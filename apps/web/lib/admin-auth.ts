import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session-verify";

export const ADMIN_COOKIE = "mpf_admin";

/** Returns true when request is authorized for admin routes. */
export async function isAdminAuthorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  if (cookie && (await verifyAdminSessionToken(cookie, secret))) return true;

  return false;
}

export function unauthorizedAdminResponse(): NextResponse {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  if (await isAdminAuthorized(request)) return null;
  return unauthorizedAdminResponse();
}

/** Block cross-origin admin mutations (no Redis / CSRF token needed for same-site SPA). */
export function assertSameOriginMutation(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin) return null;
  if (!host) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    if (new URL(origin).host === host) return null;
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}

export function adminLoginCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
