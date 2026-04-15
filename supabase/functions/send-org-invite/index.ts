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

interface RequestBody {
  email: string;
  inviteCode: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateInviteEmailHtml(
  organizationName: string,
  inviteCode: string,
  inviteLink: string,
  inviterEmail: string
): string {
  const safeName = escapeHtml(organizationName);
  const safeCode = escapeHtml(inviteCode);
  const safeInviter = escapeHtml(inviterEmail);

  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inbjudan till ${safeName} - Promotely UF</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #35141D;">Promotely</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #952A5E;">UF Marketing Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #35141D;">
                Du har blivit inbjuden! 🎉
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555;">
                <strong>${safeInviter}</strong> har bjudit in dig att gå med i
                organisationen <strong>${safeName}</strong> på Promotely.
              </p>
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${inviteLink}"
                       style="display: inline-block; padding: 16px 32px; background-color: #EE593D; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(238, 89, 61, 0.3);">
                      Gå med i ${safeName}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px; font-size: 14px; color: #777777;">
                Eller använd denna inbjudningskod när du loggar in:
              </p>
              <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 12px 24px; background-color: #f5f5f5; border-radius: 8px; font-family: monospace; font-size: 20px; font-weight: 700; color: #35141D; letter-spacing: 2px;">
                      ${safeCode}
                    </div>
                  </td>
                </tr>
              </table>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0;">
              <p style="margin: 0; font-size: 13px; color: #999999;">
                ⏰ Denna inbjudan är giltig i 7 dagar.
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #999999;">
                Om du inte förväntade dig denna inbjudan kan du ignorera detta mejl.
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
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "email_service_not_configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'send-org-invite'
    });
    if (rateLimitOk === false) {
      return new Response(
        JSON.stringify({ error: "rate_limit_exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request
    const body: RequestBody = await req.json();
    const { email, inviteCode } = body;

    if (!email || typeof email !== "string" || !email.includes("@") || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "invalid_email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!inviteCode || typeof inviteCode !== "string") {
      return new Response(
        JSON.stringify({ error: "missing_required_fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up the invite to get org_id, then verify membership server-side
    const { data: invite } = await supabaseAdmin
      .from("organization_invites")
      .select("organization_id, organizations(name)")
      .eq("invite_code", inviteCode.toUpperCase())
      .eq("status", "pending")
      .single();

    if (!invite) {
      return new Response(
        JSON.stringify({ error: "invalid_invite_code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller is a member of this organization
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", invite.organization_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "not_org_member" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get org name from DB (never trust client)
    const orgName = (invite as any).organizations?.name || "Organisation";
    const inviteLink = `${APP_ORIGIN}/join/${inviteCode}`;
    const html = generateInviteEmailHtml(orgName, inviteCode, inviteLink, user.email || "");

    console.log(`Sending org invite email to ${email} for org ${orgName}`);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [email],
        subject: `Inbjudan till ${escapeHtml(orgName)} - Promotely UF`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({}));
      console.error("Resend API error:", resendResponse.status, errorData);
      return new Response(
        JSON.stringify({ error: "email_send_failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendResponse.json();
    console.log(`Org invite email sent to ${email}, message id: ${resendData.id}`);

    return new Response(
      JSON.stringify({ ok: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-org-invite:", error);
    return new Response(
      JSON.stringify({ error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
