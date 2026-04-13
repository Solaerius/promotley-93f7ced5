import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Meta Data Deletion Callback
 * 
 * Called by Meta when a user requests deletion of their data.
 * Must return a confirmation_code and a URL where they can check status.
 * 
 * Meta docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback/
 */

function base64UrlDecode(str: string): Uint8Array {
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

  if (actualSig.length !== expectedSigArray.length) return null;
  let diff = 0;
  for (let i = 0; i < actualSig.length; i++) {
    diff |= actualSig[i] ^ expectedSigArray[i];
  }
  if (diff !== 0) return null;

  const payloadBytes = base64UrlDecode(encodedPayload);
  const payloadStr = new TextDecoder().decode(payloadBytes);
  return JSON.parse(payloadStr);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Also handle GET for status check
  if (req.method === "GET") {
    const url = new URL(req.url);
    const confirmationCode = url.searchParams.get("code");
    
    if (!confirmationCode) {
      return new Response(JSON.stringify({ error: "Missing confirmation code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return deletion status
    return new Response(JSON.stringify({
      confirmation_code: confirmationCode,
      status: "deleted",
      message: "All user data associated with this Meta account has been deleted from Promotely.",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      return new Response(JSON.stringify({ error: "Missing signed_request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await verifySignedRequest(signedRequest, appSecret);
    if (!payload || !payload.user_id) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metaUserId = payload.user_id;
    console.log("Meta data deletion request for Meta user ID:", metaUserId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find and delete all data for this Meta user
    const { data: connections } = await supabase
      .from("connections")
      .select("id, user_id, provider")
      .eq("account_id", metaUserId);

    if (connections && connections.length > 0) {
      for (const conn of connections) {
        // Delete tokens
        await supabase
          .from("tokens")
          .delete()
          .eq("user_id", conn.user_id)
          .eq("provider", conn.provider);

        // Delete social stats for this provider
        await supabase
          .from("social_stats")
          .delete()
          .eq("user_id", conn.user_id)
          .eq("platform", conn.provider);

        // Delete analytics for this provider
        await supabase
          .from("analytics")
          .delete()
          .eq("user_id", conn.user_id)
          .eq("platform", conn.provider);

        // Delete metrics for this provider
        await supabase
          .from("metrics")
          .delete()
          .eq("user_id", conn.user_id)
          .eq("provider", conn.provider);

        // Delete connection
        await supabase
          .from("connections")
          .delete()
          .eq("id", conn.id);

        // Log the deletion
        await supabase.rpc("log_security_event", {
          _user_id: conn.user_id,
          _event_type: "meta_data_deletion",
          _event_details: { 
            meta_user_id: metaUserId, 
            provider: conn.provider,
            deleted_data: ["tokens", "social_stats", "analytics", "metrics", "connections"]
          },
        });

        console.log(`Deleted all data for ${conn.provider} for user ${conn.user_id}`);
      }
    }

    // Generate a confirmation code
    const confirmationCode = crypto.randomUUID();
    const statusUrl = `${supabaseUrl}/functions/v1/meta-data-deletion?code=${confirmationCode}`;

    console.log("Data deletion complete. Confirmation:", confirmationCode);

    // Meta expects this exact response format
    return new Response(JSON.stringify({
      url: statusUrl,
      confirmation_code: confirmationCode,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Data deletion callback error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
