import { useUserCredits } from './useUserCredits';
import { getPlanConfig, minPlanForFeature, planHasFeature, FeatureKey } from '@/lib/planConfig';

export interface FeatureAccessResult {
  allowed: boolean;
  loading: boolean;
  currentPlanName: string;
  requiredPlanName: string;
  reason: 'allowed' | 'requires_upgrade' | 'loading';
}

/**
 * Hard plan gating. Use the returned `allowed` to disable UI, and surface
 * `requiredPlanName` in tooltips / upgrade modals.
 */
export function useFeatureAccess(feature: FeatureKey): FeatureAccessResult {
  const { credits, loading } = useUserCredits();

  if (loading) {
    return {
      allowed: false,
      loading: true,
      currentPlanName: '',
      requiredPlanName: '',
      reason: 'loading',
    };
  }

  const currentPlan = getPlanConfig(credits?.plan);
  const allowed = planHasFeature(credits?.plan, feature);
  const required = minPlanForFeature(feature);

  return {
    allowed,
    loading: false,
    currentPlanName: currentPlan.displayName,
    requiredPlanName: required.displayName,
    reason: allowed ? 'allowed' : 'requires_upgrade',
  };
}
