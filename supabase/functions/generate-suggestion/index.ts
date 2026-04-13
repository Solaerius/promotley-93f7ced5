import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  /ignore\s+the\s+above/i,
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

// AI Council: model pools per tier
const MODEL_POOLS: Record<string, { defaultModel: string; pool: string[] }> = {
  fast: { defaultModel: 'gpt-4o-mini', pool: ['gpt-4o-mini'] },
  standard: { defaultModel: 'gpt-4o', pool: ['gpt-4o', 'gpt-4o-mini'] },
  premium: { defaultModel: 'gpt-4o', pool: ['gpt-4o'] },
};

async function routeModel(message: string, tier: string, apiKey: string): Promise<string> {
  const config = MODEL_POOLS[tier] || MODEL_POOLS.standard;
  if (config.pool.length <= 1) return config.pool[0];

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `Pick the best model for this task from: ${config.pool.join(', ')}. This is a content suggestion generation task. Respond with ONLY the model name.` },
          { role: 'user', content: message.slice(0, 300) }
        ],
        temperature: 0, max_tokens: 50,
      }),
    });
    if (!resp.ok) return config.defaultModel;
    const data = await resp.json();
    const recommended = data.choices?.[0]?.message?.content?.trim();
    if (recommended && config.pool.includes(recommended)) {
      console.log(`🧭 AI Council routed to: ${recommended}`);
      return recommended;
    }
    return config.defaultModel;
  } catch { return config.defaultModel; }
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
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
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

    // Rate limits
    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      _user_id: user.id, _endpoint: 'generate-suggestion'
    });
    if (!rateLimitOk) {
      return new Response(JSON.stringify({ error: 'För många förfrågningar. Vänta en stund.' }), {
        status: 429, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" }
      });
    }

    // User data
    const { data: userData } = await supabase
      .from("users")
      .select("plan, credits_left, company_name, industry, keywords")
      .eq("id", user.id)
      .single();

    if (!userData || userData.credits_left <= 0) {
      return new Response(JSON.stringify({ error: "PAYWALL", message: "Du har inga krediter kvar." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SuggestionRequest = await req.json();
    const { platform, brand, keywords, recentMetrics, model_tier } = body;

    // Validate platform
    if (!platform || !['instagram', 'tiktok', 'facebook'].includes(platform.toLowerCase())) {
      return new Response(JSON.stringify({ error: "Ogiltig plattform" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check injection
    const fieldsToCheck = [brand, ...(keywords || []), recentMetrics].filter(Boolean);
    for (const field of fieldsToCheck) {
      if (checkForInjection(field as string)) {
        return new Response(JSON.stringify({ error: "Ogiltigt innehåll" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch AI profile + knowledge base for context injection
    const { data: aiProfile } = await supabaseAdmin
      .from('ai_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: allKnowledge } = await supabaseAdmin
      .from('ai_knowledge')
      .select('title, content, category');

    const knowledgeContext = allKnowledge && allKnowledge.length > 0
      ? allKnowledge.map(k => `[${k.category}] ${k.title}: ${k.content}`).join('\n\n')
      : '';

    const profileContext = aiProfile ? `
Företagsprofil:
- Företagsnamn: ${aiProfile.foretagsnamn || userData.company_name || 'Ej angivet'}
- Bransch: ${aiProfile.branch || userData.industry || 'Ej angiven'}
- Målgrupp: ${aiProfile.malgrupp || 'Ej angiven'}
- Produkt: ${aiProfile.produkt_beskrivning || 'Ej angiven'}
- Tonalitet: ${aiProfile.tonalitet || 'Professionell'}
- Målsättning: ${aiProfile.malsattning || 'Ej angiven'}
- Nyckelord: ${aiProfile.nyckelord?.join(', ') || 'Inga'}` : '';

    const companyName = brand || aiProfile?.foretagsnamn || userData.company_name || "företaget";
    const industry = aiProfile?.branch || userData.industry || "din bransch";
    const keywordsList = keywords || aiProfile?.nyckelord || userData.keywords || [];

    const systemPrompt = `Du är en svensk social media-strateg som hjälper UF-företag. Svara ENDAST i JSON med följande struktur:
{
  "idea": "En konkret innehållsidé (ren text)",
  "caption": "Färdig caption i ren text (INGA emojis, INGEN Markdown)",
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "best_time": "Bästa posttid (ex: Torsdag 18:00)"
}

${profileContext}

${knowledgeContext ? `KUNSKAPSBAS:\n${knowledgeContext}` : ''}

KRITISKT: Caption-fältet får ENDAST innehålla ren text. Svara ALLTID på svenska.`;

    const userPrompt = `Företag: ${companyName}
Bransch: ${industry}
Nyckelord: ${keywordsList.join(", ")}
Plattform: ${platform}
Senaste data: ${recentMetrics || "inga tidigare metrics"}

Ge 1 konkret idé för ett ${platform}-inlägg med engagerande idé, färdig caption, 8 hashtags och bästa posttid.`;

    // AI Council routing
    const tier = model_tier || 'standard';
    const aiModel = await routeModel(userPrompt, tier, openaiApiKey);
    console.log(`🤖 Using model: ${aiModel} (tier: ${tier})`);

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI API-fel" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message?.content || "{}";
    
    let suggestion;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestion = JSON.parse(cleaned);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { suggestion = JSON.parse(jsonMatch[0]); } catch { suggestion = null; }
      }
      if (!suggestion) {
        return new Response(JSON.stringify({ error: "Kunde inte tolka AI-svar" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Save suggestion
    await supabase.from("suggestions").insert({
      user_id: user.id, platform,
      idea: suggestion.idea || "", caption: suggestion.caption || "",
      hashtags: suggestion.hashtags || [], best_time: suggestion.best_time || "",
      credits_spent: 1,
    });

    // Deduct credits
    await supabase.from("users").update({ credits_left: userData.credits_left - 1 }).eq("id", user.id);

    return new Response(JSON.stringify(suggestion), {
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
