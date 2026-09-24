import { NextResponse } from "next/server";
import { getDealBySlug } from "@/lib/server/deals";

// Read-only and mutated only by the cron importer, so it is safe for the CDN to serve a
// slightly stale copy while it refreshes in the background. 404s stay uncached so a newly
// imported deal is reachable immediately.
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const deal = await getDealBySlug(slug);
  if (!deal) return NextResponse.json({ message: "Deal not found" }, { status: 404 });
  return NextResponse.json(deal, { headers: { "Cache-Control": CACHE_CONTROL } });
}
