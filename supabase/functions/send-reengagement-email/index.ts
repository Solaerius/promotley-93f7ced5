import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const MAIL_FROM = Deno.env.get("MAIL_FROM") || "Promotely UF <support@promotley.se>";
const APP_ORIGIN = Deno.env.get("APP_ORIGIN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if re-engagement is enabled
    const { data: settings } = await adminClient
      .from("email_automation_settings")
      .select("*")
      .in("email_type", ["inactive_reminder", "reengagement"]);

    if (!settings || settings.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "no_settings" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const enabledSettings = settings.filter((s: any) => s.enabled);
    if (enabledSettings.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "RESEND_API_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSent = 0;

    for (const setting of enabledSettings) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - setting.delay_days);

      // Find users who haven't been active since cutoff
      const { data: allUsers } = await adminClient
        .from("users")
        .select("id, email, company_name, created_at")
        .is("deleted_at", null)
        .eq("email_newsletter", true)
        .lt("created_at", cutoffDate.toISOString());

      if (!allUsers || allUsers.length === 0) continue;

      // Check which users have recent activity
      for (const user of allUsers) {
        // Check if already sent
        const { data: alreadySent } = await adminClient
          .from("email_automation_logs")
          .select("id")
          .eq("user_id", user.id)
          .eq("email_type", setting.email_type)
          .gte("sent_at", cutoffDate.toISOString())
          .maybeSingle();

        if (alreadySent) continue;

        // Check for recent activity
        const { count: chatCount } = await adminClient
          .from("ai_chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", user.id)
          .gte("created_at", cutoffDate.toISOString());

        const { count: suggCount } = await adminClient
          .from("suggestions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", cutoffDate.toISOString());

        if ((chatCount || 0) > 0 || (suggCount || 0) > 0) continue;

        // Send re-engagement email
        const name = user.company_name || "där";
        const html = `
<!DOCTYPE html>
<html lang="sv"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" style="max-width:600px;width:100%;background:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;">
<h1 style="margin:0;font-size:24px;font-weight:700;color:#35141D;">Vi saknar dig, ${name}!</h1>
</td></tr>
<tr><td style="padding:20px 40px;">
<p style="font-size:16px;line-height:1.6;color:#555;">Det har gått ett tag sedan du använde Promotely. Dina AI-verktyg väntar på dig – skapa innehåll, analysera din närvaro och väx snabbare.</p>
<table role="presentation" style="width:100%;"><tr><td align="center" style="padding:16px 0;">
<a href="${APP_ORIGIN}/dashboard" style="display:inline-block;padding:14px 28px;background:#EE593D;color:#fff;text-decoration:none;font-size:16px;font-weight:600;border-radius:8px;">Kom tillbaka till Promotely</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:20px 40px 40px;text-align:center;">
<p style="font-size:12px;color:#999;">© ${new Date().getFullYear()} Promotely UF</p>
<p style="font-size:11px;color:#bbb;"><a href="${APP_ORIGIN}/unsubscribe?email=${encodeURIComponent(user.email)}" style="color:#bbb;">Avprenumerera</a></p>
</td></tr>
</table></td></tr></table></body></html>`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: MAIL_FROM, to: [user.email], subject: "Vi saknar dig på Promotely!", html }),
        });

        // Log it
        await adminClient.from("email_automation_logs").insert({
          user_id: user.id,
          email_type: setting.email_type,
        });

        totalSent++;
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
