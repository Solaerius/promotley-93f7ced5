import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FreeTierUsage {
  ai_analysis_used: boolean;
  calendar_used: boolean;
  either_used: boolean;
}

export const useFreeTierUsage = () => {
  const [usage, setUsage] = useState<FreeTierUsage>({
    ai_analysis_used: false,
    calendar_used: false,
    either_used: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const periodStart = new Date();
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
      const periodStr = periodStart.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("free_tier_usage")
        .select("usage_type")
        .eq("user_id", user.id)
        .eq("period_start", periodStr);

      if (error) throw error;

      const types = (data || []).map((d: any) => d.usage_type);
      const ai = types.includes("ai_analysis");
      const cal = types.includes("calendar");

      setUsage({
        ai_analysis_used: ai,
        calendar_used: cal,
        either_used: ai || cal,
      });
    } catch (err) {
      console.error("Error fetching free tier usage:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const recordUsage = useCallback(async (usageType: "ai_analysis" | "calendar") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const periodStart = new Date();
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
      const periodStr = periodStart.toISOString().split("T")[0];

      const { error } = await supabase.from("free_tier_usage").insert({
        user_id: user.id,
        usage_type: usageType,
        period_start: periodStr,
      });

      if (error) throw error;
      await fetchUsage();
    } catch (err) {
      console.error("Error recording free tier usage:", err);
      throw err;
    }
  }, [fetchUsage]);

  return { usage, loading, recordUsage, refetch: fetchUsage };
};
