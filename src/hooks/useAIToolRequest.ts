import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { creditUpdateEvent } from './useAIAssistant';
import { useProfileCompleteness } from './useProfileCompleteness';

interface UseAIToolRequestOptions {
  toolSystemPrompt: string;
}

export const useAIToolRequest = <T = any>({ toolSystemPrompt }: UseAIToolRequestOptions) => {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isProfileComplete } = useProfileCompleteness();

  const generate = async (userMessage: string) => {
    if (!isProfileComplete) return null;
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Inte inloggad');

      const { data, error: invokeError } = await supabase.functions.invoke('ai-assistant/chat', {
        method: 'POST',
        body: {
          message: userMessage,
          history: [],
          calendarContextDigest: [],
          meta: { toolSystemPrompt },
        },
      });

      if (invokeError) throw invokeError;

      if (data?.error === 'INSUFFICIENT_CREDITS') {
        setError(data.message || 'Du har inte tillräckligt med krediter.');
        return null;
      }

      if (data?.error) {
        setError(data.message || 'Ett fel uppstod.');
        return null;
      }

      // Try to parse the response as JSON
      const responseText = data?.response || '';
      let parsed: T | null = null;

      try {
        // Remove markdown code blocks if present
        const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        // If not valid JSON, try to extract JSON from the text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            parsed = null;
          }
        }
        // Also try array
        if (!parsed) {
          const arrayMatch = responseText.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            try {
              parsed = JSON.parse(arrayMatch[0]);
            } catch {
              parsed = null;
            }
          }
        }
      }

      if (!parsed) {
        // Fallback: return raw text as-is in a wrapper
        parsed = { raw: responseText } as any;
      }

      setResult(parsed);
      creditUpdateEvent.dispatchEvent(new Event('creditsChanged'));
      return parsed;
    } catch (err: any) {
      console.error('AI tool request error:', err);
      const msg = err?.message || 'Kunde inte generera svar.';
      setError(msg);
      toast({
        title: 'Fel',
        description: msg,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, generate, setResult };
};
