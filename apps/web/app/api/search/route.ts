import { NextResponse } from "next/server";
import { SearchQuery } from "@mpf/types";
import { searchDealsPage } from "@/lib/server/deals";

// Read-only and mutated only by the cron importer; repeated queries (autocomplete, popular
// terms) are the expensive ones and they benefit most from an edge cache.
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

/** Postgres-only search (no Meilisearch) — cost-efficient for Railway. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = SearchQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid query" }, { status: 400 });
  }
  const result = await searchDealsPage(parsed.data.q, { page: parsed.data.page });
  return NextResponse.json(
    { query: parsed.data.q, source: "postgres", ...result },
    { headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
