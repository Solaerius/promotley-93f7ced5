import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CalendarPost {
  id: string;
  title: string;
  description: string | null;
  platform: string;
  date: string;
  created_at: string;
}

type MethodAction =
  | { action: 'list' }
  | { action: 'create'; data: { title: string; description?: string; platform: 'instagram' | 'tiktok' | 'facebook'; date: string } }
  | { action: 'bulk_create'; data: { posts: Array<{ title: string; content?: string; channel: 'instagram' | 'tiktok' | 'facebook'; date: string }>; requestId: string } }
  | { action: 'update'; data: { id: string; patch: Partial<{ title: string; description: string; platform: 'instagram' | 'tiktok' | 'facebook'; date: string }> } }
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

    // Ensure payload always has action
    const body = payload && payload.action ? payload : { action: 'list' };
    
    console.debug('[calendar] invoking with payload:', body);

    const { data, error } = await supabase.functions.invoke('calendar', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body // OBS: skicka objekt, INTE JSON.stringify
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

  const createPost = async (postData: {
    title: string;
    description?: string;
    platform: string;
    date: string;
  }) => {
    try {
      // Normalize platform
      const platform = (postData.platform || '').toLowerCase();
      if (!['instagram', 'tiktok', 'facebook'].includes(platform)) {
        throw new Error('Ogiltig kanal');
      }
      
      // Normalize date to YYYY-MM-DD
      const date = new Date(postData.date);
      if (isNaN(date.valueOf())) {
        throw new Error('Ogiltigt datum');
      }
      const isoDate = date.toISOString().slice(0, 10);

      console.debug('[calendar] creating post:', { title: postData.title, platform, date: isoDate });

      const result = await invokeCalendar({ 
        action: 'create', 
        data: { 
          title: postData.title, 
          description: postData.description, 
          platform: platform as 'instagram' | 'tiktok' | 'facebook', 
          date: isoDate 
        } 
      });

      toast({
        title: "Inlägg skapat",
        description: "Ditt inlägg har lagts till i kalendern.",
      });

      await fetchPosts();
      return result;
    } catch (err: any) {
      console.error('Error creating post:', err);
      const errorMsg = err.message || "Kunde inte skapa inlägg.";
      toast({
        title: "Fel",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const bulkCreate = async (
    postsIn: Array<{ title: string; content?: string; channel: string; date: string }>,
    requestId: string
  ) => {
    // Normalize all posts
    const normalizedPosts = postsIn.map(p => {
      const platform = (p.channel || '').toLowerCase();
      const d = new Date(p.date);
      return {
        title: p.title,
        content: p.content ?? '',
        channel: platform as 'instagram' | 'tiktok' | 'facebook',
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
    platform?: string;
    date?: string;
  }) => {
    try {
      const patch: Partial<{ title: string; description: string; platform: 'instagram' | 'tiktok' | 'facebook'; date: string }> = {};
      
      if (postData.title) patch.title = postData.title;
      if (postData.description !== undefined) patch.description = postData.description;
      
      if (postData.platform) {
        const platform = postData.platform.toLowerCase();
        if (!['instagram', 'tiktok', 'facebook'].includes(platform)) {
          throw new Error('Ogiltig kanal');
        }
        patch.platform = platform as 'instagram' | 'tiktok' | 'facebook';
      }
      
      if (postData.date) {
        const d = new Date(postData.date);
        if (isNaN(d.valueOf())) {
          throw new Error('Ogiltigt datum');
        }
        patch.date = d.toISOString().slice(0, 10);
      }

      const result = await invokeCalendar({ 
        action: 'update', 
        data: { id, patch } 
      });

      toast({
        title: "Inlägg uppdaterat",
        description: "Ditt inlägg har uppdaterats.",
      });

      await fetchPosts();
      return result;
    } catch (err: any) {
      console.error('Error updating post:', err);
      const errorMsg = err.message || "Kunde inte uppdatera inlägg.";
      toast({
        title: "Fel",
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
        title: "Inlägg raderat",
        description: "Ditt inlägg har tagits bort.",
      });

      await fetchPosts();
    } catch (err: any) {
      console.error('Error deleting post:', err);
      const errorMsg = err.message || "Kunde inte radera inlägg.";
      toast({
        title: "Fel",
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
    createPost,
    bulkCreate,
    updatePost,
    deletePost,
  };
};
