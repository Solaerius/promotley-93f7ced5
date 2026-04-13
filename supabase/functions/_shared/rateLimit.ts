/**
 * rateLimit.ts — Simple in-memory rate limiter for Supabase Edge Functions.
 *
 * Uses a module-level Map as a sliding-window counter.
 * Each edge function instance is isolated, so this only prevents burst
 * requests within a single instance's lifetime (~10 min on Deno Deploy).
 * For persistent rate limiting across instances, pair with a Supabase KV call
 * or the `rate_limit_log` table (see bottom of this file for the SQL).
 *
 * Usage:
 *   import { checkRateLimit } from '../_shared/rateLimit.ts';
 *   const limitHit = checkRateLimit(userId, 'ai-chat', 10, 60);
 *   if (limitHit) return new Response('Rate limited', { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Returns true if the request should be blocked (limit exceeded).
 *
 * @param identifier  - User ID or IP address
 * @param action      - Action name (e.g. 'ai-chat', 'billing')
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowSecs  - Sliding window size in seconds
 */
export function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowSecs: number
): boolean {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSecs * 1000;

  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window: reset counter
    store.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return true; // Rate limited
  }

  return false;
}

/**
 * Returns rate limit response headers for informational purposes.
 */
export function rateLimitHeaders(
  identifier: string,
  action: string,
  maxRequests: number
): Record<string, string> {
  const key = `${action}:${identifier}`;
  const entry = store.get(key);
  const remaining = entry ? Math.max(0, maxRequests - entry.count) : maxRequests;
  return {
    'X-RateLimit-Limit': String(maxRequests),
    'X-RateLimit-Remaining': String(remaining),
  };
}

/*
SQL for persistent rate limiting (optional — run in Supabase SQL editor):

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id          BIGSERIAL PRIMARY KEY,
  identifier  TEXT NOT NULL,
  action      TEXT NOT NULL,
  hit_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rate_limit_log_lookup
  ON public.rate_limit_log(identifier, action, hit_at DESC);
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
-- Only service role can write; no user access needed
*/
