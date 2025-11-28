/**
 * Plan Configuration for Promotley UF
 * Maps subscription plans to AI models and features
 */

export type PlanType = 'free_trial' | 'pro' | 'pro_xl' | 'pro_unlimited';

export interface PlanConfig {
  model: string;
  credits: number;
  features: string[];
  displayName: string;
  price: number;
}

/**
 * Get plan configuration based on plan type
 * Maps database plan values to AI model settings
 */
export function getPlanConfig(plan: PlanType): PlanConfig {
  switch (plan) {
    case 'free_trial':
      // UF Starter - 29 kr/mån
      return {
        model: 'gpt-4o-mini',
        credits: 50,
        features: ['basic_strategy', 'tips'],
        displayName: 'UF Starter',
        price: 29,
      };

    case 'pro':
      // UF Growth - 49 kr/mån
      return {
        model: 'gpt-4.1-mini',
        credits: 100,
        features: ['calendar', 'ideas', 'analysis'],
        displayName: 'UF Growth',
        price: 49,
      };

    case 'pro_xl':
      // UF Pro - 99 kr/mån
      return {
        model: 'gpt-5.1',
        credits: 300,
        features: ['advanced', 'creative', 'competitors', 'reports'],
        displayName: 'UF Pro',
        price: 99,
      };

    case 'pro_unlimited':
      // Legacy unlimited plan
      return {
        model: 'gpt-5.1',
        credits: 1000,
        features: ['advanced', 'creative', 'competitors', 'reports', 'unlimited'],
        displayName: 'UF Pro Unlimited',
        price: 199,
      };

    default:
      // Default to starter
      return {
        model: 'gpt-4o-mini',
        credits: 50,
        features: ['basic_strategy', 'tips'],
        displayName: 'UF Starter',
        price: 29,
      };
  }
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
