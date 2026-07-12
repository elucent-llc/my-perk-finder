/**
 * Allow only same-origin relative paths for post-login redirects.
 * Rejects protocol-relative URLs (//evil.com) and absolute URLs.
 */
export function safeAdminNextPath(raw: string | null | undefined, fallback = "/admin"): string {
  if (!raw) return fallback;
  const next = raw.trim();
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.includes("://")) return fallback;
  return next;
}
