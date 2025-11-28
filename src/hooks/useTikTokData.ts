import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TikTokUser {
  display_name: string;
  avatar_url?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
  bio_description?: string;
}

interface TikTokStats {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  avgEngagementRate: string;
  videoCount: number;
}

interface TikTokData {
  user: TikTokUser | null;
  stats: TikTokStats | null;
  videos: any[];
  limited_access?: boolean;
  scope_message?: string;
}

export const useTikTokData = () => {
  const [data, setData] = useState<TikTokData>({
    user: null,
    stats: null,
    videos: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchTikTokData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // First, try to refresh token if needed
      console.log('Checking if token needs refresh...');
      const refreshResponse = await supabase.functions.invoke('refresh-tiktok-token', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (refreshResponse.error) {
        console.warn('Token refresh check failed:', refreshResponse.error);
      } else if (refreshResponse.data && !refreshResponse.data.success) {
        console.warn('Token refresh returned failure:', refreshResponse.data.message);
      } else {
        console.log('Token refresh check completed:', refreshResponse.data);
      }

      // Now fetch the data
      console.log('Fetching TikTok data...');
      const { data: tiktokData, error: fetchError } = await supabase.functions.invoke(
        'fetch-tiktok-data',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch TikTok data');
      }

      // Check if the response indicates failure
      if (tiktokData && !tiktokData.success) {
        throw new Error(tiktokData.error || 'Failed to fetch TikTok data');
      }

      console.log('TikTok data fetched successfully:', tiktokData);
      setData({
        user: tiktokData.user,
        stats: tiktokData.stats,
        videos: tiktokData.videos || [],
        limited_access: tiktokData.limited_access || false,
        scope_message: tiktokData.scope_message,
      });
      
      // Show info toast if limited access
      if (tiktokData.limited_access && tiktokData.scope_message) {
        toast({
          title: 'Begränsad åtkomst',
          description: tiktokData.scope_message,
          variant: 'default',
        });
      }

    } catch (err) {
      const error = err as Error;
      console.error('Error fetching TikTok data:', error);
      setError(error);
      
      toast({
        title: 'Kunde inte hämta TikTok-data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTikTokData();
  }, []);

  return {
    ...data,
    loading,
    error,
    refetch: fetchTikTokData,
  };
};
