import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per session

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(sessionId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  entry.count++;
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify internal secret for server-to-server calls
    const internalSecret = Deno.env.get("INTERNAL_API_SECRET");
    const providedSecret = req.headers.get("x-internal-secret");
    
    // If internal secret is configured, require it
    if (!internalSecret || providedSecret !== internalSecret) {
      console.error("Unauthorized: Invalid or missing internal secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { message, sessionId, timestamp } = await req.json();

    // Validate required fields
    if (!sessionId || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields: sessionId and message" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Rate limiting per session
    if (isRateLimited(sessionId)) {
      console.warn(`Rate limit exceeded for session: ${sessionId}`);
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Validate session exists in database
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from("live_chat_sessions")
      .select("id")
      .eq("session_id", sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error("Invalid session ID:", sessionId, sessionError);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch notification settings (only non-sensitive data from DB)
    const { data: settings, error: settingsError } = await supabaseClient
      .from("notification_settings")
      .select("discord_webhook_url, notification_email")
      .single();

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      return new Response(JSON.stringify({ error: "Failed to fetch notification settings" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const results = { discord: false, email: false, sms: false };

    // Discord notification
    if (settings?.discord_webhook_url) {
      try {
        const discordResponse = await fetch(settings.discord_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "Promotely Chat Bot",
            embeds: [{
              title: "🔔 Ny chatt på Promotely!",
              description: `[Öppna Admin-Chatt](https://promotley.se/admin/chat)`,
              color: 0xee593d,
              fields: [
                { name: "📩 Meddelande", value: message.substring(0, 500) || "–" },
                { name: "🆔 Session", value: sessionId || "–" },
                { name: "⏰ Tid", value: new Date(timestamp).toLocaleString("sv-SE") },
              ],
              footer: { text: "Promotely UF – Livechatt notifikation" },
              timestamp: new Date().toISOString(),
            }],
          }),
        });
        results.discord = discordResponse.ok;
      } catch (error) {
        console.error("Discord notification failed:", error);
      }
    }

    // Email notification via Resend API
    if (settings?.notification_email) {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          // Sanitize message for HTML
          const sanitizedMessage = message
            .substring(0, 1000)
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: Deno.env.get("MAIL_FROM") || "Promotely <support@promotley.se>",
              to: [settings.notification_email],
              subject: `Ny chattförfrågan på Promotely`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #EE593D;">🔔 Ny chatt på Promotely!</h2>
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Meddelande:</strong></p>
                    <p style="background: white; padding: 15px; border-radius: 4px;">${sanitizedMessage}</p>
                    <p><strong>Session ID:</strong> ${sessionId || "–"}</p>
                    <p><strong>Tid:</strong> ${new Date(timestamp).toLocaleString("sv-SE")}</p>
                  </div>
                  <a href="https://promotley.se/admin/chat" style="display: inline-block; background: #EE593D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Öppna Admin-Chatt</a>
                </div>
              `,
            }),
          });
          results.email = emailResponse.ok;
          console.log("Email sent:", results.email);
        }
      } catch (error) {
        console.error("Email notification failed:", error);
      }
    }

    // SMS notification via Twilio (credentials from environment)
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const recipientPhoneNumber = Deno.env.get("TWILIO_RECIPIENT_PHONE");

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber && recipientPhoneNumber) {
      try {
        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            },
            body: new URLSearchParams({
              From: twilioPhoneNumber,
              To: recipientPhoneNumber,
              Body: `Ny chatt på Promotely: ${message.substring(0, 100)}...`,
            }),
          },
        );
        results.sms = smsResponse.ok;
      } catch (error) {
        console.error("SMS notification failed:", error);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-chat-notification:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
