import { NextResponse } from "next/server";
import { prisma } from "@mpf/db";

export async function GET(_request: Request, context: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await context.params;
  const deal = await prisma.deal.findUnique({ where: { id: offerId } });

  if (!deal) {
    return NextResponse.json({ message: "Offer not found" }, { status: 404 });
  }
  if (deal.status !== "active" || !deal.affiliateUrl) {
    return NextResponse.json({ message: "Offer is no longer available" }, { status: 410 });
  }

  await prisma.deal.update({
    where: { id: deal.id },
    data: { clicksCount: { increment: 1 } },
  });

  return NextResponse.redirect(deal.affiliateUrl, 302);
}
