import type { Deal as PrismaDeal, Merchant } from "@mpf/db";

function num(v: unknown): number {
  if (v == null) return 0;
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

export type SerializedDeal = ReturnType<typeof serializeDeal>;
