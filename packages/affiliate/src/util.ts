/** Shared helpers for source adapters. Keep source-agnostic. */

const DAY_MS = 864e5;

/** URL-safe slug (lowercase, dashed, max 80 chars). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/**
 * Parse an end date, returning null for invalid dates or evergreen/far-future
 * dates beyond `maxDays` (networks often send year-3000 style dates for
 * open-ended promos — treat those as no expiry).
 */
export function sanitizeExpiry(
  endDate: string | Date | null | undefined,
  maxDays = 90
): Date | null {
  if (!endDate) return null;
  const d = endDate instanceof Date ? endDate : new Date(endDate);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getTime() > Date.now() + maxDays * DAY_MS) return null;
  return d;
}
