import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Simple encryption using Web Crypto API (AES-GCM)
async function encryptToken(token: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get('META_APP_SECRET') || 'fallback-key-for-dev';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret.padEnd(32, '0').slice(0, 32));
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
  }

  try {
    // Capture client information for security logging
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateToken = url.searchParams.get('state');
    const provider = url.searchParams.get('provider') || 'meta_fb';

    console.log('OAuth callback received:', { provider, hasCode: !!code, hasState: !!stateToken });

    if (!code || !stateToken) {
      throw new Error('Authorization code or state missing');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate state token and get user ID
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_token', stateToken)
      .eq('provider', provider)
      .eq('consumed', false)
      .single();

    if (stateError || !stateData) {
      console.error('Invalid state token:', stateError);
      await supabase.rpc('log_security_event', {
        _user_id: null,
        _event_type: 'oauth_invalid_state',
        _event_details: { provider, error: 'Invalid or expired state token' },
        _ip_address: clientIp,
        _user_agent: userAgent,
      });
      throw new Error('Invalid or expired state token');
    }

    // Check if state is expired (older than 10 minutes)
    const stateAge = Date.now() - new Date(stateData.created_at).getTime();
    if (stateAge > 10 * 60 * 1000) {
      console.error('State token expired');
      throw new Error('State token expired');
    }

    // Mark state as consumed
    await supabase
      .from('oauth_states')
      .update({ consumed: true, consumed_at: new Date().toISOString() })
      .eq('id', stateData.id);

    const userId = stateData.user_id;
    console.log('Validated user ID from state:', userId);

    // Exchange code for access token based on provider
    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresIn: number | null = null;
    let accountId: string;
    let username: string | null = null;

    if (provider === 'meta_fb') {
      const metaAppId = Deno.env.get('META_APP_ID');
      const metaAppSecret = Deno.env.get('META_APP_SECRET');
      const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback?provider=meta_fb`;

      if (!metaAppId || !metaAppSecret) {
        throw new Error('Meta app credentials not configured');
      }

      // Exchange code for token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${metaAppId}&` +
        `client_secret=${metaAppSecret}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code=${code}`
      );

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Facebook token exchange failed:', error);
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      expiresIn = tokenData.expires_in;

      console.log('Access token obtained, expires in:', expiresIn);

      // Get user info
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`
      );

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json();
      accountId = userData.id;
      username = userData.name;

      console.log('Facebook user info retrieved:', { accountId, username });
    } else if (provider === 'tiktok') {
      const tiktokClientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
      const tiktokClientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
      const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback?provider=tiktok`;

      if (!tiktokClientKey || !tiktokClientSecret) {
        throw new Error('TikTok app credentials not configured');
      }

      // Exchange code for token
      const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: tiktokClientKey,
          client_secret: tiktokClientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('TikTok token exchange failed:', error);
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.data.access_token;
      refreshToken = tokenData.data.refresh_token || null;
      expiresIn = tokenData.data.expires_in;

      console.log('TikTok access token obtained, expires in:', expiresIn);

      // Get user info
      const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get TikTok user info');
      }

      const userData = await userResponse.json();
      accountId = userData.data.user.open_id;
      username = userData.data.user.display_name;

      console.log('TikTok user info retrieved:', { accountId, username });
    } else {
      throw new Error(`Provider ${provider} not supported yet`);
    }

    // Encrypt tokens before storage
    const encryptionKey = await getEncryptionKey();
    const encryptedAccessToken = await encryptToken(accessToken, encryptionKey);
    const encryptedRefreshToken = refreshToken ? await encryptToken(refreshToken, encryptionKey) : null;
    
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const { error: tokenError } = await supabase
      .from('tokens')
      .upsert({
        user_id: userId,
        provider: provider,
        access_token_enc: encryptedAccessToken,
        refresh_token_enc: encryptedRefreshToken,
        expires_at: expiresAt,
      }, {
        onConflict: 'user_id,provider'
      });

    if (tokenError) {
      console.error('Error storing token:', tokenError);
      await supabase.rpc('log_security_event', {
        _user_id: userId,
        _event_type: 'oauth_token_storage_failed',
        _event_details: { provider, error: tokenError.message },
        _ip_address: clientIp,
        _user_agent: userAgent,
      });
      throw tokenError;
    }

    console.log('Encrypted token stored successfully');

    // Create connection record
    const { error: connectionError } = await supabase
      .from('connections')
      .upsert({
        user_id: userId,
        provider: provider,
        account_id: accountId,
        username: username,
      }, {
        onConflict: 'user_id,provider'
      });

    if (connectionError) {
      console.error('Error creating connection:', connectionError);
      throw connectionError;
    }

    console.log('Connection created successfully');

    // Log successful OAuth connection
    await supabase.rpc('log_security_event', {
      _user_id: userId,
      _event_type: 'oauth_connection_success',
      _event_details: { provider, account_id: accountId },
      _ip_address: clientIp,
      _user_agent: userAgent,
    });

    // Clean up expired states
    await supabase.rpc('cleanup_expired_oauth_states');

    // Redirect back to app
    const appUrl = supabaseUrl.replace('.supabase.co', '.lovable.app');
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        ...securityHeaders,
        'Location': `${appUrl}/dashboard?connected=${provider}`,
      },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log security event for failed OAuth
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.rpc('log_security_event', {
        _user_id: null,
        _event_type: 'oauth_callback_failed',
        _event_details: { error: errorMessage },
        _ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        _user_agent: req.headers.get('user-agent') || 'unknown',
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
