// Centraliserad katalog över tillgängliga AI-modeller.
// Priser i USD per 1M tokens (input / output). Uppdateras manuellt.
// Routern får denna katalog som kontext för att välja optimal modell.

export interface ModelInfo {
  id: string;
  provider: 'openai' | 'google' | 'anthropic';
  displayName: string;
  inputCostPer1M: number;   // USD per 1M input tokens
  outputCostPer1M: number;  // USD per 1M output tokens
  strengths: string[];
  bestFor: string[];
  speed: 'snabb' | 'medel' | 'långsam';
  qualityRank: number; // 1-10, högre = bättre
  supportsTools: boolean;
  contextWindow: number;
}

// Modellerna som faktiskt är tillgängliga via våra API-nycklar.
// OBS: anthropic-modeller används bara om ANTHROPIC_API_KEY finns.
export const MODEL_CATALOG: Record<string, ModelInfo> = {
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4o Mini',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    strengths: ['snabb', 'billig', 'bra för enkla uppgifter'],
    bestFor: ['classification', 'short_answer', 'simple_chat', 'routing'],
    speed: 'snabb',
    qualityRank: 5,
    supportsTools: true,
    contextWindow: 128000,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    strengths: ['hög kvalitet', 'bra resonemang', 'multimodal'],
    bestFor: ['marketing_plans', 'deep_analysis', 'creative_writing', 'strategy'],
    speed: 'medel',
    qualityRank: 8,
    supportsTools: true,
    contextWindow: 128000,
  },
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Sonnet',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    strengths: ['bästa svenska', 'långa analyser', 'nyanserad ton', 'forskning'],
    bestFor: ['sales_radar_deep', 'long_form_analysis', 'swedish_copy', 'research'],
    speed: 'medel',
    qualityRank: 9,
    supportsTools: true,
    contextWindow: 200000,
  },
  'claude-3-5-haiku-20241022': {
    id: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Haiku',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    strengths: ['snabb', 'bra svenska', 'billig'],
    bestFor: ['short_swedish_copy', 'caption_generation', 'hashtag_ideas'],
    speed: 'snabb',
    qualityRank: 6,
    supportsTools: true,
    contextWindow: 200000,
  },
};

// Vilka modeller får routern välja mellan baserat på plan-tier.
export const TIER_MODEL_POOLS: Record<string, string[]> = {
  fast: ['gpt-4o-mini'],
  standard: ['gpt-4o-mini', 'gpt-4o', 'claude-3-5-haiku-20241022'],
  premium: ['gpt-4o', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
};

export function getAvailableModels(tier: string, hasAnthropicKey: boolean): ModelInfo[] {
  const pool = TIER_MODEL_POOLS[tier] || TIER_MODEL_POOLS.standard;
  return pool
    .map(id => MODEL_CATALOG[id])
    .filter(m => m && (m.provider !== 'anthropic' || hasAnthropicKey));
}

/**
 * Bygger en kort textbeskrivning av tillgängliga modeller (för router-prompten).
 */
export function buildModelCatalogPrompt(models: ModelInfo[]): string {
  return models.map(m =>
    `- ${m.id} (${m.provider}): ${m.displayName}
   Pris: $${m.inputCostPer1M}/$${m.outputCostPer1M} per 1M tokens (in/out)
   Hastighet: ${m.speed}, Kvalitet: ${m.qualityRank}/10
   Styrkor: ${m.strengths.join(', ')}
   Bäst för: ${m.bestFor.join(', ')}`
  ).join('\n\n');
}
