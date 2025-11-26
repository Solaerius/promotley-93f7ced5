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

// Encrypt token using Web Crypto API
async function encryptToken(token: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return btoa(String.fromCharCode(...combined));
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

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing authorization header' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Unauthorized:', userError);
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Refreshing TikTok token for user:', user.id);

    // Get current token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'tiktok')
      .maybeSingle();

    if (tokenError) {
      console.error('Error fetching token:', tokenError);
      return new Response(
        JSON.stringify({ success: false, message: 'Database error fetching token' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenData) {
      console.log('No TikTok connection found');
      return new Response(
        JSON.stringify({ success: false, message: 'TikTok connection not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh (refresh if expires in less than 1 day)
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (expiresAt > oneDayFromNow) {
      console.log('Token still valid, no refresh needed');
      return new Response(
        JSON.stringify({ success: true, message: 'Token still valid', expires_at: tokenData.expires_at }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token expires soon, refreshing...');

    // Decrypt refresh token
    const encryptionKey = await getEncryptionKey();
    let refreshToken: string;
    
    try {
      refreshToken = await decryptToken(tokenData.refresh_token_enc, encryptionKey);
    } catch (decryptError) {
      console.error('❌ Token decryption failed:', decryptError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Token har blivit ogiltig. Vänligen koppla från TikTok i Inställningar och anslut igen.',
          need_reconnect: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tiktokClientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
    const tiktokClientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');

    if (!tiktokClientKey || !tiktokClientSecret) {
      console.error('TikTok credentials not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'TikTok credentials not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh the token
    const refreshResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: tiktokClientKey,
        client_secret: tiktokClientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const responseText = await refreshResponse.text();
    console.log('TikTok refresh response:', responseText);

    if (!refreshResponse.ok) {
      console.error('Token refresh failed');
      return new Response(
        JSON.stringify({ success: false, message: `Token refresh failed: ${responseText}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let refreshData;
    try {
      refreshData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse refresh response:', e);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid response from TikTok' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (refreshData.error) {
      console.error('TikTok error:', refreshData.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `TikTok error: ${refreshData.error} - ${refreshData.error_description || ''}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract new tokens
    let newAccessToken: string;
    let newRefreshToken: string;
    let expiresIn: number;

    if (refreshData.data) {
      newAccessToken = refreshData.data.access_token;
      newRefreshToken = refreshData.data.refresh_token;
      expiresIn = refreshData.data.expires_in;
    } else {
      newAccessToken = refreshData.access_token;
      newRefreshToken = refreshData.refresh_token;
      expiresIn = refreshData.expires_in;
    }

    // Encrypt new tokens
    const encryptedAccessToken = await encryptToken(newAccessToken, encryptionKey);
    const encryptedRefreshToken = await encryptToken(newRefreshToken, encryptionKey);

    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Update tokens in database
    const { error: updateError } = await supabase
      .from('tokens')
      .update({
        access_token_enc: encryptedAccessToken,
        refresh_token_enc: encryptedRefreshToken,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('provider', 'tiktok');

    if (updateError) {
      console.error('Failed to update token:', updateError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to update token in database' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token refreshed successfully, new expiry:', newExpiresAt);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Token refreshed successfully',
        expires_at: newExpiresAt 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error refreshing token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
