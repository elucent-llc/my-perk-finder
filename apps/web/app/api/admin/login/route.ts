import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminLoginCookieOptions } from "@/lib/admin-auth";
import { signAdminSession } from "@/lib/admin-session-sign";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/server/login-rate-limit";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = checkLoginRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec ?? 900) } }
    );
  }

  const body = (await request.json().catch(() => null)) as { secret?: string } | null;
  const expected = process.env.ADMIN_AUTH_SECRET?.trim();

  if (!expected) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ ok: true, dev: true });
    }
    return NextResponse.json({ message: "ADMIN_AUTH_SECRET not configured" }, { status: 503 });
  }

  if (!body?.secret || body.secret !== expected) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  resetLoginRateLimit(ip);
  const maxAge = 60 * 60 * 24 * 7;
  const token = signAdminSession(expected, maxAge);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, adminLoginCookieOptions(maxAge));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...adminLoginCookieOptions(0), maxAge: 0 });
  return res;
}
