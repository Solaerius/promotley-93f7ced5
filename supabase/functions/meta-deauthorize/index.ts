import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { createHmac } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Meta Deauthorize Callback
 * 
 * Called by Meta when a user removes the app from their Facebook/Instagram settings.
 * Meta sends a signed_request containing the user's Facebook ID.
 * We use this to clean up tokens and connections for that user.
 * 
 * Meta docs: https://developers.facebook.com/docs/facebook-login/guides/advanced/deauthorize-callback/
 */

function base64UrlDecode(str: string): Uint8Array {
  // Replace URL-safe chars and add padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifySignedRequest(signedRequest: string, appSecret: string): Promise<{ user_id: string } | null> {
  const parts = signedRequest.split('.');
  if (parts.length !== 2) return null;

  const [encodedSig, encodedPayload] = parts;

  // Verify signature using HMAC-SHA256
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expectedSig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload)
  );

  const actualSig = base64UrlDecode(encodedSig);
  const expectedSigArray = new Uint8Array(expectedSig);

  // Constant-time comparison
  if (actualSig.length !== expectedSigArray.length) return null;
  let diff = 0;
  for (let i = 0; i < actualSig.length; i++) {
    diff |= actualSig[i] ^ expectedSigArray[i];
  }
  if (diff !== 0) return null;

  // Decode payload
  const payloadBytes = base64UrlDecode(encodedPayload);
  const payloadStr = new TextDecoder().decode(payloadBytes);
  const payload = JSON.parse(payloadStr);

  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appSecret = Deno.env.get("META_APP_SECRET");
    if (!appSecret) {
      console.error("META_APP_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Meta sends as application/x-www-form-urlencoded
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      console.error("No signed_request in deauthorize callback");
      return new Response(JSON.stringify({ error: "Missing signed_request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await verifySignedRequest(signedRequest, appSecret);
    if (!payload || !payload.user_id) {
      console.error("Invalid signed_request signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metaUserId = payload.user_id;
    console.log("Meta deauthorize callback for Meta user ID:", metaUserId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find connections with this Meta account_id (could be meta_ig or meta_fb)
    const { data: connections, error: connError } = await supabase
      .from("connections")
      .select("id, user_id, provider")
      .eq("account_id", metaUserId);

    if (connError) {
      console.error("Error finding connections:", connError);
    }

    if (connections && connections.length > 0) {
      for (const conn of connections) {
        // Delete tokens
        await supabase
          .from("tokens")
          .delete()
          .eq("user_id", conn.user_id)
          .eq("provider", conn.provider);

        // Delete connection
        await supabase
          .from("connections")
          .delete()
          .eq("id", conn.id);

        // Log security event
        await supabase.rpc("log_security_event", {
          _user_id: conn.user_id,
          _event_type: "meta_deauthorize",
          _event_details: { meta_user_id: metaUserId, provider: conn.provider },
        });

        console.log(`Deauthorized ${conn.provider} for user ${conn.user_id}`);
      }
    } else {
      console.log("No connections found for Meta user ID:", metaUserId);
    }

    // Meta expects a 200 response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Deauthorize callback error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
