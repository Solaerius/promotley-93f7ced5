import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Plan configuration with lookup keys
const PLAN_CONFIG: Record<string, { lookupKey: string; credits: number; dbPlan: string }> = {
  starter: { lookupKey: 'starter_monthly_sek', credits: 50, dbPlan: 'pro' },
  growth: { lookupKey: 'growth_monthly_sek', credits: 100, dbPlan: 'pro_xl' },
  pro: { lookupKey: 'pro_monthly_sek', credits: 300, dbPlan: 'pro_unlimited' },
};

// Fallback prices in case lookup_key prices don't exist yet
const FALLBACK_PRICES: Record<string, number> = {
  starter: 2900, // 29 SEK in öre
  growth: 4900,
  pro: 9900,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const action = pathParts[pathParts.length - 1];

  console.log('[billing] Action:', action, 'Method:', req.method);

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const STRIPE_PUBLISHABLE_KEY = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    
    // GET /billing/config - Return publishable key for client
    if (req.method === 'GET' && action === 'config') {
      if (!STRIPE_PUBLISHABLE_KEY) {
        return new Response(
          JSON.stringify({ error: 'Stripe publishable key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ publishableKey: STRIPE_PUBLISHABLE_KEY }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for required env vars (except for webhook which needs different handling)
    if (!STRIPE_SECRET_KEY && action !== 'webhook' && action !== 'config') {
      console.error('[billing] STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured', missing: 'STRIPE_SECRET_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }) : null;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // POST /billing/create-checkout-session - Create embedded checkout session
    if (req.method === 'POST' && (action === 'create-checkout-session' || action === 'checkout')) {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError || !user) {
        console.error('[billing] Auth error:', userError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { plan, planLookupKey, userId, successUrl, cancelUrl } = body;

      // Determine plan from either plan name or lookup key
      let planKey = plan;
      if (planLookupKey) {
        planKey = Object.keys(PLAN_CONFIG).find(k => PLAN_CONFIG[k].lookupKey === planLookupKey) || plan;
      }

      const planConfig = PLAN_CONFIG[planKey] || PLAN_CONFIG.starter;
      console.log('[billing] Creating checkout for plan:', planKey, 'lookupKey:', planConfig.lookupKey);

      // Verify userId matches authenticated user
      if (userId && userId !== user.id) {
        return new Response(
          JSON.stringify({ error: 'User ID mismatch' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!stripe) {
        return new Response(
          JSON.stringify({ error: 'Stripe not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get or create Stripe customer
      let customerId: string | undefined;
      
      // Check if customer already exists
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('[billing] Found existing customer:', customerId);
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        console.log('[billing] Created new customer:', customerId);
      }

      // Try to get price by lookup_key first
      let priceId: string | undefined;
      try {
        const prices = await stripe.prices.list({ 
          lookup_keys: [planConfig.lookupKey],
          active: true,
          limit: 1 
        });
        if (prices.data.length > 0) {
          priceId = prices.data[0].id;
          console.log('[billing] Found price by lookup_key:', priceId);
        }
      } catch (e) {
        console.log('[billing] Could not find price by lookup_key, will use inline price');
      }

      // Create checkout session
      const origin = req.headers.get('origin') || 'https://promotely.se';
      const returnUrl = successUrl || `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;

      let session;
      
      if (priceId) {
        // Use existing price
        session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          ui_mode: 'embedded',
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          return_url: returnUrl,
          metadata: {
            userId: user.id,
            plan: planKey,
            credits: planConfig.credits.toString(),
          },
        });
      } else {
        // Create inline price (fallback for testing)
        session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          ui_mode: 'embedded',
          customer: customerId,
          line_items: [{
            price_data: {
              currency: 'sek',
              product_data: {
                name: `UF ${planKey.charAt(0).toUpperCase() + planKey.slice(1)}`,
                description: `${planConfig.credits} AI-krediter per månad`,
              },
              unit_amount: FALLBACK_PRICES[planKey] || 2900,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          }],
          return_url: returnUrl,
          metadata: {
            userId: user.id,
            plan: planKey,
            credits: planConfig.credits.toString(),
          },
        });
      }

      console.log('[billing] Checkout session created:', session.id);

      return new Response(
        JSON.stringify({ 
          clientSecret: session.client_secret,
          checkoutSessionId: session.id,
          // Also return URL for fallback hosted checkout
          checkoutUrl: session.url,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /billing/subscription-status - Get current subscription status
    if (req.method === 'GET' && action === 'subscription-status') {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user data
      const { data: userData, error: dbError } = await supabaseClient
        .from('users')
        .select('plan, credits_left, max_credits, renewal_date')
        .eq('id', user.id)
        .single();

      if (dbError) {
        console.error('[billing] DB error:', dbError);
        return new Response(
          JSON.stringify({ error: 'Could not fetch user data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isActive = userData.plan !== 'free_trial';

      return new Response(
        JSON.stringify({ 
          status: isActive ? 'active' : 'inactive',
          plan: userData.plan,
          credits_left: userData.credits_left,
          max_credits: userData.max_credits,
          renewal_date: userData.renewal_date,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /billing/webhook - Handle Stripe webhooks
    if (req.method === 'POST' && action === 'webhook') {
      const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

      if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
        console.error('[billing] Missing webhook config');
        return new Response(
          JSON.stringify({ error: 'Webhook not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stripeWebhook = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

      const signature = req.headers.get('stripe-signature');
      if (!signature) {
        console.error('[billing] No signature in webhook');
        return new Response(
          JSON.stringify({ error: 'No signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.text();
      
      let event;
      try {
        event = stripeWebhook.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.error('[billing] Webhook signature verification failed');
        return new Response(
          JSON.stringify({ error: 'Webhook signature verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[billing] Webhook event:', event.type);

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const userId = session.client_reference_id || session.metadata?.userId;
          const plan = session.metadata?.plan || 'starter';
          const credits = parseInt(session.metadata?.credits || '50');

          console.log('[billing] Checkout completed for user:', userId, 'plan:', plan);

          if (userId) {
            const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
            const renewalDate = new Date();
            renewalDate.setMonth(renewalDate.getMonth() + 1);

            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({
                plan: planConfig.dbPlan,
                max_credits: credits,
                credits_left: credits,
                credits_used: 0,
                renewal_date: renewalDate.toISOString().split('T')[0],
              })
              .eq('id', userId);

            if (updateError) {
              console.error('[billing] Failed to update user:', updateError);
            } else {
              console.log('[billing] User subscription activated:', userId);
            }
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          const customerId = subscription.customer;
          
          // Get user by customer email
          if (stripeWebhook) {
            try {
              const customer = await stripeWebhook.customers.retrieve(customerId) as any;
              const userId = customer.metadata?.userId;
              
              if (userId && subscription.status === 'active') {
                // Get plan from price metadata or lookup key
                const priceId = subscription.items?.data?.[0]?.price?.id;
                let planKey = 'starter';
                
                if (priceId) {
                  const price = await stripeWebhook.prices.retrieve(priceId);
                  // Check lookup_key or metadata
                  if (price.lookup_key) {
                    planKey = Object.keys(PLAN_CONFIG).find(k => 
                      PLAN_CONFIG[k].lookupKey === price.lookup_key
                    ) || 'starter';
                  }
                }
                
                const planConfig = PLAN_CONFIG[planKey];
                const renewalDate = new Date(subscription.current_period_end * 1000);
                
                await supabaseAdmin
                  .from('users')
                  .update({
                    plan: planConfig.dbPlan,
                    max_credits: planConfig.credits,
                    renewal_date: renewalDate.toISOString().split('T')[0],
                  })
                  .eq('id', userId);
                  
                console.log('[billing] Subscription updated for user:', userId);
              }
            } catch (e) {
              console.error('[billing] Error processing subscription:', e);
            }
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          const customerId = subscription.customer;
          
          if (stripeWebhook) {
            try {
              const customer = await stripeWebhook.customers.retrieve(customerId) as any;
              const userId = customer.metadata?.userId;
              
              if (userId) {
                await supabaseAdmin
                  .from('users')
                  .update({
                    plan: 'free_trial',
                    credits_left: 1,
                    max_credits: 50,
                  })
                  .eq('id', userId);
                  
                console.log('[billing] Subscription cancelled for user:', userId);
              }
            } catch (e) {
              console.error('[billing] Error processing cancellation:', e);
            }
          }
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as any;
          console.log('[billing] Invoice paid:', invoice.id);
          
          // Refresh credits on successful renewal
          if (invoice.subscription && stripeWebhook) {
            try {
              const subscription = await stripeWebhook.subscriptions.retrieve(invoice.subscription as string);
              const customer = await stripeWebhook.customers.retrieve(subscription.customer as string) as any;
              const userId = customer.metadata?.userId;
              
              if (userId) {
                // Get current plan credits
                const { data: userData } = await supabaseAdmin
                  .from('users')
                  .select('max_credits')
                  .eq('id', userId)
                  .single();
                  
                if (userData) {
                  await supabaseAdmin
                    .from('users')
                    .update({
                      credits_left: userData.max_credits,
                      credits_used: 0,
                    })
                    .eq('id', userId);
                    
                  console.log('[billing] Credits refreshed for user:', userId);
                }
              }
            } catch (e) {
              console.error('[billing] Error refreshing credits:', e);
            }
          }
          break;
        }

        default:
          console.log('[billing] Unhandled event type:', event.type);
      }

      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback
    return new Response(
      JSON.stringify({ error: 'Invalid action', action }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[billing] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
