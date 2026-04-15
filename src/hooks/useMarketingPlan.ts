import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface MarketingPost {
  date: string;
  channel: 'instagram' | 'tiktok' | 'facebook';
  title: string;
  content: string;
  tags: string[];
  assets: string[];
  status: 'scheduled' | 'draft' | 'published';
}

export interface MarketingPlan {
  timeframe: {
    start: string;
    end: string;
  };
  goals: string[];
  budgetHints: string[];
  posts: MarketingPost[];
}

async function getFreshToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// Helper function for invoking Edge Functions with automatic retry on 401
async function invokeWithRetry(
  functionName: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; body?: any } = {}
): Promise<any> {
  const attempt = async () => {
    const token = await getFreshToken();
    if (!token) {
      throw new Error('not_authenticated');
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: options.body
    });

    if (error) {
      // Check if it's a 401 error
      if (error.message?.includes('Unauthorized') || error.message?.includes('JW') || error.message?.includes('invalid_jwt')) {
        throw { ...error, status: 401 };
      }
      throw error;
    }

    return data;
  };

  try {
    return await attempt();
  } catch (err: any) {
    // Retry once on 401 after refreshing session
    if (err.status === 401 || err.message === 'not_authenticated') {
      await supabase.auth.getSession(); // Silent refresh
      return await attempt();
    }
    throw err;
  }
}

// Helper for calendar action-based API
async function invokeCalendar(payload: { action: string; data?: any }): Promise<any> {
  const attempt = async () => {
    const token = await getFreshToken();
    if (!token) throw Object.assign(new Error('not_authenticated'), { status: 401 });

    const { data, error } = await supabase.functions.invoke('calendar', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: payload
    });

    if (error) {
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
      await supabase.auth.getSession(); // silent refresh
      return await attempt();
    }
    throw err;
  }
}

export const useMarketingPlan = () => {
  const [activePlan, setActivePlan] = useState<MarketingPlan | null>(null);
  const [isImplementing, setIsImplementing] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const createPlan = async (targets: string[], timeframe: string) => {
    try {
      // Fetch calendar context using new action-based API
      const contextData = await invokeCalendar({ action: 'context' });

      const result = await invokeWithRetry('ai-assistant', {
        method: 'POST',
        body: {
          action: 'create-marketing-plan',
          targets,
          timeframe,
          calendarContextDigest: contextData?.digest || []
        }
      });

      if (result.plan) {
        setActivePlan(result.plan);
        return result.plan;
      }

      return null;
    } catch (err: any) {
      console.error('Error creating marketing plan:', err);
      const errorMsg = err.message || t('toasts.could_not_create_marketing_plan');
      toast({
        title: t('common.error'),
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const implementPlan = async (plan: MarketingPlan, requestId: string) => {
    try {
      setIsImplementing(true);

      // Normalize posts for bulk_create
      const normalizedPosts = plan.posts.map(p => {
        const d = new Date(p.date);
        return {
          title: p.title,
          content: p.content ?? '',
          channel: p.channel,
          date: isNaN(d.valueOf()) ? '' : d.toISOString().slice(0, 10)
        };
      });

      const result = await invokeCalendar({ 
        action: 'bulk_create', 
        data: { posts: normalizedPosts, requestId } 
      });

      toast({
        title: t('plan_hooks.plan_implemented'),
        description: t('plan_hooks.plan_implemented_desc', { created: result.created?.length || 0, skipped: result.skipped?.length || 0 }),
      });

      return result;
    } catch (err: any) {
      console.error('Error implementing plan:', err);
      const errorMsg = err.message || t('toasts.could_not_implement_plan');
      toast({
        title: t('common.error'),
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsImplementing(false);
    }
  };

  return {
    activePlan,
    isImplementing,
    createPlan,
    implementPlan,
    setActivePlan,
  };
};
