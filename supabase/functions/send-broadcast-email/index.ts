import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const userId = claimsData.claims.sub as string

    // Verify admin role using service role client
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: corsHeaders })
    }

    const { subject, htmlContent, customEmails } = await req.json()

    if (!subject || !htmlContent) {
      return new Response(JSON.stringify({ error: 'Subject and content required' }), { status: 400, headers: corsHeaders })
    }

    // Get recipients
    let recipients: string[] = []

    if (customEmails && customEmails.length > 0) {
      recipients = customEmails
    } else {
      const { data: users, error: usersError } = await serviceClient
        .from('users')
        .select('email')
        .eq('email_newsletter', true)
        .is('deleted_at', null)

      if (usersError) {
        return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500, headers: corsHeaders })
      }

      recipients = (users || []).map(u => u.email)
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'Inga mottagare hittades' }), { status: 400, headers: corsHeaders })
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers: corsHeaders })
    }

    const MAIL_FROM = Deno.env.get('MAIL_FROM') || 'Promotely <support@support.promotley.se>'
    const SITE_URL = 'https://promotley.se'

    let sent = 0
    let failed = 0

    // Send in batches of 10
    for (let i = 0; i < recipients.length; i += 10) {
      const batch = recipients.slice(i, i + 10)

      const promises = batch.map(async (email) => {
        try {
          // Add unsubscribe link to HTML
          const fullHtml = htmlContent + `
            <div style="text-align: center; margin-top: 32px; padding: 16px; font-size: 12px; color: #9B8A8E;">
              <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #952A5E; text-decoration: underline;">
                Vill du sluta ta emot mejl från oss?
              </a>
            </div>
          `

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: MAIL_FROM,
              to: [email],
              subject,
              html: fullHtml,
            }),
          })

          if (res.ok) {
            sent++
          } else {
            failed++
          }
        } catch {
          failed++
        }
      })

      await Promise.all(promises)
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: recipients.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
