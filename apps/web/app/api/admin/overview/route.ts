import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAdminOverview } from "@/lib/server/deals";
import { guardAdminApi } from "@/lib/server/admin-guard";

export async function GET(request: NextRequest) {
  const denied = guardAdminApi(request);
  if (denied) return denied;
  return NextResponse.json(await getAdminOverview());
}
