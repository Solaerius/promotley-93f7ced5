import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  id: string;
  platform: string;
  followers: number | null;
  views: number | null;
  reach: number | null;
  engagement: number | null;
  history: any | null;
  updated_at: string;
}

export const useAnalytics = (platform?: string) => {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setData([]);
        setLoading(false);
        return;
      }

      // Build request body with platform if specified
      const body = platform ? { platform } : {};

      const { data: result, error } = await supabase.functions.invoke('analytics', {
        method: 'GET',
        body,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      // Only set data if it's not empty
      if (result && !result.empty) {
        setData(Array.isArray(result) ? result : [result]);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAnalytics = async (analyticsData: {
    platform: string;
    followers?: number;
    views?: number;
    reach?: number;
    engagement?: number;
    history?: any;
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: result, error } = await supabase.functions.invoke('analytics', {
        method: 'POST',
        body: analyticsData,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: "Statistik uppdaterad",
        description: "Din statistik har sparats framgångsrikt.",
      });

      await fetchAnalytics();
      return result;
    } catch (err) {
      console.error('Error updating analytics:', err);
      toast({
        title: t('common.error'),
        description: t('toasts.could_not_update_stats'),
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [platform]);

  // Helper to check if we have data
  const hasData = data.length > 0;

  // Helper to get platform data
  const getPlatformData = (platformName: string) => {
    return data.find(d => d.platform === platformName);
  };

  return {
    data,
    loading,
    error,
    hasData,
    fetchAnalytics,
    updateAnalytics,
    getPlatformData,
  };
};
