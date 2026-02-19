import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Ej autentiserad" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Ogiltig session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.trim().length === 0 || code.trim().length > 50) {
      return new Response(JSON.stringify({ error: "Ingen kod angiven" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use service role to call the atomic RPC function
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await serviceSupabase.rpc("redeem_promotion", {
      _user_id: user.id,
      _code: code.trim(),
    });

    if (error) {
      console.error("RPC error:", error);
      return new Response(JSON.stringify({ error: "Internt fel" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (data?.error) {
      return new Response(JSON.stringify({ error: data.error }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ success: true, credits_given: data.credits_given }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Redeem promotion error:", err);
    return new Response(
      JSON.stringify({ error: "Internt fel" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
