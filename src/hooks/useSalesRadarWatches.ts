import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { creditUpdateEvent } from './useAIAssistant';
import { trackEvent } from '@/lib/trackEvent';

interface Watch {
  id: string;
  result_id: string;
  item_type: 'lead' | 'trend';
  item_index: number;
  item_title: string;
  notify_date: string | null;
  notified: boolean;
  created_at: string;
}

export const useSalesRadarWatches = () => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWatches = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase
        .from('sales_radar_watches') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWatches(data || []);
    } catch (err) {
      console.error('Error fetching watches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWatches(); }, [fetchWatches]);

  const isWatched = (resultId: string, itemType: string, itemIndex: number) =>
    watches.some(w => w.result_id === resultId && w.item_type === itemType && w.item_index === itemIndex);

  const addWatch = async (resultId: string, itemType: 'lead' | 'trend', itemIndex: number, itemTitle: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Deduct 1 credit
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits_left')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if ((userData?.credits_left ?? 0) < 1) {
        toast({ title: 'Otillräckliga krediter', description: 'Bevakning kostar 1 kredit.', variant: 'destructive' });
        return false;
      }

      await supabase.from('users').update({ credits_left: (userData?.credits_left ?? 0) - 1 }).eq('id', user.id);

      const { error } = await (supabase.from('sales_radar_watches') as any).insert({
        user_id: user.id,
        result_id: resultId,
        item_type: itemType,
        item_index: itemIndex,
        item_title: itemTitle,
      });

      if (error) throw error;

      creditUpdateEvent.dispatchEvent(new Event('creditsChanged'));
      trackEvent('watch_created', { item_type: itemType, item_title: itemTitle });
      toast({ title: 'Bevakning tillagd', description: `"${itemTitle}" bevakas nu. (1 kredit)` });
      await fetchWatches();
      return true;
    } catch (err) {
      console.error('Error adding watch:', err);
      toast({ title: 'Fel', description: 'Kunde inte lägga till bevakning.', variant: 'destructive' });
      return false;
    }
  };

  const removeWatch = async (watchId: string) => {
    try {
      const { error } = await (supabase.from('sales_radar_watches') as any).delete().eq('id', watchId);
      if (error) throw error;
      toast({ title: 'Bevakning borttagen' });
      await fetchWatches();
    } catch (err) {
      console.error('Error removing watch:', err);
    }
  };

  return { watches, loading, isWatched, addWatch, removeWatch, refetch: fetchWatches };
};
