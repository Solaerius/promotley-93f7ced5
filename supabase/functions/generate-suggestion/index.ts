import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

// Patterns that may indicate prompt injection attempts
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

// Check for prompt injection in user-provided content
function checkForInjection(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

interface SuggestionRequest {
  platform: string;
  brand?: string;
  keywords?: string[];
  recentMetrics?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
  }

  try {
    // Capture client information for security logging
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Hämta användare från JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      await supabaseAdmin.rpc('log_security_event', {
        _user_id: null,
        _event_type: 'unauthorized_ai_request',
        _event_details: { error: 'Missing auth header' },
        _ip_address: clientIp,
        _user_agent: userAgent,
      });
      return new Response(JSON.stringify({ error: "Ingen autentisering" }), {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await supabaseAdmin.rpc('log_security_event', {
        _user_id: null,
        _event_type: 'unauthorized_ai_request',
        _event_details: { error: 'Invalid auth token' },
        _ip_address: clientIp,
        _user_agent: userAgent,
      });
      return new Response(JSON.stringify({ error: "Ogiltig användare" }), {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limits
    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'generate-suggestion'
    });

    if (!rateLimitOk) {
      console.log('Rate limit exceeded for user:', user.id);
      
      // Log rate limit exceeded event with IP and user agent
      await supabaseAdmin.rpc('log_security_event', {
        _user_id: user.id,
        _event_type: 'rate_limit_exceeded',
        _event_details: {
          endpoint: 'generate-suggestion',
          timestamp: new Date().toISOString()
        },
        _ip_address: clientIp,
        _user_agent: userAgent
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'För många förfrågningar. Vänta en stund innan du försöker igen.' 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Hämta användarens plan och krediter
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("plan, credits_left, trial_used, company_name, industry, keywords")
      .eq("id", user.id)
      .single();

    if (fetchError || !userData) {
      console.error("Fetch user error:", fetchError);
      return new Response(JSON.stringify({ error: "Kunde inte hämta användardata" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kolla krediter - alla planer har nu krediter
    if (userData.credits_left <= 0) {
      return new Response(
        JSON.stringify({
          error: "PAYWALL",
          message: "Du har inga krediter kvar. Uppgradera din plan eller vänta till nästa månad!",
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: SuggestionRequest = await req.json();
    const { platform, brand, keywords, recentMetrics } = body;

    // Server-side input validation
    if (!platform || typeof platform !== 'string') {
      return new Response(
        JSON.stringify({ error: "Platform är obligatorisk" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validPlatforms = ['instagram', 'tiktok', 'facebook'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Ogiltig plattform. Välj instagram, tiktok eller facebook" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate optional fields
    if (brand && (typeof brand !== 'string' || brand.length > 100)) {
      return new Response(
        JSON.stringify({ error: "Varumärket får vara max 100 tecken" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (keywords && Array.isArray(keywords) && keywords.join(', ').length > 500) {
      return new Response(
        JSON.stringify({ error: "Nyckelord får vara max 500 tecken totalt" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for prompt injection in user-provided fields
    const fieldsToCheck = [brand, ...(keywords || []), recentMetrics].filter(Boolean);
    for (const field of fieldsToCheck) {
      if (checkForInjection(field as string)) {
        console.warn('⚠️ Potential prompt injection in generate-suggestion:', field);
        await supabaseAdmin.rpc('log_security_event', {
          _user_id: user.id,
          _event_type: 'prompt_injection_attempt',
          _event_details: { endpoint: 'generate-suggestion', field_preview: String(field).slice(0, 50) },
          _ip_address: clientIp,
          _user_agent: userAgent,
        });
        return new Response(
          JSON.stringify({ error: "Ogiltigt innehåll i förfrågan" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Bygg prompt
    const companyName = brand || userData.company_name || "företaget";
    const industry = userData.industry || "din bransch";
    const keywordsList = keywords || userData.keywords || [];
    const metricsInfo = recentMetrics || "inga tidigare metrics";

    const systemPrompt = `Du är en svensk social media-strateg som hjälper UF-företag. Svara ENDAST i JSON med följande struktur:
{
  "idea": "En konkret innehållsidé (ren text utan emojis eller Markdown)",
  "caption": "Färdig caption i ren text (INGA emojis, INGEN Markdown, INGA specialtecken)",
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "best_time": "Bästa posttid (ex: Torsdag 18:00)"
}

KRITISKT: Caption-fältet får ENDAST innehålla ren text. FÖRBJUDET: emojis, stjärnor, understreck, hashtag-rubriker, backticks, större-än-tecken, bindestreck, punkt-listor, HTML, Markdown.`;

    const userPrompt = `
Företag: ${companyName}
Bransch: ${industry}
Nyckelord: ${keywordsList.join(", ")}
Plattform: ${platform}
Senaste data: ${metricsInfo}

Ge 1 konkret idé för ett ${platform}-inlägg, inklusive:
- En engagerande idé som passar målgruppen (ren text)
- En färdig caption i REN TEXT med call-to-action (INGA emojis, INGEN Markdown)
- 8 relevanta hashtags
- Förslag på bästa posttid baserat på målgruppen

VIKTIGT: Caption ska vara professionell men ungdomlig text, perfekt för UF-företag, men UTAN emojis eller specialtecken.`;

    console.log("Anropar OpenAI med:", { platform, companyName, industry });

    // Anropa OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI error:", errorText);
      return new Response(JSON.stringify({ error: "OpenAI API-fel" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0].message?.content || "{}";
    
    let suggestion;
    try {
      suggestion = JSON.parse(content);
    } catch (e) {
      console.error("JSON parse error:", e, content);
      return new Response(JSON.stringify({ error: "Kunde inte tolka AI-svar" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Spara förslaget i databasen
    const { error: insertError } = await supabase.from("suggestions").insert({
      user_id: user.id,
      platform,
      idea: suggestion.idea || "",
      caption: suggestion.caption || "",
      hashtags: suggestion.hashtags || [],
      best_time: suggestion.best_time || "",
      credits_spent: 1,
    });

    if (insertError) {
      console.error("Insert suggestion error:", insertError);
    }

    // Uppdatera krediter
    await supabase
      .from("users")
      .update({ credits_left: userData.credits_left - 1 })
      .eq("id", user.id);

    console.log("Förslag genererat och sparat:", suggestion);

    // Log successful AI suggestion generation
    await supabaseAdmin.rpc('log_security_event', {
      _user_id: user.id,
      _event_type: 'ai_suggestion_generated',
      _event_details: {
        platform,
        timestamp: new Date().toISOString()
      },
      _ip_address: clientIp,
      _user_agent: userAgent
    });

    return new Response(JSON.stringify(suggestion), {
      headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("General error:", error);
    
    // Log security event for AI generation errors
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabaseAdmin.rpc('log_security_event', {
        _user_id: null,
        _event_type: 'ai_generation_failed',
        _event_details: { error: error instanceof Error ? error.message : 'Unknown error' },
        _ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        _user_agent: req.headers.get('user-agent') || 'unknown',
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Okänt fel" }),
      {
        status: 500,
        headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
