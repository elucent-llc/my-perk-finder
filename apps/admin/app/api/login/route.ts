import { NextResponse } from "next/server";

const COOKIE = "mpf_admin_local";

export async function POST(request: Request) {
  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ message: "ADMIN_AUTH_SECRET is not configured" }, { status: 503 });
  }

  let body: { secret?: string };
  try {
    body = (await request.json()) as { secret?: string };
  } catch {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  if (body.secret !== secret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
