import { NextResponse } from "next/server";
import { DealFilterQuery } from "@mpf/types";
import { listDeals } from "@/lib/server/deals";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = DealFilterQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await listDeals(parsed.data);
  return NextResponse.json(result);
}
