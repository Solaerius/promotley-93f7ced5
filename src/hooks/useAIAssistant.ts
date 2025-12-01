import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Global event for credit updates
export const creditUpdateEvent = new EventTarget();

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
  plan?: any; // Marketing plan if present
  requestId?: string;
}

interface MessageMeta {
  action?: string;
  timeframe?: any;
  targets?: string[];
  requestId?: string;
}

export const useAIAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setMessages([]);
        return;
      }

      const { data: result, error } = await supabase.functions.invoke('ai-assistant/history', {
        method: 'GET'
      });

      if (error) throw error;

      setMessages(result || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching chat history:', err);
      setMessages([]);
    }
  };

  const sendMessage = async (message: string, meta?: MessageMeta) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Fetch calendar context
      const { data: contextData } = await supabase.functions.invoke('calendar/context');

      // Add user message to UI immediately (optimistic)
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        message,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      const { data: result, error } = await supabase.functions.invoke('ai-assistant/chat', {
        method: 'POST',
        body: { 
          message, 
          history: messages,
          calendarContextDigest: contextData?.digest || [],
          lastUpdatedAt: contextData?.lastUpdatedAt,
          meta // Include metadata for special actions like marketing plan
        }
      });

      if (error) throw error;

      // Build AI response message
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        message: result.response,
        timestamp: new Date().toISOString(),
      };

      // If a marketing plan was generated, attach it to the message
      if (result.plan) {
        aiMessage.plan = result.plan;
        aiMessage.requestId = meta?.requestId || `plan-${Date.now()}`;
      }

      setMessages(prev => [...prev, aiMessage]);

      // Trigger credit update
      creditUpdateEvent.dispatchEvent(new Event('creditsChanged'));

      return result;
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: "Fel",
        description: "Kunde inte skicka meddelande.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createMarketingPlan = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Fetch calendar context
      const { data: contextData } = await supabase.functions.invoke('calendar/context');

      // Add system message
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        message: 'Jag skapar en marknadsföringsplan baserat på dina mål och kalender...',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, systemMessage]);

      const { data: result, error } = await supabase.functions.invoke('ai-assistant/create-marketing-plan', {
        method: 'POST',
        body: {
          targets: ['reach', 'engagement'],
          timeframe: 'month',
          calendarContextDigest: contextData?.digest || []
        }
      });

      if (error) throw error;

      // Add plan to chat
      const planMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        message: result.explanation || 'Plan skapad!',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, planMessage]);

      // Trigger credit update
      creditUpdateEvent.dispatchEvent(new Event('creditsChanged'));

      return result;
    } catch (err) {
      console.error('Error creating marketing plan:', err);
      toast({
        title: "Fel",
        description: "Kunde inte skapa marknadsföringsplan.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const implementPlan = async (plan: any, requestId: string) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Normalize posts for bulk_create
      const normalizedPosts = (plan.posts || []).map((p: any) => {
        const channel = (p.channel || p.platform || '').toLowerCase();
        const d = new Date(p.date);
        return {
          title: p.title,
          content: p.content || p.description || '',
          channel: channel as 'instagram' | 'tiktok' | 'facebook',
          date: isNaN(d.valueOf()) ? '' : d.toISOString().slice(0, 10)
        };
      });

      console.debug('[implementPlan] Sending posts:', normalizedPosts);

      const { data: result, error } = await supabase.functions.invoke('calendar', {
        headers: { 
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: {
          action: 'bulk_create',
          data: { posts: normalizedPosts, requestId }
        }
      });

      if (error) {
        console.error('[implementPlan] Error:', error);
        throw error;
      }

      console.debug('[implementPlan] Result:', result);

      toast({
        title: "Plan implementerad!",
        description: `${result.created?.length || 0} inlägg skapade.`,
      });

      // Add confirmation message
      const confirmMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        message: `Plan implementerad! ${result.created?.length || 0} inlägg har lagts till i kalendern.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, confirmMessage]);

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
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: result, error } = await supabase.functions.invoke('ai-assistant/generate-plan', {
        method: 'POST'
      });

      if (error) throw error;

      if (result.placeholder) {
        toast({
          title: "Kommer snart",
          description: result.message,
        });
      }

      return result;
    } catch (err) {
      console.error('Error generating plan:', err);
      toast({
        title: "Fel",
        description: "Kunde inte generera innehållsplan.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const analyzeStats = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: result, error } = await supabase.functions.invoke('ai-assistant/analyze', {
        method: 'POST'
      });

      if (error) throw error;

      if (result.placeholder) {
        toast({
          title: "Kommer snart",
          description: result.message,
        });
      }

      return result;
    } catch (err) {
      console.error('Error analyzing stats:', err);
      toast({
        title: "Fel",
        description: "Kunde inte analysera statistik.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const hasMessages = messages.length > 0;

  return {
    messages,
    loading,
    error,
    hasMessages,
    sendMessage,
    generatePlan,
    analyzeStats,
    fetchHistory,
    createMarketingPlan,
    implementPlan,
  };
};