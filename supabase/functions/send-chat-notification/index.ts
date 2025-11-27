import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get notification settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from("notification_settings")
      .select("*")
      .single();

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      return new Response(JSON.stringify({ error: "Failed to fetch notification settings" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { message, sessionId, timestamp } = await req.json();

    const results = {
      discord: false,
      email: false,
      sms: false,
    };

    // Send Discord notification (embed)
    if (settings.discord_webhook_url) {
      try {
        const adminUrl = `${Deno.env.get("CUSTOM_DOMAIN")}/admin/chat`;

        const embedPayload = {
          username: "Promotely Chat Bot",
          embeds: [
            {
              title: "🔔 Ny chatt på Promotely!",
              description: `[👉 Öppna Admin-Chatt](https://promotley.se/admin/chat)`,
              color: 0xee593d, // Promotely färg (orange)
              fields: [
                {
                  name: "📩 Meddelande",
                  value: message || "–",
                },
                {
                  name: "🆔 Session",
                  value: sessionId || "–",
                },
                {
                  name: "⏰ Tid",
                  value: new Date(timestamp).toLocaleString("sv-SE"),
                },
              ],
              footer: {
                text: "Promotely UF – Livechatt notifikation",
              },
              timestamp: new Date().toISOString(),
            },
          ],
        };

        const discordResponse = await fetch(settings.discord_webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(embedPayload),
        });

        results.discord = discordResponse.ok;

        if (!discordResponse.ok) {
          const errorText = await discordResponse.text();
          console.error("Discord error response:", errorText);
        } else {
          console.log("Discord embed sent successfully");
        }
      } catch (error) {
        console.error("Discord notification failed:", error);
      }
    }

    // Send email notification (placeholder - would need email service configured)
    if (settings.notification_email) {
      // TODO: Implement email sending using Resend or similar service
      console.log("Email notification would be sent to:", settings.notification_email);
      results.email = false; // Set to true when implemented
    }

    // Send SMS notification via Twilio
    if (
      settings.twilio_account_sid &&
      settings.twilio_auth_token &&
      settings.twilio_phone_number &&
      settings.recipient_phone_number
    ) {
      try {
        const twilioAuth = btoa(`${settings.twilio_account_sid}:${settings.twilio_auth_token}`);

        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${twilioAuth}`,
            },
            body: new URLSearchParams({
              From: settings.twilio_phone_number,
              To: settings.recipient_phone_number,
              Body: `Ny chatt på Promotely: ${message.substring(0, 100)}...`,
            }),
          },
        );

        results.sms = smsResponse.ok;
        console.log("SMS notification sent:", results.sms);
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
