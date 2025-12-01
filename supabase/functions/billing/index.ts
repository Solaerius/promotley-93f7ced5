import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // POST /billing/checkout - Create Stripe checkout session
    if (req.method === 'POST' && pathParts.includes('checkout')) {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { plan, userId, successUrl, cancelUrl } = body;

      if (!plan || !userId || !successUrl || !cancelUrl) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
      if (!STRIPE_SECRET_KEY) {
        return new Response(
          JSON.stringify({ error: 'Stripe not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });

      // Plan pricing
      const planPricing: Record<string, { amount: number; name: string; credits: number }> = {
        starter: { amount: 29 * 100, name: 'UF Starter', credits: 50 },
        growth: { amount: 49 * 100, name: 'UF Growth', credits: 100 },
        pro: { amount: 99 * 100, name: 'UF Pro', credits: 300 },
      };

      const selectedPlan = planPricing[plan] || planPricing.starter;

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'sek',
              product_data: {
                name: selectedPlan.name,
                description: `${selectedPlan.credits} AI-krediter per månad`,
              },
              unit_amount: selectedPlan.amount,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: user.email,
        client_reference_id: userId,
        metadata: {
          userId,
          plan,
          credits: selectedPlan.credits.toString(),
        },
      });

      return new Response(
        JSON.stringify({ checkoutUrl: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /billing/webhook - Handle Stripe webhooks
    if (req.method === 'POST' && pathParts.includes('webhook')) {
      const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
      const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

      if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Stripe not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });

      const signature = req.headers.get('stripe-signature');
      if (!signature) {
        return new Response(
          JSON.stringify({ error: 'No signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.text();
      
      let event;
      try {
        event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new Response(
          JSON.stringify({ error: 'Webhook signature verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

          if (userId) {
            // Map plan to database enum
            const planMap: Record<string, string> = {
              starter: 'free_trial',
              growth: 'pro',
              pro: 'pro_xl',
            };

            const dbPlan = planMap[plan] || 'free_trial';

            // Update user subscription
            const renewalDate = new Date();
            renewalDate.setMonth(renewalDate.getMonth() + 1);

            await supabaseAdmin
              .from('users')
              .update({
                plan: dbPlan,
                max_credits: credits,
                credits_left: credits,
                credits_used: 0,
                renewal_date: renewalDate.toISOString().split('T')[0],
              })
              .eq('id', userId);

            console.log('Subscription activated for user:', userId);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          // Handle subscription updates
          console.log('Subscription updated:', subscription.id);
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as any;
          // Handle successful payment
          console.log('Invoice paid:', invoice.id);
          break;
        }

        default:
          console.log('Unhandled event type:', event.type);
      }

      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in billing function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
