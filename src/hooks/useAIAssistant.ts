import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Global event for credit updates
export const creditUpdateEvent = new EventTarget();

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
  plan?: any;
  requestId?: string;
  isOptimistic?: boolean;
}

interface MessageMeta {
  action?: string;
  timeframe?: any;
  targets?: string[];
  requestId?: string;
  model_tier?: string;
}

export const useAIAssistant = (conversationId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessages([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(
        (data || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          message: m.message,
          timestamp: m.created_at,
          plan: m.plan,
          requestId: m.request_id,
        }))
      );
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching messages:', err);
      setMessages([]);
    }
  }, [conversationId]);

  const sendMessage = async (message: string, meta?: MessageMeta) => {
    if (!conversationId) return;

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
        isOptimistic: true,
      };
      setMessages(prev => [...prev, userMessage]);

      // Save user message to DB
      await supabase.from('ai_chat_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        message,
      });

      const { data: result, error: invokeError } = await supabase.functions.invoke('ai-assistant/chat', {
        method: 'POST',
        body: {
          message,
          history: messages.filter(m => !m.isOptimistic),
          calendarContextDigest: contextData?.digest || [],
          lastUpdatedAt: contextData?.lastUpdatedAt,
          meta,
          conversationId,
        }
      });

      if (invokeError) throw invokeError;

      // Save AI response to DB
      const aiInsert: any = {
        conversation_id: conversationId,
        role: 'assistant',
        message: result.response,
      };
      if (result.plan) {
        aiInsert.plan = result.plan;
        aiInsert.request_id = meta?.requestId || `plan-${Date.now()}`;
      }
      await supabase.from('ai_chat_messages').insert(aiInsert);

      // Build AI response message for UI
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        message: result.response,
        timestamp: new Date().toISOString(),
      };
      if (result.plan) {
        aiMessage.plan = result.plan;
        aiMessage.requestId = aiInsert.request_id;
      }

      // Replace optimistic messages with real ones
      setMessages(prev => [
        ...prev.filter(m => !m.isOptimistic),
        { ...userMessage, isOptimistic: false },
        aiMessage,
      ]);

      // Trigger credit update
      creditUpdateEvent.dispatchEvent(new Event('creditsChanged'));

      // Auto-update conversation title from first message
      if (messages.length === 0) {
        const title = message.length > 40 ? message.slice(0, 40) + '…' : message;
        await supabase
          .from('ai_conversations')
          .update({ title })
          .eq('id', conversationId);
      }

      return result;
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic messages on error
      setMessages(prev => prev.filter(m => !m.isOptimistic));
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

  const implementPlan = async (plan: any, requestId: string) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

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

      const { data: result, error: invokeError } = await supabase.functions.invoke('calendar', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: 'bulk_create', data: { posts: normalizedPosts, requestId } }
      });

      if (invokeError) throw invokeError;

      toast({
        title: "Plan implementerad!",
        description: `${result.created?.length || 0} inlägg skapade.`,
      });

      if (conversationId) {
        await supabase.from('ai_chat_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          message: `Plan implementerad! ${result.created?.length || 0} inlägg har lagts till i kalendern.`,
        });

        const confirmMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          message: `Plan implementerad! ${result.created?.length || 0} inlägg har lagts till i kalendern.`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, confirmMessage]);
      }

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

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const hasMessages = messages.length > 0;

  return {
    messages,
    loading,
    error,
    hasMessages,
    sendMessage,
    implementPlan,
    fetchMessages,
  };
};
