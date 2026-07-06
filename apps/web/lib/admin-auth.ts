import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "mpf_admin";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Returns true when request is authorized for admin routes. Edge-safe (no node:crypto). */
export function isAdminAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  if (cookie && safeEqual(cookie, secret)) return true;

  return false;
}

export function unauthorizedAdminResponse(): NextResponse {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export function requireAdminAuth(request: NextRequest): NextResponse | null {
  if (isAdminAuthorized(request)) return null;
  return unauthorizedAdminResponse();
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
