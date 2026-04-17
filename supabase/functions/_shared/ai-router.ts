// Smart AI Router — väljer optimal modell + skills baserat på request.
// Använder en billig router-modell (gpt-4o-mini) som ser hela katalogen.

import { MODEL_CATALOG, TIER_MODEL_POOLS, getAvailableModels, buildModelCatalogPrompt, type ModelInfo } from './ai-models-catalog.ts';
import { AI_SKILLS, buildSkillsCatalog } from './ai-skills/index.ts';

export interface RouteRequest {
  functionName: string;          // 'ai-assistant' | 'generate-suggestion' | 'sales-radar' | etc
  taskType: string;              // 'chat' | 'caption' | 'analysis' | 'sales-radar' | 'marketing-plan'
  userMessage?: string;          // Det användaren faktiskt skickade
  tier: 'fast' | 'standard' | 'premium';
  hasProfile?: boolean;
  contextSize?: 'small' | 'medium' | 'large';
}

export interface RouteResult {
  model: string;                 // ID på vald modell
  modelInfo: ModelInfo;
  skills: string[];              // Keys på valda skills
  reasoning: string;             // Varför routern valde detta
}

const ROUTER_MODEL = 'gpt-4o-mini';

export async function routeAIRequest(
  req: RouteRequest,
  openaiApiKey: string,
  hasAnthropicKey: boolean = false
): Promise<RouteResult> {
  const availableModels = getAvailableModels(req.tier, hasAnthropicKey);

  // Snabb fallback om bara en modell finns
  if (availableModels.length === 1) {
    return {
      model: availableModels[0].id,
      modelInfo: availableModels[0],
      skills: defaultSkillsForTask(req.taskType),
      reasoning: 'Endast en modell tillgänglig för denna plan',
    };
  }

  const catalogText = buildModelCatalogPrompt(availableModels);
  const skillsText = buildSkillsCatalog();

  const routerPrompt = `Du är en AI-router som väljer optimal modell + skills för en svensk marknadsförings-plattform (UF-företag).

TILLGÄNGLIGA MODELLER:
${catalogText}

TILLGÄNGLIGA SKILLS:
${skillsText}

VÄLJ:
1. EN modell-ID från listan ovan (balansera kvalitet vs pris).
2. 2-4 skills som passar uppgiften.
3. Förklara kortfattat varför.

REQUEST:
- Funktion: ${req.functionName}
- Uppgift: ${req.taskType}
- Användarprofil ifylld: ${req.hasProfile ? 'ja' : 'nej'}
- Kontextstorlek: ${req.contextSize || 'medium'}
${req.userMessage ? `- Meddelande (förkortat): "${req.userMessage.slice(0, 200)}"` : ''}

Svara ENDAST som JSON:
{"model":"<id>","skills":["<key1>","<key2>"],"reasoning":"<en mening>"}`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ROUTER_MODEL,
        messages: [{ role: 'system', content: routerPrompt }],
        temperature: 0,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      console.warn('Router call failed:', resp.status);
      return fallback(availableModels, req);
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    const validModel = availableModels.find(m => m.id === parsed.model);
    const validSkills = (parsed.skills || []).filter((k: string) => AI_SKILLS[k]);

    if (!validModel) {
      console.warn('Router picked invalid model:', parsed.model);
      return fallback(availableModels, req);
    }

    console.log(`🧭 Router → ${validModel.id}, skills: ${validSkills.join(', ')}`);
    return {
      model: validModel.id,
      modelInfo: validModel,
      skills: validSkills.length > 0 ? validSkills : defaultSkillsForTask(req.taskType),
      reasoning: parsed.reasoning || 'Router val',
    };
  } catch (err) {
    console.warn('Router error:', err);
    return fallback(availableModels, req);
  }
}

function fallback(models: ModelInfo[], req: RouteRequest): RouteResult {
  // Default: välj billigaste/snabbaste i poolen
  const sorted = [...models].sort((a, b) => a.inputCostPer1M - b.inputCostPer1M);
  const chosen = sorted[0];
  return {
    model: chosen.id,
    modelInfo: chosen,
    skills: defaultSkillsForTask(req.taskType),
    reasoning: 'Fallback: billigaste modellen i poolen',
  };
}

function defaultSkillsForTask(taskType: string): string[] {
  switch (taskType) {
    case 'caption':
    case 'suggestion':
      return ['caption-writing', 'hashtag-strategy', 'swedish-tone'];
    case 'sales-radar':
      return ['marketing-fundamentals', 'data-explanation', 'swedish-tone'];
    case 'analysis':
      return ['data-explanation', 'marketing-fundamentals', 'swedish-tone'];
    case 'marketing-plan':
      return ['marketing-fundamentals', 'tiktok-trends', 'instagram-best-practices', 'swedish-tone'];
    case 'chat':
    default:
      return ['marketing-fundamentals', 'swedish-tone'];
  }
}

/**
 * Loggar routning-beslut till databasen för analys.
 */
export async function logRouting(
  supabase: any,
  params: {
    userId: string;
    functionName: string;
    selectedModel: string;
    skills: string[];
    reasoning: string;
    estimatedCredits?: number;
    actualCredits?: number;
  }
) {
  try {
    await supabase.from('ai_routing_log').insert({
      user_id: params.userId,
      function_name: params.functionName,
      selected_model: params.selectedModel,
      skills_injected: params.skills,
      reasoning: params.reasoning,
      estimated_credits: params.estimatedCredits,
      actual_credits: params.actualCredits,
    });
  } catch (err) {
    console.warn('Failed to log routing:', err);
  }
}
