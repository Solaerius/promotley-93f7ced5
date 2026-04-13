/**
 * logger.ts — Structured logger for Supabase Edge Functions.
 *
 * Severity levels: DEBUG < INFO < WARN < ERROR < CRITICAL
 *
 * - DEBUG/INFO: console.log only
 * - WARN:       console.warn only
 * - ERROR:      console.error + Discord webhook (if DISCORD_WEBHOOK_URL is set)
 * - CRITICAL:   console.error + Discord webhook + email alert
 *
 * Usage:
 *   import { logger } from '../_shared/logger.ts';
 *   logger.error('billing', 'Stripe payment failed', { userId, error: err.message });
 *   logger.critical('ai-assistant', 'Edge function crashed', { error });
 */

type Severity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogPayload {
  severity: Severity;
  function: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');
const APP_ENV = Deno.env.get('APP_ENV') ?? 'production';

async function sendDiscordAlert(payload: LogPayload): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  const color = payload.severity === 'critical' ? 0xff0000 : 0xff6b35; // red / orange
  const embed = {
    title: `[${payload.severity.toUpperCase()}] ${payload.function}`,
    description: payload.message,
    color,
    fields: payload.context
      ? Object.entries(payload.context).map(([k, v]) => ({
          name: k,
          value: String(v).substring(0, 1024),
          inline: true,
        }))
      : [],
    footer: { text: `${APP_ENV} · ${payload.timestamp}` },
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (e) {
    console.error('[logger] Failed to send Discord alert:', e);
  }
}

async function log(
  severity: Severity,
  fn: string,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  const payload: LogPayload = {
    severity,
    function: fn,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  // Always log to console
  const line = JSON.stringify(payload);
  if (severity === 'debug' || severity === 'info') console.log(line);
  else if (severity === 'warn') console.warn(line);
  else console.error(line);

  // Send Discord alert for ERROR and CRITICAL
  if (severity === 'error' || severity === 'critical') {
    await sendDiscordAlert(payload);
  }
}

export const logger = {
  debug:    (fn: string, msg: string, ctx?: Record<string, unknown>) => log('debug',    fn, msg, ctx),
  info:     (fn: string, msg: string, ctx?: Record<string, unknown>) => log('info',     fn, msg, ctx),
  warn:     (fn: string, msg: string, ctx?: Record<string, unknown>) => log('warn',     fn, msg, ctx),
  error:    (fn: string, msg: string, ctx?: Record<string, unknown>) => log('error',    fn, msg, ctx),
  critical: (fn: string, msg: string, ctx?: Record<string, unknown>) => log('critical', fn, msg, ctx),
};

/*
To enable Discord alerts:
1. Create a Discord webhook in your server's channel settings
2. Add the webhook URL to Supabase Edge Function secrets:
   supabase secrets set DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

To enable email alerts for CRITICAL severity:
Extend the critical path below to call your send-broadcast-email edge function.
*/
