import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// Simple encryption using Web Crypto API (AES-GCM)
async function encryptToken(token: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("META_APP_SECRET");
  if (!secret) {
    throw new Error("SECURITY_ERROR: META_APP_SECRET is not configured. Token encryption cannot proceed without a valid encryption key.");
  }
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret.padEnd(32, "0").slice(0, 32));

  return await crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

Deno.serve(async (req) => {
  console.log("🔵 OAuth callback reached - function is deployed and working");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
  }

  try {
    // Capture client information for security logging
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateToken = url.searchParams.get("state");

    console.log("OAuth callback received:", { hasCode: !!code, hasState: !!stateToken, fullUrl: req.url });

    if (!code || !stateToken) {
      throw new Error("Authorization code or state missing");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate state token and get user ID (don't filter by provider yet - get it from the state)
    console.log("Looking up state token (length):", stateToken?.length);
    const { data: stateData, error: stateError } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state_token", stateToken)
      .eq("consumed", false)
      .maybeSingle();

    if (stateError || !stateData) {
      console.error("Invalid state token - not found in database:", {
        error: stateError,
        stateToken,
        errorCode: stateError?.code,
        errorMessage: stateError?.message,
      });
      await supabase.rpc("log_security_event", {
        _user_id: null,
        _event_type: "oauth_invalid_state",
        _event_details: { error: "Invalid or expired state token", stateToken },
        _ip_address: clientIp,
        _user_agent: userAgent,
      });
      throw new Error("Invalid or expired state token");
    }

    // Get provider from the state data (not from query params)
    const provider = stateData.provider;
    console.log("State validated successfully:", { provider, userId: stateData.user_id });

    // Check if state is expired (older than 10 minutes)
    const stateAge = Date.now() - new Date(stateData.created_at).getTime();
    if (stateAge > 10 * 60 * 1000) {
      console.error("State token expired:", { stateAge: Math.floor(stateAge / 1000), maxAge: 600 });
      throw new Error("State token expired");
    }

    // Mark state as consumed
    await supabase
      .from("oauth_states")
      .update({ consumed: true, consumed_at: new Date().toISOString() })
      .eq("id", stateData.id);

    const userId = stateData.user_id;
    console.log("State marked as consumed, proceeding with OAuth for user:", userId);

    // Exchange code for access token based on provider
    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresIn: number | null = null;
    let accountId: string;
    let username: string | null = null;
    let grantedScopesString = '';
    let missingOptionalScopes: string[] = [];

    if (provider === "meta_fb" || provider === "meta_ig") {
      const metaAppId = Deno.env.get("META_APP_ID");
      const metaAppSecret = Deno.env.get("META_APP_SECRET");
      const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback?provider=${provider}`;

      if (!metaAppId || !metaAppSecret) {
        throw new Error("Meta app credentials not configured");
      }

      // Exchange code for token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
          `client_id=${metaAppId}&` +
          `client_secret=${metaAppSecret}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `code=${code}`,
      );

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error("Meta token exchange failed:", error);
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      expiresIn = tokenData.expires_in;

      console.log("Access token obtained, expires in:", expiresIn);

      if (provider === "meta_ig") {
        // For Instagram, get Instagram Business Account ID
        console.log("Fetching Instagram Business Account info...");
        
        // First get Facebook Pages
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`,
        );

        if (!pagesResponse.ok) {
          throw new Error("Failed to get Facebook Pages");
        }

        const pagesData = await pagesResponse.json();
        console.log("Pages data:", pagesData);

        if (!pagesData.data || pagesData.data.length === 0) {
          throw new Error("No Facebook Pages found. You need a Facebook Page connected to an Instagram Business Account.");
        }

        const pageId = pagesData.data[0].id;

        // Get Instagram Business Account from the Page
        const igAccountResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`,
        );

        if (!igAccountResponse.ok) {
          throw new Error("Failed to get Instagram Business Account");
        }

        const igAccountData = await igAccountResponse.json();
        console.log("Instagram account data:", igAccountData);

        if (!igAccountData.instagram_business_account) {
          throw new Error("No Instagram Business Account linked to this Facebook Page. Please connect your Instagram Business Account to your Facebook Page.");
        }

        const igBusinessId = igAccountData.instagram_business_account.id;

        // Get Instagram username
        const igUserResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igBusinessId}?fields=username&access_token=${accessToken}`,
        );

        if (!igUserResponse.ok) {
          throw new Error("Failed to get Instagram username");
        }

        const igUserData = await igUserResponse.json();
        accountId = igBusinessId;
        username = igUserData.username;

        console.log("Instagram user info retrieved:", { accountId, username });
      } else {
        // For Facebook, get user info
        const userResponse = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`,
        );

        if (!userResponse.ok) {
          throw new Error("Failed to get user info");
        }

        const userData = await userResponse.json();
        accountId = userData.id;
        username = userData.name;

        console.log("Facebook user info retrieved:", { accountId, username });
      }
    } else if (provider === "tiktok") {
      const tiktokClientKey = Deno.env.get("TIKTOK_CLIENT_KEY");
      const tiktokClientSecret = Deno.env.get("TIKTOK_CLIENT_SECRET");
      const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;

      if (!tiktokClientKey || !tiktokClientSecret) {
        throw new Error("TikTok app credentials not configured");
      }

      console.log("TikTok token exchange - Request params:", {
        client_key: tiktokClientKey,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        hasCode: !!code,
      });

      // Exchange code for token
      const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: tiktokClientKey,
          client_secret: tiktokClientSecret,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      const responseText = await tokenResponse.text();
      console.log("TikTok token response status:", tokenResponse.status);

      if (!tokenResponse.ok) {
        console.error("TikTok token exchange failed:", {
          status: tokenResponse.status,
        });
        throw new Error(`Failed to exchange code for token`);
      }

      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse TikTok token response:", parseError);
        throw new Error("Invalid JSON response from TikTok");
      }

      console.log("Token received:", {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scopes: tokenData.scope,
      });
      
      // Check if TikTok returned an error
      if (tokenData.error) {
        const errorMsg = `TikTok OAuth error: ${tokenData.error}${tokenData.error_description ? ` - ${tokenData.error_description}` : ""}`;
        console.error(errorMsg, { log_id: tokenData.log_id });
        throw new Error(errorMsg);
      }

      // Verify scopes before proceeding
      grantedScopesString = tokenData.data?.scope || tokenData.scope || '';
      console.log('🔍 TikTok granted scopes:', grantedScopesString);

      const grantedScopes = grantedScopesString.split(',').map((s: string) => s.trim());
      
      // Adjust required scopes based on API level
      // If Content Posting API is not enabled, video.list is optional
      const hasContentPosting = Deno.env.get('TIKTOK_HAS_CONTENT_POSTING_API') === 'true';
      
      const requiredScopes = hasContentPosting
        ? ['user.info.basic', 'user.info.stats', 'video.list']
        : ['user.info.basic', 'user.info.stats'];
      
      const optionalScopes = hasContentPosting
        ? ['video.query', 'video.data', 'user.info.profile']
        : ['user.info.profile', 'video.list', 'video.query', 'video.data'];
      
      console.log('🔍 TikTok API mode:', hasContentPosting ? 'Content Posting API' : 'Login Kit Only');
      console.log('🔍 Required scopes:', requiredScopes.join(', '));
      console.log('🔍 Optional scopes:', optionalScopes.join(', '));

      const missingRequiredScopes = requiredScopes.filter(s => !grantedScopes.includes(s));
      missingOptionalScopes = optionalScopes.filter(s => !grantedScopes.includes(s));

      if (missingRequiredScopes.length > 0) {
        console.error('⚠️ Missing required TikTok scopes:', missingRequiredScopes);

        await supabase.rpc('log_security_event', {
          _user_id: userId,
          _event_type: 'tiktok_scope_missing',
          _event_details: { 
            missing: missingRequiredScopes,
            granted: grantedScopes 
          },
          _ip_address: clientIp,
          _user_agent: userAgent,
        });

        throw new Error(
          `Insufficient TikTok permissions. Missing required scopes: ${missingRequiredScopes.join(', ')}. ` +
          'Please reconnect your TikTok account and authorize all requested permissions.'
        );
      }

      if (missingOptionalScopes.length > 0) {
        console.warn('⚠️ Missing optional TikTok scopes (limited functionality):', missingOptionalScopes);
        
        await supabase.rpc('log_security_event', {
          _user_id: userId,
          _event_type: 'tiktok_limited_scopes',
          _event_details: { 
            missing: missingOptionalScopes,
            granted: grantedScopes 
          },
          _ip_address: clientIp,
          _user_agent: userAgent,
        });
      }

      // TikTok API returns data in different formats - handle both
      if (tokenData.data && tokenData.data.access_token) {
        accessToken = tokenData.data.access_token;
        refreshToken = tokenData.data.refresh_token || null;
        expiresIn = tokenData.data.expires_in;
      } else if (tokenData.access_token) {
        accessToken = tokenData.access_token;
        refreshToken = tokenData.refresh_token || null;
        expiresIn = tokenData.expires_in;
      } else {
        console.error("TikTok access_token not found in response:", tokenData);
        throw new Error("access_token missing from TikTok response");
      }

      console.log("TikTok access token obtained successfully:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        expiresIn,
      });

      // Get user info
      const userResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userResponseText = await userResponse.text();
      console.log("TikTok user info response:", {
        status: userResponse.status,
        body: userResponseText,
      });

      if (!userResponse.ok) {
        console.error("Failed to get TikTok user info:", userResponseText);
        throw new Error(`Failed to get TikTok user info: ${userResponseText}`);
      }

      let userData;
      try {
        userData = JSON.parse(userResponseText);
      } catch (parseError) {
        console.error("Failed to parse TikTok user response:", parseError);
        throw new Error("Invalid JSON response from TikTok user endpoint");
      }

      console.log("TikTok user data structure:", JSON.stringify(userData, null, 2));

      // Handle different response formats
      if (userData.data && userData.data.user) {
        accountId = userData.data.user.open_id;
        username = userData.data.user.display_name;
      } else if (userData.user) {
        accountId = userData.user.open_id;
        username = userData.user.display_name;
      } else {
        console.error("Unexpected TikTok user data structure:", userData);
        throw new Error("Cannot parse TikTok user info");
      }

      console.log("TikTok user info retrieved successfully:", { accountId, username });
    } else {
      throw new Error(`Provider ${provider} not supported yet`);
    }

    // Encrypt tokens before storage
    const encryptionKey = await getEncryptionKey();
    const encryptedAccessToken = await encryptToken(accessToken, encryptionKey);
    const encryptedRefreshToken = refreshToken ? await encryptToken(refreshToken, encryptionKey) : null;

    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const { error: tokenError } = await supabase.from("tokens").upsert(
      {
        user_id: userId,
        provider: provider,
        access_token_enc: encryptedAccessToken,
        refresh_token_enc: encryptedRefreshToken,
        expires_at: expiresAt,
        scopes: grantedScopesString || null,
      },
      {
        onConflict: "user_id,provider",
      },
    );

    if (tokenError) {
      console.error("Error storing token:", tokenError);
      await supabase.rpc("log_security_event", {
        _user_id: userId,
        _event_type: "oauth_token_storage_failed",
        _event_details: { provider, error: tokenError.message },
        _ip_address: clientIp,
        _user_agent: userAgent,
      });
      throw tokenError;
    }

    console.log("Encrypted token stored successfully");

    // Create connection record
    const { error: connectionError } = await supabase.from("connections").upsert(
      {
        user_id: userId,
        provider: provider,
        account_id: accountId,
        username: username,
      },
      {
        onConflict: "user_id,provider",
      },
    );

    if (connectionError) {
      console.error("Error creating connection:", connectionError);
      throw connectionError;
    }

    console.log("Connection created successfully");

    // Log successful OAuth connection
    await supabase.rpc("log_security_event", {
      _user_id: userId,
      _event_type: "oauth_connection_success",
      _event_details: { provider, account_id: accountId },
      _ip_address: clientIp,
      _user_agent: userAgent,
    });

    // Clean up expired states
    await supabase.rpc("cleanup_expired_oauth_states");

    // Redirect back to app
    // Use custom domain if configured, otherwise fall back to lovable.app
    let customDomain = Deno.env.get("CUSTOM_DOMAIN");

    // Sanitize and normalize the custom domain
    if (customDomain) {
      // Lägg till https:// om det saknas
      if (!customDomain.startsWith("http://") && !customDomain.startsWith("https://")) {
        customDomain = `https://${customDomain}`;
      }

      // Ta bort eventuella avslutande snedstreck
      customDomain = customDomain.replace(/\/+$/, "");
    }

    const appUrl = customDomain || supabaseUrl.replace(".supabase.co", ".lovable.app");

    const redirectUrl = `${appUrl}/dashboard?connected=${provider}`;
    console.log("Redirecting to:", redirectUrl);

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        ...securityHeaders,
        Location: redirectUrl,
      },
    });
  } catch (error) {
    console.error("OAuth callback error:", error);

    // Extract detailed error information
    let errorMessage = "Unknown error";
    let errorDetails: any = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails.message = error.message;
      errorDetails.stack = error.stack;
    } else if (typeof error === "object" && error !== null) {
      errorDetails = error;
      errorMessage = JSON.stringify(error);
    }

    console.error("Detailed error information:", JSON.stringify(errorDetails, null, 2));

    // Log security event for failed OAuth
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.rpc("log_security_event", {
        _user_id: null,
        _event_type: "oauth_callback_failed",
        _event_details: { error: errorMessage, details: errorDetails },
        _ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        _user_agent: req.headers.get("user-agent") || "unknown",
      });
    } catch (logError) {
      console.error("Failed to log security event:", logError);
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
