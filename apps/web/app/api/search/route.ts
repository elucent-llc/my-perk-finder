import { NextResponse } from "next/server";
import { SearchQuery } from "@mpf/types";
import { searchDealsPostgres } from "@/lib/server/deals";

/** Postgres-only search (no Meilisearch) — cost-efficient for Railway. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = SearchQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid query" }, { status: 400 });
  }
  const data = await searchDealsPostgres(parsed.data.q);
  return NextResponse.json({ query: parsed.data.q, source: "postgres", data });
}
