import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export const useMarketingPlan = () => {
  const [activePlan, setActivePlan] = useState<MarketingPlan | null>(null);
  const [isImplementing, setIsImplementing] = useState(false);
  const { toast } = useToast();

  const createPlan = async (targets: string[], timeframe: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Fetch calendar context
      const { data: contextData } = await supabase.functions.invoke('calendar/context');

      const { data: result, error } = await supabase.functions.invoke('ai-assistant/create-marketing-plan', {
        method: 'POST',
        body: {
          targets,
          timeframe,
          calendarContextDigest: contextData?.digest || []
        }
      });

      if (error) throw error;

      if (result.plan) {
        setActivePlan(result.plan);
        return result.plan;
      }

      return null;
    } catch (err) {
      console.error('Error creating marketing plan:', err);
      toast({
        title: "Fel",
        description: "Kunde inte skapa marknadsföringsplan.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const implementPlan = async (plan: MarketingPlan, requestId: string) => {
    try {
      setIsImplementing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: result, error } = await supabase.functions.invoke('calendar/bulk_create', {
        method: 'POST',
        body: {
          posts: plan.posts,
          requestId
        }
      });

      if (error) throw error;

      toast({
        title: "Plan implementerad!",
        description: `${result.created?.length || 0} inlägg skapade, ${result.skipped?.length || 0} hoppades över.`,
      });

      return result;
    } catch (err) {
      console.error('Error implementing plan:', err);
      toast({
        title: "Fel",
        description: "Kunde inte implementera plan.",
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
