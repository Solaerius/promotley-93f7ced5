import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TikTokUser {
  open_id: string;
  display_name: string;
  avatar_url?: string;
  bio_description?: string;
  profile_web_link?: string;
  profile_deep_link?: string;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

export interface TikTokVideo {
  id: string;
  title: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  created_at: string | null;
  cover_image_url?: string;
  share_url?: string;
  duration?: number;
}

export interface TikTokStats {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  avgEngagementRate: string;
  videoCount: number;
}

export interface TikTokScopeInfo {
  granted_scopes: string[];
  requested_scopes: string[];
  missing_scopes: string[];
}

interface TikTokData {
  user: TikTokUser | null;
  stats: TikTokStats | null;
  videos: TikTokVideo[];
  pagination: { cursor: string | null; has_more: boolean } | null;
  scopeInfo: TikTokScopeInfo | null;
  limited_access?: boolean;
  scope_message?: string;
}

// Module-level cache — persists across component mounts/unmounts for the session
const STALE_MS = 5 * 60 * 1000; // 5 minutes
let _cache: TikTokData | null = null;
let _cacheTime = 0;
let _inflight: Promise<void> | null = null;

export const useTikTokData = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const [data, setData] = useState<TikTokData>(() =>
    _cache ?? { user: null, stats: null, videos: [], pagination: null, scopeInfo: null }
  );
  // If we already have cached data, don't show loading spinner
  const [loading, setLoading] = useState(!_cache && enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchTikTokData = async () => {
    // Deduplicate: if a fetch is already in flight, await it instead of starting another
    if (_inflight) {
      await _inflight;
      if (_cache) setData(_cache);
      return;
    }

    let resolve!: () => void;
    _inflight = new Promise(r => { resolve = r; });

    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Try to refresh token if needed
      const refreshResponse = await supabase.functions.invoke('refresh-tiktok-token', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (refreshResponse.error) {
        console.warn('Token refresh check failed:', refreshResponse.error);
      }

      // Fetch data
      const { data: tiktokData, error: fetchError } = await supabase.functions.invoke(
        'fetch-tiktok-data',
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      if (fetchError) {
        throw new Error(fetchError.message || t('toasts.could_not_fetch_tiktok'));
      }

      if (tiktokData && !tiktokData.success) {
        throw new Error(tiktokData.error || t('toasts.could_not_fetch_tiktok'));
      }

      const next: TikTokData = {
        user: tiktokData.user,
        stats: tiktokData.stats,
        videos: tiktokData.videos || [],
        pagination: tiktokData.pagination || null,
        scopeInfo: {
          granted_scopes: tiktokData.granted_scopes || [],
          requested_scopes: tiktokData.requested_scopes || [],
          missing_scopes: tiktokData.missing_scopes || [],
        },
        limited_access: tiktokData.limited_access || false,
        scope_message: tiktokData.scope_message,
      };

      // Update module-level cache
      _cache = next;
      _cacheTime = Date.now();

      setData(next);

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

      // Only show toast if we have no cached data to fall back on
      if (!_cache) {
        toast({
          title: t('toasts.could_not_fetch_tiktok'),
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      _inflight = null;
      resolve();
    }
  };

  const loadMoreVideos = useCallback(async () => {
    if (!data.pagination?.cursor || !data.pagination.has_more || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: moreData, error: fetchError } = await supabase.functions.invoke(
        'fetch-tiktok-videos',
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { cursor: data.pagination.cursor },
        }
      );

      if (fetchError || !moreData?.success) {
        console.error('Failed to load more videos:', fetchError || moreData?.error);
        return;
      }

      setData(prev => ({
        ...prev,
        videos: [...prev.videos, ...(moreData.videos || [])],
        pagination: moreData.pagination || null,
      }));
    } catch (err) {
      console.error('Error loading more videos:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [data.pagination, loadingMore]);

  useEffect(() => {
    if (!enabled) return;
    const isStale = Date.now() - _cacheTime > STALE_MS;
    if (_cache && !isStale) {
      // Cache is fresh — nothing to do, state was already initialised from cache
      return;
    }
    // No cache, or cache is stale — fetch (silently if we have cached data to show)
    fetchTikTokData();
  }, [enabled]);

  return {
    ...data,
    loading,
    loadingMore,
    error,
    refetch: fetchTikTokData,
    loadMoreVideos,
  };
};
