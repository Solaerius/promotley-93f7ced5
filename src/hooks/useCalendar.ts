import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface CalendarPost {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  platform: string | null;
  date: string;
  created_at: string;
}

type MethodAction =
  | { action: 'list' }
  | { action: 'create'; data: { title: string; description?: string; event_type: string; platform?: string | null; date: string } }
  | { action: 'bulk_create'; data: { posts: Array<{ title: string; content?: string; event_type?: string; channel?: string; date: string }>; requestId: string } }
  | { action: 'update'; data: { id: string; patch: Partial<{ title: string; description: string; event_type: string; platform: string | null; date: string }> } }
  | { action: 'delete'; data: { id: string } }
  | { action: 'context' };

async function getFreshToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function invokeCalendar(payload: MethodAction): Promise<any> {
  const attempt = async () => {
    const token = await getFreshToken();
    if (!token) throw Object.assign(new Error('not_authenticated'), { status: 401 });

    const body = payload && payload.action ? payload : { action: 'list' };

    console.debug('[calendar] invoking with payload:', body);

    const { data, error } = await supabase.functions.invoke('calendar', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body
    });

    if (error) {
      console.error('[calendar] invoke error:', error, 'response:', data);
      if (error.message?.includes('Unauthorized') || error.message?.includes('JW') || error.message?.includes('invalid_jwt')) {
        throw Object.assign(error, { status: 401 });
      }
      throw error;
    }
    return data;
  };

  try {
    return await attempt();
  } catch (err: any) {
    if (err?.status === 401 || String(err?.message).toLowerCase().includes('unauthorized') || err.message === 'not_authenticated') {
      console.debug('[calendar] 401 detected, refreshing session and retrying');
      await supabase.auth.getSession();
      return await attempt();
    }
    throw err;
  }
}

export const useCalendar = () => {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.debug('[calendar] fetching posts with action: list');
      const result = await invokeCalendar({ action: 'list' });
      setPosts(Array.isArray(result) ? result : []);
    } catch (err: any) {
      if (err.message === 'not_authenticated') {
        setPosts([]);
      } else {
        setError(err as Error);
        console.error('Error fetching calendar posts:', err);
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchContext = async () => {
    return invokeCalendar({ action: 'context' });
  };

  const createPost = async (postData: {
    title: string;
    description?: string;
    event_type: string;
    platform?: string | null;
    date: string;
  }) => {
    try {
      const event_type = (postData.event_type || 'inlagg').toLowerCase();
      const validTypes = ['inlagg', 'uf_marknad', 'event', 'deadline', 'ovrigt'];
      if (!validTypes.includes(event_type)) {
        throw new Error(t('calendar_hooks.invalid_event_type'));
      }

      const platform = postData.platform ? postData.platform.toLowerCase() : null;
      if (platform && !['instagram', 'tiktok', 'facebook'].includes(platform)) {
        throw new Error(t('calendar_hooks.invalid_channel'));
      }

      // Normalize date to YYYY-MM-DD
      const date = new Date(postData.date);
      if (isNaN(date.valueOf())) {
        throw new Error(t('calendar_hooks.invalid_date'));
      }
      const isoDate = date.toISOString().slice(0, 10);

      console.debug('[calendar] creating post:', { title: postData.title, event_type, platform, date: isoDate });

      const result = await invokeCalendar({
        action: 'create',
        data: {
          title: postData.title,
          description: postData.description,
          event_type,
          platform,
          date: isoDate
        }
      });

      toast({
        title: t('calendar_hooks.post_created'),
        description: t('calendar_hooks.post_created_desc'),
      });

      await fetchPosts();
      return result;
    } catch (err: any) {
      console.error('Error creating post:', err);
      const errorMsg = err.message || t('toasts.could_not_create_post');
      toast({
        title: t('common.error'),
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const bulkCreate = async (
    postsIn: Array<{ title: string; content?: string; event_type?: string; channel?: string; date: string }>,
    requestId: string
  ) => {
    const normalizedPosts = postsIn.map(p => {
      const d = new Date(p.date);
      return {
        title: p.title,
        content: p.content ?? '',
        event_type: p.event_type ?? 'inlagg',
        channel: p.channel ?? undefined,
        date: isNaN(d.valueOf()) ? '' : d.toISOString().slice(0, 10)
      };
    });

    console.debug('[calendar] bulk creating posts:', normalizedPosts.length);

    const result = await invokeCalendar({
      action: 'bulk_create',
      data: { posts: normalizedPosts, requestId }
    });

    await fetchPosts();
    return result;
  };

  const updatePost = async (id: string, postData: {
    title?: string;
    description?: string;
    event_type?: string;
    platform?: string | null;
    date?: string;
  }) => {
    try {
      const patch: Partial<{ title: string; description: string; event_type: string; platform: string | null; date: string }> = {};

      if (postData.title) patch.title = postData.title;
      if (postData.description !== undefined) patch.description = postData.description;

      if (postData.event_type) {
        const event_type = postData.event_type.toLowerCase();
        const validTypes = ['inlagg', 'uf_marknad', 'event', 'deadline', 'ovrigt'];
        if (!validTypes.includes(event_type)) {
          throw new Error(t('calendar_hooks.invalid_event_type'));
        }
        patch.event_type = event_type;
      }

      if (postData.platform !== undefined) {
        const platform = postData.platform ? postData.platform.toLowerCase() : null;
        if (platform && !['instagram', 'tiktok', 'facebook'].includes(platform)) {
          throw new Error(t('calendar_hooks.invalid_channel'));
        }
        patch.platform = platform;
      }

      if (postData.date) {
        const d = new Date(postData.date);
        if (isNaN(d.valueOf())) {
          throw new Error(t('calendar_hooks.invalid_date'));
        }
        patch.date = d.toISOString().slice(0, 10);
      }

      const result = await invokeCalendar({
        action: 'update',
        data: { id, patch }
      });

      toast({
        title: t('calendar_hooks.post_updated'),
        description: t('calendar_hooks.post_updated_desc'),
      });

      await fetchPosts();
      return result;
    } catch (err: any) {
      console.error('Error updating post:', err);
      const errorMsg = err.message || t('toasts.could_not_update_post');
      toast({
        title: t('common.error'),
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deletePost = async (id: string) => {
    try {
      await invokeCalendar({ action: 'delete', data: { id } });

      toast({
        title: t('calendar_hooks.post_deleted'),
        description: t('calendar_hooks.post_deleted_desc'),
      });

      await fetchPosts();
    } catch (err: any) {
      console.error('Error deleting post:', err);
      const errorMsg = err.message || t('toasts.could_not_delete_post');
      toast({
        title: t('common.error'),
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const hasPosts = posts.length > 0;

  return {
    posts,
    loading,
    error,
    hasPosts,
    fetchPosts,
    fetchContext,
    createPost,
    bulkCreate,
    updatePost,
    deletePost,
  };
};
