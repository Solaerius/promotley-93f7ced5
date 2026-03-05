import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GrowthDataPoint {
  date: string;
  followers: number;
  likes: number;
  views: number;
}

export const useTikTokGrowth = () => {
  const [data, setData] = useState<GrowthDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrowth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch last 30 days of metrics for TikTok
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: metrics, error } = await supabase
          .from('metrics')
          .select('metric_type, value, period')
          .eq('provider', 'tiktok')
          .gte('period', thirtyDaysAgo.toISOString().split('T')[0])
          .order('period', { ascending: true });

        if (error || !metrics) {
          console.warn('Could not fetch TikTok growth metrics:', error);
          return;
        }

        // Group by date
        const grouped: Record<string, Partial<GrowthDataPoint>> = {};
        for (const m of metrics) {
          if (!m.period) continue;
          if (!grouped[m.period]) {
            grouped[m.period] = { date: m.period };
          }
          if (m.metric_type === 'followers') grouped[m.period].followers = Number(m.value);
          if (m.metric_type === 'likes') grouped[m.period].likes = Number(m.value);
          if (m.metric_type === 'video_views') grouped[m.period].views = Number(m.value);
        }

        const points = Object.values(grouped)
          .map(p => ({
            date: p.date!,
            followers: p.followers ?? 0,
            likes: p.likes ?? 0,
            views: p.views ?? 0,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setData(points);
      } catch (err) {
        console.error('Error fetching TikTok growth:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrowth();
  }, []);

  return { data, loading, hasData: data.length > 0 };
};
