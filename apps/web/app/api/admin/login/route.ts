import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminLoginCookieOptions } from "@/lib/admin-auth";

export async function POST(request: Request) {
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

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, expected, adminLoginCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...adminLoginCookieOptions(0), maxAge: 0 });
  return res;
}
