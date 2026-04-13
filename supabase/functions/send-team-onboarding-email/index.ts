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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's org members
    const { data: membership } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all org members
    const { data: members } = await adminClient
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", membership.organization_id);

    if (!members || members.length <= 1) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile
    const { data: profile } = await adminClient
      .from("ai_profiles")
      .select("foretagsnamn")
      .eq("user_id", user.id)
      .single();

    const companyName = profile?.foretagsnamn || "ert företag";

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no_resend_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const member of members) {
      if (member.user_id === user.id) continue;

      const { data: memberUser } = await adminClient
        .from("users")
        .select("email, email_newsletter")
        .eq("id", member.user_id)
        .single();

      if (!memberUser || !memberUser.email_newsletter) continue;

      const html = `
<!DOCTYPE html>
<html lang="sv"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" style="max-width:600px;width:100%;background:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="padding:40px 40px 20px;text-align:center;">
<h1 style="margin:0;font-size:24px;font-weight:700;color:#35141D;">${companyName} är redo!</h1>
</td></tr>
<tr><td style="padding:20px 40px;">
<p style="font-size:16px;line-height:1.6;color:#555;">AI-profilen för ${companyName} är nu komplett. Logga in på Promotely och börja använda AI-verktygen för att skapa innehåll och växa på sociala medier.</p>
<table role="presentation" style="width:100%;"><tr><td align="center" style="padding:16px 0;">
<a href="${APP_ORIGIN}/ai" style="display:inline-block;padding:14px 28px;background:#EE593D;color:#fff;text-decoration:none;font-size:16px;font-weight:600;border-radius:8px;">Utforska AI-verktygen</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:20px 40px 40px;text-align:center;">
<p style="font-size:12px;color:#999;">© ${new Date().getFullYear()} Promotely UF</p>
</td></tr>
</table></td></tr></table></body></html>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: MAIL_FROM,
          to: [memberUser.email],
          subject: `${companyName} är redo att växa med Promotely!`,
          html,
        }),
      });
      sent++;
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
