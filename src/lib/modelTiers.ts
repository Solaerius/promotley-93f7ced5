import { Zap, Sparkles, Brain } from 'lucide-react';

export type ModelTier = 'fast' | 'standard' | 'premium';

export interface ModelTierConfig {
  id: ModelTier;
  label: string;
  icon: typeof Zap;
  description: string;
  creditMultiplier: number;
  defaultModel: string;
  modelPool: string[];
}

export const MODEL_TIERS: Record<ModelTier, ModelTierConfig> = {
  fast: {
    id: 'fast',
    label: 'Snabb',
    icon: Zap,
    description: 'Snabba svar, lägre kostnad – AI väljer optimal modell',
    creditMultiplier: 0.5,
    defaultModel: 'google/gemini-2.5-flash-lite',
    modelPool: ['google/gemini-2.5-flash-lite', 'openai/gpt-5-nano'],
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    icon: Sparkles,
    description: 'Balanserad kvalitet – AI väljer bästa modellen för din fråga',
    creditMultiplier: 1,
    defaultModel: 'google/gemini-3-flash-preview',
    modelPool: ['google/gemini-3-flash-preview', 'google/gemini-2.5-flash', 'openai/gpt-5-mini'],
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    icon: Brain,
    description: 'Bästa kvalitet – AI Council väljer toppmodell för komplexa uppgifter',
    creditMultiplier: 2,
    defaultModel: 'google/gemini-2.5-pro',
    modelPool: ['google/gemini-2.5-pro', 'google/gemini-3-pro-preview', 'openai/gpt-5', 'openai/gpt-5.2'],
  },
};

export const TIER_ORDER: ModelTier[] = ['fast', 'standard', 'premium'];

export const getEstimatedCost = (baseCost: number, tier: ModelTier): number => {
  return Math.max(1, Math.ceil(baseCost * MODEL_TIERS[tier].creditMultiplier));
};
