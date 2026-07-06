import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { assertSameOriginMutation, requireAdminAuth } from "@/lib/admin-auth";

/** Server-side guard for admin API route handlers (middleware is first line of defense). */
export async function guardAdminApi(request: NextRequest): Promise<NextResponse | null> {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;
  return null;
}

/** Auth + same-origin check for POST/PATCH/DELETE admin mutations. */
export async function guardAdminMutation(request: NextRequest): Promise<NextResponse | null> {
  const denied = await guardAdminApi(request);
  if (denied) return denied;
  return assertSameOriginMutation(request);
}
