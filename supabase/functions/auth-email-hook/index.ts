import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { Resend } from 'npm:resend@^2'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Bekräfta din e-post – Promotley',
  invite: 'Du har blivit inbjuden till Promotley',
  magiclink: 'Din inloggningslänk – Promotley',
  recovery: 'Återställ ditt lösenord – Promotley',
  email_change: 'Bekräfta din nya e-postadress – Promotley',
  reauthentication: 'Din verifieringskod – Promotley',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = "promotley"
const SENDER_DOMAIN = "support.promotley.se"
const ROOT_DOMAIN = "promotley.se"
const FROM_DOMAIN = "promotley.se"

const APP_ORIGIN = Deno.env.get("APP_ORIGIN") || `https://${ROOT_DOMAIN}`

const SAMPLE_EMAIL = "user@example.test"
const SAMPLE_DATA: Record<string, object> = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: APP_ORIGIN,
    recipient: SAMPLE_EMAIL,
    recipientName: 'Anna',
    confirmationUrl: APP_ORIGIN,
  },
  magiclink: {
    siteName: SITE_NAME,
    recipientName: 'Anna',
    confirmationUrl: APP_ORIGIN,
  },
  recovery: {
    siteName: SITE_NAME,
    recipientName: 'Anna',
    confirmationUrl: APP_ORIGIN,
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: APP_ORIGIN,
    recipientName: 'Anna',
    confirmationUrl: APP_ORIGIN,
  },
  email_change: {
    siteName: SITE_NAME,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    recipientName: 'Anna',
    confirmationUrl: APP_ORIGIN,
  },
  reauthentication: {
    token: '123456',
    recipientName: 'Anna',
  },
}

async function resolveRecipientName(email: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) return null

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const authUser = authUsers?.users?.find((u: any) => u.email === email)
    const metaName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name
    if (metaName) return metaName

    const { data: profile } = await supabase
      .from('users')
      .select('company_name')
      .eq('email', email)
      .maybeSingle()

    if (profile?.company_name) return profile.company_name

    return null
  } catch (err) {
    console.error('Failed to resolve recipient name', err)
    return null
  }
}

// Verify Supabase hook JWT signature using SEND_EMAIL_HOOK_SECRET
async function verifyHookSignature(req: Request): Promise<void> {
  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  if (!hookSecret) return // Skip in dev when secret is not configured

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: missing authorization')
  }

  const token = authHeader.slice(7)
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Unauthorized: invalid token format')

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(hookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const signingInput = `${parts[0]}.${parts[1]}`
  const rawSig = parts[2].replace(/-/g, '+').replace(/_/g, '/')
  const padded = rawSig + '=='.slice(0, (4 - rawSig.length % 4) % 4)
  const sigBytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0))

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    new TextEncoder().encode(signingInput),
  )
  if (!valid) throw new Error('Unauthorized: invalid signature')
}

// Build the confirmation URL from Supabase hook payload
function buildConfirmationUrl(emailData: any): string {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const { token_hash, email_action_type, redirect_to } = emailData
  if (!token_hash) return redirect_to || APP_ORIGIN

  const params = new URLSearchParams({
    token: token_hash,
    type: email_action_type,
    redirect_to: redirect_to || APP_ORIGIN,
  })
  return `${supabaseUrl}/auth/v1/verify?${params}`
}

// Preview endpoint — authenticated with PREVIEW_API_KEY or RESEND_API_KEY
async function handlePreview(req: Request): Promise<Response> {
  const previewCorsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: previewCorsHeaders })
  }

  const apiKey = Deno.env.get('PREVIEW_API_KEY') || Deno.env.get('RESEND_API_KEY')
  const authHeader = req.headers.get('Authorization')

  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let type: string
  try {
    const body = await req.json()
    type = body.type
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const EmailTemplate = EMAIL_TEMPLATES[type]
  if (!EmailTemplate) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sampleData = SAMPLE_DATA[type] || {}
  const html = await renderAsync(React.createElement(EmailTemplate, sampleData))

  return new Response(html, {
    status: 200,
    headers: { ...previewCorsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// Main hook handler — Supabase Send Email Hook format
async function handleHook(req: Request): Promise<Response> {
  await verifyHookSignature(req)

  const payload = await req.json()
  // Supabase Send Email Hook payload: { user, email_data }
  const { user, email_data } = payload
  const emailType = email_data?.email_action_type
  const email = user?.email

  if (!emailType || !email) {
    console.error('Invalid hook payload', { emailType, email })
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Received auth event', { emailType, email })

  const EmailTemplate = EMAIL_TEMPLATES[emailType]
  if (!EmailTemplate) {
    console.error('Unknown email type', { emailType })
    return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const recipientName = await resolveRecipientName(email)
  const confirmationUrl = buildConfirmationUrl(email_data)

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: email,
    recipientName,
    confirmationUrl,
    token: email_data.token,
    email,
    newEmail: email_data.new_email,
  }

  const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), {
    plainText: true,
  })

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured')
    return new Response(JSON.stringify({ error: 'Email service not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const resend = new Resend(resendApiKey)
  const { data, error } = await resend.emails.send({
    from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
    replyTo: `support@${SENDER_DOMAIN}`,
    to: email,
    subject: EMAIL_SUBJECTS[emailType] || 'Notification',
    html,
    text,
  })

  if (error) {
    console.error('Resend error', error)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Email sent successfully', { id: data?.id })
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  const url = new URL(req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (url.pathname.endsWith('/preview')) {
    return handlePreview(req)
  }

  try {
    return await handleHook(req)
  } catch (error) {
    console.error('Hook handler error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('Unauthorized') ? 401 : 500
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
