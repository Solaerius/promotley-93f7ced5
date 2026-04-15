import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchConversations = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setConversations((data as AIConversation[]) || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (title?: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: session.user.id,
          title: title || t('conv_hooks.new_conversation'),
        })
        .select()
        .single();

      if (error) throw error;
      const conv = data as AIConversation;
      setConversations(prev => [conv, ...prev]);
      setActiveConversationId(conv.id);
      return conv.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      toast({ title: t('common.error'), description: t('toasts.could_not_create_conv'), variant: "destructive" });
      return null;
    }
  }, [toast]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast({ title: t('common.error'), description: t('toasts.could_not_delete_conv'), variant: "destructive" });
    }
  }, [activeConversationId, toast]);

  const updateTitle = useCallback(async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', id);

      if (error) throw error;
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, title } : c)
      );
    } catch (err) {
      console.error('Error updating conversation title:', err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    loading,
    createConversation,
    deleteConversation,
    updateTitle,
    fetchConversations,
  };
};
