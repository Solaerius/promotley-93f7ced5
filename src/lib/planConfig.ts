/**
 * Plan Configuration for Promotley UF
 * Single source of truth for AI model mappings and credit policies
 */

export type PlanType = 'starter' | 'growth' | 'pro';

export interface PlanConfig {
  model: string;
  credits: number;
  features: string[];
  displayName: string;
  price: number;
  tier: 'starter' | 'growth' | 'pro';
  isActive: boolean;
}

/**
 * CONFIG.MODEL_BY_TIER - Single source of truth
 * This mapping MUST be enforced server-side
 * Starter → GPT-4o Mini, Growth → GPT-4.1 Mini, Pro → GPT-4o
 */
export const MODEL_BY_TIER = {
  starter: 'gpt-4o-mini',
  growth: 'gpt-4.1-mini-2025-04-14', 
  pro: 'gpt-4.1-mini-2025-04-14'
} as const;

/**
 * Premium model for Pro tier (used for deep analysis and marketing plans)
 */
export const PREMIUM_MODEL_BY_TIER = {
  pro: 'gpt-4o'
} as const;

/**
 * Credit cost per AI request by tier
 */
export const CREDIT_COST_BY_TIER = {
  starter: 2,
  growth: 1,
  pro: 1
} as const;

/**
 * Get plan configuration based on plan type
 * Maps database plan values to AI model settings
 */
export function getPlanConfig(plan: PlanType): PlanConfig {
  switch (plan) {
    case 'starter':
      return {
        model: MODEL_BY_TIER.starter,
        credits: 50,
        features: ['basic_strategy', 'tips'],
        displayName: 'Starter',
        price: 29,
        tier: 'starter',
        isActive: true
      };

    case 'growth':
      return {
        model: MODEL_BY_TIER.growth,
        credits: 100,
        features: ['calendar', 'ideas', 'analysis'],
        displayName: 'Growth',
        price: 49,
        tier: 'growth',
        isActive: true
      };

    case 'pro':
      return {
        model: MODEL_BY_TIER.pro,
        credits: 200,
        features: ['advanced', 'creative', 'competitors', 'reports', 'premium_analysis', 'premium_plans'],
        displayName: 'Pro',
        price: 99,
        tier: 'pro',
        isActive: true
      };

    default:
      return {
        model: MODEL_BY_TIER.starter,
        credits: 50,
        features: ['basic_strategy', 'tips'],
        displayName: 'Starter',
        price: 29,
        tier: 'starter',
        isActive: false
      };
  }
}

/**
 * Verify that the requested model matches the tier's allowed model
 * Returns true if valid, throws error if policy violation detected
 */
export function enforceModelPolicy(tier: string, requestedModel?: string): string {
  const allowedModel = MODEL_BY_TIER[tier as keyof typeof MODEL_BY_TIER] || MODEL_BY_TIER.starter;
  
  if (requestedModel && requestedModel !== allowedModel) {
    console.error('POLICY_VIOLATION: Model mismatch', {
      tier,
      requested: requestedModel,
      allowed: allowedModel,
      timestamp: new Date().toISOString()
    });
    // Return allowed model, ignore client override
    return allowedModel;
  }
  
  return allowedModel;
}

/**
 * Check if user has valid plan with AI access
 */
export function hasAIAccess(plan: PlanType, creditsLeft: number): { 
  allowed: boolean; 
  reason?: string;
  tier: string;
} {
  const config = getPlanConfig(plan);
  
  if (!config.isActive) {
    return {
      allowed: false,
      reason: 'no_active_plan',
      tier: config.tier
    };
  }
  
  if (creditsLeft <= 0) {
    return {
      allowed: false,
      reason: 'insufficient_credits',
      tier: config.tier
    };
  }
  
  return {
    allowed: true,
    tier: config.tier
  };
}

/**
 * Check if user has credits remaining
 */
export function hasCreditsRemaining(creditsUsed: number, maxCredits: number): boolean {
  return creditsUsed < maxCredits;
}

/**
 * Calculate credits remaining
 */
export function getCreditsRemaining(creditsUsed: number, maxCredits: number): number {
  return Math.max(0, maxCredits - creditsUsed);
}

/**
 * Check if renewal date has passed
 */
export function shouldResetCredits(renewalDate: string): boolean {
  const now = new Date();
  const renewal = new Date(renewalDate);
  return now >= renewal;
}
