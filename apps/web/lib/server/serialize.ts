import type { Deal as PrismaDeal } from "@mpf/db";

function num(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const asDecimal = v as { toNumber?: () => number };
  return typeof asDecimal.toNumber === "function" ? asDecimal.toNumber() : Number(v);
}

/** Prisma returns Decimal for money columns; plain numbers show up in tests/fixtures. */
type DecimalLike = number | { toNumber(): number } | null;

/**
 * The exact row shape these serializers read — deliberately structural rather than
 * `PrismaDeal & {...}` so callers can `select` only these columns (see DEAL_CARD_SELECT
 * in ./deals.ts) instead of paying for every column plus the full merchant/category rows.
 * A full Prisma row still satisfies it, so admin callers that `include` are unaffected.
 */
export type SerializableDeal = {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  offerType: PrismaDeal["offerType"];
  regularPrice: DecimalLike;
  salePrice: DecimalLike;
  discountPercent: number;
  couponCode: string | null;
  currency: string;
  imageUrl: string | null;
  productUrl: string | null;
  expiryDate: Date | null;
  lastVerifiedAt: Date | null;
  sourceName: string | null;
  status: PrismaDeal["status"];
  confidenceScore: number | null;
  validationFlags: string[];
  clicksCount: number;
  savesCount: number;
  merchantId?: string | null;
  categoryId?: string | null;
  /** Optional: only admin reads select it, public reads must not fetch it at all. */
  affiliateUrl?: string | null;
  merchant?: { name: string; slug: string; logoUrl: string | null } | null;
  category?: { name: string; slug?: string } | null;
};

export function serializeDeal(d: SerializableDeal) {
  return {
    id: d.id,
    title: d.title,
    slug: d.slug,
    merchantName: d.merchant?.name ?? "Unknown",
    merchantSlug: d.merchant?.slug ?? null,
    // Raw FKs so callers (e.g. "More like this") can query related rows without a second lookup.
    merchantId: d.merchantId ?? null,
    categoryId: d.categoryId ?? null,
    category: d.category?.name ?? "Uncategorized",
    categorySlug: d.category?.slug ?? null,
    brand: d.brand,
    offerType: d.offerType,
    regularPrice: num(d.regularPrice),
    salePrice: num(d.salePrice),
    discountPercent: d.discountPercent,
    couponCode: d.couponCode,
    currency: d.currency,
    imageUrl: d.imageUrl,
    merchantLogoUrl: d.merchant?.logoUrl ?? null,
    affiliateUrl: d.affiliateUrl ?? null,
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

/** Public API shape — never expose raw affiliate URLs (use /api/r/:id redirect). */
export function serializePublicDeal(d: SerializableDeal) {
  const { affiliateUrl: _omit, ...rest } = serializeDeal(d);
  return rest;
}

export type SerializedDeal = ReturnType<typeof serializeDeal>;
export type SerializedPublicDeal = ReturnType<typeof serializePublicDeal>;
