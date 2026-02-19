import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tiktok-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET');
    
    if (!TIKTOK_CLIENT_SECRET) {
      console.error('Missing TIKTOK_CLIENT_SECRET');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the request body
    const body = await req.text();
    const signature = req.headers.get('x-tiktok-signature');
    
    console.log('TikTok webhook received:', {
      method: req.method,
      hasSignature: !!signature,
      bodyLength: body.length
    });

    // Verify webhook signature (mandatory)
    if (!signature) {
      console.error('Missing TikTok signature');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hmac = createHmac('sha256', TIKTOK_CLIENT_SECRET);
    const expectedSignature = hmac.update(body).digest('hex');
    
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the webhook data
    const data = JSON.parse(body);
    
    // Handle TikTok challenge verification
    if (data.challenge) {
      console.log('TikTok challenge verification:', data.challenge);
      return new Response(
        JSON.stringify({ challenge: data.challenge }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the webhook event for debugging
    console.log('TikTok webhook event:', {
      type: data.type,
      event: data.event,
      timestamp: data.timestamp
    });

    // Initialize Supabase client for storing webhook data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store webhook event for later processing if needed
    // You can add database logic here to store events
    
    // Acknowledge receipt
    return new Response(
      JSON.stringify({ success: true, received: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('TikTok webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
