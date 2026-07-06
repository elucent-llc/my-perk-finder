/** In-memory login rate limiter (per process — no Redis). Resets on cold start. */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true };
}

export function resetLoginRateLimit(key: string): void {
  buckets.delete(key);
}
