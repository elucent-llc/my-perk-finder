import { NextResponse } from "next/server";
import { DealFilterQuery } from "@mpf/types";
import { listDeals } from "@/lib/server/deals";

// Read-only and mutated only by the cron importer, so it is safe for the CDN to serve a
// slightly stale copy while it refreshes in the background.
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = DealFilterQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await listDeals(parsed.data);
  return NextResponse.json(result, { headers: { "Cache-Control": CACHE_CONTROL } });
}
