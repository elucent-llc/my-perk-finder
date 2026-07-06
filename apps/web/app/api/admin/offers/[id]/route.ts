import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@mpf/db";
import { OfferStatus, UpdateDealSchema } from "@mpf/types";
import { serializeDeal } from "@/lib/server/serialize";
import { guardAdminMutation } from "@/lib/server/admin-guard";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await guardAdminMutation(request);
  if (denied) return denied;
  const { id } = await context.params;
  const body = UpdateDealSchema.extend({ status: OfferStatus.optional() }).safeParse(
    await request.json()
  );
  if (!body.success) {
    return NextResponse.json({ message: "Invalid body", issues: body.error.issues }, { status: 400 });
  }
  const b = body.data;
  const updated = await prisma.deal.update({
    where: { id },
    data: {
      ...(b.title !== undefined ? { title: b.title } : {}),
      ...(b.brand !== undefined ? { brand: b.brand } : {}),
      ...(b.couponCode !== undefined ? { couponCode: b.couponCode } : {}),
      ...(b.status !== undefined ? { status: b.status } : {}),
      ...(b.salePrice !== undefined ? { salePrice: b.salePrice } : {}),
      ...(b.regularPrice !== undefined ? { regularPrice: b.regularPrice } : {}),
    },
    include: { merchant: true, category: true },
  });
  return NextResponse.json(serializeDeal(updated));
}
