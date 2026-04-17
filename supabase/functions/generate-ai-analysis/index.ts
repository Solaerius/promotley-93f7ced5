import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { routeAIRequest, logRouting } from '../_shared/ai-router.ts';
import { callAI, usdToCredits } from '../_shared/ai-providers.ts';
import { buildSkillsPrompt } from '../_shared/ai-skills/index.ts';
import { logCreditTransaction } from '../_shared/credit-tracking.ts';

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
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

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
    const modelTier = (body.model_tier || 'standard') as 'fast' | 'standard' | 'premium';

    // Plan check — analysis kräver Starter eller högre
    const { data: userData, error: userError } = await supabase
      .from('users').select('plan, credits_left, max_credits, renewal_date, active_organization_id').eq('id', user.id).single();
    if (userError) {
      return new Response(JSON.stringify({ error: 'Could not fetch user plan' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (userData.plan === 'free_trial' || userData.plan === 'free') {
      return new Response(JSON.stringify({
        error: 'PLAN_REQUIRED',
        message: 'AI-analys kräver Starter-plan eller högre',
        required_plan: 'starter',
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Pre-check minimum credits (we'll bill exact after)
    if (userData.credits_left < 1) {
      return new Response(JSON.stringify({
        error: 'INSUFFICIENT_CREDITS', message: 'Fyll på krediter för att fortsätta',
      }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch all context
    const { data: aiProfile } = await supabase.from('ai_profiles').select('*').eq('user_id', user.id).maybeSingle();
    const { data: orgProfile } = userData.active_organization_id
      ? await supabase.from('organization_profiles').select('*').eq('organization_id', userData.active_organization_id).maybeSingle()
      : { data: null };
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

    // === Smart routing ===
    const routing = await routeAIRequest({
      functionName: 'generate-ai-analysis',
      taskType: 'analysis',
      tier: modelTier,
      hasProfile: !!aiProfile,
      contextSize: 'large',
    }, openaiApiKey, !!anthropicApiKey);

    const skillsBlock = buildSkillsPrompt(routing.skills);

    const systemPrompt = `Du är Promotley UF:s AI-expert och marknadsföringsrådgivare.

Du analyserar sociala medier, UF-regler, marknadsföring och entreprenörskap för svenska UF-företag.
Ge konkreta, smarta och handlingsbara förslag.

KRITISK REGEL — EXAKT CITERING FRÅN KUNSKAPSBASEN:
Vid frågor om UF-regler, tävlingskriterier eller bedömningspunkter: citera ALLTID exakt och ordagrant.

${skillsBlock}

${knowledgeContext ? `\nKUNSKAPSBAS:\n${knowledgeContext}` : ''}

TEXTFORMATERING:
- ENDAST ren text
- Numrerade listor: 1) punkt, 2) punkt
- Tydliga avsnitt separerade med tom rad
- Ge KONKRETA exempel och actionable advice
- Svara alltid på svenska`;

    const profileContext = orgProfile ? `## FÖRETAGSPROFIL (organisation)
Bransch: ${orgProfile.industry || 'Ej specificerad'}
Målgrupp: ${orgProfile.target_audience || 'Ej specificerad'}
Prisnivå: ${orgProfile.price_level || 'Ej specificerad'}
Mål: ${orgProfile.goals || 'Ej specificerad'}
Tonalitet: ${orgProfile.tone || 'Professionell'}
Stad: ${orgProfile.city || 'Ej angiven'}
Unika egenskaper: ${orgProfile.unique_properties || '—'}
` : aiProfile ? `## FÖRETAGSPROFIL
Bransch: ${aiProfile.branch || 'Ej specificerad'}
Målgrupp: ${aiProfile.malgrupp || 'Ej specificerad'}
Produkt/Tjänst: ${aiProfile.produkt_beskrivning || 'Ej specificerad'}
Prisnivå: ${aiProfile.prisniva || 'Ej specificerad'}
Marknadsplan: ${aiProfile.marknadsplan || 'Ej specificerad'}
Målsättning: ${aiProfile.malsattning || 'Ej specificerad'}
Tonalitet: ${aiProfile.tonalitet || 'Professionell'}
Stad: ${aiProfile.stad || 'Ej angiven'}
` : '## FÖRETAGSPROFIL\nIngen företagsprofil inlagd.\n';

    const userPrompt = `${profileContext}

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

    console.log(`🤖 Analysis using model: ${routing.model} (tier: ${modelTier}), skills: ${routing.skills.join(', ')}`);

    const aiResult = await callAI({
      modelId: routing.model,
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      jsonMode: true,
    });

    let resultText = aiResult.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiOutput = JSON.parse(resultText);

    // Dynamic credit cost
    const credits = await usdToCredits(supabase, aiResult.usage.costUsd);
    const creditsBefore = userData.credits_left;
    await supabase.from('users').update({ credits_left: Math.max(0, creditsBefore - credits) }).eq('id', user.id);

    await logCreditTransaction(supabase, {
      userId: user.id,
      functionName: 'generate-ai-analysis',
      creditsUsed: credits,
      costUsd: aiResult.usage.costUsd,
      model: routing.model,
      organizationId: userData.active_organization_id,
      metadata: { request_id: requestId, tier: modelTier, skills: routing.skills },
    });

    await logRouting(supabase, {
      userId: user.id,
      functionName: 'generate-ai-analysis',
      selectedModel: routing.model,
      skills: routing.skills,
      reasoning: routing.reasoning,
      actualCredits: credits,
    });

    // Save analysis
    await supabase.from('ai_analysis_history').insert({
      user_id: user.id,
      organization_id: userData.active_organization_id,
      input_data: { aiProfile, orgProfile, socialStats, analytics: analyticsData, plan: userData.plan, tier: modelTier, model_used: routing.model, request_id: requestId },
      ai_output: aiOutput
    });

    return new Response(
      JSON.stringify({
        success: true, analysis: aiOutput,
        credits: { before: creditsBefore, cost: credits, after: creditsBefore - credits },
        usage: { model: routing.model, costUsd: aiResult.usage.costUsd, reasoning: routing.reasoning },
        requestId,
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
