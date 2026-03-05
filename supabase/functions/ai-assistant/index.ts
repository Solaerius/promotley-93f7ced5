import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache with 60s TTL
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

// =====================================================
// PROMPT INJECTION PROTECTION
// =====================================================

// Patterns that may indicate prompt injection attempts
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /ignore\s+the\s+above/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?previous/i,
  /new\s+instructions?:\s*/i,
  /system\s*:\s*/i,
  /you\s+are\s+now\s+a/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+if/i,
  /jailbreak/i,
  /DAN\s*mode/i,
  /developer\s+mode/i,
  /bypass\s+(your\s+)?restrictions?/i,
  /override\s+(your\s+)?instructions?/i,
  /reveal\s+(your\s+)?system\s+prompt/i,
  /show\s+(me\s+)?(your\s+)?instructions?/i,
  /what\s+are\s+your\s+instructions?/i,
  /print\s+(your\s+)?system\s+prompt/i,
  /output\s+(your\s+)?initial\s+prompt/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
  /\{\{system\}\}/i,
];

// Sanitize user message to prevent prompt injection
function sanitizeUserMessage(message: string): { sanitized: string; flagged: boolean; reason?: string } {
  if (!message || typeof message !== 'string') {
    return { sanitized: '', flagged: true, reason: 'Invalid message type' };
  }

  // Check message length (prevent resource exhaustion)
  if (message.length > 10000) {
    return { sanitized: message.slice(0, 10000), flagged: true, reason: 'Message too long' };
  }

  // Check for prompt injection patterns
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      console.warn('⚠️ Potential prompt injection detected:', pattern.toString());
      return { 
        sanitized: message, 
        flagged: true, 
        reason: 'Potential prompt injection detected' 
      };
    }
  }

  // Remove potential control characters and invisible characters
  const sanitized = message
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except tab, newline, carriage return
    .replace(/\u200B/g, '') // Zero-width space
    .replace(/\u200C/g, '') // Zero-width non-joiner
    .replace(/\u200D/g, '') // Zero-width joiner
    .replace(/\uFEFF/g, '') // BOM
    .trim();

  return { sanitized, flagged: false };
}

// Model tier configuration matching frontend
const MODEL_TIER_CONFIG: Record<string, { model: string; multiplier: number }> = {
  fast: { model: 'google/gemini-2.5-flash-lite', multiplier: 0.5 },
  standard: { model: 'google/gemini-3-flash-preview', multiplier: 1 },
  premium: { model: 'google/gemini-2.5-pro', multiplier: 2 },
};

// Credit cost estimation based on request type and complexity
const estimateCreditCost = (action: string, message?: string, modelTier: string = 'standard'): number => {
  let baseCost = 1;

  // Marketing plans are expensive
  if (action === 'create-marketing-plan') {
    baseCost = 5;
  } else if (action === 'analyze') {
    baseCost = 3;
  } else if (action === 'chat' && message) {
    const lowerMsg = message.toLowerCase();
    
    // Complex requests (strategies, plans, detailed analysis)
    if (lowerMsg.includes('strategi') || 
        lowerMsg.includes('plan') || 
        lowerMsg.includes('30 dag') ||
        lowerMsg.includes('marknadsföring') ||
        lowerMsg.includes('kampanj') ||
        lowerMsg.includes('innehållskalender')) {
      baseCost = 3;
    } else if (lowerMsg.includes('analys') || 
        lowerMsg.includes('tips') || 
        lowerMsg.includes('rekommend') ||
        lowerMsg.includes('förslag') ||
        lowerMsg.includes('förbättra')) {
      baseCost = 2;
    } else {
      baseCost = 1;
    }
  }
  
  const tierConfig = MODEL_TIER_CONFIG[modelTier] || MODEL_TIER_CONFIG.standard;
  return Math.max(1, Math.ceil(baseCost * tierConfig.multiplier));
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

    // Rate limiting
    const { data: rateLimitOk } = await supabaseClient.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'ai-assistant'
    });
    if (rateLimitOk === false) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Vänta en stund.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    console.log('📍 Action:', action, 'Path:', url.pathname);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      console.error('❌ LOVABLE_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'AI not connected', placeholder: true }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Lovable AI Gateway key found');

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

      // Get ALL knowledge from ai_knowledge table (not just uf_rules)
      const { data: allKnowledge } = await supabaseClient
        .from('ai_knowledge')
        .select('title, content, category');

      const result = {
        connections: connections || [],
        profile: profile || null,
        user: user || null,
        knowledgeBase: {
          files: knowledgeFiles?.map(f => f.name) || [],
          allKnowledge: allKnowledge || []
        },
        timestamp: new Date().toISOString()
      };

      statsCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    };

    // POST /ai-assistant/chat - Chat with AI (handles both regular chat and marketing plan creation)
    if (action === 'chat' && req.method === 'POST') {
      const body = await req.json();
      const { message: rawMessage, history, calendarContextDigest = [], meta } = body;
      const modelTier = meta?.model_tier || 'standard';
      if (!rawMessage) {
        return new Response(
          JSON.stringify({ error: 'Message required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Sanitize user message for prompt injection protection
      const { sanitized: message, flagged, reason } = sanitizeUserMessage(rawMessage);
      
      if (flagged) {
        console.warn('⚠️ Message flagged:', reason, 'User:', user.id);
        // Log security event for flagged messages
        await supabaseClient.rpc('log_security_event', {
          _user_id: user.id,
          _event_type: 'prompt_injection_attempt',
          _event_details: { reason, message_preview: rawMessage.slice(0, 100) },
          _ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          _user_agent: req.headers.get('user-agent') || 'unknown',
        });
        
        // For severe injection attempts, reject the message
        if (reason === 'Potential prompt injection detected') {
          return new Response(
            JSON.stringify({ 
              error: 'INVALID_MESSAGE',
              message: 'Ditt meddelande kunde inte bearbetas. Försök formulera om din fråga.',
              response: 'Jag kunde inte bearbeta ditt meddelande. Kan du försöka formulera om din fråga?'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log('Processing chat message:', message.slice(0, 100) + '...');
      console.log('Meta:', meta);

      // Check if this is a marketing plan request (via meta action)
      const isMarketingPlanRequest = meta?.action === 'create_marketing_plan' || 
        message.toLowerCase().includes('marknadsföringsplan') && 
        (message.toLowerCase().includes('skapa') || message.toLowerCase().includes('generera'));

      // Estimate credit cost for this request
      const estimatedCost = isMarketingPlanRequest ? estimateCreditCost('create-marketing-plan', message, modelTier) : estimateCreditCost('chat', message, modelTier);
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
      
      // Check if user has enough credits
      if ((userData?.credits_left || 0) < estimatedCost) {
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

        const tierConfig = MODEL_TIER_CONFIG[modelTier] || MODEL_TIER_CONFIG.standard;
        // Use premium model for marketing plans regardless of tier selection
        const planModel = modelTier === 'fast' ? 'google/gemini-2.5-flash' : 'google/gemini-2.5-pro';
        
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: planModel,
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
          
          // Deduct credits after successful plan creation
          const newCredits = Math.max(0, (userData?.credits_left || 0) - estimatedCost);
          await supabaseClient
            .from('users')
            .update({ credits_left: newCredits })
            .eq('id', user.id);
          console.log('💸 Plan credits deducted:', estimatedCost, 'remaining:', newCredits);

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
        allKnowledge: userContext.knowledgeBase.allKnowledge.length
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

      // Group knowledge by category for better prompt organization
      const knowledgeByCategory: Record<string, any[]> = {};
      userContext.knowledgeBase.allKnowledge.forEach((k: any) => {
        if (!knowledgeByCategory[k.category]) {
          knowledgeByCategory[k.category] = [];
        }
        knowledgeByCategory[k.category].push(k);
      });

      const knowledgeContext = Object.keys(knowledgeByCategory).length > 0 ? `
KUNSKAPSBAS (CITERA EXAKT VID FRÅGOR OM UF-REGLER ELLER TÄVLINGAR):
${Object.entries(knowledgeByCategory).map(([category, items]) => `
## ${category.toUpperCase().replace(/_/g, ' ')}
${items.map((k: any) => `### ${k.title}\nFULL INNEHÅLL:\n${k.content}`).join('\n\n')}
`).join('\n')}
` : '';

      // Use model based on user-selected tier
      const tierConfig = MODEL_TIER_CONFIG[modelTier] || MODEL_TIER_CONFIG.standard;
      const aiModel = tierConfig.model;
      console.log('🤖 Using AI model:', aiModel, 'tier:', modelTier);

      // Check if this is a tool-specific request with a custom system prompt
      const toolSystemPrompt = meta?.toolSystemPrompt;

      const messages = [
        {
          role: 'system',
           content: toolSystemPrompt 
            ? `${toolSystemPrompt}

Användarens företagsprofil:
${profileInfo || 'Ingen profil angiven.'}

${knowledgeContext}

Svara ALLTID på svenska.`
            : `Du är Promotely AI – en expert på marknadsföring för UF-företag (Ung Företagsamhet) och svenska startups.

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

${knowledgeContext}

## KRITISK REGEL: EXAKT CITERING FRÅN KUNSKAPSBASEN

När användaren frågar om specifika UF-regler, tävlingskriterier, bedömningspunkter, eller vill skriva texter för tävlingar:

1) CITERA ALLTID EXAKT OCH ORDAGRANT från kunskapsbasen - förkorta eller sammanfatta ALDRIG
2) Om kunskapsbasen innehåller en lista med t.ex. 5 punkter, inkludera ALLA punkter i ditt svar - hoppa inte över någon
3) Använd exakt samma formuleringar som finns i kunskapsbasen
4) Om informationen finns i kunskapsbasen, inled med: "Enligt UF:s riktlinjer:" följt av exakt citat
5) När användaren vill skriva text för en tävling, använd ALLA relevanta bedömningskriterier för att strukturera svaret

Exempel:
- Fråga: "Vad bedömer juryn i Årets Innovation?" → Lista SAMTLIGA bedömningspunkter exakt som de står i kunskapsbasen
- Fråga: "Hjälp mig skriva för Årets Innovation" → Strukturera svaret efter ALLA officiella bedömningskriterier

## VIKTIGT: TEXTSKRIVNING FÖR UF-TÄVLINGAR

När användaren ber om hjälp att skriva texter för UF-tävlingar (som Årets Innovation, Bästa Affärsidé, Årets UF-företag, etc.):

1) **Identifiera rätt tävling** - Fråga vilken tävling om det inte är tydligt
2) **Hämta bedömningskriterier** - Använd kunskapsbasen för att hitta EXAKTA bedömningskriterier för den specifika tävlingen
3) **Strukturera texten enligt kriterierna** - Varje bedömningskriterium ska adresseras explicit
4) **Använd UF-terminologi** - Inkludera relevanta UF-begrepp och terminologi
5) **Anpassa till företagets profil** - Använd informationen från användarens AI-profil för att göra texten personlig och relevant
6) **Optimera för juryn** - Skriv så att juryn enkelt kan se att varje kriterium uppfylls

**Format för tävlingstexter:**
- Börja med en stark inledning som fångar uppmärksamheten
- Adressera varje bedömningskriterium med en tydlig rubrik eller sektion
- Använd konkreta exempel och siffror när möjligt
- Avsluta med en övertygande sammanfattning
- Håll texten inom eventuella teckenbegränsningar som anges

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

## Textformatering
- Du FÅR och SKA använda Markdown-formatering för att göra svaren snygga och läsbara
- Använd ## för rubriker och ### för underrubriker
- Använd **fetstil** för viktiga begrepp och nyckelord
- Använd numrerade listor (1. 2. 3.) och punktlistor (- eller *) för att strukturera information
- Använd > för citat (speciellt vid citering från kunskapsbasen)
- Använd kodblock (backticks) för specifika termer eller tekniska begrepp
- Använd --- för horisontella avgränsare mellan sektioner
- Håll svar strukturerade och lättlästa
- Begränsa svar till max 400 ord om inte användaren ber om längre analys

## VIKTIG REGEL: Felaktig diagnos är förbjudet
- ALDRIG ALDRIG ALDRIG svara "koppla TikTok" eller "kontot är inte kopplat" om get_social_stats returnerar success=true och connected=true
- Om connected=true men vissa fält saknas (limited_access=true), förklara att specifika behörigheter (scopes) saknas, inte att kontot är okopplat
- Om get_social_stats misslyckas av tekniska skäl (errorCode=API_ERROR) → säg att det är ett tekniskt problem, inte att kontot saknas

Kom ihåg: Du är här för att hjälpa UF-företagare att växa sina företag smart och snabbt. Hämta alltid faktisk data innan du svarar!`
        },
        ...(toolSystemPrompt ? [] : (history || []).map((msg: any) => ({
          role: msg.role,
          content: msg.message
        }))),
        {
          role: 'user',
          content: message
        }
      ];

      console.log('Calling Lovable AI Gateway...');

      // Call OpenAI API with tool calling support
      // Use dynamic model based on user plan
      const requestBody: any = {
        model: aiModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500, // Increased to allow for complete citations
      };

      if (tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto';
      }

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('❌ AI Gateway error:', aiResponse.status, errorText);
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded', message: 'För många förfrågningar. Vänta en stund och försök igen.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Payment required', message: 'AI-tjänsten kräver mer krediter.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
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

          const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: tierConfig.model,
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
      
      // Deduct credits after successful response
      const newCredits = Math.max(0, (userData?.credits_left || 0) - estimatedCost);
      await supabaseClient
        .from('users')
        .update({ credits_left: newCredits })
        .eq('id', user.id);
      console.log('💸 Credits deducted:', estimatedCost, 'remaining:', newCredits);

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
      
      // Check if user has enough credits
      if ((userData?.credits_left || 0) < planCost) {
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

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
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
        
        // Deduct credits after successful plan creation
        const newCredits = Math.max(0, (userData?.credits_left || 0) - planCost);
        await supabaseClient
          .from('users')
          .update({ credits_left: newCredits })
          .eq('id', user.id);
        console.log('💸 Plan credits deducted:', planCost, 'remaining:', newCredits);

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