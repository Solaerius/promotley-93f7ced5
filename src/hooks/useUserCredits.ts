import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { creditUpdateEvent } from './useAIAssistant';

interface UserCredits {
  plan: string;
  credits_left: number;
  max_credits: number;
  renewal_date: string | null;
}

export const useUserCredits = () => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCredits(null);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('plan, credits_left, max_credits, renewal_date')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCredits(data);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();

    // Listen for credit update events
    const handleCreditUpdate = () => {
      fetchCredits();
    };

    creditUpdateEvent.addEventListener('creditsChanged', handleCreditUpdate);

    return () => {
      creditUpdateEvent.removeEventListener('creditsChanged', handleCreditUpdate);
    };
  }, [fetchCredits]);

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'starter': return 'Starter';
      case 'growth': return 'Growth';
      case 'pro': return 'Pro';
      default: return plan;
    }
  };

  // Get tier level for comparison (higher = better plan)
  const getTierLevel = (plan: string): number => {
    switch (plan) {
      case 'starter': return 1;
      case 'growth': return 2;
      case 'pro': return 3;
      default: return 0;
    }
  };

  return {
    credits,
    loading,
    refetch: fetchCredits,
    getPlanLabel,
    getTierLevel,
  };
};
