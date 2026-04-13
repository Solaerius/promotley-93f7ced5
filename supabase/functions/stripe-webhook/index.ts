import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { logger } from '../_shared/logger.ts';

// Keep in sync with src/lib/planConfig.ts
const PLAN_CREDITS: Record<string, number> = {
  starter: 50,
  growth: 100,
  pro: 200,
};

// Keep in sync with src/lib/stripeConfig.ts credit package definitions
const PACKAGE_CREDITS: Record<string, number> = {
  mini: 10,
  small: 25,
  medium: 50,
  large: 100,
};

// Map Stripe price IDs to plan keys — populated from env vars
function getPriceToplanMap(): Record<string, string> {
  const map: Record<string, string> = {};
  const keys = ['starter', 'growth', 'pro'];
  for (const key of keys) {
    const priceId = Deno.env.get(`STRIPE_PRICE_${key.toUpperCase()}`);
    if (priceId) map[priceId] = key;
  }
  return map;
}

serve(async (req) => {
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] Missing Stripe config');
    return new Response(JSON.stringify({ error: 'webhook_misconfigured' }), { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'missing_signature' }), { status: 400 });
  }

  const body = await req.text();
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    await logger.critical('stripe-webhook', 'Signature verification failed', { error: (err as Error).message });
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 400 });
  }

  console.log('[stripe-webhook] Event:', event.type, event.id);

  // Idempotency check
  const { data: existingEvent } = await supabaseAdmin
    .from('processed_stripe_events')
    .select('id')
    .eq('event_id', event.id)
    .maybeSingle();

  if (existingEvent) {
    console.log('[stripe-webhook] Event already processed:', event.id);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Only handle one-time payment mode here; subscription handled by subscription.created
        if (session.mode !== 'payment') break;

        const userId = session.metadata?.userId;
        const planKey = session.metadata?.planKey;
        if (!userId || !planKey) {
          console.error('[stripe-webhook] Missing metadata in checkout.session.completed');
          break;
        }

        const creditsToAdd = PACKAGE_CREDITS[planKey];
        if (!creditsToAdd) {
          console.error('[stripe-webhook] Unknown package key:', planKey);
          break;
        }

        // Add credits to user
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('credits_left')
          .eq('id', userId)
          .single();

        if (userData) {
          await supabaseAdmin
            .from('users')
            .update({ credits_left: (userData.credits_left || 0) + creditsToAdd })
            .eq('id', userId);
          console.log('[stripe-webhook] Credits added for user:', userId, 'amount:', creditsToAdd);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price?.id;
        const priceToplan = getPriceToplanMap();
        const plan = priceToplan[priceId] || 'starter';
        const userId = subscription.metadata?.userId;

        // Try to find userId from stripe_customers if not in metadata
        let resolvedUserId = userId;
        if (!resolvedUserId) {
          const { data: customerRow } = await supabaseAdmin
            .from('stripe_customers')
            .select('user_id')
            .eq('stripe_customer_id', subscription.customer as string)
            .maybeSingle();
          resolvedUserId = customerRow?.user_id;
        }

        if (!resolvedUserId) {
          console.error('[stripe-webhook] Cannot find userId for subscription:', subscription.id);
          break;
        }

        const credits = PLAN_CREDITS[plan] ?? 50;
        const periodEnd = new Date((subscription.current_period_end as number) * 1000).toISOString();
        const periodStart = new Date((subscription.current_period_start as number) * 1000).toISOString();

        await supabaseAdmin.from('stripe_subscriptions').upsert({
          user_id: resolvedUserId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          price_id: priceId,
          plan,
          status: subscription.status,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' });

        await supabaseAdmin.from('users').update({
          plan,
          credits_left: credits,
          max_credits: credits,
          renewal_date: periodEnd,
        }).eq('id', resolvedUserId);

        console.log('[stripe-webhook] Subscription created for user:', resolvedUserId, 'plan:', plan);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const newPriceId = subscription.items.data[0]?.price?.id;

        // Get existing stored price_id to detect plan change
        const { data: existingSub } = await supabaseAdmin
          .from('stripe_subscriptions')
          .select('price_id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        const periodEnd = new Date((subscription.current_period_end as number) * 1000).toISOString();
        const periodStart = new Date((subscription.current_period_start as number) * 1000).toISOString();

        await supabaseAdmin.from('stripe_subscriptions').upsert({
          user_id: existingSub?.user_id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          price_id: newPriceId,
          plan: getPriceToplanMap()[newPriceId] || 'starter',
          status: subscription.status,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' });

        // Only reset credits if plan changed (price_id differs)
        if (existingSub && existingSub.price_id !== newPriceId && existingSub.user_id) {
          const priceToplan = getPriceToplanMap();
          const newPlan = priceToplan[newPriceId] || 'starter';
          const credits = PLAN_CREDITS[newPlan] ?? 50;
          await supabaseAdmin.from('users').update({
            plan: newPlan,
            credits_left: credits,
            max_credits: credits,
            renewal_date: periodEnd,
          }).eq('id', existingSub.user_id);
          console.log('[stripe-webhook] Plan changed for user:', existingSub.user_id, 'new plan:', newPlan);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: subRow } = await supabaseAdmin
          .from('stripe_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        await supabaseAdmin.from('stripe_subscriptions').upsert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          price_id: subscription.items.data[0]?.price?.id,
          plan: 'free',
          status: 'canceled',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' });

        if (subRow?.user_id) {
          await supabaseAdmin.from('users').update({
            plan: 'free',
            credits_left: 0,
            max_credits: 0,
          }).eq('id', subRow.user_id);
          console.log('[stripe-webhook] Subscription deleted for user:', subRow.user_id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await supabaseAdmin.from('stripe_subscriptions').update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', invoice.subscription as string);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        // Skip initial invoice created when subscription is first created
        if ((invoice as any).billing_reason === 'subscription_create') break;

        if (!invoice.subscription) break;

        const { data: subRow } = await supabaseAdmin
          .from('stripe_subscriptions')
          .select('user_id, status')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .maybeSingle();

        if (!subRow) {
          console.warn('[stripe-webhook] invoice.paid: No subscription row found for:', invoice.subscription);
          break;
        }
        if (subRow.status === 'canceled') {
          console.warn('[stripe-webhook] invoice.paid: Subscription is canceled, skipping credit reset');
          break;
        }

        const userId = subRow.user_id;
        const periodEnd = (invoice.lines?.data?.[0]?.period?.end
          ? new Date((invoice.lines.data[0].period.end as number) * 1000).toISOString()
          : null);

        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('max_credits')
          .eq('id', userId)
          .single();

        if (userData) {
          await supabaseAdmin.from('users').update({
            credits_left: userData.max_credits,
            ...(periodEnd ? { renewal_date: periodEnd } : {}),
          }).eq('id', userId);
          console.log('[stripe-webhook] Credits renewed for user:', userId);
        }
        break;
      }

      default:
        console.log('[stripe-webhook] Unhandled event:', event.type);
    }

    // Mark event as processed
    await supabaseAdmin.from('processed_stripe_events').insert({ event_id: event.id });

  } catch (err) {
    console.error('[stripe-webhook] Processing error:', err);
    await logger.error('stripe-webhook', 'Event processing failed', { eventType: event?.type, error: (err as Error).message });
    return new Response(JSON.stringify({ error: 'processing_error' }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
