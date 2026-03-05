import { Zap, Sparkles, Brain } from 'lucide-react';

export type ModelTier = 'fast' | 'standard' | 'premium';

export interface ModelTierConfig {
  id: ModelTier;
  label: string;
  icon: typeof Zap;
  emoji: string;
  description: string;
  creditMultiplier: number;
  model: string;
}

export const MODEL_TIERS: Record<ModelTier, ModelTierConfig> = {
  fast: {
    id: 'fast',
    label: 'Snabb',
    icon: Zap,
    emoji: '⚡',
    description: 'Snabba svar, lägre kostnad',
    creditMultiplier: 0.5,
    model: 'google/gemini-2.5-flash-lite',
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    icon: Sparkles,
    emoji: '✨',
    description: 'Balanserad kvalitet och kostnad',
    creditMultiplier: 1,
    model: 'google/gemini-3-flash-preview',
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    icon: Brain,
    emoji: '🧠',
    description: 'Bästa kvalitet, högre kostnad',
    creditMultiplier: 2,
    model: 'google/gemini-2.5-pro',
  },
};

export const TIER_ORDER: ModelTier[] = ['fast', 'standard', 'premium'];

export const getEstimatedCost = (baseCost: number, tier: ModelTier): number => {
  return Math.max(1, Math.ceil(baseCost * MODEL_TIERS[tier].creditMultiplier));
};
