import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache with 60s TTL
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

// Credit cost estimation based on request type and complexity
const estimateCreditCost = (action: string, message?: string): number => {
  // Marketing plans are expensive (uses gpt-4o, multiple posts)
  if (action === 'create-marketing-plan') {
    return 5;
  }
  
  // Analysis requests
  if (action === 'analyze') {
    return 3;
  }
  
  // Chat messages - estimate based on complexity
  if (action === 'chat' && message) {
    const lowerMsg = message.toLowerCase();
    
    // Complex requests (strategies, plans, detailed analysis)
    if (lowerMsg.includes('strategi') || 
        lowerMsg.includes('plan') || 
        lowerMsg.includes('30 dag') ||
        lowerMsg.includes('marknadsföring') ||
        lowerMsg.includes('kampanj') ||
        lowerMsg.includes('innehållskalender')) {
      return 3;
    }
    
    // Medium complexity (analysis, recommendations)
    if (lowerMsg.includes('analys') || 
        lowerMsg.includes('tips') || 
        lowerMsg.includes('rekommend') ||
        lowerMsg.includes('förslag') ||
        lowerMsg.includes('förbättra')) {
      return 2;
    }
    
    // Simple questions
    return 1;
  }
  
  return 1;
};

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

    // Check email verification
    if (!user.email_confirmed_at) {
      console.error('❌ Email not verified:', user.id);
      return new Response(
        JSON.stringify({ 
          error: 'email_not_verified',
          message: 'Verifiera din e-post för att använda AI-funktioner'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // POST /ai-assistant/chat - Chat with AI (handles both regular chat and marketing plan creation)
    if (action === 'chat' && req.method === 'POST') {
      const body = await req.json();
      const { message, history, calendarContextDigest = [], meta } = body;

      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Message required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Processing chat message:', message);
      console.log('Meta:', meta);

      // Check if this is a marketing plan request (via meta action)
      const isMarketingPlanRequest = meta?.action === 'create_marketing_plan' || 
        message.toLowerCase().includes('marknadsföringsplan') && 
        (message.toLowerCase().includes('skapa') || message.toLowerCase().includes('generera'));

      // Estimate credit cost for this request
      const estimatedCost = isMarketingPlanRequest ? 5 : estimateCreditCost('chat', message);
      console.log('💰 Estimated credit cost:', estimatedCost, isMarketingPlanRequest ? '(marketing plan)' : '');
      
      // Check user credits
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('credits_left, plan')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user credits:', userError);
      }
      
      // Check if user has enough credits (skip for unlimited plan)
      if (userData?.plan !== 'pro_unlimited' && (userData?.credits_left || 0) < estimatedCost) {
        console.log('❌ Insufficient credits:', userData?.credits_left, 'needed:', estimatedCost);
        
        // Return a friendly message instead of error for insufficient credits
        const creditMessage = isMarketingPlanRequest 
          ? `Du har inte tillräckligt med krediter för en marknadsföringsplan. En plan kostar ${estimatedCost} krediter och du har ${userData?.credits_left || 0} kvar. Uppgradera din plan för att fortsätta.`
          : `Du har inte tillräckligt med krediter för denna förfrågan. Du har ${userData?.credits_left || 0} krediter kvar.`;
        
        return new Response(
          JSON.stringify({ 
            error: 'INSUFFICIENT_CREDITS',
            message: creditMessage,
            response: creditMessage,
            credits_left: userData?.credits_left || 0,
            cost: estimatedCost
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If this is a marketing plan request, handle it specially
      if (isMarketingPlanRequest) {
        console.log('📅 Creating marketing plan via chat...');
        
        const targets = meta?.targets || ['reach', 'engagement'];
        const timeframe = meta?.timeframe?.preset === 'next_4_weeks' ? 'month' : 'month';
        const requestId = meta?.requestId;

        const userContext = await getUserContext(user.id);

        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);

        let calendarContext = '';
        if (calendarContextDigest.length > 0) {
          calendarContext = `\n\nExisterande kalender:\n${calendarContextDigest.map((p: any) => 
            `- ${p.date}: ${p.title} (${p.channel})`
          ).join('\n')}`;
        }

        const systemPrompt = `Du är en marknadsföringsexpert för UF-företag. Skapa en detaljerad marknadsföringsplan i JSON-format.

Mål: ${targets.join(', ')}
Tidsram: kommande 4 veckor
Start: ${now.toISOString().split('T')[0]}
Slut: ${endDate.toISOString().split('T')[0]}

${userContext.profile ? `
Företagsprofil:
- Bransch: ${userContext.profile.branch || 'Ej angiven'}
- Målgrupp: ${userContext.profile.malgrupp || 'Ej angiven'}
- Produkt: ${userContext.profile.produkt_beskrivning || 'Ej angiven'}
` : ''}

${calendarContext}

Returnera ENDAST ett JSON-objekt (ingen annan text före eller efter) med följande exakta struktur:
{
  "timeframe": {"start": "${now.toISOString().split('T')[0]}", "end": "${endDate.toISOString().split('T')[0]}"},
  "goals": ["konkret mål 1", "konkret mål 2", "konkret mål 3"],
  "budgetHints": ["budgettips 1", "budgettips 2"],
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "channel": "instagram",
      "title": "Catchy inläggstitel",
      "content": "Detaljerad innehållsbeskrivning för inlägget",
      "tags": ["tag1", "tag2", "tag3"],
      "assets": [],
      "status": "scheduled"
    }
  ]
}

Skapa minst 10-15 inlägg spridda jämnt över tidsperioden. Variera kanaler (instagram, tiktok, facebook). Alla datum måste vara mellan ${now.toISOString().split('T')[0]} och ${endDate.toISOString().split('T')[0]}. Gör innehållet relevant för UF-företag.`;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            temperature: 0.8,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error('Failed to generate plan');
        }

        const aiData = await aiResponse.json();
        let planText = aiData.choices[0].message.content.trim();
        
        // Remove markdown code blocks if present
        planText = planText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
          const plan = JSON.parse(planText);
          
          const explanation = `Jag har skapat en marknadsföringsplan baserat på din förfrågan!

Planen innehåller ${plan.posts?.length || 0} inlägg fördelade över Instagram, TikTok och Facebook under de kommande 4 veckorna.

Mål för perioden:
${plan.goals?.map((g: string, i: number) => `${i + 1}) ${g}`).join('\n') || 'Öka räckvidd och engagemang'}

Klicka på "Implementera planen" nedan för att lägga till alla inlägg i din kalender.`;

          // Save user message to chat history
          await supabaseClient
            .from('chat_history')
            .insert({
              user_id: user.id,
              role: 'user',
              message,
            });

          // Save plan to analysis history for later reuse
          await supabaseClient
            .from('ai_analysis_history')
            .insert({
              user_id: user.id,
              input_data: {
                type: 'marketing_plan',
                targets,
                timeframe,
                requestId,
              },
              ai_output: plan,
            });

          // Save explanation message to chat history
          await supabaseClient
            .from('chat_history')
            .insert({
              user_id: user.id,
              role: 'assistant',
              message: explanation,
            });
          
          // Deduct credits after successful plan creation (skip for unlimited plan)
          if (userData?.plan !== 'pro_unlimited') {
            const newCredits = Math.max(0, (userData?.credits_left || 0) - estimatedCost);
            await supabaseClient
              .from('users')
              .update({ credits_left: newCredits })
              .eq('id', user.id);
            console.log('💸 Plan credits deducted:', estimatedCost, 'remaining:', newCredits);
          }

          return new Response(
            JSON.stringify({ 
              response: explanation, 
              plan, 
              credits_used: estimatedCost,
              requestId 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (parseError) {
          console.error('Failed to parse plan JSON:', parseError, 'Raw text:', planText);
          return new Response(
            JSON.stringify({ 
              response: 'Jag kunde inte generera en giltig plan just nu. Försök igen om en stund.',
              error: 'Kunde inte generera giltig plan. Försök igen.' 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

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
          content: `Du är Promotely AI – en expert på marknadsföring för UF-företag (Ung Företagsamhet) och svenska startups.

## Din uppgift
Analysera användarens fråga och ge personliga råd baserat på:
- Deras sociala medier-konton (TikTok, Instagram, Facebook) om de är kopplade
- UF-regler och konkurrenskrav
- Deras företagsprofil och målsättningar

ANVÄNDARENS KONTEXT:
- Kopplade konton: ${connectedPlatforms || 'Inga konton kopplade än'}
- Företag: ${userContext.user?.company_name || 'Ej angivet'}
- Bransch: ${userContext.user?.industry || 'Ej angiven'}
- Plan: ${userContext.user?.plan || 'free_trial'}
- Credits kvar: ${userContext.user?.credits_left || 0}

${profileInfo}

${ufKnowledge}

## KRITISK REGEL: Hämta faktisk data innan du svarar

När användaren frågar om sina sociala medier-konton (följare, visningar, engagement, videor):
1. ALLTID anropa get_social_stats FÖRST innan du svarar
2. ALDRIG svara "jag vet inte" eller "koppla ditt konto" utan att först kontrollera med get_social_stats
3. Om get_social_stats returnerar success=true och connected=true → använd den data du fick och visa konkreta siffror
4. Om get_social_stats returnerar success=false och connected=false → då och endast då säg att kontot inte är kopplat

## Steg-för-steg-process

1. Identifiera intent: Frågar användaren om sina sociala medier-konton (TikTok, Instagram, Facebook)?
   - Nyckelord: "följare", "visningar", "likes", "engagement", "videor", "mitt TikTok-konto", "min Instagram", "mitt Facebook"
   - Om JA → anropa get_social_stats omedelbart

2. Tolka svaret från get_social_stats:

   a) Framgångsrikt svar (success=true, connected=true):
      - Visa konkreta siffror med tidsstämpel
      - Exempel: "Du har 12 457 följare på TikTok (uppdaterad ${new Date().toLocaleString('sv-SE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})"
      - Använd exakta värden från API:t (followers, likes, video_count, views)
      - Om limited_access=true: Visa tillgängliga siffror (followers, likes, video_count) men förklara:
        * "För att se videovisningar behöver du video.list scopet."
        * "Gå till Inställningar → Integrationer, koppla bort och återkoppla TikTok så aktiveras video.list."

   b) Inte kopplat (success=false, connected=false, errorCode=NOT_CONNECTED):
      - "Ditt [plattform]-konto är inte kopplat än. Gå till Inställningar → Integrationer och koppla [plattform] så hämtar jag dina siffror direkt."

   c) Scopeproblem (success=false, connected=true, errorCode=SCOPE_MISSING):
      - "Jag kan inte läsa alla dina [plattform]-siffror eftersom behörigheter (scopes) saknas."
      - "För TikTok behöver vi user.info.stats och video.list."
      - "Gå till Inställningar → Integrationer, koppla från [plattform] och anslut igen så aktiveras rätt behörigheter."

   d) Token utgånget (success=false, connected=true, errorCode=TOKEN_INVALID):
      - "Din [plattform]-anslutning har gått ut. Gå till Inställningar → Integrationer, koppla från och återanslut [plattform]."

   e) API-fel (success=false, errorCode=API_ERROR):
      - "Ett tekniskt fel uppstod när jag försökte hämta dina [plattform]-siffror. Försök igen om en stund."

3. Svara på användarens fråga:
   - Var alltid specifik (ge exakta antal, datum, procent)
   - Förklara varför något fungerar/inte fungerar
   - Ge 1-3 konkreta, actionable steg som användaren kan göra idag
   - Anpassa dina råd till UF-regler där det är relevant

## Språk & Ton
- Skriv alltid på SVENSKA (om inte användaren explicit frågar på engelska)
- Skriv kort och tydligt
- Använd personlig, vänlig ton (säg "du" istället för "ni")
- Undvik jargong och marknadsföringsklichéer
- Ge konkreta exempel istället för generella tips

## Textformatering - KRITISKT
- ENDAST ren text, inga Markdown-tecken eller emojis
- FÖRBJUDET: stjärnor, understreck, hashtag-rubriker, backticks, större-än-tecken, bindestreck-listor, punkt-listor, hakparenteser, HTML-taggar, emojis
- Använd numrerade listor: 1) punkt, 2) punkt, 3) punkt
- Rubriker: skriv som vanlig text, ingen ## eller ###
- Länkar: skriv bara URL:en på egen rad
- Maximalt 2-3 meningar per stycke
- Tydliga avsnitt separerade med en tom rad
- Håll svar under 200 ord om inte användaren explicit ber om en längre analys

## VIKTIG REGEL: Felaktig diagnos är förbjudet
- ALDRIG ALDRIG ALDRIG svara "koppla TikTok" eller "kontot är inte kopplat" om get_social_stats returnerar success=true och connected=true
- Om connected=true men vissa fält saknas (limited_access=true), förklara att specifika behörigheter (scopes) saknas, inte att kontot är okopplat
- Om get_social_stats misslyckas av tekniska skäl (errorCode=API_ERROR) → säg att det är ett tekniskt problem, inte att kontot saknas

Kom ihåg: Du är här för att hjälpa UF-företagare att växa sina företag smart och snabbt. Hämta alltid faktisk data innan du svarar!`
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
          
          const startTime = Date.now();
          let statsResult: any = {
            success: false,
            error: 'Okänt fel',
            platform: platform || 'all'
          };

          try {
            // Check if user has the requested platform connected
            const { data: connection } = await supabaseClient
              .from('connections')
              .select('*')
              .eq('user_id', user.id)
              .eq('provider', platform || 'tiktok')
              .maybeSingle();

            if (!connection) {
              console.log('⚠️ No connection found for platform:', platform);
              const platformName = platform === 'tiktok' ? 'TikTok' : 
                                   platform === 'meta_ig' ? 'Instagram' : 
                                   platform === 'meta_fb' ? 'Facebook' : 'denna plattform';
              
              statsResult = {
                success: false,
                connected: false,
                platform: platform || 'tiktok',
                error: `${platformName}-kontot är inte kopplat`,
                action: `Koppla ${platformName} i Inställningar → Integrationer för att se statistik`,
                errorCode: 'NOT_CONNECTED'
              };
            } else {
              console.log('✅ Connection found:', connection.provider, connection.username);
              
              // For TikTok, fetch live data
              if (platform === 'tiktok' || !platform) {
                console.log('📱 Fetching live TikTok data...');
                
                const { data: tiktokData, error: tiktokError } = await supabaseClient.functions.invoke(
                  'fetch-tiktok-data',
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                if (tiktokError) {
                  console.error('❌ TikTok fetch error:', tiktokError);
                  statsResult = {
                    success: false,
                    connected: true,
                    platform: 'tiktok',
                    error: 'Kunde inte hämta TikTok-data just nu',
                    action: 'Försök igen om en stund',
                    errorCode: 'API_ERROR',
                    details: tiktokError.message
                  };
                } else if (!tiktokData?.success) {
                  console.error('❌ TikTok API returned error:', tiktokData?.error);
                  
                  // Parse errorCode from fetch-tiktok-data response
                  const fetchedErrorCode = tiktokData?.errorCode || 'API_ERROR';
                  const fetchedVideoErrorCode = tiktokData?.videoErrorCode;
                  
                  let action = 'Försök igen om en stund';
                  let errorCode = fetchedErrorCode;
                  
                  // Use the specific errorCode from fetch-tiktok-data
                  if (fetchedErrorCode === 'NOT_CONNECTED') {
                    action = 'Koppla TikTok i Inställningar → Integrationer';
                  } else if (fetchedErrorCode === 'SCOPE_MISSING') {
                    action = 'Återkoppla TikTok i Inställningar → Integrationer för att aktivera user.info.stats scope';
                  } else if (fetchedErrorCode === 'TOKEN_INVALID') {
                    action = 'Koppla från och återanslut TikTok i Inställningar → Integrationer';
                  } else if (fetchedVideoErrorCode === 'SCOPE_MISSING') {
                    // Special case: user.info.stats worked but video.list failed
                    errorCode = 'SCOPE_MISSING';
                    action = 'Video-statistik kräver video.list scope. Återkoppla TikTok i Inställningar → Integrationer.';
                  }
                  
                  statsResult = {
                    success: false,
                    connected: fetchedErrorCode !== 'NOT_CONNECTED',
                    platform: 'tiktok',
                    error: tiktokData?.error || 'Kunde inte hämta TikTok-data',
                    action,
                    errorCode,
                    videoErrorCode: fetchedVideoErrorCode,
                    limited_access: tiktokData?.limited_access || false,
                    scope_message: tiktokData?.scope_message,
                    timestamp: tiktokData?.timestamp || new Date().toISOString(),
                  };
                } else {
                  console.log('✅ TikTok data fetched successfully');
                  
                  const user_data = tiktokData.user || {};
                  const stats = tiktokData.stats || {};
                  
                  statsResult = {
                    success: true,
                    connected: true,
                    platform: 'tiktok',
                    account: connection.username || user_data.display_name,
                    followers: user_data.follower_count || 0,
                    following: user_data.following_count || 0,
                    likes: user_data.likes_count || 0,
                    video_count: user_data.video_count || 0,
                    totalViews: stats.totalViews || 0,
                    totalLikes: stats.totalLikes || 0,
                    totalShares: stats.totalShares || 0,
                    totalComments: stats.totalComments || 0,
                    avgEngagementRate: stats.avgEngagementRate || '0%',
                    videos: tiktokData.videos || [],
                    timestamp: tiktokData.timestamp || new Date().toISOString(),
                    updated: 'nyss',
                    limited_access: tiktokData.limited_access || false,
                    scope_message: tiktokData.scope_message,
                    videoErrorCode: tiktokData.videoErrorCode,
                  };
                  
                  // Cache the result for 60 seconds
                  statsCache.set(`tiktok-${user.id}`, { 
                    data: statsResult, 
                    timestamp: Date.now() 
                  });
                }
              } else {
                // For other platforms, use cached data from social_stats table
                const stats = await getUserStats(user.id, platform);
                statsResult = {
                  success: true,
                  connected: true,
                  platform,
                  data: stats,
                  timestamp: new Date().toISOString()
                };
              }
            }
          } catch (error) {
            console.error('❌ Error in get_social_stats:', error);
            statsResult = {
              success: false,
              platform: platform || 'tiktok',
              error: error instanceof Error ? error.message : 'Okänt fel uppstod',
              errorCode: 'UNKNOWN_ERROR'
            };
          }

          const responseTime = Date.now() - startTime;
          
          // Log telemetry
          console.log('📈 Telemetry:', {
            intent: 'social_stats_query',
            platform: platform || 'all',
            responseTime,
            success: statsResult.success,
            connected: statsResult.connected,
            has_data: (statsResult.followers || 0) > 0,
            limited_access: statsResult.limited_access || false,
            errorCode: statsResult.errorCode || null,
            videoErrorCode: statsResult.videoErrorCode || null,
            timestamp: statsResult.timestamp || new Date().toISOString(),
          });
          
          // Call AI again with the stats data
          const followUpMessages = [
            ...messages,
            choice.message,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(statsResult)
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
      
      // Deduct credits after successful response (skip for unlimited plan)
      if (userData?.plan !== 'pro_unlimited') {
        const newCredits = Math.max(0, (userData?.credits_left || 0) - estimatedCost);
        await supabaseClient
          .from('users')
          .update({ credits_left: newCredits })
          .eq('id', user.id);
        console.log('💸 Credits deducted:', estimatedCost, 'remaining:', newCredits);
      }

      return new Response(
        JSON.stringify({ response: assistantMessage, credits_used: estimatedCost }),
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

    // POST /ai-assistant/create-marketing-plan - Create marketing plan
    if (action === 'create-marketing-plan' && req.method === 'POST') {
      console.log('📅 Creating marketing plan...');
      
      const body = await req.json();
      const { targets = ['reach', 'engagement'], timeframe = 'month', calendarContextDigest = [] } = body;
      
      // Marketing plans cost 5 credits
      const planCost = estimateCreditCost('create-marketing-plan');
      console.log('💰 Marketing plan cost:', planCost);
      
      // Check user credits
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('credits_left, plan')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user credits:', userError);
      }
      
      // Check if user has enough credits (skip for unlimited plan)
      if (userData?.plan !== 'pro_unlimited' && (userData?.credits_left || 0) < planCost) {
        console.log('❌ Insufficient credits for marketing plan:', userData?.credits_left, 'needed:', planCost);
        return new Response(
          JSON.stringify({ 
            error: 'INSUFFICIENT_CREDITS',
            message: 'Du har inte tillräckligt med krediter för en marknadsföringsplan. En plan kostar 5 krediter.',
            credits_left: userData?.credits_left || 0,
            cost: planCost
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userContext = await getUserContext(user.id);

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + (timeframe === 'week' ? 0 : 1));
      endDate.setDate(endDate.getDate() + (timeframe === 'week' ? 7 : 0));

      let calendarContext = '';
      if (calendarContextDigest.length > 0) {
        calendarContext = `\n\nExisterande kalender:\n${calendarContextDigest.map((p: any) => 
          `- ${p.date}: ${p.title} (${p.channel})`
        ).join('\n')}`;
      }

      const systemPrompt = `Du är en marknadsföringsexpert för UF-företag. Skapa en detaljerad marknadsföringsplan i JSON-format.

Mål: ${targets.join(', ')}
Tidsram: ${timeframe}
Start: ${now.toISOString().split('T')[0]}
Slut: ${endDate.toISOString().split('T')[0]}

${userContext.profile ? `
Företagsprofil:
- Bransch: ${userContext.profile.branch || 'Ej angiven'}
- Målgrupp: ${userContext.profile.malgrupp || 'Ej angiven'}
- Produkt: ${userContext.profile.produkt_beskrivning || 'Ej angiven'}
` : ''}

${calendarContext}

Returnera ENDAST ett JSON-objekt (ingen annan text före eller efter) med följande exakta struktur:
{
  "timeframe": {"start": "${now.toISOString().split('T')[0]}", "end": "${endDate.toISOString().split('T')[0]}"},
  "goals": ["konkret mål 1", "konkret mål 2", "konkret mål 3"],
  "budgetHints": ["budgettips 1", "budgettips 2"],
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "channel": "instagram",
      "title": "Catchy inläggstitel",
      "content": "Detaljerad innehållsbeskrivning för inlägget",
      "tags": ["tag1", "tag2", "tag3"],
      "assets": [],
      "status": "scheduled"
    }
  ]
}

Skapa minst 10-15 inlägg spridda jämnt över tidsperioden. Variera kanaler (instagram, tiktok, facebook). Alla datum måste vara mellan ${now.toISOString().split('T')[0]} och ${endDate.toISOString().split('T')[0]}. Gör innehållet relevant för UF-företag.`;

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Skapa marknadsföringsplanen nu i JSON-format.' }
          ],
          temperature: 0.8,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to generate plan');
      }

      const aiData = await aiResponse.json();
      let planText = aiData.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      planText = planText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const plan = JSON.parse(planText);
        
        const explanation = `Jag har skapat en marknadsföringsplan för ${timeframe === 'week' ? 'denna vecka' : 'denna månad'} med ${plan.posts?.length || 0} inlägg fördelade över Instagram, TikTok och Facebook.

Planen fokuserar på ${targets.join(' och ')} och innehåller konkreta inlägg med datumplanering.

Vill du implementera denna plan i din kalender? Klicka på "Implementera planen"-knappen nedan så läggs alla inlägg automatiskt in.`;

        // Save plan to analysis history for later reuse
        await supabaseClient
          .from('ai_analysis_history')
          .insert({
            user_id: user.id,
            input_data: {
              type: 'marketing_plan',
              targets,
              timeframe,
            },
            ai_output: plan,
          });

        // Save explanation message to chat history
        await supabaseClient
          .from('chat_history')
          .insert({
            user_id: user.id,
            role: 'assistant',
            message: explanation,
          });
        
        // Deduct credits after successful plan creation (skip for unlimited plan)
        if (userData?.plan !== 'pro_unlimited') {
          const newCredits = Math.max(0, (userData?.credits_left || 0) - planCost);
          await supabaseClient
            .from('users')
            .update({ credits_left: newCredits })
            .eq('id', user.id);
          console.log('💸 Plan credits deducted:', planCost, 'remaining:', newCredits);
        }

        return new Response(
          JSON.stringify({ plan, explanation, credits_used: planCost }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error('Failed to parse plan JSON:', parseError, 'Raw text:', planText);
        return new Response(
          JSON.stringify({ error: 'Kunde inte generera giltig plan. Försök igen.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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