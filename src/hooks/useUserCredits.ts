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
      case 'free_trial': return 'Gratis';
      case 'pro': return 'Pro';
      case 'pro_xl': return 'Pro XL';
      case 'pro_unlimited': return 'Pro Unlimited';
      default: return plan;
    }
  };

  return {
    credits,
    loading,
    refetch: fetchCredits,
    getPlanLabel,
  };
};
