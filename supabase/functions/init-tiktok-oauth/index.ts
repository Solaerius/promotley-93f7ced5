import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

serve(async (req) => {
  console.log('🟢 init-tiktok-oauth reached - function is deployed and working');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const tiktokClientKey = Deno.env.get('TIKTOK_CLIENT_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !tiktokClientKey) {
      throw new Error('Missing required environment variables');
    }

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Initializing TikTok OAuth for user:', user.id);

    // Generate CSRF state token
    const stateToken = crypto.randomUUID();
    console.log('Generated state token:', stateToken);

    // Store state in database with 10-minute expiration
    const { error: insertError } = await supabase
      .from('oauth_states')
      .insert({
        state_token: stateToken,
        user_id: user.id,
        provider: 'tiktok',
      });

    if (insertError) {
      console.error('Failed to store state token:', insertError);
      throw new Error('Failed to initialize OAuth');
    }

    console.log('State token stored successfully');

    // Build TikTok authorization URL
    const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;
    const scope = 'user.info.basic,user.info.stats,video.list';
    
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.set('client_key', tiktokClientKey);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', stateToken);

    console.log('TikTok OAuth URL generated:', { 
      redirectUri, 
      stateToken,
      scope,
      authUrl: authUrl.toString() 
    });

    return new Response(
      JSON.stringify({ url: authUrl.toString() }),
      {
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in init-tiktok-oauth:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
