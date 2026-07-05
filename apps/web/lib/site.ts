/** Public site URL — used for server-side self-fetch in dev; production uses same-origin /api. */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

/** Relative redirect path for affiliate click tracking (same Next.js service). */
export function offerRedirectPath(offerId: string): string {
  return `/api/r/${offerId}`;
}
