/** Public-facing expiry badge helpers. */

const DAY_MS = 864e5;
/** Show exact day counts up to this many days. */
const MAX_COUNT_DAYS = 60;
/** Beyond this, treat as open-ended / ongoing (common for Awin evergreen promos). */
const ONGOING_AFTER_DAYS = 90;

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
  if (days > ONGOING_AFTER_DAYS) return { label: "Ongoing", urgent: false };
  return { label: `${days} days`, urgent: false };
}

/** True when an expiry is within the next `withinDays` and still in the future. */
export function isExpiringSoon(iso: string | null | undefined, withinDays = 30): boolean {
  if (!iso) return false;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return false;
  const diff = end - Date.now();
  return diff > 0 && diff <= withinDays * DAY_MS;
}
