// Provider-agnostiskt anrop till AI. Tar modell-ID, dirigerar till rätt provider.

import { MODEL_CATALOG } from './ai-models-catalog.ts';

export interface AICallParams {
  modelId: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AICallResult {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
}

export async function callAI(params: AICallParams): Promise<AICallResult> {
  const model = MODEL_CATALOG[params.modelId];
  if (!model) throw new Error(`Unknown model: ${params.modelId}`);

  if (model.provider === 'openai') {
    return callOpenAI(params, model);
  }
  if (model.provider === 'anthropic') {
    return callAnthropic(params, model);
  }
  throw new Error(`Unsupported provider: ${model.provider}`);
}

async function callOpenAI(params: AICallParams, model: any): Promise<AICallResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const body: any = {
    model: params.modelId,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userPrompt },
    ],
    temperature: params.temperature ?? 0.5,
  };
  if (params.maxTokens) body.max_tokens = params.maxTokens;
  if (params.jsonMode) body.response_format = { type: 'json_object' };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

  return {
    text,
    usage: {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd:
        (usage.prompt_tokens / 1_000_000) * model.inputCostPer1M +
        (usage.completion_tokens / 1_000_000) * model.outputCostPer1M,
    },
  };
}

async function callAnthropic(params: AICallParams, model: any): Promise<AICallResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.modelId,
      max_tokens: params.maxTokens ?? 2048,
      temperature: params.temperature ?? 0.5,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userPrompt }],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Anthropic error ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text || '';
  const usage = data.usage || { input_tokens: 0, output_tokens: 0 };

  return {
    text,
    usage: {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costUsd:
        (usage.input_tokens / 1_000_000) * model.inputCostPer1M +
        (usage.output_tokens / 1_000_000) * model.outputCostPer1M,
    },
  };
}

/**
 * Konverterar USD-kostnad till krediter baserat på cachad SEK-kurs.
 * Formel: cost_usd × usd_to_sek × 1.18 (moms) / 0.10 (1 kredit = 0.10 kr)
 */
export async function usdToCredits(supabase: any, costUsd: number): Promise<number> {
  // Hämta cachad kurs
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'usd_to_sek_rate')
    .maybeSingle();

  const rate = (data?.value as any)?.rate || 10.5; // fallback
  const credits = Math.ceil((costUsd * rate * 1.18) / 0.10);
  return Math.max(1, credits);
}
