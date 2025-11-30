/**
 * Plan Configuration for Promotley UF
 * Single source of truth for AI model mappings and credit policies
 */

export type PlanType = 'free_trial' | 'pro' | 'pro_xl' | 'pro_unlimited';

export interface PlanConfig {
  model: string;
  credits: number;
  features: string[];
  displayName: string;
  price: number;
  tier: 'starter' | 'growth' | 'pro' | 'unlimited';
  isActive: boolean;
}

/**
 * CONFIG.MODEL_BY_TIER - Single source of truth
 * This mapping MUST be enforced server-side
 */
export const MODEL_BY_TIER = {
  starter: 'gpt-4o-mini',
  growth: 'gpt-4o-mini', 
  pro: 'gpt-4o',
  unlimited: 'gpt-4o'
} as const;

/**
 * Credit cost per AI request by tier
 */
export const CREDIT_COST_BY_TIER = {
  starter: 2,
  growth: 1,
  pro: 1,
  unlimited: 0
} as const;

/**
 * Get plan configuration based on plan type
 * Maps database plan values to AI model settings
 */
export function getPlanConfig(plan: PlanType): PlanConfig {
  switch (plan) {
    case 'free_trial':
      return {
        model: MODEL_BY_TIER.starter,
        credits: 50,
        features: ['basic_strategy', 'tips'],
        displayName: 'UF Starter',
        price: 29,
        tier: 'starter',
        isActive: true
      };

    case 'pro':
      return {
        model: MODEL_BY_TIER.growth,
        credits: 100,
        features: ['calendar', 'ideas', 'analysis'],
        displayName: 'UF Growth',
        price: 49,
        tier: 'growth',
        isActive: true
      };

    case 'pro_xl':
      return {
        model: MODEL_BY_TIER.pro,
        credits: 300,
        features: ['advanced', 'creative', 'competitors', 'reports'],
        displayName: 'UF Pro',
        price: 99,
        tier: 'pro',
        isActive: true
      };

    case 'pro_unlimited':
      return {
        model: MODEL_BY_TIER.unlimited,
        credits: 999999,
        features: ['advanced', 'creative', 'competitors', 'reports', 'unlimited'],
        displayName: 'UF Pro Unlimited',
        price: 199,
        tier: 'unlimited',
        isActive: true
      };

    default:
      return {
        model: MODEL_BY_TIER.starter,
        credits: 50,
        features: ['basic_strategy', 'tips'],
        displayName: 'UF Starter',
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
  
  if (config.tier !== 'unlimited' && creditsLeft <= 0) {
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
