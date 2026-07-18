import { z } from "zod";
import { slugify, sanitizeExpiry } from "../util.js";
import type { AffiliateSourceResult, NormalizedOffer, OfferType } from "../types.js";

export type CjRelationshipStatus = "joined" | "joined_pending" | "not_joined" | "all";

export interface CjSourceConfig {
  accessToken: string;
  websiteId: string;
  relationshipStatus?: CjRelationshipStatus;
  pageSize?: number;
  mockExternal?: boolean;
  debugRawPages?: boolean;
}

const CjLinkSchema = z
  .object({
    linkId: z.union([z.string(), z.number()]).optional(),
    id: z.union([z.string(), z.number()]).optional(),
    linkName: z.string().optional(),
    name: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional().nullable(),
    linkType: z.string().optional().nullable(),
    promotionType: z.string().optional().nullable(),
    clickUrl: z.string().optional().nullable(),
    linkUrl: z.string().optional().nullable(),
    destinationUrl: z.string().optional().nullable(),
    couponCode: z.string().optional().nullable(),
    promotionStartDate: z.string().optional().nullable(),
    promotionEndDate: z.string().optional().nullable(),
    advertiserId: z.union([z.string(), z.number()]).optional().nullable(),
    advertiserName: z.string().optional().nullable(),
  })
  .passthrough();

function cjLinkToOfferType(linkType?: string | null, couponCode?: string | null): OfferType {
  if (couponCode) return "coupon";
  const t = (linkType ?? "").toLowerCase();
  if (t.includes("coupon") || t.includes("voucher")) return "coupon";
  if (t.includes("sale") || t.includes("discount")) return "sale";
  return "promotion";
}

export function normalizeCjLink(raw: unknown): NormalizedOffer | null {
  const parsed = CjLinkSchema.safeParse(raw);
  if (!parsed.success) return null;
  const p = parsed.data;

  const externalId = String(p.linkId ?? p.id ?? "").trim();
  if (!externalId) return null;

  const title = (p.linkName ?? p.name ?? p.title ?? "").trim();
  if (!title) return null;

  const merchantName = p.advertiserName?.trim() || null;
  const couponCode = p.couponCode?.trim() || null;
  const affiliateUrl = (p.clickUrl ?? p.linkUrl)?.trim() || null;
  const productUrl = p.destinationUrl?.trim() || null;
  const offerType = cjLinkToOfferType(p.linkType ?? p.promotionType, couponCode);

  let confidence = 0.78;
  if (!affiliateUrl) confidence -= 0.25;
  if (!merchantName) confidence -= 0.15;
  if (title.length < 5) confidence -= 0.1;

  return {
    externalId,
    source: "cj",
    title,
    slug: slugify(`${title}-${merchantName ?? "cj"}-${externalId}`),
    merchantName,
    merchantExternalId: p.advertiserId != null ? String(p.advertiserId) : null,
    brand: null,
    category: null,
    offerType,
    regularPrice: null,
    salePrice: null,
    discountPercent: 0,
    couponCode,
    currency: "USD",
    imageUrl: null,
    affiliateUrl,
    productUrl,
    startDate: p.promotionStartDate ? new Date(p.promotionStartDate) : null,
    expiryDate: sanitizeExpiry(p.promotionEndDate),
    countryCodes: ["US"],
    description: p.description ?? null,
    confidenceScore: Math.max(0, Math.min(1, confidence)),
    rawPayload: raw,
  };
}

function mockCjLinks(): NormalizedOffer[] {
  const samples = [
    {
      linkId: "cj-1001",
      linkName: "15% Off Sitewide",
      description: "Save 15% with code CJ15",
      linkType: "Text Link",
      clickUrl: "https://www.anrdoezrs.net/click-1001",
      destinationUrl: "https://www.example.com/sale",
      couponCode: "CJ15",
      promotionEndDate: new Date(Date.now() + 14 * 864e5).toISOString(),
      advertiserId: 501,
      advertiserName: "Example Outfitters",
    },
    {
      linkId: "cj-1002",
      linkName: "Free Shipping Over $50",
      description: "Free ground shipping",
      linkType: "Banner",
      clickUrl: "https://www.anrdoezrs.net/click-1002",
      destinationUrl: "https://www.example.com/shipping",
      couponCode: null,
      promotionEndDate: new Date(Date.now() + 7 * 864e5).toISOString(),
      advertiserId: 502,
      advertiserName: "Home Goods Co",
    },
  ];
  return samples.map((s) => normalizeCjLink(s)).filter(Boolean) as NormalizedOffer[];
}

function relationshipToGraphql(status: CjRelationshipStatus): string {
  switch (status) {
    case "joined":
      return "JOINED";
    case "joined_pending":
      return "JOINED_PENDING";
    case "not_joined":
      return "NOT_JOINED";
    default:
      return "JOINED";
  }
}

/**
 * Fetch promotion/coupon links from CJ GraphQL Link Search.
 * POST https://ads.api.cj.com/query
 *
 * Never call from browser — server/worker only.
 *
 * DEPLOY: kept implemented, but Railway combined import skips CJ until
 * ENABLE_CJ_IN_COMBINED_IMPORT is set true in apps/worker/src/cli/import-all.ts.
 * Use `pnpm worker:import-cj` for local testing.
 */
export async function fetchCjOffers(
  config: CjSourceConfig,
  options: { page?: number; pageSize?: number } = {}
): Promise<AffiliateSourceResult> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? config.pageSize ?? 100;
  const relationship = config.relationshipStatus ?? "joined";

  const useMock =
    config.mockExternal ||
    !config.accessToken ||
    !config.websiteId ||
    config.accessToken === "mock" ||
    config.websiteId === "mock";

  if (useMock) {
    const offers = mockCjLinks();
    return {
      offers,
      rawResponses: offers.map((o) => o.rawPayload),
      page: 1,
      pageSize: offers.length,
      totalCount: offers.length,
      hasMore: false,
    };
  }

  const query = `
    query ($companyId: ID!, $page: Int!, $pageSize: Int!, $status: AdvertiserRelationshipStatus) {
      advertiserLinkSearch(
        companyId: $companyId
        relationship: { status: $status }
        pagination: { page: $page, pageSize: $pageSize }
      ) {
        count
        resultList {
          linkId
          linkName
          description
          linkType
          clickUrl
          destinationUrl
          couponCode
          promotionStartDate
          promotionEndDate
          advertiserId
          advertiserName
        }
      }
    }
  `;

  const res = await fetch("https://ads.api.cj.com/query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        companyId: config.websiteId,
        page,
        pageSize,
        status: relationship === "all" ? "JOINED" : relationshipToGraphql(relationship),
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CJ API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const json: unknown = await res.json();
  const envelope = z
    .object({
      data: z
        .object({
          advertiserLinkSearch: z
            .object({
              count: z.number().optional(),
              resultList: z.array(z.unknown()).optional(),
            })
            .optional(),
        })
        .optional(),
      errors: z.array(z.unknown()).optional(),
    })
    .safeParse(json);

  if (envelope.success && envelope.data.errors?.length) {
    throw new Error(`CJ GraphQL error: ${JSON.stringify(envelope.data.errors).slice(0, 300)}`);
  }

  const rows = envelope.success
    ? (envelope.data.data?.advertiserLinkSearch?.resultList ?? [])
    : [];
  const total = envelope.success ? envelope.data.data?.advertiserLinkSearch?.count : undefined;

  const offers = rows
    .map((row) => normalizeCjLink(row))
    .filter((o): o is NormalizedOffer => o !== null);

  const hasMore = typeof total === "number" ? page * pageSize < total : offers.length >= pageSize;

  return {
    offers,
    rawResponses: [json],
    page,
    pageSize,
    totalCount: total,
    hasMore,
  };
}
