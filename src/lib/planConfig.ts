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
  tier: number;              // 0..3 — used for "is higher" comparisons
  isActive: boolean;
  limits: PlanLimits;
  features: FeatureKey[];
}

const UNLIMITED = -1;

const FREE: PlanConfig = {
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
};

const STARTER: PlanConfig = {
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
};

const GROWTH: PlanConfig = {
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
};

const MAX_PLAN: PlanConfig = {
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
};

// Legacy plans → mapped to closest new plan, but keep their original id.
const PRO_LEGACY: PlanConfig = { ...GROWTH, id: 'pro' };
const PRO_XL_LEGACY: PlanConfig = { ...MAX_PLAN, id: 'pro_xl' };
const PRO_UNLIMITED_LEGACY: PlanConfig = { ...MAX_PLAN, id: 'pro_unlimited' };

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  free_trial: FREE,
  starter: STARTER,
  growth: GROWTH,
  max: MAX_PLAN,
  pro: PRO_LEGACY,
  pro_xl: PRO_XL_LEGACY,
  pro_unlimited: PRO_UNLIMITED_LEGACY,
};

/** Plans shown on the public pricing page (in display order). */
export const PUBLIC_PLANS: PlanConfig[] = [FREE, STARTER, GROWTH, MAX_PLAN];

export function getPlanConfig(plan: PlanType | string | null | undefined): PlanConfig {
  if (!plan) return FREE;
  return PLAN_CONFIGS[plan as PlanType] ?? FREE;
}

export function planHasFeature(plan: PlanType | string | null | undefined, feature: FeatureKey): boolean {
  return getPlanConfig(plan).features.includes(feature);
}

/** Lowest plan that includes the given feature (used for upgrade prompts). */
export function minPlanForFeature(feature: FeatureKey): PlanConfig {
  for (const p of PUBLIC_PLANS) {
    if (p.features.includes(feature)) return p;
  }
  return MAX_PLAN;
}

export function isHigherPlan(a: PlanType | string, b: PlanType | string): boolean {
  return getPlanConfig(a).tier > getPlanConfig(b).tier;
}

/**
 * Backwards-compatible shim used by older code paths.
 * Real model selection happens in the AI router.
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
