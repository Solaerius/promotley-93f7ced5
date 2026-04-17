import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { routeAIRequest, logRouting } from "../_shared/ai-router.ts";
import { buildSkillsPrompt } from "../_shared/ai-skills/index.ts";
import { callAI, usdToCredits } from "../_shared/ai-providers.ts";
import { logCreditTransaction } from "../_shared/credit-tracking.ts";

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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const hasAnthropicKey = !!Deno.env.get('ANTHROPIC_API_KEY');

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

    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id, _endpoint: 'sales-radar'
    });
    if (rateLimitOk === false) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Vänta en stund.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => ({}));
    const modelTier = (body.model_tier as 'fast' | 'standard' | 'premium') || 'standard';

    const { data: userData, error: userError } = await supabase
      .from('users').select('plan, credits_left, active_organization_id').eq('id', user.id).single();
    if (userError) {
      return new Response(JSON.stringify({ error: 'Could not fetch user data' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PLAN-GATING: Säljradar kräver Growth eller Max
    if (!['growth', 'max', 'unlimited'].includes(userData.plan)) {
      return new Response(JSON.stringify({
        error: 'PLAN_REQUIRED',
        message: 'Säljradar kräver Growth-plan eller högre',
        required_plan: 'growth'
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (userData.credits_left < 1) {
      return new Response(JSON.stringify({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Fyll på krediter för att använda Säljradarn',
        credits_available: userData.credits_left
      }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Hämta profil från ai_profiles + organization_profiles
    const { data: aiProfile } = await supabase
      .from('ai_profiles').select('*').eq('user_id', user.id).maybeSingle();

    let orgProfile: any = null;
    if (userData.active_organization_id) {
      const { data } = await supabase
        .from('organization_profiles').select('*')
        .eq('organization_id', userData.active_organization_id).maybeSingle();
      orgProfile = data;
    }

    const { data: socialStats } = await supabase.from('social_stats').select('*').eq('user_id', user.id);
    const { data: analytics } = await supabase.from('analytics').select('*').eq('user_id', user.id);
    const { data: allKnowledge } = await supabase.from('ai_knowledge').select('title, content, category');

    const knowledgeContext = allKnowledge && allKnowledge.length > 0
      ? allKnowledge.map(k => `[${k.category}] ${k.title}: ${k.content}`).join('\n\n')
      : '';

    const userCity = aiProfile?.stad || orgProfile?.city || '';
    const userLan = aiProfile?.lan || '';
    const hasLocation = !!(userCity || userLan);

    // SMART AI ROUTER
    const route = await routeAIRequest({
      functionName: 'sales-radar',
      taskType: 'sales-radar',
      userMessage: `Säljradar för ${aiProfile?.branch || orgProfile?.industry || 'företag'}, ort: ${userCity}`,
      tier: modelTier,
      hasProfile: !!(aiProfile || orgProfile),
      contextSize: 'large',
    }, openaiApiKey, hasAnthropicKey);

    const skillsPrompt = buildSkillsPrompt(route.skills);

    const systemPrompt = `Du är Promotleys Säljradar-AI. Du hjälper svenska UF-företag och startups hitta konkreta affärsmöjligheter.

${skillsPrompt}

Du genererar:
1. LEADS - Potentiella kunder, samarbetspartners och målgrupper
2. TRENDER - Aktuella trender i branschen
${hasLocation ? `3. LOKALA MÖJLIGHETER - Platsbaserade events i eller nära ${userCity}` : ''}

${hasLocation ? `VIKTIGT: Inkludera minst 2 leads kopplade till ${userCity || userLan}.` : ''}

KUNSKAPSBAS:
${knowledgeContext}

Svara ENDAST i giltig JSON:
{
  "leads": [{ "typ": "kund|samarbete|event|kanal", "titel": "...", "beskrivning": "...", "action": "...", "prioritet": "hög|medel|låg", "potential": "...", "plats": "Stad eller null" }],
  "trends": [{ "typ": "hashtag|format|ämne|event|säsong", "titel": "...", "beskrivning": "...", "tips": "...", "plattform": "instagram|tiktok|alla", "aktualitet": "nu|denna_vecka|denna_månad" }],
  "sammanfattning": "2-3 meningar"
}

Ge 4-6 leads och 4-6 trender. Skriv på svenska.`;

    const userPrompt = `## FÖRETAGSPROFIL
Företagsnamn: ${aiProfile?.foretagsnamn || 'Ej angivet'}
Bransch: ${aiProfile?.branch || orgProfile?.industry || 'Ej specificerad'}
Målgrupp: ${aiProfile?.malgrupp || orgProfile?.target_audience || 'Ej specificerad'}
Produkt/Tjänst: ${aiProfile?.produkt_beskrivning || 'Ej specificerad'}
Stad: ${userCity}
Län: ${userLan}
Prisnivå: ${aiProfile?.prisniva || orgProfile?.price_level || 'Ej specificerad'}
Målsättning: ${aiProfile?.malsattning || orgProfile?.goals || 'Ej specificerad'}
Tonalitet: ${aiProfile?.tonalitet || orgProfile?.tone || 'Professionell'}
Nyckelord: ${(aiProfile?.nyckelord || orgProfile?.keywords || []).join(', ')}

${socialStats && socialStats.length > 0 ? `## SOCIALA MEDIER
${socialStats.map(s => `${s.platform}: ${s.followers || 0} följare, ${s.likes || 0} likes`).join('\n')}
` : ''}

${analytics && analytics.length > 0 ? `## ANALYTICS
${analytics.map(a => `${a.platform}: ${a.followers || 0} följare, ${a.engagement || 0}% engagemang`).join('\n')}
` : ''}

Generera leads och trender baserat på ovanstående.`;

    const aiResult = await callAI({
      modelId: route.model,
      systemPrompt,
      userPrompt,
      temperature: 0.5,
      maxTokens: 2500,
      jsonMode: route.modelInfo.provider === 'openai',
    });

    let result;
    try {
      const cleaned = aiResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (!result) throw new Error('Kunde inte tolka AI-svar');
    }

    // Dynamiska krediter
    const credits = await usdToCredits(supabase, aiResult.usage.costUsd);

    if (userData.credits_left < credits) {
      return new Response(JSON.stringify({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Otillräckliga krediter för denna analys',
        credits_needed: credits, credits_available: userData.credits_left
      }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await supabase.from('users')
      .update({ credits_left: userData.credits_left - credits })
      .eq('id', user.id);

    await supabase.from('sales_radar_results').insert({
      user_id: user.id,
      organization_id: userData.active_organization_id,
      radar_type: 'full',
      leads: result.leads || [],
      trends: result.trends || [],
      input_context: { plan: userData.plan, model: route.model, tier: modelTier, skills: route.skills }
    });

    await logCreditTransaction(supabase, {
      userId: user.id,
      functionName: 'sales-radar',
      creditsUsed: credits,
      costUsd: aiResult.usage.costUsd,
      model: route.model,
      organizationId: userData.active_organization_id,
      metadata: { tier: modelTier, skills: route.skills },
    });

    await logRouting(supabase, {
      userId: user.id,
      functionName: 'sales-radar',
      selectedModel: route.model,
      skills: route.skills,
      reasoning: route.reasoning,
      actualCredits: credits,
    });

    return new Response(
      JSON.stringify({ success: true, data: result, credits_used: credits, _meta: { model: route.model } }),
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
