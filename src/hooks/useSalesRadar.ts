import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { creditUpdateEvent } from './useAIAssistant';

interface Lead {
  typ: 'kund' | 'samarbete' | 'event' | 'kanal';
  titel: string;
  beskrivning: string;
  action: string;
  prioritet: 'hög' | 'medel' | 'låg';
  potential: string;
}

interface Trend {
  typ: 'hashtag' | 'format' | 'ämne' | 'event' | 'säsong';
  titel: string;
  beskrivning: string;
  tips: string;
  plattform: 'instagram' | 'tiktok' | 'alla';
  aktualitet: 'nu' | 'denna_vecka' | 'denna_månad';
}

interface RadarResult {
  id: string;
  leads: Lead[];
  trends: Trend[];
  sammanfattning?: string;
  created_at: string;
  input_context: any;
}

export const useSalesRadar = () => {
  const [latestResult, setLatestResult] = useState<RadarResult | null>(null);
  const [history, setHistory] = useState<RadarResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sales_radar_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const results = (data || []) as unknown as RadarResult[];
      setHistory(results);
      setLatestResult(results[0] || null);
    } catch (error) {
      console.error('Error fetching radar results:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRadar = async (modelTier: string = 'standard') => {
    try {
      setGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('Not authenticated');

      toast({
        title: 'Skannar möjligheter...',
        description: 'Säljradarn analyserar din bransch och profil.',
      });

      const { data, error } = await supabase.functions.invoke('sales-radar', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { model_tier: modelTier },
      });

      if (error) {
        if (error.message?.includes('402') || error.message?.includes('INSUFFICIENT_CREDITS')) {
          toast({ title: 'Otillräckliga krediter', variant: 'destructive' });
          throw new Error('INSUFFICIENT_CREDITS');
        }
        throw error;
      }

      if (!data.success) {
        if (data.error === 'NO_ACTIVE_PLAN') {
          throw new Error('NO_ACTIVE_PLAN');
        }
        throw new Error(data.error || 'Failed to generate radar');
      }

      toast({
        title: 'Säljradar klar!',
        description: 'Nya möjligheter har hittats.',
      });

      creditUpdateEvent.dispatchEvent(new Event('creditsChanged'));
      await fetchResults();
      return data.data;
    } catch (error: any) {
      if (!error?.message?.includes('INSUFFICIENT_CREDITS') && !error?.message?.includes('NO_ACTIVE_PLAN')) {
        toast({
          title: 'Fel',
          description: 'Kunde inte generera Säljradar. Försök igen.',
          variant: 'destructive',
        });
      }
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return {
    latestResult,
    history,
    loading,
    generating,
    generateRadar,
    refetch: fetchResults,
  };
};
