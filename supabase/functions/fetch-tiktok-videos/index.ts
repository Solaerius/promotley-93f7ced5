import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function decryptToken(encryptedToken: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);
  
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );
  
  return new TextDecoder().decode(decryptedData);
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get('META_APP_SECRET') || 'fallback-key-for-dev';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret.padEnd(32, '0').slice(0, 32));
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse cursor from request body
    let cursor: number | null = null;
    try {
      const body = await req.json();
      cursor = body.cursor ? parseInt(body.cursor) : null;
    } catch {
      // No body
    }

    // Rate limiting
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'fetch-tiktok-videos'
    });
    if (rateLimitOk === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get token
    const { data: tokenData } = await supabase
      .from('tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'tiktok')
      .maybeSingle();

    if (!tokenData) {
      return new Response(
        JSON.stringify({ success: false, error: 'TikTok ej anslutet' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check video.list scope
    const scopes = (tokenData.scopes || '').split(/[,\s]+/).filter(Boolean);
    if (!scopes.includes('video.list')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Behörigheten video.list saknas' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encryptionKey = await getEncryptionKey();
    const accessToken = await decryptToken(tokenData.access_token_enc, encryptionKey);

    const requestBody: any = { max_count: 20 };
    if (cursor) {
      requestBody.cursor = cursor;
    }

    const response = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,cover_image_url,share_url,video_description,duration,title,like_count,comment_count,share_count,view_count',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Video list API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Kunde inte hämta videor' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const videos = (data.data?.videos || []).map((video: any) => ({
      id: video.id,
      title: video.title || video.video_description || 'Utan titel',
      views: video.view_count || 0,
      likes: video.like_count || 0,
      shares: video.share_count || 0,
      comments: video.comment_count || 0,
      created_at: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
      cover_image_url: video.cover_image_url,
      share_url: video.share_url,
      duration: video.duration,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        videos,
        pagination: {
          cursor: data.data?.cursor ? String(data.data.cursor) : null,
          has_more: data.data?.has_more || false,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Okänt fel' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
