import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const metaAppId = Deno.env.get('META_APP_ID')!;
    const customDomain = Deno.env.get('CUSTOM_DOMAIN')!;

    if (!supabaseUrl || !supabaseServiceRoleKey || !metaAppId || !customDomain) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Missing configuration' }),
        { status: 500, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get provider from request body
    const { provider } = await req.json();
    
    if (!provider || !['meta_fb', 'meta_ig'].includes(provider)) {
      return new Response(
        JSON.stringify({ error: 'Invalid provider. Must be meta_fb or meta_ig' }),
        { status: 400, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate state token
    const stateToken = crypto.randomUUID();

    // Insert oauth state using service role
    const { error: insertError } = await supabaseClient
      .from('oauth_states')
      .insert({
        state_token: stateToken,
        user_id: user.id,
        provider: provider,
      });

    if (insertError) {
      console.error('Error inserting oauth state:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create OAuth state' }),
        { status: 500, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine permissions based on provider
    const permissions = provider === 'meta_ig'
      ? ['instagram_basic', 'instagram_manage_insights', 'pages_show_list', 'pages_read_engagement']
      : ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'read_insights'];

    const scope = permissions.join(',');
    const redirectUri = `https://${customDomain}/api/oauth-callback`;

    // Build OAuth URL
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${metaAppId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${stateToken}` +
      `&scope=${encodeURIComponent(scope)}`;

    console.log(`OAuth URL created for ${provider}, user: ${user.id}`);

    return new Response(
      JSON.stringify({ url: authUrl }),
      { status: 200, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
