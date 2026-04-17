import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdminStatus } from './useAdminStatus';

interface FeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  isAdmin: boolean;
  /** True if the flag is OFF for normal users but the current user is an admin (sandbox preview). */
  adminOnly: boolean;
}

/**
 * Returns whether a "coming soon" feature is enabled.
 * Admins always get access (sandbox preview). Normal users only see it when the flag is on.
 */
export function useFeatureFlag(flagKey: string): FeatureFlagResult {
  const { user } = useAuth();
  const { isAdmin } = useAdminStatus();
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [userOverride, setUserOverride] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('enabled_globally, user_id')
          .eq('flag_key', flagKey);

        if (cancelled) return;
        if (error) {
          console.error('[useFeatureFlag] error', error);
          setLoading(false);
          return;
        }

        const globalRow = data?.find(r => r.user_id === null);
        const userRow = user ? data?.find(r => r.user_id === user.id) : null;
        setGlobalEnabled(globalRow?.enabled_globally ?? false);
        setUserOverride(userRow ? userRow.enabled_globally : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [flagKey, user?.id]);

  const effective = userOverride ?? globalEnabled;
  const enabled = effective || isAdmin; // admins always preview

  return {
    enabled,
    loading,
    isAdmin,
    adminOnly: isAdmin && !effective,
  };
}
