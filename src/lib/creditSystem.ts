/**
 * Credit Reservation and Settlement System
 * Handles atomic credit transactions with rollback support
 */

export interface CreditReservation {
  requestId: string;
  userId: string;
  reserved: number;
  timestamp: number;
}

export interface CreditTransaction {
  requestId: string;
  userId: string;
  before: number;
  reserved: number;
  actual: number;
  after: number;
  settled: boolean;
}

// In-memory store for pending reservations (should be Redis in production)
const pendingReservations = new Map<string, CreditReservation>();

/**
 * Reserve credits for an AI request
 * Returns the reservation or null if already reserved
 */
export function reserveCredits(
  requestId: string,
  userId: string,
  amount: number
): CreditReservation | null {
  // Check if already reserved (idempotency)
  if (pendingReservations.has(requestId)) {
    console.log('Credit already reserved for requestId:', requestId);
    return null;
  }

  const reservation: CreditReservation = {
    requestId,
    userId,
    reserved: amount,
    timestamp: Date.now()
  };

  pendingReservations.set(requestId, reservation);
  return reservation;
}

/**
 * Settle reserved credits with actual usage
 * Returns the difference (positive = charge more, negative = refund)
 */
export function settleCredits(
  requestId: string,
  actualUsage: number
): number {
  const reservation = pendingReservations.get(requestId);
  
  if (!reservation) {
    console.warn('No reservation found for requestId:', requestId);
    return actualUsage;
  }

  const diff = actualUsage - reservation.reserved;
  pendingReservations.delete(requestId);
  
  return diff;
}

/**
 * Rollback reserved credits (on error)
 */
export function rollbackReservation(requestId: string): boolean {
  const existed = pendingReservations.has(requestId);
  pendingReservations.delete(requestId);
  return existed;
}

/**
 * Clean up old reservations (older than 5 minutes)
 */
export function cleanupExpiredReservations(): number {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  let cleaned = 0;

  for (const [requestId, reservation] of pendingReservations.entries()) {
    if (reservation.timestamp < fiveMinutesAgo) {
      pendingReservations.delete(requestId);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Calculate estimated cost based on tier and request type
 */
export function estimateCost(tier: string, requestType: 'chat' | 'analysis' | 'suggestion' | 'analysis_deep' | 'plan_premium'): number {
  const baseCosts = {
    starter: { chat: 2, analysis: 5, suggestion: 2, analysis_deep: 5, plan_premium: 5 },
    growth: { chat: 1, analysis: 3, suggestion: 1, analysis_deep: 3, plan_premium: 5 },
    pro: { chat: 1, analysis: 2, suggestion: 1, analysis_deep: 5, plan_premium: 8 },
    unlimited: { chat: 0, analysis: 0, suggestion: 0, analysis_deep: 0, plan_premium: 0 }
  };

  return baseCosts[tier as keyof typeof baseCosts]?.[requestType] || 2;
}
