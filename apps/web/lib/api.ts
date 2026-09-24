import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { DealCardData, StoreCardData } from "@mpf/ui";
import { parseDealQuery } from "@/lib/deal-query";
import {
  listDeals,
  getDealBySlug,
  listStores,
  searchDealsPostgres,
  searchDealsPage,
  getStoreBySlug,
  getPublicStats,
  getCategoryBySlug,
  getRelatedDeals as getRelatedDealsQuery,
  listCategories,
  getSitemapData,
} from "@/lib/server/deals";
import type { SerializedPublicDeal } from "@/lib/server/serialize";
import { offerRedirectPath } from "@/lib/site";
import { expiryLabel } from "@/lib/expiry";

export type DealDTO = SerializedPublicDeal;
export type { StoreCardData };
export { expiryLabel } from "@/lib/expiry";

/** Internal click-tracking redirect (same Next.js service). */
export function offerRedirectUrl(offerId: string): string {
  return offerRedirectPath(offerId);
}

/**
 * Listings live behind unstable_cache, keyed on the normalised query string.
 *
 * Any route that reads `searchParams` renders per request, so `export const revalidate`
 * alone buys nothing there — the data cache is what actually removes the database round
 * trip. Popular views (unfiltered /deals, the common category and sort combinations) then
 * cost one query per five minutes across all visitors instead of one per visitor, which
 * matters on a single shared Railway Postgres instance.
 *
 * Tagged so the importer can invalidate listings immediately after a feed run rather than
 * waiting out the window.
 */
export const DEALS_TAG = "deals";

const cachedDealsList = unstable_cache(
  async (query: string) => listDeals(parseDealQuery(query), { withTotal: false }),
  ["deals-list"],
  { revalidate: 300, tags: [DEALS_TAG] }
);

const cachedDealsPage = unstable_cache(
  async (query: string) => listDeals(parseDealQuery(query)),
  ["deals-page"],
  { revalidate: 300, tags: [DEALS_TAG] }
);

export async function getDeals(query = ""): Promise<DealDTO[]> {
  // The caller only wants rows, so skip the COUNT(*) that pairs with them.
  const result = await cachedDealsList(query);
  return result.data;
}

export async function getDealsPage(query = "") {
  return cachedDealsPage(query);
}

/*
 * generateMetadata() and the page body of every dynamic route run the same getter with the
 * same slug, which doubled the DB work on /deal, /stores and /category. React's cache()
 * dedupes them for the lifetime of the request.
 *
 * Note for callers: cache() keys on the argument list, so generateMetadata and the page body
 * must pass identical arguments (including any page/pageSize) to share one result.
 */
export const getDeal = cache(async (slug: string): Promise<DealDTO | null> => {
  return getDealBySlug(slug);
});

export const getStore = cache(async (slug: string) => {
  return getStoreBySlug(slug);
});

export const getCategory = cache(async (slug: string, page?: number, pageSize?: number) => {
  return getCategoryBySlug(slug, { page, pageSize });
});

/** "More like this" — one indexed query instead of scanning the newest deals in JS. */
export async function getRelatedDeals(
  slug: string,
  merchantId: string | null,
  categoryId: string | null,
  take = 4
): Promise<DealDTO[]> {
  return getRelatedDealsQuery(slug, merchantId, categoryId, take);
}

export async function getCouponDeals(): Promise<DealDTO[]> {
  // `couponAvailable=true` excludes null and empty codes in SQL, so there is nothing left
  // for a second pass in JS to remove.
  return getDeals("?couponAvailable=true&pageSize=50");
}

/*
 * Store and category lists drive the header, the footer, the facet rail and three
 * listing pages, and they only change when a feed adds a merchant. Caching them for an
 * hour removes the two aggregate queries (`_count` over deals per merchant/category,
 * both of which are index scans) from the critical path of nearly every page.
 */
const cachedStores = unstable_cache(
  async (limit?: number) => listStores(limit),
  ["stores-list"],
  { revalidate: 3600, tags: [DEALS_TAG] }
);

const cachedCategories = unstable_cache(
  async (limit?: number) => listCategories(limit),
  ["categories-list"],
  { revalidate: 3600, tags: [DEALS_TAG] }
);

/** @param limit omit on /stores (lists everything); pass 12 on the homepage. */
export async function getStores(limit?: number): Promise<StoreCardData[]> {
  return cachedStores(limit);
}

export async function getStats() {
  return getPublicStats();
}

/** @param limit omit on /categories (lists everything); pass 6 on the homepage. */
export async function getCategories(limit?: number) {
  return cachedCategories(limit);
}

export async function getSitemap() {
  return getSitemapData();
}

export async function searchDeals(q: string): Promise<DealDTO[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  return searchDealsPostgres(trimmed);
}

/** Paginated variant — the search page can now show results past the first 24. */
export async function searchDealsPaged(q: string, page = 1, pageSize = 24) {
  const trimmed = q.trim();
  if (!trimmed) return { data: [] as DealDTO[], page, pageSize, total: 0, totalPages: 1 };
  return searchDealsPage(trimmed, { page, pageSize });
}

export function toCard(d: DealDTO): DealCardData {
  const e = expiryLabel(d.expiryDate);
  return {
    // id + clicksCount feed the save button and the "N used" social proof, both of
    // which the card rendered nothing for before.
    id: d.id,
    clicksCount: d.clicksCount,
    title: d.title,
    slug: d.slug,
    merchantName: d.merchantName,
    salePrice: d.salePrice,
    regularPrice: d.regularPrice,
    discountPercent: d.discountPercent,
    couponCode: d.couponCode,
    currency: d.currency,
    imageUrl: d.imageUrl,
    merchantLogoUrl: d.merchantLogoUrl,
    expiryLabel: e.label,
    isUrgent: e.urgent,
    verified: Boolean(d.lastVerifiedAt),
  };
}
