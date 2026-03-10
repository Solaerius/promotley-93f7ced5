import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const MAIL_FROM = Deno.env.get("MAIL_FROM") || "Promotely UF <support@promotley.se>";
const APP_ORIGIN = Deno.env.get("APP_ORIGIN") || "https://promotley.lovable.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function generateWelcomeEmailHtml(companyName: string): string {
  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Välkommen till Promotely!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #35141D;">Grattis!</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #952A5E;">Din profil är nu komplett</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #35141D;">Välkommen, ${companyName}!</h2>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #555555;">
                Du är nu redo att börja växa med Promotely. Din första AI-analys är helt gratis – prova direkt!
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555;">
                💡 Tips: Gå till AI-sidan för att generera din första innehållsstrategi.
              </p>
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${APP_ORIGIN}/ai" 
                       style="display: inline-block; padding: 16px 32px; background-color: #EE593D; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(238, 89, 61, 0.3);">
                      Starta din första AI-analys 🚀
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0;">
              <p style="margin: 0; font-size: 13px; color: #999999;">
                Har du frågor? Svara på detta mail så hjälper vi dig.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Promotely UF. Alla rättigheter förbehållna.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company name from ai_profiles
    const { data: profile } = await adminClient
      .from("ai_profiles")
      .select("foretagsnamn")
      .eq("user_id", user.id)
      .single();

    const companyName = profile?.foretagsnamn || "ditt företag";

    // Create in-app notification
    await adminClient.from("notifications").insert({
      user_id: user.id,
      title: "Välkommen till Promotely!",
      message: `Din profil är klar. Prova din första AI-analys – den är gratis!`,
      read: false,
      action_url: "/ai",
      action_type: "spotlight_ai_analysis",
    });

    // Send email if Resend is configured
    if (RESEND_API_KEY) {
      const html = generateWelcomeEmailHtml(companyName);
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: MAIL_FROM,
          to: [user.email],
          subject: "Du är igång – första AI-analysen är gratis!",
          html,
        }),
      });

      if (!resendResponse.ok) {
        const err = await resendResponse.json().catch(() => ({}));
        console.error("Resend error:", err);
        // Don't fail the whole request if email fails
      } else {
        console.log(`Welcome email sent to ${user.email}`);
      }
    } else {
      console.log("RESEND_API_KEY not set, skipping email");
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-onboarding-complete:", error);
    return new Response(
      JSON.stringify({ error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
