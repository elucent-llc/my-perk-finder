/** Public-facing expiry badge helpers. */

const DAY_MS = 864e5;
/** Show exact day counts up to this many days; beyond → "Ongoing". */
const MAX_COUNT_DAYS = 60;
/** Homepage + deals filter window for “ending soon”. */
export const EXPIRING_SOON_DAYS = 30;

export function expiryLabel(iso?: string | null): { label: string | null; urgent: boolean } {
  if (!iso) return { label: null, urgent: false };
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return { label: null, urgent: false };

  const diff = end - Date.now();
  if (diff <= 0) return { label: "Expired", urgent: true };

  const days = Math.ceil(diff / DAY_MS);
  if (days <= 1) return { label: "Ends today", urgent: true };
  if (days <= 3) return { label: `${days} days`, urgent: true };
  if (days <= MAX_COUNT_DAYS) return { label: `${days} days`, urgent: false };
  return { label: "Ongoing", urgent: false };
}

/** True when an expiry is within the next `withinDays` and still in the future. */
export function isExpiringSoon(
  iso: string | null | undefined,
  withinDays = EXPIRING_SOON_DAYS
): boolean {
  if (!iso) return false;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return false;
  const diff = end - Date.now();
  return diff > 0 && diff <= withinDays * DAY_MS;
}

/** True when `iso` falls on the local calendar day. */
export function isVerifiedToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return at.getTime() >= start.getTime();
}
