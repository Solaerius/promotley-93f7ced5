import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const MAIL_FROM = Deno.env.get("MAIL_FROM") || "Promotely UF <support@promotley.se>";
const MAIL_REPLY_TO = Deno.env.get("MAIL_REPLY_TO") || "Promotely UF <support@promotley.se>";
const APP_ORIGIN = Deno.env.get("APP_ORIGIN") || "https://promotley.lovable.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RequestBody {
  email: string;
  mode?: "magic" | "signup";
}

// Rate limit constants
const MIN_INTERVAL_SECONDS = 60;
const MAX_PER_MINUTE = 5;
const MAX_PER_HOUR = 10;

async function checkRateLimit(
  supabase: any,
  email: string,
  userId: string | null,
  ip: string | null
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check last send time for this email
  const { data: lastSend } = await supabase
    .from("auth_resend_logs")
    .select("sent_at")
    .eq("email", email)
    .order("sent_at", { ascending: false })
    .limit(1)
    .single();

  if (lastSend && lastSend.sent_at) {
    const lastSendTime = new Date(lastSend.sent_at as string);
    const secondsSinceLastSend = (now.getTime() - lastSendTime.getTime()) / 1000;
    
    if (secondsSinceLastSend < MIN_INTERVAL_SECONDS) {
      return { 
        allowed: false, 
        retryAfter: Math.ceil(MIN_INTERVAL_SECONDS - secondsSinceLastSend) 
      };
    }
  }

  // Check sends per minute
  const { count: perMinuteCount } = await supabase
    .from("auth_resend_logs")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("sent_at", oneMinuteAgo.toISOString());

  if ((perMinuteCount || 0) >= MAX_PER_MINUTE) {
    return { allowed: false, retryAfter: 60 };
  }

  // Check sends per hour
  const { count: perHourCount } = await supabase
    .from("auth_resend_logs")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("sent_at", oneHourAgo.toISOString());

  if ((perHourCount || 0) >= MAX_PER_HOUR) {
    return { allowed: false, retryAfter: 3600 };
  }

  return { allowed: true };
}

function generateEmailHtml(verificationLink: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifiera din e-post - Promotely UF</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #35141D;">Promotely</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #952A5E;">UF Marketing Platform</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #35141D;">Bekräfta din e-postadress</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #555555;">
                Hej! Klicka på knappen nedan för att verifiera din e-postadress och komma igång med Promotely.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${verificationLink}" 
                       style="display: inline-block; padding: 16px 32px; background-color: #EE593D; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(238, 89, 61, 0.3);">
                      Bekräfta e-post
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px; font-size: 14px; color: #777777;">
                Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:
              </p>
              <p style="margin: 0 0 24px; font-size: 12px; color: #999999; word-break: break-all;">
                ${verificationLink}
              </p>
              
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0;">
              
              <p style="margin: 0; font-size: 13px; color: #999999;">
                ⏰ Denna länk är giltig i 24 timmar.
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #999999;">
                Om du inte har registrerat dig på Promotely kan du ignorera detta mejl.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key exists
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "email_service_not_configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const body: RequestBody = await req.json();
    const { email, mode = "magic" } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "invalid_email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get user from auth header if provided (for "resend" functionality)
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    // Get IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("cf-connecting-ip") || 
               null;

    // Check rate limit
    const rateLimit = await checkRateLimit(supabaseAdmin, email, userId, ip);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "rate_limited", 
          retry_after: rateLimit.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter || 60)
          } 
        }
      );
    }

    // Generate magic link using Supabase Admin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${APP_ORIGIN}/auth/callback`
      }
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Failed to generate link:", linkError);
      return new Response(
        JSON.stringify({ error: "failed_to_generate_link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verificationLink = linkData.properties.action_link;

    // Generate email HTML
    const html = generateEmailHtml(verificationLink, email);

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [email],
        reply_to: MAIL_REPLY_TO,
        subject: "Bekräfta din e-postadress - Promotely UF",
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({}));
      console.error("Resend API error:", resendResponse.status, errorData);
      
      // Check if domain is not verified
      if (errorData?.name === "validation_error" && 
          errorData?.message?.includes("domain")) {
        return new Response(
          JSON.stringify({ error: "domain_not_verified" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "email_send_failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendResponse.json();

    // Log the send for rate limiting
    await supabaseAdmin.from("auth_resend_logs").insert({
      user_id: userId,
      email,
      ip,
      sent_at: new Date().toISOString(),
    });

    console.log(`Verification email sent to ${email}, message id: ${resendData.id}`);

    return new Response(
      JSON.stringify({ ok: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-verification:", error);
    return new Response(
      JSON.stringify({ error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
