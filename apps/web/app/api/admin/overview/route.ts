import { NextResponse } from "next/server";
import { getAdminOverview } from "@/lib/server/deals";

export async function GET() {
  return NextResponse.json(await getAdminOverview());
}
