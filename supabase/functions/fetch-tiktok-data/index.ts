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

    // Rate limiting
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'fetch-tiktok-data'
    });
    if (rateLimitOk === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Verify scopes before proceeding - normalize with both comma and space splitting
    const rawScopes = tokenData.scopes || '';
    const grantedScopes = rawScopes.split(/[,\s]+/).map((s: string) => s.trim()).filter(Boolean);
    const hasUserInfoStats = grantedScopes.includes('user.info.stats');
    const hasVideoList = grantedScopes.includes('video.list');
    
    console.log('🔍 Raw scopes string:', rawScopes);
    console.log('🔍 Parsed scopes:', grantedScopes.join(', '));
    console.log('🔍 Has user.info.stats:', hasUserInfoStats);
    console.log('🔍 Has video.list:', hasVideoList);

    if (!hasUserInfoStats) {
      console.error('❌ Missing required scope: user.info.stats');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Behörigheten user.info.stats saknas. Koppla bort och återkoppla TikTok i Inställningar → Integrationer.',
          errorCode: 'SCOPE_MISSING',
          missing_scope: 'user.info.stats'
        }),
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

    // Check which profile scopes are available
    const hasUserInfoProfile = grantedScopes.includes('user.info.profile');
    
    // Build fields list based on granted scopes
    const userInfoFields = ['open_id', 'display_name', 'avatar_url'];
    if (hasUserInfoProfile) {
      userInfoFields.push('bio_description', 'profile_web_link', 'profile_deep_link', 'is_verified');
    }
    if (hasUserInfoStats) {
      userInfoFields.push('likes_count', 'follower_count', 'following_count', 'video_count');
    }
    
    console.log('📱 Fetching TikTok user info with fields:', userInfoFields.join(','));
    const userInfoResponse = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=${userInfoFields.join(',')}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const userInfoText = await userInfoResponse.text();
    console.log('📊 TikTok user info response:', { 
      status: userInfoResponse.status, 
      statusText: userInfoResponse.statusText 
    });

    if (!userInfoResponse.ok) {
      console.error('❌ Failed to fetch user info');
      
      let errorMessage = 'Kunde inte hämta TikTok-data';
      let logId = 'unknown';
      let errorCode = 'API_ERROR';
      
      try {
        const errorData = JSON.parse(userInfoText);
        logId = errorData.error?.log_id || 'unknown';
        
        console.error('🔍 TikTok API error details:', errorData.error);
        
        if (errorData.error?.code === 'scope_not_authorized') {
          errorCode = 'SCOPE_MISSING';
          errorMessage = 'Behörigheten user.info.stats saknas. Koppla bort och återkoppla TikTok i Inställningar → Integrationer.';
          console.warn('ℹ️ Missing scope: user.info.stats');
        } else if (errorData.error?.code === 'access_token_invalid') {
          errorCode = 'TOKEN_INVALID';
          errorMessage = 'Din TikTok-anslutning har gått ut. Koppla bort och återkoppla i Inställningar → Integrationer.';
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
          errorCode,
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

    let videos: any[] = [];
    let limitedAccess = false;
    let scopeErrorMessage = '';
    let videoErrorCode: string | null = null;
    let videoFetchAttempted = false;
    let initialCursor: string | null = null;
    let initialHasMore = false;
    
    // Check if video.list scope is granted before attempting API call
    if (!hasVideoList) {
      limitedAccess = true;
      videoErrorCode = 'SCOPE_MISSING';
      scopeErrorMessage = 'Video-statistik kräver video.list behörighet. Koppla bort och återkoppla TikTok i Inställningar → Integrationer för att aktivera scopet.';
      console.warn('ℹ️ Missing scope: video.list (skipping video fetch)');
    } else {
      videoFetchAttempted = true;
      console.log('🎥 Fetching TikTok video list with video.list scope...');
      // Fetch video list (last 50 videos) using video.list scope
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
      console.log('📹 Video list response:', { 
        status: videoListResponse.status,
        statusText: videoListResponse.statusText
      });

      if (videoListResponse.ok) {
        try {
          const videoListData = JSON.parse(videoListText);
          if (videoListData.data && videoListData.data.videos) {
            videos = videoListData.data.videos.map((video: any) => ({
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
            // Capture pagination from initial fetch
            initialCursor = videoListData.data.cursor ? String(videoListData.data.cursor) : null;
            initialHasMore = videoListData.data.has_more || false;
            console.log(`✅ Successfully fetched ${videos.length} videos, cursor: ${initialCursor}, has_more: ${initialHasMore}`);
            
            // Check if any videos are missing view_count and need fallback
            const videosMissingViews = videos.filter(v => !v.views && v.id);
            if (videosMissingViews.length > 0) {
              console.log(`⚠️ ${videosMissingViews.length} videos missing view_count, attempting fallback via video.query`);
              
              // Batch video IDs (max 20 per request)
              const batchSize = 20;
              for (let i = 0; i < videosMissingViews.length; i += batchSize) {
                const batch = videosMissingViews.slice(i, i + batchSize);
                const videoIds = batch.map(v => v.id);
                
                try {
                  const queryResponse = await fetch(
                    'https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count,cover_image_url',
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        filters: {
                          video_ids: videoIds,
                        },
                      }),
                    }
                  );
                  
                  if (queryResponse.ok) {
                    const queryData = await queryResponse.json();
                    if (queryData.data && queryData.data.videos) {
                      // Merge fallback data into main videos array
                      queryData.data.videos.forEach((queryVideo: any) => {
                        const videoIndex = videos.findIndex(v => v.id === queryVideo.id);
                        if (videoIndex !== -1) {
                          videos[videoIndex].views = queryVideo.view_count || videos[videoIndex].views;
                          videos[videoIndex].likes = queryVideo.like_count || videos[videoIndex].likes;
                          videos[videoIndex].comments = queryVideo.comment_count || videos[videoIndex].comments;
                          videos[videoIndex].shares = queryVideo.share_count || videos[videoIndex].shares;
                          videos[videoIndex].cover_image_url = queryVideo.cover_image_url || videos[videoIndex].cover_image_url;
                        }
                      });
                      console.log(`✅ Fallback: fetched ${queryData.data.videos.length} videos via video.query`);
                    }
                  } else {
                    console.warn(`⚠️ Fallback video.query failed for batch ${i / batchSize + 1}:`, queryResponse.status);
                  }
                } catch (queryError) {
                  console.warn(`⚠️ Fallback video.query error for batch ${i / batchSize + 1}:`, queryError);
                }
              }
            }
            
            // If we got 0 videos with valid scope, it means user has no public videos (not a scope error)
            if (videos.length === 0) {
              limitedAccess = false;
              videoErrorCode = null;
              scopeErrorMessage = '';
              console.log('ℹ️ User has no public videos (not a scope error)');
            }
          }
        } catch (e) {
          console.warn('⚠️ Could not parse video list:', e);
          limitedAccess = true;
          videoErrorCode = 'PARSE_ERROR';
          scopeErrorMessage = 'Video-data kunde inte tolkas från TikTok API.';
        }
      } else {
        // API error when video.list scope is granted
        limitedAccess = true;
        try {
          const errorData = JSON.parse(videoListText);
          console.warn('⚠️ Video list API error:', errorData.error);
          
          if (errorData.error?.code === 'access_token_invalid') {
            videoErrorCode = 'TOKEN_INVALID';
            scopeErrorMessage = 'Token har gått ut under video-hämtning. Koppla bort och återkoppla TikTok.';
          } else {
            videoErrorCode = 'API_ERROR';
            scopeErrorMessage = `TikTok API-fel (${errorData.error?.code || 'okänt'}): ${errorData.error?.message || 'kunde inte hämta video-data'}`;
          }
        } catch {
          console.warn('⚠️ Could not parse video error (raw):', videoListText);
          videoErrorCode = 'PARSE_ERROR';
          scopeErrorMessage = 'Video-data kunde inte tolkas från TikTok API.';
        }
      }
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

    // For first page, use cursor from initial fetch
    let paginationCursor: string | null = initialCursor;
    let hasMoreVideos = initialHasMore;

    // Extract user data from response
    const userData = userInfo.data?.user || userInfo.user || {};
    
    const response = {
      success: true,
      connected: true,
      user: {
        open_id: userData.open_id || '',
        display_name: userData.display_name || 'Okänd',
        avatar_url: userData.avatar_url || '',
        bio_description: userData.bio_description || '',
        profile_web_link: userData.profile_web_link || '',
        profile_deep_link: userData.profile_deep_link || '',
        is_verified: userData.is_verified || false,
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
      pagination: {
        cursor: paginationCursor,
        has_more: hasMoreVideos,
      },
      granted_scopes: grantedScopes,
      requested_scopes: ['user.info.basic', 'user.info.profile', 'user.info.stats', 'video.list'],
      missing_scopes: ['user.info.basic', 'user.info.profile', 'user.info.stats', 'video.list'].filter(s => !grantedScopes.includes(s)),
      limited_access: limitedAccess,
      scope_message: scopeErrorMessage || undefined,
      videoErrorCode: videoErrorCode || undefined,
      timestamp: new Date().toISOString(),
    };

    // Save daily snapshot to metrics table for growth tracking
    try {
      // Get connection_id for this user's TikTok
      const { data: connectionData } = await supabase
        .from('connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'tiktok')
        .maybeSingle();

      if (connectionData) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const metricsToSave = [
          { metric_type: 'followers', value: response.user.follower_count },
          { metric_type: 'following', value: response.user.following_count },
          { metric_type: 'likes', value: response.user.likes_count },
          { metric_type: 'video_count', value: response.user.video_count },
          { metric_type: 'video_views', value: totalViews },
        ];

        for (const metric of metricsToSave) {
          // Upsert: only one entry per metric per day (use period as date key)
          const { error: metricsError } = await supabase
            .from('metrics')
            .upsert(
              {
                user_id: user.id,
                connection_id: connectionData.id,
                provider: 'tiktok',
                metric_type: metric.metric_type,
                value: metric.value,
                period: today,
                captured_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,connection_id,metric_type,period', ignoreDuplicates: false }
            );

          if (metricsError) {
            console.warn(`⚠️ Failed to save ${metric.metric_type} snapshot:`, metricsError.message);
          }
        }
        console.log('📊 Daily TikTok snapshots saved for', today);
      }
    } catch (snapshotError) {
      console.warn('⚠️ Snapshot saving failed (non-critical):', snapshotError);
    }

    // Telemetry logging
    console.log('✅ TikTok data fetch completed:', {
      display_name: response.user.display_name,
      follower_count: response.user.follower_count,
      likes_count: response.user.likes_count,
      video_count: response.user.video_count,
      raw_scopes: rawScopes,
      parsed_scopes: grantedScopes,
      hasUserInfoStats,
      hasVideoList,
      video_fetch_attempted: videoFetchAttempted,
      videos_fetched: videos.length,
      totalViews,
      limited_access: limitedAccess,
      videoErrorCode: videoErrorCode || 'none',
      scopes_ok: hasUserInfoStats && hasVideoList,
      timestamp: response.timestamp,
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
