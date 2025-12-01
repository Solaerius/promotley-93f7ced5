import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { creditUpdateEvent } from './useAIAssistant';

interface AIAnalysis {
  id: string;
  user_id: string;
  input_data: any;
  ai_output: {
    sammanfattning: string;
    social_medier_analys: string;
    "7_dagars_plan": Array<{
      dag: string;
      aktivitet: string;
      beskrivning: string;
      plattform: string;
    }>;
    uf_tavlingsstrategi: string;
    content_forslag: Array<{
      titel: string;
      beskrivning: string;
      plattform: string;
      format: string;
    }>;
    rekommendationer: Array<{
      kategori: string;
      prioritet: string;
      titel: string;
      beskrivning: string;
      deadline: string;
    }>;
  };
  created_at: string;
}

export const useAIAnalysis = () => {
  const [latestAnalysis, setLatestAnalysis] = useState<AIAnalysis | null>(null);
  const [history, setHistory] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLatestAnalysis(null);
        setHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('ai_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHistory((data || []) as AIAnalysis[]);
      setLatestAnalysis(data && data.length > 0 ? (data[0] as AIAnalysis) : null);
    } catch (error) {
      console.error('Error fetching AI analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    try {
      setGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      toast({
        title: 'Genererar analys...',
        description: 'Detta kan ta upp till 30 sekunder.',
      });

      const { data, error } = await supabase.functions.invoke('generate-ai-analysis', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate analysis');
      }

      toast({
        title: 'Analys genererad!',
        description: 'Din AI-analys är nu klar.',
      });

      // Trigger credit update
      creditUpdateEvent.dispatchEvent(new Event('creditsChanged'));

      await fetchAnalyses();
      return data.analysis;
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte generera analys. Försök igen.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  return {
    latestAnalysis,
    history,
    loading,
    generating,
    generateAnalysis,
    refetch: fetchAnalyses,
  };
};