import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getReviewQueue } from "@/lib/server/deals";
import { guardAdminApi } from "@/lib/server/admin-guard";

export async function GET(request: NextRequest) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("pageSize")) || 50));
  return NextResponse.json(await getReviewQueue(page, pageSize));
}
