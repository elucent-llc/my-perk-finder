import { z } from "zod";
import type {
  AffiliateFetchOptions,
  AffiliateSourceConfig,
  AffiliateSourceResult,
  NormalizedOffer,
} from "../types.js";

const AwinPromotionSchema = z.object({
  promotionId: z.union([z.number(), z.string()]).optional(),
  id: z.union([z.number(), z.string()]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  terms: z.string().optional(),
  type: z.string().optional(),
  url: z.string().url().optional().nullable(),
  urlTracking: z.string().url().optional().nullable(),
  deeplink: z.string().url().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  voucherCode: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  advertiser: z
    .object({
      id: z.union([z.number(), z.string()]).optional(),
      name: z.string().optional(),
    })
    .optional()
    .nullable(),
  regions: z.array(z.string()).optional(),
});

const AwinResponseSchema = z.object({
  data: z.array(AwinPromotionSchema).optional(),
  promotions: z.array(AwinPromotionSchema).optional(),
  pagination: z
    .object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      total: z.number().optional(),
    })
    .optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function parsePrice(text?: string | null): number | null {
  if (!text) return null;
  const match = text.match(/(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]) : null;
}

/** Normalize a single Awin promotion into our canonical offer shape. */
export function normalizeAwinPromotion(raw: unknown): NormalizedOffer | null {
  const parsed = AwinPromotionSchema.safeParse(raw);
  if (!parsed.success) return null;

  const p = parsed.data;
  const externalId = String(p.promotionId ?? p.id ?? "");
  if (!externalId) return null;

  const title = (p.title ?? p.description ?? "Untitled promotion").trim();
  const merchantName = p.advertiser?.name?.trim() ?? null;
  const affiliateUrl = p.urlTracking ?? p.deeplink ?? p.url ?? null;
  const couponCode = p.voucherCode ?? p.code ?? null;

  const descPrices = parsePrice(p.description);
  const salePrice = descPrices ?? 0;
  const regularPrice = salePrice > 0 ? salePrice : 0;
  const discountPercent =
    regularPrice > 0 && salePrice < regularPrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  let confidence = 0.75;
  if (!affiliateUrl) confidence -= 0.2;
  if (!merchantName) confidence -= 0.15;
  if (!title || title.length < 5) confidence -= 0.1;
  if (p.type && p.type !== "promotion" && p.type !== "voucher") confidence -= 0.05;

  return {
    externalId,
    source: "awin",
    title,
    slug: slugify(`${title}-${merchantName ?? "awin"}-${externalId}`),
    merchantName,
    brand: null,
    category: null,
    regularPrice,
    salePrice,
    discountPercent,
    couponCode,
    currency: "USD",
    imageUrl: null,
    affiliateUrl,
    productUrl: p.url ?? null,
    expiryDate: p.endDate ? new Date(p.endDate) : null,
    description: p.description ?? p.terms ?? null,
    confidenceScore: Math.max(0, Math.min(1, confidence)),
    rawPayload: raw,
  };
}

/** Mock promotions for local dev when credentials are absent or MOCK_EXTERNAL=true. */
function mockAwinPromotions(): NormalizedOffer[] {
  const samples = [
    {
      promotionId: "mock-1001",
      title: "20% off Electronics at Best Buy",
      description: "Save 20% on select electronics. Was $249 now $199.",
      advertiser: { id: 101, name: "Best Buy" },
      urlTracking: "https://www.awin1.com/cread.php?awinmid=mock&awinaffid=mock",
      url: "https://bestbuy.com/deals",
      endDate: new Date(Date.now() + 7 * 864e5).toISOString(),
      voucherCode: "BB20OFF",
      type: "promotion",
    },
    {
      promotionId: "mock-1002",
      title: "Free shipping at Nike",
      description: "Free shipping on orders $50+",
      advertiser: { id: 102, name: "Nike" },
      urlTracking: "https://www.awin1.com/cread.php?awinmid=mock2&awinaffid=mock",
      url: "https://nike.com",
      endDate: new Date(Date.now() + 14 * 864e5).toISOString(),
      type: "voucher",
    },
    {
      promotionId: "mock-1003",
      title: "Instant Pot Duo — $59",
      description: "Limited time $59 (was $119)",
      advertiser: { id: 103, name: "Amazon" },
      urlTracking: "https://www.awin1.com/cread.php?awinmid=mock3&awinaffid=mock",
      endDate: new Date(Date.now() + 3 * 864e5).toISOString(),
      type: "promotion",
    },
  ];
  return samples.map((s) => normalizeAwinPromotion(s)).filter(Boolean) as NormalizedOffer[];
}

/**
 * Fetch promotions from Awin Publisher API.
 * POST https://api.awin.com/publisher/{publisherId}/promotions
 *
 * Never call from browser — server/worker only.
 */
export async function fetchAwinOffers(
  config: AffiliateSourceConfig,
  options: AffiliateFetchOptions = {}
): Promise<AffiliateSourceResult> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 100;
  const regionCodes = options.regionCodes ?? ["US"];
  const updatedSince = options.updatedSince?.toISOString();

  const useMock =
    config.mockExternal ||
    !config.accessToken ||
    !config.publisherId ||
    config.accessToken === "mock" ||
    config.publisherId === "mock";

  if (useMock) {
    const offers = mockAwinPromotions();
    return {
      offers,
      rawResponses: offers.map((o) => o.rawPayload),
      page: 1,
      pageSize: offers.length,
      totalCount: offers.length,
      hasMore: false,
    };
  }

  const url = `https://api.awin.com/publisher/${encodeURIComponent(config.publisherId)}/promotions`;

  const body: Record<string, unknown> = {
    filters: {
      regionCodes,
      membership: "joined",
      status: "active",
      ...(updatedSince ? { updatedSince } : {}),
    },
    pagination: { page, pageSize },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Awin API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const json: unknown = await res.json();
  const parsed = AwinResponseSchema.safeParse(json);
  const rows = parsed.success ? (parsed.data.data ?? parsed.data.promotions ?? []) : [];

  const offers = rows
    .map((row) => normalizeAwinPromotion(row))
    .filter((o): o is NormalizedOffer => o !== null);

  const pagination = parsed.success ? parsed.data.pagination : undefined;
  const total = pagination?.total;
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
