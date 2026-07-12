import { NextResponse } from "next/server";
import { prisma } from "@mpf/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      service: "myperkfinder-web",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "database unreachable";
    return NextResponse.json(
      {
        status: "error",
        service: "myperkfinder-web",
        database: "down",
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
