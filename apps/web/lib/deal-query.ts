import { DealFilterQuery } from "@mpf/types";

/**
 * Query string → validated filters, discarding only the parts that are actually invalid.
 *
 * This used to live in lib/api.ts and fall back to `DealFilterQuery.parse({})` whenever *any*
 * key failed, so a single unparseable param silently replaced the entire request with an
 * unfiltered page 1. A crawler or a hand-edited URL hitting
 * `/deals?category=kitchen&minPrice=cheap` got the full catalogue under a URL that promises
 * kitchen deals under a price cap — wrong results presented as if they were right, and cached
 * under that key for five minutes.
 *
 * Zod reports the offending path per issue, so dropping those keys and re-parsing keeps every
 * filter the visitor got right. The second failure branch should be unreachable (all remaining
 * fields are optional or defaulted) but is kept so this can never throw into a page render.
 *
 * It lives in its own module, rather than in lib/api.ts, so it can be unit-tested without
 * importing the Prisma client through the query layer.
 */
export function parseDealQuery(query: string) {
  const raw = query.startsWith("?") ? query.slice(1) : query;
  const params = Object.fromEntries(new URLSearchParams(raw));

  const parsed = DealFilterQuery.safeParse(params);
  if (parsed.success) return parsed.data;

  const cleaned: Record<string, string> = { ...params };
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") delete cleaned[key];
  }

  const retry = DealFilterQuery.safeParse(cleaned);
  return retry.success ? retry.data : DealFilterQuery.parse({});
}
