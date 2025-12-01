import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Extract and validate JWT
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing_jwt' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1) Validate JWT with service role client
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('JWT validation failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid_jwt' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) DB client with anon key + forwarded JWT for RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false }
      }
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // GET /calendar/context - Get calendar digest for AI
    if (req.method === 'GET' && pathParts.includes('context')) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysForward = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabaseClient
        .from('calendar_posts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('date', sixtyDaysForward.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching calendar context:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create digest
      const digest = (data || []).map(post => ({
        id: post.id,
        date: post.date,
        channel: post.platform,
        title: post.title,
        tags: post.description?.substring(0, 50) || ''
      }));

      return new Response(
        JSON.stringify({ 
          digest, 
          lastUpdatedAt: new Date().toISOString(),
          count: digest.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /calendar - Get all posts sorted by date
    if (req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('calendar_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching calendar posts:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data || []),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /calendar/bulk_create - Create multiple posts
    if (req.method === 'POST' && pathParts.includes('bulk_create')) {
      const body = await req.json();
      const { posts, requestId } = body;

      if (!posts || !Array.isArray(posts)) {
        return new Response(
          JSON.stringify({ error: 'Posts array required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const created = [];
      const skipped = [];

      for (const post of posts) {
        if (!post.title || !post.channel || !post.date) {
          skipped.push({ reason: 'Missing required fields', post });
          continue;
        }

        // Check for duplicates
        const { data: existing } = await supabaseClient
          .from('calendar_posts')
          .select('id')
          .eq('user_id', user.id)
          .eq('platform', post.channel)
          .eq('date', post.date)
          .eq('title', post.title)
          .maybeSingle();

        if (existing) {
          skipped.push({ reason: 'duplicate', id: existing.id, post });
          continue;
        }

        // Validate future date
        if (new Date(post.date) < new Date()) {
          skipped.push({ reason: 'Date must be in the future', post });
          continue;
        }

        const { data: created_post, error } = await supabaseClient
          .from('calendar_posts')
          .insert({
            user_id: user.id,
            title: post.title,
            description: post.content || '',
            platform: post.channel,
            date: post.date,
          })
          .select()
          .single();

        if (error) {
          skipped.push({ reason: error.message, post });
        } else {
          created.push(created_post);
        }
      }

      return new Response(
        JSON.stringify({ created, skipped }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /calendar - Create new post (not bulk_create or update)
    if (req.method === 'POST' && !pathParts.includes('bulk_create')) {
      let body;
      try {
        body = await req.json();
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { title, description, platform, date } = body;

      if (!title || !platform || !date) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: title, platform, date' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!['instagram', 'tiktok', 'facebook'].includes(platform)) {
        return new Response(
          JSON.stringify({ error: 'Invalid platform. Must be: instagram, tiktok, or facebook' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate future date
      if (new Date(date) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Date must be in the future' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('calendar_posts')
        .insert({
          user_id: user.id,
          title,
          description,
          platform,
          date,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating calendar post:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /calendar/update/{id} - Update post
    if (req.method === 'PUT' && pathParts.includes('update')) {
      const postId = pathParts[pathParts.length - 1];
      const body = await req.json();
      const { title, description, platform, date } = body;

      const { data, error } = await supabaseClient
        .from('calendar_posts')
        .update({ title, description, platform, date })
        .eq('id', postId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating calendar post:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Post not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /calendar/{id} - Delete post
    if (req.method === 'DELETE') {
      const postId = pathParts[pathParts.length - 1];

      const { error } = await supabaseClient
        .from('calendar_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting calendar post:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calendar function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});