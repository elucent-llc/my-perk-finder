import type { SourceKind } from "@mpf/types";

/**
 * Canonical shape every affiliate adapter must produce before validation + DB upsert.
 * Maps to the Prisma `Deal` model (Offer in admin UI).
 */
export interface NormalizedOffer {
  /** Stable ID from the affiliate network (used for upsert deduplication). */
  externalId: string;
  source: SourceKind;
  title: string;
  slug?: string;
  merchantName: string | null;
  brand?: string | null;
  category?: string | null;
  regularPrice: number;
  salePrice: number;
  discountPercent: number;
  couponCode?: string | null;
  currency: string;
  imageUrl?: string | null;
  affiliateUrl?: string | null;
  productUrl?: string | null;
  expiryDate?: Date | null;
  description?: string | null;
  /** 0–1 extraction/normalization confidence. */
  confidenceScore: number;
  /** Original network payload (stored on RawRecord before normalization). */
  rawPayload: unknown;
}

export interface AffiliateFetchOptions {
  regionCodes?: string[];
  updatedSince?: Date;
  page?: number;
  pageSize?: number;
}

/** Result returned by every affiliate source adapter. */
export interface AffiliateSourceResult {
  offers: NormalizedOffer[];
  /** Raw API response pages (saved to RawRecord before normalization). */
  rawResponses: unknown[];
  page: number;
  pageSize: number;
  totalCount?: number;
  hasMore: boolean;
}

export interface AffiliateSourceConfig {
  accessToken: string;
  publisherId: string;
  mockExternal?: boolean;
}
