import type { Deal as PrismaDeal, Merchant, Coupon } from "@mpf/db";

/** Convert Prisma Decimal | number | null into a plain number | null. */
function num(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const asDecimal = v as { toNumber?: () => number };
  return typeof asDecimal.toNumber === "function" ? asDecimal.toNumber() : Number(v);
}

export function serializeDeal(
  d: PrismaDeal & { merchant?: Merchant | null; category?: { name: string } | null }
) {
  return {
    id: d.id,
    title: d.title,
    slug: d.slug,
    merchantName: d.merchant?.name ?? "Unknown",
    category: d.category?.name ?? "Uncategorized",
    brand: d.brand,
    regularPrice: num(d.regularPrice),
    salePrice: num(d.salePrice),
    discountPercent: d.discountPercent,
    couponCode: d.couponCode,
    currency: d.currency,
    imageUrl: d.imageUrl,
    affiliateUrl: d.affiliateUrl,
    productUrl: d.productUrl,
    expiryDate: d.expiryDate ? d.expiryDate.toISOString() : null,
    lastVerifiedAt: d.lastVerifiedAt ? d.lastVerifiedAt.toISOString() : null,
    sourceName: d.sourceName,
    status: d.status,
    confidenceScore: d.confidenceScore,
    validationFlags: d.validationFlags,
    clicksCount: d.clicksCount,
    savesCount: d.savesCount,
  };
}

/** Public API shape — never expose raw affiliate URLs. */
export function serializePublicDeal(
  d: PrismaDeal & { merchant?: Merchant | null; category?: { name: string } | null }
) {
  const { affiliateUrl: _omit, ...rest } = serializeDeal(d);
  return rest;
}

export function serializeCoupon(c: Coupon & { merchant?: Merchant | null }) {
  return {
    id: c.id,
    merchantName: c.merchant?.name ?? "Unknown",
    title: c.title,
    code: c.code,
    expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
    isActive: c.isActive,
    revealCount: c.revealCount,
  };
}
