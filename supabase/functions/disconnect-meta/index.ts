import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Disconnect Meta (Instagram/Facebook)
 * 
 * Revokes the user's Meta access token via the Graph API,
 * then removes tokens and connections from our database.
 */

async function decryptToken(encrypted: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("META_APP_SECRET");
  if (!secret) throw new Error("META_APP_SECRET not configured");
  const keyData = new TextEncoder().encode(secret.padEnd(32, "0").slice(0, 32));
  return await crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Rate limiting
    const rateLimitClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: rateLimitOk } = await rateLimitClient.rpc('check_rate_limit', {
      _user_id: userId,
      _endpoint: 'disconnect-meta'
    });
    if (rateLimitOk === false) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { provider } = await req.json();

    if (!provider || !["meta_ig", "meta_fb"].includes(provider)) {
      return new Response(JSON.stringify({ error: "Invalid provider" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the stored token to revoke it
    const { data: tokenData } = await serviceClient
      .from("tokens")
      .select("access_token_enc")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();

    if (tokenData?.access_token_enc) {
      try {
        const encryptionKey = await getEncryptionKey();
        const accessToken = await decryptToken(tokenData.access_token_enc, encryptionKey);

        // Revoke the token via Meta Graph API
        const revokeResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`,
          { method: "DELETE" }
        );

        const revokeResult = await revokeResponse.json();
        console.log("Meta permission revoke result:", revokeResult);
      } catch (revokeError) {
        // Log but don't fail - token may already be expired/revoked
        console.warn("Failed to revoke Meta token (may already be expired):", revokeError);
      }
    }

    // Delete tokens from database
    await serviceClient
      .from("tokens")
      .delete()
      .eq("user_id", userId)
      .eq("provider", provider);

    // Delete connection
    const { data: deletedConn } = await serviceClient
      .from("connections")
      .delete()
      .eq("user_id", userId)
      .eq("provider", provider)
      .select();

    if (!deletedConn || deletedConn.length === 0) {
      return new Response(JSON.stringify({ error: "No connection found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log security event
    await serviceClient.rpc("log_security_event", {
      _user_id: userId,
      _event_type: "meta_disconnect",
      _event_details: { provider },
    });

    console.log(`Disconnected ${provider} for user ${userId}, Meta permissions revoked`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Disconnect error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
