import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { logger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-side price ID map — populated from env vars set in Supabase dashboard
// DO NOT use client-supplied priceId values
function getPriceIds() {
  return {
    starter: Deno.env.get('STRIPE_PRICE_STARTER') ?? '',
    growth:  Deno.env.get('STRIPE_PRICE_GROWTH') ?? '',
    pro:     Deno.env.get('STRIPE_PRICE_PRO') ?? '',
    mini:    Deno.env.get('STRIPE_PRICE_MINI') ?? '',
    small:   Deno.env.get('STRIPE_PRICE_SMALL') ?? '',
    medium:  Deno.env.get('STRIPE_PRICE_MEDIUM') ?? '',
    large:   Deno.env.get('STRIPE_PRICE_LARGE') ?? '',
  } as Record<string, string>;
}

const PLAN_KEYS = new Set(['starter', 'growth', 'pro']);
const PACKAGE_KEYS = new Set(['mini', 'small', 'medium', 'large']);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Validate SITE_URL inside handler (not module top-level)
  const SITE_URL = Deno.env.get('SITE_URL');
  if (!SITE_URL) {
    return jsonResponse({ error: 'SITE_URL not configured' }, 500);
  }

  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  if (!STRIPE_SECRET_KEY) {
    return jsonResponse({ error: 'STRIPE_SECRET_KEY not configured' }, 500);
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // Verify JWT
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'missing_authorization' }, 401);
  }
  const token = authHeader.replace('Bearer ', '');
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return jsonResponse({ error: 'invalid_token' }, 401);
  }

  if (checkRateLimit(user.id, 'billing', 3, 60)) {
    await logger.warn('billing', 'Rate limit hit', { userId: user.id });
    return jsonResponse({ error: 'rate_limited' }, 429);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_body' }, 400);
  }

  const { planKey, type } = body as { planKey: string; type: string };

  // Validate planKey exists
  const PRICE_IDS = getPriceIds();
  if (!planKey || !(planKey in PRICE_IDS)) {
    return jsonResponse({ error: 'invalid_plan_key', detail: `Unknown key: ${planKey}` }, 400);
  }

  // Validate type matches planKey
  if (PLAN_KEYS.has(planKey) && type !== 'subscription') {
    return jsonResponse({ error: 'type_mismatch', detail: 'Plan keys require type: subscription' }, 400);
  }
  if (PACKAGE_KEYS.has(planKey) && type !== 'one_time') {
    return jsonResponse({ error: 'type_mismatch', detail: 'Package keys require type: one_time' }, 400);
  }

  const priceId = PRICE_IDS[planKey];
  if (!priceId) {
    return jsonResponse({ error: 'price_not_configured', detail: `No price ID for key: ${planKey}` }, 500);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

  // Look up or create Stripe customer
  let stripeCustomerId: string;
  const { data: existingCustomer } = await supabaseAdmin
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingCustomer?.stripe_customer_id) {
    stripeCustomerId = existingCustomer.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;

    await supabaseAdmin.from('stripe_customers').insert({
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
    });

    await supabaseAdmin.from('users').update({
      stripe_customer_id: stripeCustomerId,
    }).eq('id', user.id);
  }

  // Create Checkout Session
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: type === 'subscription' ? 'subscription' : 'payment',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/checkout/cancel`,
      metadata: {
        userId: user.id,
        planKey,
        type,
      },
    });
  } catch (err) {
    await logger.error('billing', 'Stripe checkout session creation failed', { userId: user.id, planKey, error: (err as Error).message });
    return jsonResponse({ error: 'checkout_failed' }, 500);
  }

  return jsonResponse({ url: session.url });
});
