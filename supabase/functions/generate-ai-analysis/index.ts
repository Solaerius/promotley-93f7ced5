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
          { role: 'system', content: `Pick the best model for a deep business analysis task from: ${config.pool.join(', ')}. This needs strong reasoning. Respond with ONLY the model name.` },
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
      return new Response(JSON.stringify({ error: 'email_not_verified', message: 'Verifiera din e-post för att använda AI-analys' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id, _endpoint: 'generate-ai-analysis'
    });
    if (rateLimitOk === false) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Vänta en stund.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => ({}));
    const requestId = body.requestId || crypto.randomUUID();
    const modelTier = body.model_tier || 'standard';

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users').select('plan, credits_left, max_credits, renewal_date').eq('id', user.id).single();
    if (userError) {
      return new Response(JSON.stringify({ error: 'Could not fetch user plan' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Credit cost based on tier (base 3 for analysis)
    const baseCost = 3;
    const estimatedCost = Math.max(1, Math.ceil(baseCost * (TIER_MULTIPLIERS[modelTier] || 1)));

    if (userData.credits_left < estimatedCost) {
      return new Response(JSON.stringify({ 
        error: 'INSUFFICIENT_CREDITS', message: 'Fyll på krediter för att fortsätta',
        credits_needed: estimatedCost, credits_available: userData.credits_left
      }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Reserve credits
    const creditsBefore = userData.credits_left;
    await supabase.from('users').update({ credits_left: userData.credits_left - estimatedCost }).eq('id', user.id);

    // Fetch all context
    const { data: aiProfile } = await supabase.from('ai_profiles').select('*').eq('user_id', user.id).single();
    const { data: socialStats } = await supabase.from('social_stats').select('*').eq('user_id', user.id);
    const { data: analyticsData } = await supabase.from('analytics').select('*').eq('user_id', user.id);
    const { data: allKnowledge } = await supabase.from('ai_knowledge').select('title, content, category');

    // Build knowledge context
    let knowledgeContext = '';
    if (allKnowledge && allKnowledge.length > 0) {
      const byCategory: Record<string, any[]> = {};
      allKnowledge.forEach(k => {
        if (!byCategory[k.category]) byCategory[k.category] = [];
        byCategory[k.category].push(k);
      });
      knowledgeContext = Object.entries(byCategory).map(([cat, items]) =>
        `## ${cat.toUpperCase().replace(/_/g, ' ')}\n${items.map(k => `### ${k.title}\n${k.content}`).join('\n\n')}`
      ).join('\n\n');
    }

    const systemPrompt = `Du är Promotely UF:s AI-expert och marknadsföringsrådgivare.

Du analyserar sociala medier, UF-regler, marknadsföring och entreprenörskap för svenska UF-företag.
Ge konkreta, smarta och handlingsbara förslag.

KRITISK REGEL - EXAKT CITERING FRÅN KUNSKAPSBASEN:
Vid frågor om UF-regler, tävlingskriterier eller bedömningspunkter: citera ALLTID exakt och ordagrant.

${knowledgeContext ? `\nKUNSKAPSBAS:\n${knowledgeContext}` : ''}

TEXTFORMATERING:
- ENDAST ren text
- Numrerade listor: 1) punkt, 2) punkt
- Tydliga avsnitt separerade med tom rad
- Ge KONKRETA exempel och actionable advice
- Svara alltid på svenska`;

    const userPrompt = `${aiProfile ? `## FÖRETAGSPROFIL
Bransch: ${aiProfile.branch || 'Ej specificerad'}
Målgrupp: ${aiProfile.malgrupp || 'Ej specificerad'}
Produkt/Tjänst: ${aiProfile.produkt_beskrivning || 'Ej specificerad'}
Prisnivå: ${aiProfile.prisniva || 'Ej specificerad'}
Marknadsplan: ${aiProfile.marknadsplan || 'Ej specificerad'}
Målsättning: ${aiProfile.malsattning || 'Ej specificerad'}
Tonalitet: ${aiProfile.tonalitet || 'Professionell'}
Stad: ${aiProfile.stad || 'Ej angiven'}
` : '## FÖRETAGSPROFIL\nIngen företagsprofil inlagd.\n'}

${socialStats && socialStats.length > 0 ? `## SOCIALA MEDIER
${socialStats.map(s => `${s.platform}: ${s.followers || 0} följare, ${s.reach || 0} räckvidd, ${s.likes || 0} likes, ${s.comments || 0} kommentarer`).join('\n')}
` : 'Inga sociala medier anslutna.\n'}

${analyticsData && analyticsData.length > 0 ? `## ANALYTICS
${analyticsData.map(a => `${a.platform}: ${a.followers || 0} följare, ${a.engagement || 0}% engagemang`).join('\n')}
` : ''}

Generera en komplett analys i JSON:
{
  "sammanfattning": "Kort sammanfattning (2-3 meningar)",
  "social_medier_analys": "Detaljerad analys med styrkor, svagheter, möjligheter",
  "7_dagars_plan": [{"dag": "Dag 1", "aktivitet": "...", "beskrivning": "...", "plattform": "..."}],
  "uf_tavlingsstrategi": "Strategi för UF-tävlingar",
  "content_forslag": [{"titel": "...", "beskrivning": "...", "plattform": "...", "format": "..."}],
  "rekommendationer": [{"kategori": "...", "prioritet": "...", "titel": "...", "beskrivning": "...", "deadline": "..."}]
}`;

    // AI Council routing
    const aiModel = await routeModel(userPrompt, modelTier, openaiApiKey);
    console.log(`🤖 Analysis using model: ${aiModel} (tier: ${modelTier})`);

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
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
    const aiOutput = JSON.parse(resultText);

    // Save analysis
    await supabase.from('ai_analysis_history').insert({
      user_id: user.id,
      input_data: { aiProfile, socialStats, analytics: analyticsData, plan: userData.plan, tier: modelTier, model_used: aiModel, request_id: requestId },
      ai_output: aiOutput
    });

    return new Response(
      JSON.stringify({ 
        success: true, analysis: aiOutput,
        credits: { before: creditsBefore, cost: estimatedCost, after: creditsBefore - estimatedCost },
        usage: { model: aiModel }, requestId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ai-analysis:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
