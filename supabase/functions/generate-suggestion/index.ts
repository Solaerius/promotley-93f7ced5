import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { routeAIRequest, logRouting } from "../_shared/ai-router.ts";
import { buildSkillsPrompt } from "../_shared/ai-skills/index.ts";
import { callAI, usdToCredits } from "../_shared/ai-providers.ts";
import { logCreditTransaction } from "../_shared/credit-tracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(all\s+)?previous/i,
  /new\s+instructions?:\s*/i,
  /system\s*:\s*/i,
  /you\s+are\s+now\s+a/i,
  /pretend\s+you\s+are/i,
  /jailbreak/i,
  /bypass\s+(your\s+)?restrictions?/i,
];

function checkForInjection(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

interface SuggestionRequest {
  platform: string;
  brand?: string;
  keywords?: string[];
  recentMetrics?: string;
  model_tier?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const hasAnthropicKey = !!Deno.env.get('ANTHROPIC_API_KEY');

    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 503, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Ingen autentisering" }), {
        status: 401, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Ogiltig användare" }), {
        status: 401, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user.email_confirmed_at) {
      return new Response(JSON.stringify({ error: 'email_not_verified', message: 'Verifiera din e-post först' }), {
        status: 403, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" }
      });
    }

    // Rate limit
    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      _user_id: user.id, _endpoint: 'generate-suggestion'
    });
    if (!rateLimitOk) {
      return new Response(JSON.stringify({ error: 'För många förfrågningar. Vänta en stund.' }), {
        status: 429, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("plan, credits_left, company_name, industry, keywords, active_organization_id")
      .eq("id", user.id)
      .single();

    if (!userData || userData.credits_left <= 0) {
      return new Response(JSON.stringify({ error: "PAYWALL", message: "Du har inga krediter kvar." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SuggestionRequest = await req.json();
    const { platform, brand, keywords, recentMetrics, model_tier } = body;

    if (!platform || !['instagram', 'tiktok', 'facebook'].includes(platform.toLowerCase())) {
      return new Response(JSON.stringify({ error: "Ogiltig plattform" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fieldsToCheck = [brand, ...(keywords || []), recentMetrics].filter(Boolean);
    for (const field of fieldsToCheck) {
      if (checkForInjection(field as string)) {
        return new Response(JSON.stringify({ error: "Ogiltigt innehåll" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Hämta AI-profil + organization-profil för rikare kontext
    const { data: aiProfile } = await supabaseAdmin
      .from('ai_profiles').select('*').eq('user_id', user.id).maybeSingle();

    let orgProfile: any = null;
    if (userData.active_organization_id) {
      const { data } = await supabaseAdmin
        .from('organization_profiles').select('*')
        .eq('organization_id', userData.active_organization_id).maybeSingle();
      orgProfile = data;
    }

    const { data: allKnowledge } = await supabaseAdmin
      .from('ai_knowledge').select('title, content, category');

    const knowledgeContext = allKnowledge && allKnowledge.length > 0
      ? allKnowledge.map(k => `[${k.category}] ${k.title}: ${k.content}`).join('\n\n')
      : '';

    // SMART AI ROUTER
    const tier = (model_tier as 'fast' | 'standard' | 'premium') || 'standard';
    const route = await routeAIRequest({
      functionName: 'generate-suggestion',
      taskType: 'suggestion',
      userMessage: `Plattform: ${platform}, bransch: ${aiProfile?.branch || userData.industry || ''}`,
      tier,
      hasProfile: !!aiProfile,
      contextSize: knowledgeContext.length > 5000 ? 'large' : 'medium',
    }, openaiApiKey, hasAnthropicKey);

    const skillsPrompt = buildSkillsPrompt(route.skills);

    const companyName = brand || aiProfile?.foretagsnamn || orgProfile?.industry || userData.company_name || "företaget";
    const industry = aiProfile?.branch || orgProfile?.industry || userData.industry || "din bransch";
    const keywordsList = keywords || aiProfile?.nyckelord || orgProfile?.keywords || userData.keywords || [];
    const targetAudience = aiProfile?.malgrupp || orgProfile?.target_audience || '';
    const tone = aiProfile?.tonalitet || orgProfile?.tone || 'Professionell';

    const systemPrompt = `Du är en svensk social media-strateg som hjälper UF-företag.

${skillsPrompt}

KUNSKAPSBAS:
${knowledgeContext}

Svara ENDAST i giltig JSON med denna struktur:
{
  "idea": "Konkret innehållsidé (ren text)",
  "caption": "Färdig caption på svenska (ren text, inga emojis, inga markdown)",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "best_time": "Bästa posttid (ex: Torsdag 18:00)"
}`;

    const userPrompt = `Företag: ${companyName}
Bransch: ${industry}
Målgrupp: ${targetAudience}
Tonalitet: ${tone}
Nyckelord: ${keywordsList.join(", ")}
Plattform: ${platform}
Senaste data: ${recentMetrics || "inga tidigare metrics"}

Ge 1 konkret idé för ett ${platform}-inlägg med engagerande idé, färdig caption, 8 hashtags och bästa posttid.`;

    const aiResult = await callAI({
      modelId: route.model,
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 700,
      jsonMode: true,
    });

    let suggestion;
    try {
      const cleaned = aiResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestion = JSON.parse(cleaned);
    } catch {
      const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { suggestion = JSON.parse(jsonMatch[0]); } catch { suggestion = null; }
      }
      if (!suggestion) {
        return new Response(JSON.stringify({ error: "Kunde inte tolka AI-svar" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Beräkna krediter dynamiskt utifrån verklig USD-kostnad
    const credits = await usdToCredits(supabaseAdmin, aiResult.usage.costUsd);

    // Spara suggestion + dra krediter
    await supabase.from("suggestions").insert({
      user_id: user.id, platform,
      organization_id: userData.active_organization_id,
      idea: suggestion.idea || "",
      caption: suggestion.caption || "",
      hashtags: suggestion.hashtags || [],
      best_time: suggestion.best_time || "",
      credits_spent: credits,
    });

    await supabase.from("users")
      .update({ credits_left: userData.credits_left - credits })
      .eq("id", user.id);

    // Logga transaktion + routning
    await logCreditTransaction(supabaseAdmin, {
      userId: user.id,
      functionName: 'generate-suggestion',
      creditsUsed: credits,
      costUsd: aiResult.usage.costUsd,
      model: route.model,
      organizationId: userData.active_organization_id,
      metadata: { platform, tier, skills: route.skills },
    });

    await logRouting(supabaseAdmin, {
      userId: user.id,
      functionName: 'generate-suggestion',
      selectedModel: route.model,
      skills: route.skills,
      reasoning: route.reasoning,
      actualCredits: credits,
    });

    return new Response(JSON.stringify({ ...suggestion, _meta: { model: route.model, credits } }), {
      headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Okänt fel" }),
      { status: 500, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
    );
  }
});
