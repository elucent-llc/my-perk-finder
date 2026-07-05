import { NextResponse } from "next/server";
import { listImportJobs } from "@/lib/server/deals";

/** Read-only import job history. Scheduled imports run via Railway cron workers. */
export async function GET() {
  return NextResponse.json(await listImportJobs());
}
