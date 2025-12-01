import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
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
    const adminClient = createClient(URL, SERVICE, { auth: { persistSession: false } });
    const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('JWT validation failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid_jwt' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) DB client with anon key + forwarded JWT for RLS
    const db = createClient(URL, ANON, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false }
    });

    // Helper functions
    const ok = (data: any, status = 200) => new Response(
      JSON.stringify(data),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
    const bad = (msg: string, status = 400) => ok({ error: msg }, status);

    // Helper: fetch list of posts
    const fetchList = async () => {
      const { data, error } = await db
        .from('calendar_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
      if (error) {
        console.error('Error fetching calendar posts:', error);
        return bad(error.message, 500);
      }
      return ok(data ?? []);
    };

    // 3) GET → backward compat, return list
    if (req.method === 'GET') {
      console.log('[calendar] GET request (backward compat), user:', user.id);
      return fetchList();
    }

    // 4) POST - parse body robustly (no 400 on parse failure)
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      // Body parsing failed - that's OK, we'll default to 'list'
      body = null;
    }

    // Default to 'list' if body is missing or has no action
    const action = (body && body.action) ? body.action : 'list';
    const dataIn = (body && body.data) ? body.data : null;

    console.log('[calendar] action:', action, 'hasBody:', !!body, 'user:', user.id);

    switch (action) {
      case 'list': {
        return fetchList();
      }

      case 'context': {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysForward = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

        const { data, error } = await db
          .from('calendar_posts')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .lte('date', sixtyDaysForward.toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(100);

        if (error) {
          console.error('Error fetching calendar context:', error);
          return bad(error.message, 500);
        }

        // Create digest
        const digest = (data || []).map(post => ({
          id: post.id,
          date: post.date,
          channel: post.platform,
          title: post.title,
          tags: post.description?.substring(0, 50) || ''
        }));

        return ok({
          digest,
          lastUpdatedAt: new Date().toISOString(),
          count: digest.length
        });
      }

      case 'create': {
        const { title, description, platform, date } = dataIn ?? {};

        if (!title || !platform || !date) {
          return bad('Missing required fields: title, platform, date');
        }

        if (!['instagram', 'tiktok', 'facebook'].includes(String(platform))) {
          return bad('Invalid platform. Must be: instagram, tiktok, or facebook');
        }

        const { data, error } = await db
          .from('calendar_posts')
          .insert({
            user_id: user.id,
            title,
            description: description ?? '',
            platform,
            date
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating calendar post:', error);
          return bad(error.message, 500);
        }

        return ok(data, 201);
      }

      case 'bulk_create': {
        const posts = dataIn?.posts;
        const requestId = dataIn?.requestId ?? null;

        if (!Array.isArray(posts)) {
          return bad('Posts array required');
        }

        const created: any[] = [];
        const skipped: any[] = [];

        for (const post of posts) {
          const title = post?.title;
          const platform = post?.channel;
          const date = post?.date;

          if (!title || !platform || !date) {
            skipped.push({ reason: 'missing_fields', post });
            continue;
          }

          if (!['instagram', 'tiktok', 'facebook'].includes(String(platform))) {
            skipped.push({ reason: 'invalid_platform', post });
            continue;
          }

          // Check for duplicates
          const { data: existing } = await db
            .from('calendar_posts')
            .select('id')
            .eq('user_id', user.id)
            .eq('platform', platform)
            .eq('date', date)
            .eq('title', title)
            .maybeSingle();

          if (existing) {
            skipped.push({ reason: 'duplicate', id: existing.id, post });
            continue;
          }

          const { data: createdPost, error } = await db
            .from('calendar_posts')
            .insert({
              user_id: user.id,
              title,
              description: post?.content ?? '',
              platform,
              date
            })
            .select()
            .single();

          if (error) {
            skipped.push({ reason: error.message, post });
          } else {
            created.push(createdPost);
          }
        }

        console.log(`Bulk create completed: ${created.length} created, ${skipped.length} skipped`);
        return ok({ created, skipped });
      }

      case 'update': {
        const id = dataIn?.id;
        const patch = dataIn?.patch ?? {};

        if (!id) {
          return bad('Missing id');
        }

        if (patch.platform && !['instagram', 'tiktok', 'facebook'].includes(String(patch.platform))) {
          return bad('Invalid platform');
        }

        if (patch.date && !/^\d{4}-\d{2}-\d{2}$/.test(patch.date)) {
          return bad('Invalid date format, expected YYYY-MM-DD');
        }

        const { data, error } = await db
          .from('calendar_posts')
          .update(patch)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating calendar post:', error);
          return bad(error.message, 500);
        }

        if (!data) {
          return bad('Post not found', 404);
        }

        return ok(data);
      }

      case 'delete': {
        const id = dataIn?.id;

        if (!id) {
          return bad('Missing id');
        }

        const { error } = await db
          .from('calendar_posts')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting calendar post:', error);
          return bad(error.message, 500);
        }

        return ok({ success: true });
      }

      default:
        // Fallback to list for unknown actions
        console.log('[calendar] Unknown action, falling back to list:', action);
        return fetchList();
    }
  } catch (error) {
    console.error('Error in calendar function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
