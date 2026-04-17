// Cron-driven processor: hittar 'scheduled' inlägg vars scheduled_at <= now
// och triggar publish-tiktok per inlägg. Kör en gång per minut via pg_cron.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const nowIso = new Date().toISOString();

  const { data: due, error } = await admin
    .from("calendar_posts")
    .select("id, platform")
    .eq("publish_status", "scheduled")
    .lte("scheduled_at", nowIso)
    .limit(20);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<{ id: string; ok: boolean; detail?: unknown }> = [];

  for (const p of due ?? []) {
    if (p.platform !== "tiktok") {
      // Markera som failed: andra plattformar stöds inte i denna batch
      await admin
        .from("calendar_posts")
        .update({
          publish_status: "failed",
          publish_error: `Auto-publish stöds bara för TikTok i nuläget (plattform: ${p.platform}).`,
        })
        .eq("id", p.id);
      results.push({ id: p.id, ok: false, detail: "unsupported_platform" });
      continue;
    }

    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/publish-tiktok`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ post_id: p.id }),
        },
      );
      const j = await res.json().catch(() => ({}));
      results.push({ id: p.id, ok: res.ok, detail: j });
    } catch (e) {
      results.push({ id: p.id, ok: false, detail: String(e) });
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
