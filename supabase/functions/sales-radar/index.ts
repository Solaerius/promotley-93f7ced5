import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Council model pools
const MODEL_POOLS: Record<string, { defaultModel: string; pool: string[] }> = {
  fast: { defaultModel: 'gpt-4o-mini', pool: ['gpt-4o-mini'] },
  standard: { defaultModel: 'gpt-4o', pool: ['gpt-4o', 'gpt-4o-mini'] },
  premium: { defaultModel: 'gpt-4o', pool: ['gpt-4o'] },
};

// Credit multipliers per tier
const TIER_MULTIPLIERS: Record<string, number> = { fast: 0.5, standard: 1, premium: 2 };

async function routeModel(context: string, tier: string, apiKey: string): Promise<string> {
  const config = MODEL_POOLS[tier] || MODEL_POOLS.standard;
  if (config.pool.length <= 1) return config.pool[0];
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `Pick the best model for a sales radar / lead generation task from: ${config.pool.join(', ')}. Respond with ONLY the model name.` },
          { role: 'user', content: context.slice(0, 300) }
        ],
        temperature: 0, max_tokens: 50,
      }),
    });
    if (!resp.ok) return config.defaultModel;
    const data = await resp.json();
    const rec = data.choices?.[0]?.message?.content?.trim();
    if (rec && config.pool.includes(rec)) { console.log(`🧭 AI Council: ${rec}`); return rec; }
    return config.defaultModel;
  } catch { return config.defaultModel; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!user.email_confirmed_at) {
      return new Response(JSON.stringify({ error: 'email_not_verified', message: 'Verifiera din e-post först' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id, _endpoint: 'sales-radar'
    });
    if (rateLimitOk === false) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Vänta en stund.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse body for model_tier
    const body = await req.json().catch(() => ({}));
    const modelTier = body.model_tier || 'standard';

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users').select('plan, credits_left').eq('id', user.id).single();
    if (userError) {
      return new Response(JSON.stringify({ error: 'Could not fetch user data' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Credit cost based on tier
    const baseCost = 3;
    const creditCost = Math.max(1, Math.ceil(baseCost * (TIER_MULTIPLIERS[modelTier] || 1)));

    if (userData.credits_left < creditCost) {
      return new Response(JSON.stringify({ 
        error: 'INSUFFICIENT_CREDITS', message: 'Fyll på krediter för att använda Säljradarn',
        credits_needed: creditCost, credits_available: userData.credits_left
      }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Deduct credits
    await supabase.from('users').update({ credits_left: userData.credits_left - creditCost }).eq('id', user.id);

    // Fetch AI profile
    const { data: aiProfile } = await supabase.from('ai_profiles').select('*').eq('user_id', user.id).single();

    // Fetch social stats + analytics
    const { data: socialStats } = await supabase.from('social_stats').select('*').eq('user_id', user.id);
    const { data: analytics } = await supabase.from('analytics').select('*').eq('user_id', user.id);

    // Fetch knowledge base
    const { data: allKnowledge } = await supabase.from('ai_knowledge').select('title, content, category');
    const knowledgeContext = allKnowledge && allKnowledge.length > 0
      ? allKnowledge.map(k => `[${k.category}] ${k.title}: ${k.content}`).join('\n\n')
      : '';

    const userCity = aiProfile?.stad || '';
    const userLan = aiProfile?.lan || '';
    const hasLocation = !!(userCity || userLan);

    const systemPrompt = `Du är Promotelys Säljradar-AI. Du hjälper svenska UF-företag och startups hitta konkreta affärsmöjligheter.

Du analyserar företagets profil, bransch och sociala medier-data för att generera:
1. LEADS - Potentiella kunder, samarbetspartners och målgrupper
2. TRENDER - Aktuella trender i branschen
${hasLocation ? `3. LOKALA MÖJLIGHETER - Platsbaserade events, mässor, marknader i eller nära användarens stad/region` : ''}

${hasLocation ? `VIKTIGT: Inkludera minst 2 leads specifikt kopplade till användarens stad (${userCity}) eller region (${userLan}).` : ''}

${knowledgeContext ? `\nKUNSKAPSBAS:\n${knowledgeContext}` : ''}

Svara i exakt detta JSON-format:
{
  "leads": [{ "typ": "kund|samarbete|event|kanal", "titel": "Kort titel", "beskrivning": "Konkret beskrivning", "action": "Exakt vad företaget ska göra", "prioritet": "hög|medel|låg", "potential": "Uppskattad påverkan", "plats": "Stad eller null" }],
  "trends": [{ "typ": "hashtag|format|ämne|event|säsong", "titel": "Trendnamn", "beskrivning": "Varför relevant nu", "tips": "Hur utnyttja trenden", "plattform": "instagram|tiktok|alla", "aktualitet": "nu|denna_vecka|denna_månad" }],
  "sammanfattning": "2-3 meningar om viktigaste möjligheterna"
}

Ge 4-6 leads och 4-6 trender. Skriv på svenska.`;

    const userPrompt = `${aiProfile ? `## FÖRETAGSPROFIL
Företagsnamn: ${aiProfile.foretagsnamn || 'Ej angivet'}
Bransch: ${aiProfile.branch || 'Ej specificerad'}
Målgrupp: ${aiProfile.malgrupp || 'Ej specificerad'}
Produkt/Tjänst: ${aiProfile.produkt_beskrivning || 'Ej specificerad'}
Stad: ${aiProfile.stad || 'Ej angiven'}
Län: ${aiProfile.lan || 'Ej angivet'}
Prisnivå: ${aiProfile.prisniva || 'Ej specificerad'}
Målsättning: ${aiProfile.malsattning || 'Ej specificerad'}
Tonalitet: ${aiProfile.tonalitet || 'Professionell'}
Nyckelord: ${aiProfile.nyckelord?.join(', ') || 'Inga'}
Kanaler: ${aiProfile.kanaler?.join(', ') || 'Inga'}
` : 'Ingen företagsprofil inlagd.\n'}

${socialStats && socialStats.length > 0 ? `## SOCIALA MEDIER
${socialStats.map(s => `${s.platform}: ${s.followers || 0} följare, ${s.likes || 0} likes`).join('\n')}
` : ''}

${analytics && analytics.length > 0 ? `## ANALYTICS
${analytics.map(a => `${a.platform}: ${a.followers || 0} följare, ${a.engagement || 0}% engagemang`).join('\n')}
` : ''}

Generera leads och trender baserat på ovanstående information.`;

    // AI Council routing
    const aiModel = await routeModel(userPrompt, modelTier, openaiApiKey);
    console.log(`🤖 Sales Radar using model: ${aiModel} (tier: ${modelTier})`);

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let resultText = aiData.choices[0].message.content.trim();
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(resultText);

    // Save to database
    await supabase.from('sales_radar_results').insert({
      user_id: user.id, radar_type: 'full',
      leads: result.leads || [], trends: result.trends || [],
      input_context: { plan: userData.plan, model: aiModel, tier: modelTier, has_profile: !!aiProfile }
    });

    return new Response(
      JSON.stringify({ success: true, data: result, credits_used: creditCost }),
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
