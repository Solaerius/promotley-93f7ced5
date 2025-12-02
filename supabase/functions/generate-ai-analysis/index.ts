import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UF-regler som inkluderas i varje AI-prompt
const UF_RULES = `
# UF-REGLER OCH RIKTLINJER

## TÄVLINGSKRITERIER - UF-NÄSTET
- Affärsidé och Marknadsföring (25%): Tydlig affärsidé, väl definierad målgrupp, konkret marknadsföringsstrategi
- Ekonomi och Resultat (25%): Realistisk budget, god ekonomisk planering, lönsamt eller potential till lönsamhet
- Genomförande och Aktivitet (25%): Aktiv försäljning, minst 5 säljtillfällen, regelbunden aktivitet
- Entreprenöriellt lärande (25%): Reflektion, utveckling, hantering av motgångar

## FEM OBLIGATORISKA MOMENT
1. Starta företaget korrekt (registrera hos UF, minst 3 delägare, styrelse)
2. Hålla årsstämma (senast april)
3. Skriva affärsplan
4. Genomföra minst 5 säljtillfällen (minst 1 fysiskt)
5. Upprätta årsredovisning

## EKONOMIREGLER
- Max 2000 kr startkapital
- Alla kostnader måste dokumenteras
- Budget ska innehålla: intäkter, kostnader, resultat, kassaflöde
- Prissättning ska täcka alla kostnader

## SÄLJTILLFÄLLEN
- Minst 5 under året, minst 1 fysiskt
- Dokumentera: datum, plats, intäkter, foto, lärdomar
- Godkända: skolmarknad, pop-up, event, webshop-kampanj, sociala medier med försäljning

## MARKNADSFÖRING
- Tillåtet: sociala medier, hemsida, fysisk marknadsföring, samarbeten, events
- Ej tillåtet: vilseledande marknadsföring, kopiera varumärken, spam
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
    
    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check email verification
    if (!user.email_confirmed_at) {
      console.error('Email not verified:', user.id);
      return new Response(JSON.stringify({ 
        error: 'email_not_verified',
        message: 'Verifiera din e-post för att använda AI-analys'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Generating AI analysis for user:', user.id);

    // Parse request body for requestId and any override attempts
    const body = await req.json().catch(() => ({}));
    const requestId = body.requestId || crypto.randomUUID();
    const clientModel = body.model; // Will be ignored if doesn't match policy

    // Fetch user plan and credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan, credits_left, max_credits, renewal_date')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return new Response(JSON.stringify({ error: 'Could not fetch user plan' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has active plan
    const validPlans = ['free_trial', 'pro', 'pro_xl', 'pro_unlimited'];
    if (!validPlans.includes(userData.plan)) {
      return new Response(JSON.stringify({ 
        error: 'NO_ACTIVE_PLAN',
        message: 'Uppgradera för att låsa upp AI-analys',
        upgrade_url: '/pricing'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine tier and enforce model policy
    let tier = 'starter';
    let aiModel = 'gpt-4o-mini';
    let estimatedCost = 5;
    
    switch (userData.plan) {
      case 'free_trial':
        tier = 'starter';
        aiModel = 'gpt-4o-mini';
        estimatedCost = 5;
        break;
      case 'pro':
        tier = 'growth';
        aiModel = 'gpt-4o-mini';
        estimatedCost = 3;
        break;
      case 'pro_xl':
        tier = 'pro';
        aiModel = 'gpt-4o';
        estimatedCost = 2;
        break;
      case 'pro_unlimited':
        tier = 'unlimited';
        aiModel = 'gpt-4o';
        estimatedCost = 0;
        break;
    }

    // Enforce model policy - ignore client override
    if (clientModel && clientModel !== aiModel) {
      console.warn('POLICY_VIOLATION: Client attempted model override', {
        userId: user.id,
        tier,
        requested: clientModel,
        allowed: aiModel,
        requestId
      });
    }

    console.log(`Using AI model: ${aiModel} for tier: ${tier}`);

    // Check credits
    if (tier !== 'unlimited' && userData.credits_left < estimatedCost) {
      return new Response(JSON.stringify({ 
        error: 'INSUFFICIENT_CREDITS',
        message: 'Fyll på krediter för att fortsätta',
        credits_needed: estimatedCost,
        credits_available: userData.credits_left
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Deduct credits (reservation)
    const creditsBefore = userData.credits_left;
    if (tier !== 'unlimited') {
      const { error: deductError } = await supabase
        .from('users')
        .update({ credits_left: userData.credits_left - estimatedCost })
        .eq('id', user.id);

      if (deductError) {
        console.error('Error reserving credits:', deductError);
        return new Response(JSON.stringify({ error: 'Could not reserve credits' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Hämta AI-profil
    const { data: aiProfile, error: profileError } = await supabase
      .from('ai_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching AI profile:', profileError);
    }

    // Hämta social stats
    const { data: socialStats, error: statsError } = await supabase
      .from('social_stats')
      .select('*')
      .eq('user_id', user.id);

    if (statsError) {
      console.error('Error fetching social stats:', statsError);
    }

    // Hämta analytics data för ytterligare kontext
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id);

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
    }

    // Hämta UF-kunskapsregler från databasen
    const { data: ufKnowledge, error: knowledgeError } = await supabase
      .from('ai_knowledge')
      .select('content')
      .in('category', ['uf_rules', 'competition_criteria', 'annual_report']);

    if (knowledgeError) {
      console.error('Error fetching UF knowledge:', knowledgeError);
    }

    const dynamicUfRules = ufKnowledge && ufKnowledge.length > 0
      ? ufKnowledge.map(k => k.content).join('\n\n')
      : UF_RULES;

    // Bygg system prompt
    const systemPrompt = `Du är Promotely UF:s AI-expert och marknadsföringsrådgivare.

Du analyserar sociala medier, UF-regler, marknadsföring och entreprenörskap för svenska UF-företag.
Du ger konkreta, smarta och handlingsbara förslag anpassade för unga entreprenörer.

Du HÅLLER ALLTID dig till UF-reglerna och ger råd som hjälper företaget att:
- Växa på sociala medier
- Öka engagemang och försäljning
- Kvalificera sig för UF-tävlingar
- Följa alla UF-krav och deadlines
- Bygga ett professionellt och hållbart företag

Ton: professionell, energisk, modern, enkel att förstå, motiverande.

TEXTFORMATERING - KRITISKT:
- ENDAST ren text i alla fält
- FÖRBJUDET: stjärnor, understreck, hashtag-rubriker, backticks, större-än-tecken, bindestreck-listor, punkt-listor, hakparenteser, HTML-taggar, emojis
- Använd numrerade listor: 1) punkt, 2) punkt, 3) punkt
- Rubriker: skriv som vanlig text
- Maximalt 2-3 meningar per stycke
- Tydliga avsnitt separerade med en tom rad

Svara alltid i tydliga punkter och sektioner med ren text.
Ge KONKRETA exempel och actionable advice.`;

    // Bygg user prompt
    const userPrompt = `
${aiProfile ? `## FÖRETAGSPROFIL
Bransch: ${aiProfile.branch || 'Ej specificerad'}
Målgrupp: ${aiProfile.malgrupp || 'Ej specificerad'}
Produkt/Tjänst: ${aiProfile.produkt_beskrivning || 'Ej specificerad'}
Prisnivå: ${aiProfile.prisniva || 'Ej specificerad'}
Nuvarande marknadsplan: ${aiProfile.marknadsplan || 'Ej specificerad'}
Målsättning: ${aiProfile.malsattning || 'Ej specificerad'}
Tonalitet: ${aiProfile.tonalitet || 'Professionell och ungdomlig'}
` : '## FÖRETAGSPROFIL\nIngen företagsprofil inlagd än.\n'}

${socialStats && socialStats.length > 0 ? `## SOCIALA MEDIER STATISTIK
${socialStats.map(stat => `
**${stat.platform.toUpperCase()}**
- Följare: ${stat.followers || 0}
- Räckvidd: ${stat.reach || 0}
- Visningar: ${stat.impressions || 0}
- Likes: ${stat.likes || 0}
- Kommentarer: ${stat.comments || 0}
- Delningar: ${stat.shares || 0}
- Profilvisningar: ${stat.profile_views || 0}
`).join('\n')}
` : '## SOCIALA MEDIER STATISTIK\nInga sociala medier anslutna än.\n'}

${analytics && analytics.length > 0 ? `## YTTERLIGARE ANALYTICS
${analytics.map(a => `
**${a.platform.toUpperCase()}**
- Följare: ${a.followers || 0}
- Engagemang: ${a.engagement || 0}%
- Räckvidd: ${a.reach || 0}
- Visningar: ${a.views || 0}
`).join('\n')}
` : ''}

## UF-REGLER DU MÅSTE FÖLJA
${dynamicUfRules}

---

Baserat på ovanstående information, generera en komplett analys och handlingsplan.

Strukturera ditt svar enligt följande JSON-format:
{
  "sammanfattning": "En kort sammanfattning av företagets nuvarande situation (2-3 meningar)",
  "social_medier_analys": "Detaljerad analys av deras sociala medier med styrkor, svagheter och möjligheter",
  "7_dagars_plan": [
    {
      "dag": "Dag 1",
      "aktivitet": "Konkret aktivitet",
      "beskrivning": "Detaljerad beskrivning",
      "plattform": "instagram/tiktok/facebook"
    }
  ],
  "uf_tavlingsstrategi": "Strategi för att kvalificera sig för UF-tävlingar och vinna",
  "content_forslag": [
    {
      "titel": "Content-idé",
      "beskrivning": "Beskrivning av innehållet",
      "plattform": "instagram/tiktok/facebook",
      "format": "reel/story/post/video"
    }
  ],
  "rekommendationer": [
    {
      "kategori": "Marknadsföring/Ekonomi/Försäljning/UF-krav",
      "prioritet": "Hög/Medel/Låg",
      "titel": "Rekommendation",
      "beskrivning": "Detaljerad beskrivning",
      "deadline": "När detta bör göras"
    }
  ]
}

Ge konkreta, actionable råd som företaget kan börja implementera IDAG.
Fokusera på snabba vinster och långsiktig tillväxt.
Håll dig alltid till UF-reglerna och deadlines.`;

    console.log('Calling OpenAI API...');

    // Anropa OpenAI API
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiOutput = JSON.parse(aiData.choices[0].message.content);

    console.log('AI analysis generated successfully');

    // Get actual usage from OpenAI response
    const actualTokens = aiData.usage?.total_tokens || 0;
    const actualCost = Math.ceil(actualTokens / 1000); // Simplified cost calculation
    
    // Settlement: adjust credits based on actual vs reserved
    const settlement = actualCost - estimatedCost;
    const creditsAfter = tier === 'unlimited' 
      ? creditsBefore 
      : creditsBefore - actualCost;

    if (tier !== 'unlimited' && settlement !== 0) {
      await supabase
        .from('users')
        .update({ credits_left: creditsAfter })
        .eq('id', user.id);
    }

    // Save analysis to history
    const { error: saveError } = await supabase
      .from('ai_analysis_history')
      .insert({
        user_id: user.id,
        input_data: {
          aiProfile,
          socialStats,
          analytics,
          plan: userData.plan,
          tier,
          model_used: aiModel,
          request_id: requestId
        },
        ai_output: aiOutput
      });

    if (saveError) {
      console.error('Error saving analysis history:', saveError);
    }

    // Log usage (just console for now)
    console.log('AI usage:', {
      user_id: user.id,
      request_id: requestId,
      model: aiModel,
      tier,
      credits_actual: actualCost,
      tokens_used: actualTokens
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: aiOutput,
        credits: {
          before: creditsBefore,
          reserved: estimatedCost,
          actual: actualCost,
          after: creditsAfter
        },
        usage: {
          tokens: actualTokens,
          model: aiModel
        },
        requestId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-ai-analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Rollback credits on error if they were reserved
    try {
      const body = await req.json().catch(() => ({}));
      const requestId = body.requestId;
      
      if (requestId) {
        // Check if credits were reserved
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
          const { data: { user } } = await supabase.auth.getUser(token);
          
          if (user) {
            console.log('Rolling back reserved credits for requestId:', requestId);
            // Note: In production, implement proper rollback logic
          }
        }
      }
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});