import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decrypt token using Web Crypto API
async function decryptToken(encryptedToken: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);
  
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
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

// Refresh TikTok token if expired or expiring soon
async function refreshTokenIfNeeded(supabase: any, userId: string, tokenData: any, encryptionKey: CryptoKey): Promise<string> {
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  const hourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
  // If token expires within the next hour, refresh it
  if (expiresAt <= hourFromNow) {
    console.log('Token expires soon or has expired, refreshing...');
    
    const { data, error } = await supabase.functions.invoke('refresh-tiktok-token', {
      headers: {
        Authorization: `Bearer ${tokenData.user_id}`,
      },
    });
    
    if (error) {
      console.error('Failed to refresh token:', error);
      throw new Error('Token expired and refresh failed. Please reconnect your TikTok account.');
    }
    
    // Re-fetch the updated token
    const { data: updatedToken, error: fetchError } = await supabase
      .from('tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'tiktok')
      .maybeSingle();
    
    if (fetchError || !updatedToken) {
      throw new Error('Failed to fetch refreshed token');
    }
    
    return await decryptToken(updatedToken.access_token_enc, encryptionKey);
  }
  
  return await decryptToken(tokenData.access_token_enc, encryptionKey);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Unauthorized:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Fetching TikTok data for user:', user.id);

    // Get token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'tiktok')
      .maybeSingle();

    if (tokenError) {
      console.error('❌ Error fetching token:', tokenError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error fetching token' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenData) {
      console.log('⚠️ No TikTok connection found for user');
      return new Response(
        JSON.stringify({ success: false, error: 'TikTok-kontot är inte kopplat. Vänligen anslut ditt konto.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt and refresh token if needed
    const encryptionKey = await getEncryptionKey();
    let accessToken: string;
    
    try {
      accessToken = await refreshTokenIfNeeded(supabase, user.id, tokenData, encryptionKey);
    } catch (decryptError) {
      console.error('❌ Token decryption/refresh failed:', decryptError);
      
      // Check if it's a decryption error specifically
      if (decryptError instanceof Error && decryptError.message.includes('Decryption failed')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token har blivit ogiltig. Vänligen koppla från TikTok i Inställningar och anslut igen.',
            need_reconnect: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: decryptError instanceof Error ? decryptError.message : 'Token refresh failed' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📱 Fetching TikTok user info...');
    // Fetch user info with stats
    const userInfoResponse = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,bio_description,likes_count,follower_count,following_count,video_count',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const userInfoText = await userInfoResponse.text();
    console.log('📊 TikTok API response:', { 
      status: userInfoResponse.status, 
      statusText: userInfoResponse.statusText 
    });

    if (!userInfoResponse.ok) {
      console.error('❌ Failed to fetch user info');
      console.error('📊 TikTok API response:', { status: userInfoResponse.status, statusText: userInfoResponse.statusText });
      
      let errorMessage = 'Kunde inte hämta TikTok-data';
      let logId = 'unknown';
      let isScopeError = false;
      
      try {
        const errorData = JSON.parse(userInfoText);
        logId = errorData.error?.log_id || 'unknown';
        
        console.error('🔍 TikTok error details:', errorData.error);
        
        if (errorData.error?.code === 'scope_not_authorized') {
          isScopeError = true;
          
          // Detect API level to provide better error messages
          const hasContentPosting = Deno.env.get('TIKTOK_HAS_CONTENT_POSTING_API') === 'true';
          
          if (!hasContentPosting) {
            console.warn('ℹ️ TikTok app is running in Login Kit mode - limited data available');
            console.warn('ℹ️ To enable full features, apply for Content Posting API at https://developers.tiktok.com/');
          }
          
          errorMessage = 'Ditt TikTok-konto saknar nödvändiga behörigheter. För full statistikåtkomst krävs Content Posting API. Koppla från och anslut igen, eller ansök om video.query och video.data scopes i TikTok Developer Portal.';
        } else if (errorData.error?.code === 'access_token_invalid') {
          errorMessage = 'Token är ogiltig. Koppla från och anslut ditt TikTok-konto igen.';
        } else {
          errorMessage = `TikTok API-fel: ${errorData.error?.message || errorData.error?.code || 'okänt fel'}`;
        }
      } catch {
        console.error('🔍 Raw error response:', userInfoText);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          limited_access: isScopeError,
          tiktok_log_id: logId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userInfo;
    try {
      userInfo = JSON.parse(userInfoText);
    } catch (e) {
      console.error('❌ Failed to parse user info JSON:', e);
      return new Response(
        JSON.stringify({ success: false, error: 'Ogiltigt svar från TikTok API' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userInfo.error && userInfo.error.code !== 'ok') {
      console.error('❌ TikTok API error:', userInfo.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `TikTok API-fel: ${userInfo.error.message || userInfo.error.code}`,
          tiktok_log_id: userInfo.error.log_id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎥 Fetching TikTok video list...');
    // Fetch video list (last 20 videos)
    const videoListResponse = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,cover_image_url,share_url,video_description,duration,title,like_count,comment_count,share_count,view_count',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_count: 20,
        }),
      }
    );

    const videoListText = await videoListResponse.text();
    console.log('📹 Video list response status:', videoListResponse.status);

    let videos: any[] = [];
    if (videoListResponse.ok) {
      try {
        const videoListData = JSON.parse(videoListText);
        if (videoListData.data && videoListData.data.videos) {
          videos = videoListData.data.videos.map((video: any) => ({
            id: video.id,
            title: video.title || video.video_description || 'Untitled',
            views: video.view_count || 0,
            likes: video.like_count || 0,
            shares: video.share_count || 0,
            comments: video.comment_count || 0,
            created_at: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
            cover_image_url: video.cover_image_url,
            share_url: video.share_url,
            duration: video.duration,
          }));
          console.log(`✅ Successfully fetched ${videos.length} videos`);
        }
      } catch (e) {
        console.warn('⚠️ Could not parse video list:', e);
      }
    } else {
      console.warn('⚠️ Could not fetch videos:', videoListText);
    }

    // Calculate aggregate stats from videos
    let totalViews = 0;
    let totalLikes = 0;
    let totalShares = 0;
    let totalComments = 0;

    videos.forEach((video: any) => {
      totalViews += video.views || 0;
      totalLikes += video.likes || 0;
      totalShares += video.shares || 0;
      totalComments += video.comments || 0;
    });

    const avgEngagementRate = videos.length > 0 && totalViews > 0
      ? `${((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(2)}%`
      : '0%';

    // Extract user data from response
    const userData = userInfo.data?.user || userInfo.user || {};
    
    const response = {
      success: true,
      user: {
        display_name: userData.display_name || 'Unknown',
        avatar_url: userData.avatar_url || '',
        bio_description: userData.bio_description || '',
        follower_count: userData.follower_count || 0,
        following_count: userData.following_count || 0,
        likes_count: userData.likes_count || 0,
        video_count: userData.video_count || 0,
      },
      stats: {
        totalViews,
        totalLikes,
        totalShares,
        totalComments,
        avgEngagementRate,
        videoCount: videos.length,
      },
      videos: videos,
    };

    console.log('✅ Successfully fetched TikTok data:', {
      user: response.user.display_name,
      videoCount: videos.length,
      totalViews,
    });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error fetching TikTok data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Okänt fel uppstod';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
