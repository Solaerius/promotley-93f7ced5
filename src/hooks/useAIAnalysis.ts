import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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

      setHistory((data || []) as unknown as AIAnalysis[]);
      setLatestAnalysis(data && data.length > 0 ? (data[0] as unknown as AIAnalysis) : null);
    } catch (error) {
      console.error('Error fetching AI analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async (modelTier: string = 'standard') => {
    try {
      setGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      toast({
        title: t('analysis_hooks.generating'),
        description: t('analysis_hooks.generating_desc'),
      });

      const { data, error } = await supabase.functions.invoke('generate-ai-analysis', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { model_tier: modelTier },
      });

      if (error) {
        if (error.message?.includes('402') || error.message?.includes('INSUFFICIENT_CREDITS')) {
          toast({
            title: t('analysis_hooks.insufficient_credits'),
            description: t('analysis_hooks.insufficient_credits_desc'),
            variant: 'destructive',
          });
          throw new Error('INSUFFICIENT_CREDITS');
        }
        throw error;
      }

      if (!data.success) {
        if (data.error === 'INSUFFICIENT_CREDITS' || data.message?.includes('kredit')) {
          toast({
            title: t('analysis_hooks.insufficient_credits'),
            description: data.message || t('analysis_hooks.insufficient_credits_desc'),
            variant: 'destructive',
          });
          throw new Error('INSUFFICIENT_CREDITS');
        }
        throw new Error(data.error || 'Failed to generate analysis');
      }

      toast({
        title: t('analysis_hooks.analysis_complete'),
        description: t('analysis_hooks.analysis_complete_desc'),
      });

      // Trigger credit update
      creditUpdateEvent.dispatchEvent(new Event('creditsChanged'));

      await fetchAnalyses();
      return data.analysis;
    } catch (error: any) {
      console.error('Error generating AI analysis:', error);
      // Only show generic error if it's not a credit error (already handled)
      if (!error?.message?.includes('INSUFFICIENT_CREDITS')) {
        toast({
          title: t('common.error'),
          description: t('toasts.could_not_generate_analysis'),
          variant: 'destructive',
        });
      }
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