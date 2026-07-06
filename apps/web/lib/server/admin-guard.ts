import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";

/** Server-side guard for admin API route handlers (middleware is first line of defense). */
export function guardAdminApi(request: NextRequest): NextResponse | null {
  return requireAdminAuth(request);
}
