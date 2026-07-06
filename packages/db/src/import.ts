import { prisma } from "./client.js";
import type { Prisma } from "@prisma/client";
import type { OfferStatus, SourceKind } from "@mpf/types";

export type OfferType = "product" | "coupon" | "promotion" | "sale";

/** Input for upserting a validated affiliate offer into the Deal table. */
export interface ImportedOfferInput {
  externalId: string;
  source: SourceKind;
  title: string;
  slug?: string;
  merchantName: string | null;
  brand?: string | null;
  category?: string | null;
  offerType?: OfferType;
  regularPrice?: number | null;
  salePrice?: number | null;
  discountPercent: number;
  couponCode?: string | null;
  currency: string;
  imageUrl?: string | null;
  affiliateUrl?: string | null;
  productUrl?: string | null;
  expiryDate?: Date | null;
  confidenceScore: number;
  validationFlags: string[];
  status: OfferStatus;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function resolveUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await prisma.deal.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    suffix += 1;
    slug = `${base.slice(0, 70)}-${suffix}`;
  }
}

async function resolveMerchantId(name: string | null, network?: SourceKind): Promise<string | null> {
  if (!name?.trim()) return null;
  const slug = slugify(name);
  const merchant = await prisma.merchant.upsert({
    where: { slug },
    update: { isActive: true },
    create: {
      name: name.trim(),
      slug,
      network: network ?? null,
      isActive: true,
    },
  });
  return merchant.id;
}

async function resolveCategoryId(category?: string | null): Promise<string | null> {
  if (!category?.trim()) return null;
  const slug = slugify(category);
  const cat = await prisma.category.findUnique({ where: { slug } });
  return cat?.id ?? null;
}

/**
 * Persist a raw affiliate API payload before normalization.
 * Maps to the Prisma `RawRecord` model (RawImportRecord in product docs).
 */
export async function saveRawImportRecord(params: {
  source: SourceKind;
  payload: unknown;
  importJobId?: string;
  normalized?: unknown;
}) {
  return prisma.rawRecord.create({
    data: {
      source: params.source,
      payload: params.payload as Prisma.InputJsonValue,
      normalized: params.normalized
        ? (params.normalized as Prisma.InputJsonValue)
        : undefined,
      importJobId: params.importJobId,
      status: "pending",
    },
  });
}

export interface UpsertImportedOfferResult {
  dealId: string;
  created: boolean;
}

/**
 * Upsert a validated offer by affiliate source + externalId.
 * Creates or links merchant; preserves slug uniqueness.
 */
export async function upsertImportedOffer(
  input: ImportedOfferInput
): Promise<UpsertImportedOfferResult> {
  const existing = await prisma.deal.findFirst({
    where: { source: input.source, externalId: input.externalId },
  });

  const merchantId = await resolveMerchantId(input.merchantName, input.source);
  const categoryId = await resolveCategoryId(input.category);
  const baseSlug =
    input.slug ??
    slugify(`${input.title}-${input.merchantName ?? input.source}-${input.externalId}`);
  const slug = await resolveUniqueSlug(baseSlug, existing?.id);

  const data = {
    title: input.title,
    slug,
    brand: input.brand ?? null,
    offerType: input.offerType ?? "product",
    regularPrice: input.regularPrice ?? null,
    salePrice: input.salePrice ?? null,
    discountPercent: input.discountPercent,
    couponCode: input.couponCode ?? null,
    currency: input.currency,
    imageUrl: input.imageUrl ?? null,
    affiliateUrl: input.affiliateUrl ?? null,
    productUrl: input.productUrl ?? null,
    expiryDate: input.expiryDate ?? null,
    sourceName: input.source,
    externalId: input.externalId,
    source: input.source,
    status: input.status,
    confidenceScore: input.confidenceScore,
    validationFlags: input.validationFlags,
    merchantId,
    categoryId,
    lastVerifiedAt: input.status === "active" ? new Date() : undefined,
  };

  if (existing) {
    const updated = await prisma.deal.update({
      where: { id: existing.id },
      data,
    });
    return { dealId: updated.id, created: false };
  }

  const created = await prisma.deal.create({ data });
  return { dealId: created.id, created: true };
}
