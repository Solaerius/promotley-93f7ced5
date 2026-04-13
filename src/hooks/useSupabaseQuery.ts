import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Generic hook for authenticated Supabase queries.
 * Handles auth check, loading state, and error state.
 *
 * @example
 * const { data, loading, error, refetch } = useSupabaseQuery(async (userId) => {
 *   const { data, error } = await supabase
 *     .from('users')
 *     .select('plan, credits_left')
 *     .eq('id', userId)
 *     .single();
 *   if (error) throw error;
 *   return data;
 * });
 */
export function useSupabaseQuery<T>(
  fetcher: (userId: string) => Promise<T | null>,
  deps: unknown[] = []
): QueryState<T> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ data: null, loading: false, error: null });
        return;
      }
      const data = await fetcher(user.id);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
