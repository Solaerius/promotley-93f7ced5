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
      return new Response(JSON.stringify({ 
        error: 'email_not_verified',
        message: 'Verifiera din e-post först'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Generating sales radar for user:', user.id);

    // Fetch user plan and credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan, credits_left')
      .eq('id', user.id)
      .single();

    if (userError) {
      return new Response(JSON.stringify({ error: 'Could not fetch user data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check active plan
    const validPlans = ['starter', 'growth', 'pro'];
    if (!validPlans.includes(userData.plan)) {
      return new Response(JSON.stringify({ 
        error: 'NO_ACTIVE_PLAN',
        message: 'Uppgradera för att använda Säljradarn'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Model routing
    let aiModel = 'gpt-4o-mini';
    let creditCost = 3;
    
    switch (userData.plan) {
      case 'growth':
        aiModel = 'gpt-4.1-mini-2025-04-14';
        creditCost = 2;
        break;
      case 'pro':
        aiModel = 'gpt-4o';
        creditCost = 5;
        break;
    }

    // Check credits
    if (userData.credits_left < creditCost) {
      return new Response(JSON.stringify({ 
        error: 'INSUFFICIENT_CREDITS',
        message: 'Fyll på krediter för att använda Säljradarn',
        credits_needed: creditCost,
        credits_available: userData.credits_left
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Deduct credits
    await supabase
      .from('users')
      .update({ credits_left: userData.credits_left - creditCost })
      .eq('id', user.id);

    // Fetch AI profile
    const { data: aiProfile } = await supabase
      .from('ai_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch social stats
    const { data: socialStats } = await supabase
      .from('social_stats')
      .select('*')
      .eq('user_id', user.id);

    // Fetch analytics
    const { data: analytics } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id);

    // TODO: Perplexity integration for real-time trends
    // When PERPLEXITY_API_KEY is available, fetch real-time data:
    // const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    // let externalTrends = null;
    // if (perplexityKey && aiProfile?.branch) {
    //   const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${perplexityKey}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       model: 'sonar',
    //       messages: [
    //         { role: 'system', content: 'Ge aktuella trender och säljtillfällen för svenska UF-företag.' },
    //         { role: 'user', content: `Bransch: ${aiProfile.branch}, Stad: ${aiProfile.stad || 'Sverige'}. Hitta aktuella event, trender och säljtillfällen.` }
    //       ],
    //       search_recency_filter: 'week'
    //     }),
    //   });
    //   if (perplexityResponse.ok) {
    //     const perplexityData = await perplexityResponse.json();
    //     externalTrends = perplexityData.choices[0]?.message?.content;
    //   }
    // }

    const userCity = aiProfile?.stad || '';
    const userLan = aiProfile?.lan || '';
    const userPostnummer = aiProfile?.postnummer || '';
    const hasLocation = !!(userCity || userLan);

    const systemPrompt = `Du är Promotelys Säljradar-AI. Du hjälper svenska UF-företag och startups hitta konkreta affärsmöjligheter.

Du analyserar företagets profil, bransch och sociala medier-data för att generera:
1. LEADS - Potentiella kunder, samarbetspartners och målgrupper att rikta sig mot
2. TRENDER - Aktuella trender i branschen som kan utnyttjas
${hasLocation ? `3. LOKALA MÖJLIGHETER - Platsbaserade events, mässor, marknader och lokala samarbeten i eller nära användarens stad/region` : ''}

Ton: konkret, handlingsbar, motiverande. Fokusera på möjligheter som kan realiseras inom 1-4 veckor.
Skriv alltid på svenska.
${hasLocation ? `\nVIKTIGT: Inkludera minst 2 leads som är specifikt kopplade till användarens stad eller region. Nämn lokala event, marknader, mässor, samarbeten med lokala företag, eller platsbaserade möjligheter.` : ''}

Svara i exakt detta JSON-format:
{
  "leads": [
    {
      "typ": "kund" | "samarbete" | "event" | "kanal",
      "titel": "Kort titel",
      "beskrivning": "Konkret beskrivning av möjligheten",
      "action": "Exakt vad företaget ska göra",
      "prioritet": "hög" | "medel" | "låg",
      "potential": "Uppskattad potentiell påverkan",
      "plats": "Stad eller region om relevant, annars null"
    }
  ],
  "trends": [
    {
      "typ": "hashtag" | "format" | "ämne" | "event" | "säsong",
      "titel": "Trendnamn",
      "beskrivning": "Varför detta är relevant nu",
      "tips": "Hur företaget kan utnyttja trenden",
      "plattform": "instagram" | "tiktok" | "alla",
      "aktualitet": "nu" | "denna_vecka" | "denna_månad"
    }
  ],
  "sammanfattning": "2-3 meningar om de viktigaste möjligheterna just nu"
}

Ge 4-6 leads och 4-6 trender. Var så specifik och konkret som möjligt.`;

    const userPrompt = `
${aiProfile ? `## FÖRETAGSPROFIL
Företagsnamn: ${aiProfile.foretagsnamn || 'Ej angivet'}
Bransch: ${aiProfile.branch || 'Ej specificerad'}
Målgrupp: ${aiProfile.malgrupp || 'Ej specificerad'}
Produkt/Tjänst: ${aiProfile.produkt_beskrivning || 'Ej specificerad'}
Stad: ${aiProfile.stad || 'Ej angiven'}
Prisnivå: ${aiProfile.prisniva || 'Ej specificerad'}
Målsättning: ${aiProfile.malsattning || 'Ej specificerad'}
Tonalitet: ${aiProfile.tonalitet || 'Professionell'}
Nyckelord: ${aiProfile.nyckelord?.join(', ') || 'Inga'}
Kanaler: ${aiProfile.kanaler?.join(', ') || 'Inga'}
` : 'Ingen företagsprofil inlagd.\n'}

${socialStats && socialStats.length > 0 ? `## SOCIALA MEDIER
${socialStats.map(s => `${s.platform}: ${s.followers || 0} följare, ${s.likes || 0} likes, ${s.comments || 0} kommentarer`).join('\n')}
` : 'Inga sociala medier anslutna.\n'}

${analytics && analytics.length > 0 ? `## ANALYTICS
${analytics.map(a => `${a.platform}: ${a.followers || 0} följare, ${a.engagement || 0}% engagemang`).join('\n')}
` : ''}

Generera leads och trender baserat på ovanstående information. Fokusera på möjligheter som passar företagets bransch, stad och målgrupp.`;

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
        temperature: 0.5,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    // Save to database
    const { error: saveError } = await supabase
      .from('sales_radar_results')
      .insert({
        user_id: user.id,
        radar_type: 'full',
        leads: result.leads || [],
        trends: result.trends || [],
        input_context: {
          plan: userData.plan,
          model: aiModel,
          has_profile: !!aiProfile,
          has_social: socialStats && socialStats.length > 0,
          // has_perplexity: false, // Will be true when Perplexity is enabled
        }
      });

    if (saveError) {
      console.error('Error saving radar results:', saveError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        credits_used: creditCost
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sales-radar:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
