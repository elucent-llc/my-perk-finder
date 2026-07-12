import { NextResponse } from "next/server";
import { prisma } from "@mpf/db";
import { hashIp } from "@/lib/server/click-tracking";

export const runtime = "nodejs";

function isValidAffiliateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: Request, context: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await context.params;
  const deal = await prisma.deal.findUnique({ where: { id: offerId } });

  if (!deal) {
    return NextResponse.json({ message: "Offer not found" }, { status: 404 });
  }
  if (deal.status !== "active" || !deal.affiliateUrl) {
    return NextResponse.json({ message: "Offer is no longer available" }, { status: 410 });
  }
  if (!isValidAffiliateUrl(deal.affiliateUrl)) {
    return NextResponse.json({ message: "Invalid affiliate URL" }, { status: 410 });
  }

  const ipHashSecret =
    process.env.CLICK_HASH_SECRET?.trim() ||
    process.env.ADMIN_AUTH_SECRET?.trim() ||
    null;
  if (!ipHashSecret) {
    return NextResponse.json({ message: "Click tracking is not configured" }, { status: 503 });
  }
  const referrer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent");

  try {
    await prisma.$transaction([
      prisma.click.create({
        data: {
          dealId: deal.id,
          referrer: referrer?.slice(0, 2048) ?? null,
          userAgent: userAgent?.slice(0, 512) ?? null,
          ipHash: hashIp(clientIp(request), ipHashSecret),
        },
      }),
      prisma.deal.update({
        where: { id: deal.id },
        data: { clicksCount: { increment: 1 } },
      }),
    ]);
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "Click tracking failed",
        offerId: deal.id,
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }

  const response = NextResponse.redirect(deal.affiliateUrl, 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
