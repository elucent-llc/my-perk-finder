import { NextResponse } from "next/server";
import { getReviewQueue } from "@/lib/server/deals";

export async function GET() {
  return NextResponse.json(await getReviewQueue());
}
