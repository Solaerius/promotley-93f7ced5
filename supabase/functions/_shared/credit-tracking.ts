// Hjälpfunktion för att logga kreditanvändning till credit_transactions.

export async function logCreditTransaction(
  supabase: any,
  params: {
    userId: string;
    functionName: string;
    creditsUsed: number;
    costUsd?: number;
    model?: string;
    organizationId?: string | null;
    metadata?: Record<string, any>;
  }
) {
  try {
    await supabase.from('credit_transactions').insert({
      user_id: params.userId,
      function_name: params.functionName,
      credits_used: params.creditsUsed,
      cost_usd: params.costUsd ?? null,
      model: params.model ?? null,
      organization_id: params.organizationId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.warn('Failed to log credit transaction:', err);
  }
}
