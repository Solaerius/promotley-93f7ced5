import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get platform from body if provided
    let platform: string | undefined;
    if (req.method === 'GET') {
      try {
        const body = await req.json().catch(() => ({}));
        platform = body?.platform;
      } catch {
        platform = undefined;
      }
    }

    if (req.method === 'GET') {
      let query = supabaseClient
        .from('analytics')
        .select('*')
        .eq('user_id', user.id);

      // If platform specified, filter by platform
      if (platform && ['instagram', 'tiktok', 'facebook'].includes(platform)) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching analytics:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return empty indicator if no data
      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ empty: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { platform, followers, views, reach, engagement, history } = body;

      if (!platform || !['instagram', 'tiktok', 'facebook'].includes(platform)) {
        return new Response(
          JSON.stringify({ error: 'Invalid platform' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Upsert analytics data
      const { data, error } = await supabaseClient
        .from('analytics')
        .upsert({
          user_id: user.id,
          platform,
          followers,
          views,
          reach,
          engagement,
          history,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,platform'
        })
        .select();

      if (error) {
        console.error('Error updating analytics:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analytics function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});