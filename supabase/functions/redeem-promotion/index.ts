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
    if (!code) {
      return new Response(JSON.stringify({ error: "Ingen kod angiven" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use service role for DB operations
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find promotion
    const { data: promo, error: promoError } = await serviceSupabase
      .from("promotion_links")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (promoError || !promo) {
      return new Response(JSON.stringify({ error: "Ogiltig kod" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!promo.is_active) {
      return new Response(JSON.stringify({ error: "Denna kod är inte längre aktiv" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return new Response(JSON.stringify({ error: "Koden har redan använts maximalt antal gånger" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Koden har gått ut" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check if already redeemed
    const { data: existing } = await serviceSupabase
      .from("promotion_redemptions")
      .select("id")
      .eq("promotion_id", promo.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Du har redan använt denna kod" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Redeem: add credits
    const { error: creditError } = await serviceSupabase.rpc("", {}).catch(() => null) as any;
    
    // Update user credits
    const { data: userData } = await serviceSupabase
      .from("users")
      .select("credits_left")
      .eq("id", user.id)
      .single();

    await serviceSupabase
      .from("users")
      .update({ credits_left: (userData?.credits_left || 0) + promo.credits_amount })
      .eq("id", user.id);

    // Record redemption
    await serviceSupabase.from("promotion_redemptions").insert({
      promotion_id: promo.id,
      user_id: user.id,
    });

    // Increment uses
    await serviceSupabase
      .from("promotion_links")
      .update({ current_uses: promo.current_uses + 1 })
      .eq("id", promo.id);

    return new Response(
      JSON.stringify({ success: true, credits_given: promo.credits_amount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internt fel" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
