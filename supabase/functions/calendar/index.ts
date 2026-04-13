import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const VALID_EVENT_TYPES = ['inlagg', 'uf_marknad', 'event', 'deadline', 'ovrigt'];
const VALID_PLATFORMS = ['instagram', 'tiktok', 'facebook'];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract and validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing_jwt' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('JWT validation failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid_jwt' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const adminClient = supabase;
    const { data: rateLimitOk } = await adminClient.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'calendar'
    });
    if (rateLimitOk === false) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DB client (service role — all queries filter by user_id)
    const db = supabase;

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

        // Create digest including event_type
        const digest = (data || []).map(post => ({
          id: post.id,
          date: post.date,
          event_type: post.event_type ?? 'inlagg',
          channel: post.platform ?? null,
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
        const { title, description, event_type, platform, date } = dataIn ?? {};

        if (!title || !event_type || !date) {
          return bad('Missing required fields: title, event_type, date');
        }

        if (!VALID_EVENT_TYPES.includes(String(event_type))) {
          return bad(`Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
        }

        if (platform && !VALID_PLATFORMS.includes(String(platform))) {
          return bad(`Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`);
        }

        const { data, error } = await db
          .from('calendar_posts')
          .insert({
            user_id: user.id,
            title,
            description: description ?? '',
            event_type,
            platform: platform ?? null,
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
          const event_type = post?.event_type ?? 'inlagg';
          const platform = post?.channel ?? post?.platform ?? null;
          const date = post?.date;

          if (!title || !date) {
            skipped.push({ reason: 'missing_fields', post });
            continue;
          }

          if (!VALID_EVENT_TYPES.includes(String(event_type))) {
            skipped.push({ reason: 'invalid_event_type', post });
            continue;
          }

          if (platform && !VALID_PLATFORMS.includes(String(platform))) {
            skipped.push({ reason: 'invalid_platform', post });
            continue;
          }

          // Check for duplicates
          const { data: existing } = await db
            .from('calendar_posts')
            .select('id')
            .eq('user_id', user.id)
            .eq('event_type', event_type)
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
              event_type,
              platform: platform ?? null,
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

        if (patch.event_type && !VALID_EVENT_TYPES.includes(String(patch.event_type))) {
          return bad(`Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
        }

        if (patch.platform && !VALID_PLATFORMS.includes(String(patch.platform))) {
          return bad(`Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`);
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
