import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Connection {
  id: string;
  provider: string;
  username: string | null;
  connected_at: string;
}

export const useConnections = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setConnections([]);
        return;
      }

      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('user_id', session.user.id)
        .order('connected_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const isConnected = (provider: string) => {
    return connections.some(c => c.provider === provider);
  };

  const getConnection = (provider: string) => {
    return connections.find(c => c.provider === provider);
  };

  return {
    connections,
    loading,
    error,
    loadConnections,
    isConnected,
    getConnection,
  };
};
