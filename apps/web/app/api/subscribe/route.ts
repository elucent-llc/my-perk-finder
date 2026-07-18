import { NextResponse } from "next/server";
import { prisma } from "@mpf/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await prisma.subscriber.upsert({
      where: { email },
      update: { alerts: true },
      create: { email, alerts: true },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Try again later." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
