import { z } from "zod";
import { slugify } from "../util.js";
import type { AffiliateSourceResult, NormalizedOffer } from "../types.js";

export interface WalmartSourceConfig {
  apiKey: string;
  publisherId: string;
  /** Search keywords (already parsed; env layer splits the comma-separated string). */
  searchTerms?: string[];
  pageSize?: number;
  mockExternal?: boolean;
  debugRawPages?: boolean;
}

const DEFAULT_SEARCH_TERMS = ["electronics", "home"];

const WalmartItemSchema = z
  .object({
    itemId: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    salePrice: z.number().optional().nullable(),
    msrp: z.number().optional().nullable(),
    brandName: z.string().optional().nullable(),
    categoryPath: z.string().optional().nullable(),
    thumbnailImage: z.string().optional().nullable(),
    mediumImage: z.string().optional().nullable(),
    largeImage: z.string().optional().nullable(),
    productTrackingUrl: z.string().optional().nullable(),
    productUrl: z.string().optional().nullable(),
    affiliateAddToCartUrl: z.string().optional().nullable(),
  })
  .passthrough();

function resolveSearchTerms(input?: string[]): string[] {
  const terms = (input ?? []).map((s) => s.trim()).filter(Boolean);
  return terms.length ? terms : DEFAULT_SEARCH_TERMS;
}

export function normalizeWalmartItem(raw: unknown): NormalizedOffer | null {
  const parsed = WalmartItemSchema.safeParse(raw);
  if (!parsed.success) return null;
  const p = parsed.data;

  const externalId = String(p.itemId ?? "").trim();
  if (!externalId) return null;

  const title = (p.name ?? "").trim();
  if (!title) return null;

  const salePrice = p.salePrice != null && p.salePrice > 0 ? p.salePrice : null;
  const regularPrice = p.msrp != null && p.msrp > 0 ? p.msrp : null;
  const discountPercent =
    regularPrice != null && salePrice != null && salePrice < regularPrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  const affiliateUrl =
    (p.productTrackingUrl ?? p.affiliateAddToCartUrl ?? p.productUrl)?.trim() || null;
  const productUrl = p.productUrl?.trim() || affiliateUrl;
  const imageUrl = p.largeImage ?? p.mediumImage ?? p.thumbnailImage ?? null;
  const category = p.categoryPath?.split("/")?.filter(Boolean).pop()?.trim() || null;

  let confidence = 0.82;
  if (!affiliateUrl) confidence -= 0.25;
  if (salePrice == null && regularPrice == null) confidence -= 0.1;
  if (!imageUrl) confidence -= 0.05;

  return {
    externalId,
    source: "walmart",
    title,
    slug: slugify(`${title}-walmart-${externalId}`),
    merchantName: "Walmart",
    merchantExternalId: "walmart",
    brand: p.brandName?.trim() || null,
    category,
    offerType: "product",
    regularPrice,
    salePrice,
    discountPercent,
    couponCode: null,
    currency: "USD",
    imageUrl,
    affiliateUrl,
    productUrl,
    startDate: null,
    expiryDate: null,
    countryCodes: ["US"],
    description: null,
    confidenceScore: Math.max(0, Math.min(1, confidence)),
    rawPayload: raw,
  };
}

function mockWalmartItems(): NormalizedOffer[] {
  const samples = [
    {
      itemId: 123456789,
      name: 'Samsung 55" 4K Smart TV',
      salePrice: 398,
      msrp: 549,
      brandName: "Samsung",
      categoryPath: "Electronics/TVs",
      largeImage: "https://i5.walmartimages.com/example-tv.jpg",
      productTrackingUrl: "https://goto.walmart.com/c/example/tv",
      productUrl: "https://www.walmart.com/ip/example-tv",
    },
    {
      itemId: 987654321,
      name: "Ninja Air Fryer",
      salePrice: 89,
      msrp: 129,
      brandName: "Ninja",
      categoryPath: "Home/Kitchen",
      largeImage: "https://i5.walmartimages.com/example-af.jpg",
      productTrackingUrl: "https://goto.walmart.com/c/example/af",
      productUrl: "https://www.walmart.com/ip/example-af",
    },
  ];
  return samples.map((s) => normalizeWalmartItem(s)).filter(Boolean) as NormalizedOffer[];
}

const WalmartSearchEnvelope = z
  .object({
    items: z.array(z.unknown()).optional(),
    totalResults: z.number().optional(),
    numItems: z.number().optional(),
    start: z.number().optional(),
  })
  .passthrough();

async function fetchWalmartTerm(
  config: WalmartSourceConfig,
  query: string,
  start: number,
  numItems: number
): Promise<{ offers: NormalizedOffer[]; raw: unknown; hasMore: boolean }> {
  const url = new URL("https://api.walmartlabs.com/v1/search");
  url.searchParams.set("apiKey", config.apiKey);
  url.searchParams.set("publisherId", config.publisherId);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("numItems", String(numItems));
  url.searchParams.set("start", String(start));
  url.searchParams.set("responseGroup", "full");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Walmart API error ${res.status} for "${query}": ${text.slice(0, 300)}`);
  }

  const json: unknown = await res.json();
  const envelope = WalmartSearchEnvelope.safeParse(json);
  const rows = envelope.success ? (envelope.data.items ?? []) : [];
  const total = envelope.success ? envelope.data.totalResults : undefined;

  const offers = rows
    .map((row) => normalizeWalmartItem(row))
    .filter((o): o is NormalizedOffer => o !== null);

  const hasMore =
    typeof total === "number"
      ? start + rows.length - 1 < total
      : rows.length >= numItems;

  return { offers, raw: json, hasMore };
}

/**
 * Fetch products from Walmart Affiliate Product Search API (v1).
 * GET https://api.walmartlabs.com/v1/search
 *
 * Each runner page queries ALL configured search terms once (one request per
 * term) so that a single page (WALMART_MAX_PAGES=1) still covers every term.
 * Deeper pages walk further into each term's result set via `start`.
 *
 * Uses apiKey + publisherId query params (legacy affiliate keys).
 * Never call from browser — server/worker only.
 *
 * Note: Newer walmart.io endpoints require signed headers (consumer id + private key).
 * Those can be added later without changing NormalizedOffer.
 */
export async function fetchWalmartOffers(
  config: WalmartSourceConfig,
  options: { page?: number; pageSize?: number } = {}
): Promise<AffiliateSourceResult> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? config.pageSize ?? 25;
  const numItems = Math.min(pageSize, 25);
  const terms = resolveSearchTerms(config.searchTerms);

  const useMock =
    config.mockExternal ||
    !config.apiKey ||
    !config.publisherId ||
    config.apiKey === "mock" ||
    config.publisherId === "mock";

  if (useMock) {
    const offers = mockWalmartItems();
    return {
      offers,
      rawResponses: offers.map((o) => o.rawPayload),
      page: 1,
      pageSize: offers.length,
      totalCount: offers.length,
      hasMore: false,
    };
  }

  const start = (page - 1) * numItems + 1;
  const offers: NormalizedOffer[] = [];
  const rawResponses: unknown[] = [];
  let hasMore = false;

  for (const term of terms) {
    const result = await fetchWalmartTerm(config, term, start, numItems);
    offers.push(...result.offers);
    rawResponses.push(result.raw);
    hasMore = hasMore || result.hasMore;
  }

  return {
    offers,
    rawResponses,
    page,
    pageSize,
    totalCount: undefined,
    hasMore,
  };
}
