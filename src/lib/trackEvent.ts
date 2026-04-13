import { supabase } from "@/integrations/supabase/client";

/**
 * Track a user event for analytics.
 * Fire-and-forget — never blocks UI.
 */
export const trackEvent = async (
  eventName: string,
  metadata: Record<string, unknown> = {}
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from("analytics_events") as any).insert({
      user_id: user.id,
      event_name: eventName,
      metadata,
    });
  } catch (err) {
    // Silent fail — analytics should never break the app
    console.debug("trackEvent error:", err);
  }
};
