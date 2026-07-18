import type { SourceKind } from "@mpf/types";

export type OfferType = "product" | "coupon" | "promotion" | "sale";
export type AwinMembershipFilter = "all" | "joined" | "notJoined";

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
  /** Network advertiser ID when available (stored in raw/normalized JSON only). */
  merchantExternalId?: string | null;
  /** Advertiser/store logo (persisted on Merchant.logoUrl when present). */
  merchantLogoUrl?: string | null;
  brand?: string | null;
  category?: string | null;
  offerType?: OfferType;
  regularPrice: number | null;
  salePrice: number | null;
  discountPercent: number;
  couponCode?: string | null;
  currency: string;
  imageUrl?: string | null;
  affiliateUrl?: string | null;
  productUrl?: string | null;
  startDate?: Date | null;
  expiryDate?: Date | null;
  countryCodes?: string[];
  description?: string | null;
  /** 0–1 extraction/normalization confidence. */
  confidenceScore: number;
  /** Original network payload (stored on RawRecord before normalization). */
  rawPayload: unknown;
}

export interface AffiliateFetchOptions {
  regionCodes?: string[];
  membershipFilter?: AwinMembershipFilter;
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
  /** Awin filters.membership — default `all` for testing; use `joined` in production. */
  membershipFilter?: AwinMembershipFilter;
  regionCodes?: string[];
  pageSize?: number;
  /** Save full API page payloads to RawRecord (in addition to per-offer rows). */
  debugRawPages?: boolean;
}
