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
  const secret = Deno.env.get('META_APP_SECRET');
  if (!secret) {
    throw new Error("SECURITY_ERROR: META_APP_SECRET is not configured. Token decryption cannot proceed without a valid encryption key.");
  }
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

    console.log('Fetching Meta data for user:', user.id);

    // Get Instagram token
    const { data: igTokenData, error: igTokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'meta_ig')
      .maybeSingle();

    // Get Facebook token
    const { data: fbTokenData, error: fbTokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'meta_fb')
      .maybeSingle();

    if (!igTokenData && !fbTokenData) {
      console.log('No Meta connections found for user');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No Instagram or Facebook connections found. Please connect your accounts.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encryptionKey = await getEncryptionKey();
    const result: any = {
      success: true,
      instagram: null,
      facebook: null,
    };

    // Fetch Instagram data
    if (igTokenData) {
      try {
        const accessToken = await decryptToken(igTokenData.access_token_enc, encryptionKey);
        
        console.log('Fetching Instagram business account info...');
        // Get Instagram Business Account ID
        const accountResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
        );

        const accountData = await accountResponse.json();
        console.log('Instagram account response:', accountData);

        if (accountData.data && accountData.data.length > 0) {
          const pageId = accountData.data[0].id;
          
          // Get Instagram Business Account
          const igAccountResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
          );
          
          const igAccountData = await igAccountResponse.json();
          console.log('Instagram business account data:', igAccountData);

          if (igAccountData.instagram_business_account) {
            const igBusinessId = igAccountData.instagram_business_account.id;
            
            // Get Instagram insights
            const insightsResponse = await fetch(
              `https://graph.facebook.com/v18.0/${igBusinessId}?fields=username,name,profile_picture_url,followers_count,follows_count,media_count,ig_id&access_token=${accessToken}`
            );
            
            const insightsData = await insightsResponse.json();
            console.log('Instagram insights:', insightsData);

            result.instagram = {
              username: insightsData.username,
              name: insightsData.name,
              followers_count: insightsData.followers_count,
              follows_count: insightsData.follows_count,
              media_count: insightsData.media_count,
              profile_picture_url: insightsData.profile_picture_url,
            };
          }
        }
      } catch (err) {
        console.error('Error fetching Instagram data:', err);
        result.instagram = { error: 'Failed to fetch Instagram data' };
      }
    }

    // Fetch Facebook data
    if (fbTokenData) {
      try {
        const accessToken = await decryptToken(fbTokenData.access_token_enc, encryptionKey);
        
        console.log('Fetching Facebook page info...');
        const pageResponse = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=id,name,accounts{id,name,followers_count,fan_count}&access_token=${accessToken}`
        );

        const pageData = await pageResponse.json();
        console.log('Facebook page response:', pageData);

        if (pageData.accounts && pageData.accounts.data && pageData.accounts.data.length > 0) {
          const page = pageData.accounts.data[0];
          
          result.facebook = {
            name: page.name,
            followers_count: page.followers_count || page.fan_count || 0,
            page_id: page.id,
          };
        } else {
          result.facebook = {
            name: pageData.name,
            user_id: pageData.id,
          };
        }
      } catch (err) {
        console.error('Error fetching Facebook data:', err);
        result.facebook = { error: 'Failed to fetch Facebook data' };
      }
    }

    console.log('Successfully fetched Meta data');

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Meta data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
