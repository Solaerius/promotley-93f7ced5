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

// Helper to create response with CORS
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse body to get route (or fallback to URL path)
    let route = 'unknown';
    let body: Record<string, unknown> = {};
    
    if (req.method === 'POST') {
      try {
        body = await req.json();
        route = (body.route as string) || 'unknown';
      } catch {
        // If no JSON body, try to parse from URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/').filter(Boolean);
        route = pathParts[pathParts.length - 1] || 'unknown';
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      route = pathParts[pathParts.length - 1] || 'config';
    }

    console.log('[billing] Route:', route, 'Method:', req.method);

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const STRIPE_PUBLISHABLE_KEY = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Route: config (public - no auth required)
    if (route === 'config') {
      if (!STRIPE_PUBLISHABLE_KEY) {
        return jsonResponse({ error: 'stripe_misconfigured', detail: 'Publishable key not set' }, 500);
      }
      return jsonResponse({ publishableKey: STRIPE_PUBLISHABLE_KEY });
    }

    // Route: webhook (special handling - no JWT, uses Stripe signature)
    if (route === 'webhook') {
      return handleWebhook(req, STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }

    // All other routes require JWT authentication
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[billing] Missing or invalid Authorization header');
      return jsonResponse({ error: 'missing_authorization' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Use service role to verify the JWT token
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[billing] Auth error:', authError?.message || 'No user found');
      return jsonResponse({ error: 'invalid_token', detail: authError?.message }, 401);
    }

    console.log('[billing] Authenticated user:', user.id);

    // Check email verification for checkout
    if (route === 'create-checkout-session' && !user.email_confirmed_at) {
      console.error('[billing] Email not verified:', user.id);
      return jsonResponse({ 
        error: 'email_not_verified',
        message: 'Verifiera din e-post för att kunna köpa prenumeration'
      }, 403);
    }

    // Route: create-checkout-session
    if (route === 'create-checkout-session') {
      if (!STRIPE_SECRET_KEY) {
        console.error('[billing] STRIPE_SECRET_KEY not configured');
        return jsonResponse({ error: 'stripe_misconfigured', detail: 'Secret key not set' }, 500);
      }

      const { plan, planLookupKey, userId, successUrl, cancelUrl } = body;

      // Validate userId matches authenticated user
      if (userId && userId !== user.id) {
        console.error('[billing] User ID mismatch:', userId, '!=', user.id);
        return jsonResponse({ error: 'forbidden', detail: 'User ID mismatch' }, 403);
      }

      // Determine plan from either plan name or lookup key
      let planKey = plan as string;
      if (planLookupKey) {
        planKey = Object.keys(PLAN_CONFIG).find(k => PLAN_CONFIG[k].lookupKey === planLookupKey) || (plan as string);
      }

      if (!planKey || !PLAN_CONFIG[planKey]) {
        return jsonResponse({ error: 'invalid_plan', detail: `Unknown plan: ${planKey}` }, 400);
      }

      const planConfig = PLAN_CONFIG[planKey];
      console.log('[billing] Creating checkout for plan:', planKey, 'lookupKey:', planConfig.lookupKey);

      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

      // Get or create Stripe customer
      let customerId: string;
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('[billing] Found existing customer:', customerId);
      } else {
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
          limit: 1,
        });
        if (prices.data.length > 0) {
          priceId = prices.data[0].id;
          console.log('[billing] Found price by lookup_key:', priceId);
        }
      } catch (e) {
        console.log('[billing] Could not find price by lookup_key:', e);
      }

      // Create checkout session
      const origin = req.headers.get('origin') || 'https://promotely.se';
      const returnUrl = (successUrl as string) || `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;

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
        console.log('[billing] Using fallback inline price for plan:', planKey);
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

      return jsonResponse({
        clientSecret: session.client_secret,
        checkoutSessionId: session.id,
      });
    }

    // Route: verify-session (aktivera prenumeration efter betalning)
    if (route === 'verify-session') {
      const { sessionId } = body;
      
      if (!sessionId) {
        return jsonResponse({ error: 'missing_session_id' }, 400);
      }

      if (!STRIPE_SECRET_KEY) {
        return jsonResponse({ error: 'stripe_misconfigured' }, 500);
      }

      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

      try {
        // Hämta checkout session från Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        console.log('[billing] Verifying session:', sessionId, 'status:', session.status, 'payment_status:', session.payment_status);

        // Verifiera att sessionen tillhör denna användare
        if (session.metadata?.userId && session.metadata.userId !== user.id) {
          console.error('[billing] Session userId mismatch:', session.metadata.userId, '!=', user.id);
          return jsonResponse({ error: 'forbidden' }, 403);
        }

        // Om betalningen är slutförd, aktivera paketet
        if (session.status === 'complete' && session.payment_status === 'paid') {
          const plan = session.metadata?.plan || 'starter';
          const credits = parseInt(session.metadata?.credits || '50');
          const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
          
          const renewalDate = new Date();
          renewalDate.setMonth(renewalDate.getMonth() + 1);

          console.log('[billing] Activating plan for user:', user.id, 'plan:', planConfig.dbPlan, 'credits:', credits);

          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              plan: planConfig.dbPlan,
              max_credits: credits,
              credits_left: credits,
              credits_used: 0,
              renewal_date: renewalDate.toISOString().split('T')[0],
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('[billing] Failed to update user:', updateError);
            return jsonResponse({ error: 'db_error', detail: updateError.message }, 500);
          }

          console.log('[billing] Plan activated successfully for user:', user.id);

          return jsonResponse({
            status: 'active',
            plan: planConfig.dbPlan,
            credits: credits,
            activated: true,
          });
        }

        // Betalningen är inte slutförd ännu
        return jsonResponse({
          status: 'pending',
          sessionStatus: session.status,
          paymentStatus: session.payment_status,
          activated: false,
        });

      } catch (stripeError) {
        console.error('[billing] Stripe error:', stripeError);
        return jsonResponse({ error: 'stripe_error', detail: stripeError instanceof Error ? stripeError.message : 'Unknown' }, 500);
      }
    }

    // Route: subscription-status
    if (route === 'subscription-status') {
      const { data: userData, error: dbError } = await supabaseAdmin
        .from('users')
        .select('plan, credits_left, max_credits, renewal_date')
        .eq('id', user.id)
        .single();

      if (dbError) {
        console.error('[billing] DB error:', dbError);
        return jsonResponse({ error: 'db_error', detail: dbError.message }, 500);
      }

      const isActive = userData.plan !== 'free_trial';

      return jsonResponse({
        status: isActive ? 'active' : 'inactive',
        plan: userData.plan,
        credits_left: userData.credits_left,
        max_credits: userData.max_credits,
        renewal_date: userData.renewal_date,
      });
    }

    // Route: cancel-subscription
    if (route === 'cancel-subscription') {
      if (!STRIPE_SECRET_KEY) {
        return jsonResponse({ error: 'stripe_misconfigured' }, 500);
      }

      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

      try {
        // Find customer by email
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        
        if (customers.data.length === 0) {
          // No Stripe customer - just reset in database
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              plan: 'free_trial',
              credits_left: 1,
              max_credits: 50,
              renewal_date: null,
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('[billing] DB error:', updateError);
            return jsonResponse({ error: 'db_error', detail: updateError.message }, 500);
          }

          return jsonResponse({ status: 'cancelled', message: 'Subscription cancelled' });
        }

        const customerId = customers.data[0].id;

        // Find active subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          // Cancel at period end (user keeps access until renewal date)
          await stripe.subscriptions.update(subscriptions.data[0].id, {
            cancel_at_period_end: true,
          });

          console.log('[billing] Subscription set to cancel at period end:', subscriptions.data[0].id);
        }

        // Update database to reflect cancellation
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            plan: 'free_trial',
            credits_left: 1,
            max_credits: 50,
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('[billing] DB error:', updateError);
          return jsonResponse({ error: 'db_error', detail: updateError.message }, 500);
        }

        return jsonResponse({ status: 'cancelled', message: 'Subscription cancelled successfully' });

      } catch (stripeError) {
        console.error('[billing] Stripe error:', stripeError);
        return jsonResponse({ error: 'stripe_error', detail: stripeError instanceof Error ? stripeError.message : 'Unknown' }, 500);
      }
    }

    // Unknown route
    return jsonResponse({ error: 'not_found', detail: `Unknown route: ${route}` }, 404);

  } catch (error) {
    console.error('[billing] Unexpected error:', error);
    return jsonResponse({ 
      error: 'internal_error', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Webhook handler (separate function for clarity)
async function handleWebhook(
  req: Request,
  stripeSecretKey: string | undefined,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecretKey || !STRIPE_WEBHOOK_SECRET) {
    console.error('[billing] Missing webhook config');
    return jsonResponse({ error: 'webhook_misconfigured' }, 500);
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error('[billing] No signature in webhook');
    return jsonResponse({ error: 'missing_signature' }, 400);
  }

  const body = await req.text();
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[billing] Webhook signature verification failed:', err);
    return jsonResponse({ error: 'invalid_signature' }, 400);
  }

  console.log('[billing] Webhook event:', event.type);

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
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
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      try {
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userId = customer.metadata?.userId;
        
        if (userId && subscription.status === 'active') {
          const priceId = subscription.items?.data?.[0]?.price?.id;
          let planKey = 'starter';
          
          if (priceId) {
            const price = await stripe.prices.retrieve(priceId);
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
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      try {
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
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
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('[billing] Invoice paid:', invoice.id);
      
      if (invoice.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
          const userId = customer.metadata?.userId;
          
          if (userId) {
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

  return jsonResponse({ received: true });
}
