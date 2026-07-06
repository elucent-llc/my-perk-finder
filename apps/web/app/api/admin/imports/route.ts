import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { listImportJobs } from "@/lib/server/deals";
import { guardAdminApi } from "@/lib/server/admin-guard";

/** Read-only import job history. Scheduled imports run via Railway cron workers. */
export async function GET(request: NextRequest) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;
  return NextResponse.json(await listImportJobs());
}
