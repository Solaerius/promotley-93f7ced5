import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache with 60s TTL
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 AI Assistant request received:', req.method, req.url);

  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    console.log('📍 Action:', action, 'Path:', url.pathname);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'AI not connected', placeholder: true }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ OpenAI API key found');

    // Helper function to get user stats with caching
    const getUserStats = async (userId: string, platform?: string) => {
      const cacheKey = `${userId}-${platform || 'all'}`;
      const cached = statsCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log('📦 Cache hit for', cacheKey);
        return cached.data;
      }

      console.log('🔍 Fetching fresh stats for', cacheKey);
      
      let query = supabaseClient
        .from('social_stats')
        .select('*')
        .eq('user_id', userId);
      
      if (platform) {
        query = query.eq('platform', platform);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching stats:', error);
        return null;
      }
      
      const result = {
        stats: data,
        timestamp: new Date().toISOString(),
        updated: data?.[0]?.updated_at || null
      };
      
      statsCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    };

    // Helper function to get user connections and profile
    const getUserContext = async (userId: string) => {
      const cacheKey = `context-${userId}`;
      const cached = statsCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log('📦 Cache hit for user context');
        return cached.data;
      }

      console.log('🔍 Fetching user context');

      // Get connections
      const { data: connections } = await supabaseClient
        .from('connections')
        .select('provider, username, connected_at')
        .eq('user_id', userId);

      // Get AI profile
      const { data: profile } = await supabaseClient
        .from('ai_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Get user info
      const { data: user } = await supabaseClient
        .from('users')
        .select('company_name, industry, plan, credits_left')
        .eq('id', userId)
        .maybeSingle();

      // Get knowledge base files list
      const { data: knowledgeFiles } = await supabaseClient
        .storage
        .from('promotley_knowledgebase')
        .list();

      // Get UF rules from ai_knowledge table
      const { data: ufRules } = await supabaseClient
        .from('ai_knowledge')
        .select('title, content, category')
        .eq('category', 'uf_rules');

      const result = {
        connections: connections || [],
        profile: profile || null,
        user: user || null,
        knowledgeBase: {
          files: knowledgeFiles?.map(f => f.name) || [],
          ufRules: ufRules || []
        },
        timestamp: new Date().toISOString()
      };

      statsCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    };

    // POST /ai-assistant/chat - Chat with AI
    if (action === 'chat' && req.method === 'POST') {
      const body = await req.json();
      const { message, history } = body;

      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Message required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Processing chat message:', message);

      // Get user context (connections, profile, knowledge base)
      const userContext = await getUserContext(user.id);
      console.log('📋 User context:', {
        connections: userContext.connections.length,
        hasProfile: !!userContext.profile,
        knowledgeFiles: userContext.knowledgeBase.files.length,
        ufRules: userContext.knowledgeBase.ufRules.length
      });

      // Save user message to chat history
      await supabaseClient
        .from('chat_history')
        .insert({
          user_id: user.id,
          role: 'user',
          message,
        });

      // Check if user is asking about their social media stats
      const statsKeywords = ['följare', 'followers', 'views', 'likes', 'engagement', 'statistik', 'tiktok', 'instagram', 'facebook'];
      const isStatsQuery = statsKeywords.some(keyword => message.toLowerCase().includes(keyword));
      let tools: any[] = [];
      if (isStatsQuery) {
        tools = [
          {
            type: 'function',
            function: {
              name: 'get_social_stats',
              description:
                'Hämtar användarens sociala medier-statistik från kopplade konton (TikTok, Instagram, Facebook)',
              parameters: {
                type: 'object',
                properties: {
                  platform: {
                    type: 'string',
                    enum: ['tiktok', 'meta_ig', 'meta_fb', 'all'],
                    description: 'Vilken plattform att hämta statistik för',
                  },
                },
                required: [],
              },
            },
          },
        ];
      }

      // Prepare messages for AI
      const connectedPlatforms = userContext.connections.map((c: any) => {
        if (c.provider === 'tiktok') return 'TikTok';
        if (c.provider === 'meta_ig') return 'Instagram';
        if (c.provider === 'meta_fb') return 'Facebook';
        return c.provider;
      }).join(', ');

      const profileInfo = userContext.profile ? `
Användarens företagsprofil:
- Bransch: ${userContext.profile.branch || 'Ej angiven'}
- Målgrupp: ${userContext.profile.malgrupp || 'Ej angiven'}
- Produkt/Tjänst: ${userContext.profile.produkt_beskrivning || 'Ej angiven'}
- Prisnivå: ${userContext.profile.prisniva || 'Ej angiven'}
- Marknadsplan: ${userContext.profile.marknadsplan || 'Ej angiven'}
- Målsättning: ${userContext.profile.malsattning || 'Ej angiven'}
- Tonalitet: ${userContext.profile.tonalitet || 'Ej angiven'}
- Språk: ${userContext.profile.sprakpreferens || 'svenska'}
` : '';

      const ufKnowledge = userContext.knowledgeBase.ufRules.length > 0 ? `
UF-Regler och Riktlinjer:
${userContext.knowledgeBase.ufRules.map((rule: any) => `- ${rule.title}: ${rule.content.substring(0, 200)}...`).join('\n')}
` : '';

      const messages = [
        {
          role: 'system',
          content: `Du är Promotely AI-assistent. Du hjälper UF-företag och unga entreprenörer med marknadsföring, sociala medier och strategier.

ANVÄNDARENS KONTEXT:
- Kopplade konton: ${connectedPlatforms || 'Inga konton kopplade än'}
- Företag: ${userContext.user?.company_name || 'Ej angivet'}
- Bransch: ${userContext.user?.industry || 'Ej angiven'}
- Plan: ${userContext.user?.plan || 'free_trial'}
- Credits kvar: ${userContext.user?.credits_left || 0}

${profileInfo}

${ufKnowledge}

VIKTIGA INSTRUKTIONER:
1. När användaren frågar om sina sociala medier-statistik (följare, views, likes, etc), använd get_social_stats-funktionen för att hämta faktisk data från deras kopplade konton. Svara alltid med konkreta siffror när data finns tillgänglig.

2. Om användaren frågar om ett konto som inte är kopplat, ge konkret vägledning: "Jag kan inte hämta din [plattform]-data just nu. Koppla [plattform] i Inställningar → Integrationer så visar jag siffran direkt."

3. Använd användarens företagsprofil och branschinformation för att ge personliga råd och rekommendationer.

4. Om användaren inte har fyllt i sin företagsprofil men frågar om strategier eller innehåll, föreslå att de först fyller i sin profil under Inställningar för bättre personliga rekommendationer.

5. Följ alltid UF-reglerna och riktlinjerna när du ger råd om marknadsföring och företagande.

Svara alltid på svenska och var hjälpsam och engagerande. Inkludera alltid när datan senast uppdaterades när du presenterar statistik.`
        },
        ...(history || []).map((msg: any) => ({
          role: msg.role,
          content: msg.message
        })),
        {
          role: 'user',
          content: message
        }
      ];

      console.log('Calling OpenAI...');

      // Call OpenAI API with tool calling support
      const requestBody: any = {
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      };

      if (tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto';
      }

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('❌ OpenAI API error:', aiResponse.status, errorText);
        throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
      }

      const aiData = await aiResponse.json();
      console.log('✅ AI response received');
      
      const choice = aiData.choices[0];
      let assistantMessage = choice.message.content;

      // Handle tool calls
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolCall = choice.message.tool_calls[0];
        
        if (toolCall.function.name === 'get_social_stats') {
          const args = JSON.parse(toolCall.function.arguments);
          const platform = args.platform === 'all' ? undefined : args.platform;
          
          console.log('🔧 Tool call: get_social_stats for platform:', platform || 'all');
          
          // Log telemetry
          const startTime = Date.now();
          const stats = await getUserStats(user.id, platform);
          const responseTime = Date.now() - startTime;
          
          console.log('📊 Stats fetched in', responseTime, 'ms');
          
          // Call AI again with the stats data
          const followUpMessages = [
            ...messages,
            choice.message,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(stats)
            }
          ];

          const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: followUpMessages,
              temperature: 0.7,
              max_tokens: 1000,
            }),
          });

          const followUpData = await followUpResponse.json();
          assistantMessage = followUpData.choices[0].message.content;
          
          // Log telemetry for successful stats query
          console.log('📈 Telemetry:', {
            intent: 'social_stats_query',
            platform: platform || 'all',
            responseTime,
            cacheHit: !!statsCache.get(`${user.id}-${platform || 'all'}`),
            hasData: !!stats?.stats?.length
          });
        }
      }

      // Save AI response to chat history
      await supabaseClient
        .from('chat_history')
        .insert({
          user_id: user.id,
          role: 'assistant',
          message: assistantMessage,
        });

      return new Response(
        JSON.stringify({ response: assistantMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /ai-assistant/generate-plan - Generate content plan
    if (action === 'generate-plan' && req.method === 'POST') {
      return new Response(
        JSON.stringify({ 
          error: 'AI not fully connected', 
          placeholder: true,
          message: 'Innehållsplan-generering kommer snart!' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /ai-assistant/analyze - Analyze statistics
    if (action === 'analyze' && req.method === 'POST') {
      return new Response(
        JSON.stringify({ 
          error: 'AI not fully connected', 
          placeholder: true,
          message: 'Statistik-analys kommer snart!' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /ai-assistant/history - Get chat history
    if (action === 'history' && req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
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

    console.log('❌ Invalid action or method:', action, req.method);
    return new Response(
      JSON.stringify({ error: 'Invalid action or method' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in AI assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});