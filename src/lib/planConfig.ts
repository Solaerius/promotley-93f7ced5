/**
 * Plan Configuration for Promotley
 * Single source of truth for plan limits, AI model defaults, and feature gating.
 *
 * IMPORTANT: Credit values are duplicated in
 * supabase/functions/stripe-webhook -- update both when changing.
 */

export type PlanType = 'free_trial' | 'starter' | 'growth' | 'max' | 'pro' | 'pro_xl' | 'pro_unlimited';

export type FeatureKey =
  | 'ai_chat'
  | 'content_ideas_basic'
  | 'content_ideas_advanced'
  | 'content_ideas_premium'
  | 'caption_generator'
  | 'hashtag_suggestions'
  | 'uf_tips'
  | 'weekly_planner'
  | 'marketing_plans'
  | 'sales_radar'
  | 'ai_analysis_basic'
  | 'ai_analysis_deep'
  | 'ai_analysis_premium'
  | 'manual_scheduling'
  | 'calendar'
  | 'tiktok_connection'
  | 'meta_connection'
  | 'team_organizations';

export interface PlanLimits {
  caption_per_month: number;            // -1 = unlimited
  marketing_plans_per_month: number;
  sales_radar_per_month: number;
  manual_schedules_per_month: number;
  team_organizations: number;
}

export interface PlanConfig {
  id: PlanType;
  displayName: string;
  price: number;             // SEK / month
  credits: number;
  dailyCreditCap: number;    // 0 = no daily cap
  tier: number;              // 0..4 — used for "is higher" comparisons
  isActive: boolean;
  limits: PlanLimits;
  features: FeatureKey[];
}

const UNLIMITED = -1;

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  free_trial: {
    id: 'free_trial',
    displayName: 'Free',
    price: 0,
    credits: 30,
    dailyCreditCap: 5,
    tier: 0,
    isActive: true,
    limits: {
      caption_per_month: 3,
      marketing_plans_per_month: 0,
      sales_radar_per_month: 0,
      manual_schedules_per_month: 3,
      team_organizations: 1,
    },
    features: [
      'ai_chat',
      'content_ideas_basic',
      'caption_generator',
      'hashtag_suggestions',
      'uf_tips',
      'manual_scheduling',
      'calendar',
      'tiktok_connection',
      'meta_connection',
    ],
  },
  starter: {
    id: 'starter',
    displayName: 'Starter',
    price: 49,
    credits: 250,
    dailyCreditCap: 0,
    tier: 1,
    isActive: true,
    limits: {
      caption_per_month: UNLIMITED,
      marketing_plans_per_month: 1,
      sales_radar_per_month: 0,
      manual_schedules_per_month: 10,
      team_organizations: 1,
    },
    features: [
      'ai_chat',
      'content_ideas_basic',
      'caption_generator',
      'hashtag_suggestions',
      'uf_tips',
      'weekly_planner',
      'marketing_plans',
      'ai_analysis_basic',
      'manual_scheduling',
      'calendar',
      'tiktok_connection',
      'meta_connection',
    ],
  },
  growth: {
    id: 'growth',
    displayName: 'Growth',
    price: 159,
    credits: 950,
    dailyCreditCap: 0,
    tier: 2,
    isActive: true,
    limits: {
      caption_per_month: UNLIMITED,
      marketing_plans_per_month: 5,
      sales_radar_per_month: 10,
      manual_schedules_per_month: UNLIMITED,
      team_organizations: 3,
    },
    features: [
      'ai_chat',
      'content_ideas_basic',
      'content_ideas_advanced',
      'caption_generator',
      'hashtag_suggestions',
      'uf_tips',
      'weekly_planner',
      'marketing_plans',
      'sales_radar',
      'ai_analysis_basic',
      'ai_analysis_deep',
      'manual_scheduling',
      'calendar',
      'tiktok_connection',
      'meta_connection',
      'team_organizations',
    ],
  },
  max: {
    id: 'max',
    displayName: 'Max',
    price: 299,
    credits: 2000,
    dailyCreditCap: 0,
    tier: 3,
    isActive: true,
    limits: {
      caption_per_month: UNLIMITED,
      marketing_plans_per_month: UNLIMITED,
      sales_radar_per_month: UNLIMITED,
      manual_schedules_per_month: UNLIMITED,
      team_organizations: UNLIMITED,
    },
    features: [
      'ai_chat',
      'content_ideas_basic',
      'content_ideas_advanced',
      'content_ideas_premium',
      'caption_generator',
      'hashtag_suggestions',
      'uf_tips',
      'weekly_planner',
      'marketing_plans',
      'sales_radar',
      'ai_analysis_basic',
      'ai_analysis_deep',
      'ai_analysis_premium',
      'manual_scheduling',
      'calendar',
      'tiktok_connection',
      'meta_connection',
      'team_organizations',
    ],
  },
  // Legacy plans kept for backwards compatibility — map to the closest new plan
  pro: { ...PLAN_CONFIGS_LEGACY('pro', 'growth') } as any,
  pro_xl: { ...PLAN_CONFIGS_LEGACY('pro_xl', 'max') } as any,
  pro_unlimited: { ...PLAN_CONFIGS_LEGACY('pro_unlimited', 'max') } as any,
};

// Helper used inline above — defined as function so we can self-reference PLAN_CONFIGS later
function PLAN_CONFIGS_LEGACY(legacyId: PlanType, mapTo: PlanType): PlanConfig {
  return {
    id: legacyId,
    displayName: legacyId === 'pro' ? 'Growth' : 'Max',
    price: legacyId === 'pro' ? 159 : 299,
    credits: legacyId === 'pro' ? 950 : 2000,
    dailyCreditCap: 0,
    tier: legacyId === 'pro' ? 2 : 3,
    isActive: true,
    limits: {
      caption_per_month: -1,
      marketing_plans_per_month: legacyId === 'pro' ? 5 : -1,
      sales_radar_per_month: legacyId === 'pro' ? 10 : -1,
      manual_schedules_per_month: -1,
      team_organizations: legacyId === 'pro' ? 3 : -1,
    },
    features: legacyId === 'pro'
      ? ['ai_chat','content_ideas_basic','content_ideas_advanced','caption_generator','hashtag_suggestions','uf_tips','weekly_planner','marketing_plans','sales_radar','ai_analysis_basic','ai_analysis_deep','manual_scheduling','calendar','tiktok_connection','meta_connection','team_organizations']
      : ['ai_chat','content_ideas_basic','content_ideas_advanced','content_ideas_premium','caption_generator','hashtag_suggestions','uf_tips','weekly_planner','marketing_plans','sales_radar','ai_analysis_basic','ai_analysis_deep','ai_analysis_premium','manual_scheduling','calendar','tiktok_connection','meta_connection','team_organizations'],
  };
}

export function getPlanConfig(plan: PlanType | string | null | undefined): PlanConfig {
  if (!plan) return PLAN_CONFIGS.free_trial;
  return PLAN_CONFIGS[plan as PlanType] ?? PLAN_CONFIGS.free_trial;
}

export function planHasFeature(plan: PlanType | string | null | undefined, feature: FeatureKey): boolean {
  return getPlanConfig(plan).features.includes(feature);
}

/**
 * Returns the lowest plan that includes the given feature (for upgrade prompts).
 */
export function minPlanForFeature(feature: FeatureKey): PlanConfig {
  const ordered: PlanType[] = ['free_trial', 'starter', 'growth', 'max'];
  for (const id of ordered) {
    if (PLAN_CONFIGS[id].features.includes(feature)) return PLAN_CONFIGS[id];
  }
  return PLAN_CONFIGS.max;
}

export function isHigherPlan(a: PlanType | string, b: PlanType | string): boolean {
  return getPlanConfig(a).tier > getPlanConfig(b).tier;
}

/**
 * Backwards-compatible shim used by older code paths.
 * AI model selection now lives in the AI router; this just returns a sensible default.
 */
export function enforceModelPolicy(_tier: string, _requestedModel?: string): string {
  return 'google/gemini-2.5-flash';
}

export function hasAIAccess(
  plan: PlanType | string,
  creditsLeft: number
): { allowed: boolean; reason?: string; tier: string } {
  const config = getPlanConfig(plan);
  if (!config.isActive) return { allowed: false, reason: 'no_active_plan', tier: config.id };
  if (creditsLeft <= 0) return { allowed: false, reason: 'insufficient_credits', tier: config.id };
  return { allowed: true, tier: config.id };
}
