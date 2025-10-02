import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestionRequest {
  platform: string;
  brand?: string;
  keywords?: string[];
  recentMetrics?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Hämta användare från JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Ingen autentisering" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      return new Response(JSON.stringify({ error: "Ogiltig användare" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // Kolla krediter - freemium logik
    if (userData.plan === "free_trial" && userData.trial_used) {
      return new Response(
        JSON.stringify({
          error: "PAYWALL",
          message: "Du har använt ditt gratis AI-förslag. Uppgradera till Pro för fler!",
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (userData.plan !== "pro_unlimited" && userData.credits_left <= 0) {
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

    // Parse request body
    const body: SuggestionRequest = await req.json();
    const { platform, brand, keywords, recentMetrics } = body;

    // Bygg prompt
    const companyName = brand || userData.company_name || "företaget";
    const industry = userData.industry || "din bransch";
    const keywordsList = keywords || userData.keywords || [];
    const metricsInfo = recentMetrics || "inga tidigare metrics";

    const systemPrompt = `Du är en svensk social media-strateg som hjälper UF-företag. Svara ENDAST i JSON med följande struktur:
{
  "idea": "En konkret innehållsidé",
  "caption": "Färdig caption med emojis",
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "best_time": "Bästa posttid (ex: Torsdag 18:00)"
}`;

    const userPrompt = `
Företag: ${companyName}
Bransch: ${industry}
Nyckelord: ${keywordsList.join(", ")}
Plattform: ${platform}
Senaste data: ${metricsInfo}

Ge 1 konkret idé för ett ${platform}-inlägg, inklusive:
- En engagerande idé som passar målgruppen
- En färdig caption med emojis och call-to-action
- 8 relevanta hashtags
- Förslag på bästa posttid baserat på målgruppen

Håll tonen professionell men ungdomlig, perfekt för UF-företag.`;

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
    if (userData.plan === "free_trial") {
      // Markera trial som använd
      await supabase.from("users").update({ trial_used: true }).eq("id", user.id);
    } else if (userData.plan !== "pro_unlimited") {
      // Dra en kredit
      await supabase
        .from("users")
        .update({ credits_left: userData.credits_left - 1 })
        .eq("id", user.id);
    }

    console.log("Förslag genererat och sparat:", suggestion);

    return new Response(JSON.stringify(suggestion), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("General error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Okänt fel" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
