// Publicerar ett calendar_post till TikTok via Content Posting API.
// Gated av TIKTOK_HAS_CONTENT_POSTING_API. Kräver giltig TikTok-token i public.tokens.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PublishBody {
  post_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const HAS_API = (Deno.env.get("TIKTOK_HAS_CONTENT_POSTING_API") || "")
    .toLowerCase() === "true";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  let body: PublishBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  if (!body.post_id) return json({ error: "post_id_required" }, 400);

  // Hämta inlägget
  const { data: post, error: postErr } = await admin
    .from("calendar_posts")
    .select("*")
    .eq("id", body.post_id)
    .maybeSingle();

  if (postErr || !post) return json({ error: "post_not_found" }, 404);

  if (post.platform !== "tiktok") {
    return json({ error: "wrong_platform" }, 400);
  }
  if (!post.media_url || post.media_type !== "video") {
    return json({ error: "video_required" }, 400);
  }

  if (!HAS_API) {
    // Markera som failed med tydligt meddelande – funktionen är inte aktiverad
    await admin
      .from("calendar_posts")
      .update({
        publish_status: "failed",
        publish_error:
          "TikTok Content Posting API är inte aktiverat (TIKTOK_HAS_CONTENT_POSTING_API=false).",
      })
      .eq("id", post.id);
    return json({ error: "content_posting_api_disabled" }, 403);
  }

  // Hämta TikTok-token för användaren
  const { data: token } = await admin
    .from("tokens")
    .select("access_token_enc, expires_at")
    .eq("user_id", post.user_id)
    .eq("provider", "tiktok")
    .maybeSingle();

  if (!token?.access_token_enc) {
    await admin
      .from("calendar_posts")
      .update({
        publish_status: "failed",
        publish_error: "Inget TikTok-konto anslutet.",
      })
      .eq("id", post.id);
    return json({ error: "no_tiktok_token" }, 400);
  }

  // Generera signed URL för media (privat bucket)
  const { data: signed, error: signErr } = await admin.storage
    .from("post-media")
    .createSignedUrl(post.media_url, 3600);

  if (signErr || !signed?.signedUrl) {
    await admin
      .from("calendar_posts")
      .update({
        publish_status: "failed",
        publish_error: "Kunde inte signera mediafil.",
      })
      .eq("id", post.id);
    return json({ error: "media_sign_failed" }, 500);
  }

  // PULL_FROM_URL-flödet kräver att domänen är verifierad hos TikTok
  // för Content Posting API. Om inte verifierad – misslyckas.
  try {
    const initRes = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.access_token_enc}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_info: {
            title: post.title?.slice(0, 150) || "",
            description: (post.description || "").slice(0, 2200),
            privacy_level: "SELF_ONLY",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: signed.signedUrl,
          },
        }),
      },
    );

    const initJson = await initRes.json();
    if (!initRes.ok || initJson.error?.code !== "ok") {
      const msg = initJson.error?.message || `HTTP ${initRes.status}`;
      await admin
        .from("calendar_posts")
        .update({
          publish_status: "failed",
          publish_error: `TikTok init: ${msg}`,
        })
        .eq("id", post.id);
      return json({ error: "tiktok_init_failed", detail: initJson }, 502);
    }

    await admin
      .from("calendar_posts")
      .update({
        publish_status: "published",
        published_at: new Date().toISOString(),
        publish_error: null,
      })
      .eq("id", post.id);

    return json({ success: true, publish_id: initJson.data?.publish_id });
  } catch (e) {
    await admin
      .from("calendar_posts")
      .update({
        publish_status: "failed",
        publish_error: String((e as Error).message || e),
      })
      .eq("id", post.id);
    return json({ error: "exception", detail: String(e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
