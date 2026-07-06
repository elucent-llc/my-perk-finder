import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { OfferStatus } from "@mpf/types";
import { listAdminOffers } from "@/lib/server/deals";
import { guardAdminApi } from "@/lib/server/admin-guard";

export async function GET(request: NextRequest) {
  const denied = guardAdminApi(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  if (status && !OfferStatus.safeParse(status).success) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }
  return NextResponse.json(await listAdminOffers({ status, q }));
}
