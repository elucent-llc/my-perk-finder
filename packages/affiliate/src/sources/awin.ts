import { z } from "zod";
import { slugify, sanitizeExpiry } from "../util.js";
import type {
  AffiliateFetchOptions,
  AffiliateSourceConfig,
  AffiliateSourceResult,
  AwinMembershipFilter,
  NormalizedOffer,
  OfferType,
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
  imageUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  campaignLogoUri: z.string().url().optional().nullable(),
  voucher: z
    .object({
      code: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  advertiser: z
    .object({
      id: z.union([z.number(), z.string()]).optional(),
      name: z.string().optional(),
      logoUrl: z.string().url().optional().nullable(),
      primaryRegion: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  regions: z
    .union([
      z.array(z.string()),
      z.object({
        list: z
          .array(
            z.object({
              countryCode: z.string().optional(),
            })
          )
          .optional(),
      }),
    ])
    .optional(),
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

/**
 * Only extract prices when the text has an unambiguous was/now (or now $X) pattern.
 * Avoid grabbing the first number from coupon copy (e.g. "AFF15" → $15).
 */
function parseWasNowPrices(text?: string | null): {
  salePrice: number | null;
  regularPrice: number | null;
} {
  if (!text) return { salePrice: null, regularPrice: null };
  const wasNow = text.match(
    /was\s*\$?\s*(\d+(?:\.\d{1,2})?).{0,40}?(?:now|only|just)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i
  );
  if (wasNow) {
    return { regularPrice: Number(wasNow[1]), salePrice: Number(wasNow[2]) };
  }
  const nowOnly = text.match(/(?:now|only|just)\s*\$\s*(\d+(?:\.\d{1,2})?)/i);
  if (nowOnly) return { salePrice: Number(nowOnly[1]), regularPrice: null };
  return { salePrice: null, regularPrice: null };
}

function extractCountryCodes(regions: z.infer<typeof AwinPromotionSchema>["regions"]): string[] {
  if (!regions) return [];
  if (Array.isArray(regions)) {
    return regions.map(String).filter(Boolean);
  }
  const list = regions.list ?? [];
  return list.map((r) => r.countryCode).filter((c): c is string => Boolean(c));
}

function awinTypeToOfferType(type?: string | null): OfferType {
  const t = (type ?? "").toLowerCase();
  if (t === "voucher") return "coupon";
  if (t === "promotion") return "promotion";
  return "promotion";
}

function resolveOfferType(
  awinType: string | undefined | null,
  couponCode: string | null,
  regularPrice: number | null,
  salePrice: number | null
): OfferType {
  let offerType = awinTypeToOfferType(awinType);
  if (couponCode) offerType = "coupon";
  if (salePrice != null && salePrice > 0) {
    if (regularPrice != null && regularPrice > salePrice) return "sale";
    return "product";
  }
  return offerType;
}

/** Normalize a single Awin promotion into our canonical offer shape. */
export function normalizeAwinPromotion(raw: unknown): NormalizedOffer | null {
  const parsed = AwinPromotionSchema.safeParse(raw);
  if (!parsed.success) return null;

  const p = parsed.data;
  const externalId = String(p.promotionId ?? p.id ?? "");
  if (!externalId) return null;

  const title = (p.title ?? "").trim();
  const merchantName = p.advertiser?.name?.trim() ?? null;
  const merchantExternalId = p.advertiser?.id != null ? String(p.advertiser.id) : null;
  const affiliateUrl = p.urlTracking ?? p.deeplink ?? p.url ?? null;
  const couponCode = p.voucher?.code ?? p.voucherCode ?? p.code ?? null;
  const countryCodes = extractCountryCodes(p.regions);

  const { salePrice, regularPrice } = parseWasNowPrices(p.description);
  const discountPercent =
    regularPrice != null && salePrice != null && salePrice < regularPrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  const offerType = resolveOfferType(p.type, couponCode, regularPrice, salePrice);
  const imageUrl =
    p.imageUrl ?? p.bannerUrl ?? p.campaignLogoUri ?? p.advertiser?.logoUrl ?? null;

  let confidence = 0.75;
  if (!affiliateUrl) confidence -= 0.2;
  if (!merchantName) confidence -= 0.15;
  if (!title || title.length < 5) confidence -= 0.1;

  return {
    externalId,
    source: "awin",
    title,
    slug: slugify(`${title || "offer"}-${merchantName ?? "awin"}-${externalId}`),
    merchantName,
    merchantExternalId,
    brand: null,
    category: null,
    offerType,
    regularPrice,
    salePrice,
    discountPercent,
    couponCode,
    currency: "USD",
    imageUrl,
    affiliateUrl,
    productUrl: p.url ?? null,
    startDate: p.startDate ? new Date(p.startDate) : null,
    expiryDate: sanitizeExpiry(p.endDate),
    countryCodes,
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
      voucher: { code: "BB20OFF" },
      type: "voucher",
      regions: { list: [{ countryCode: "US" }] },
    },
    {
      promotionId: "mock-1002",
      title: "Free shipping at Nike",
      description: "Free shipping on orders $50+",
      advertiser: { id: 102, name: "Nike" },
      urlTracking: "https://www.awin1.com/cread.php?awinmid=mock2&awinaffid=mock",
      url: "https://nike.com",
      endDate: new Date(Date.now() + 14 * 864e5).toISOString(),
      type: "promotion",
      regions: { list: [{ countryCode: "US" }] },
    },
    {
      promotionId: "mock-1003",
      title: "Instant Pot Duo — $59",
      description: "Limited time was $119 now $59",
      advertiser: { id: 103, name: "Amazon" },
      urlTracking: "https://www.awin1.com/cread.php?awinmid=mock3&awinaffid=mock",
      endDate: new Date(Date.now() + 3 * 864e5).toISOString(),
      type: "promotion",
      regions: { list: [{ countryCode: "US" }] },
    },
  ];
  return samples.map((s) => normalizeAwinPromotion(s)).filter(Boolean) as NormalizedOffer[];
}

function resolveMembership(
  config: AffiliateSourceConfig,
  options: AffiliateFetchOptions
): AwinMembershipFilter {
  return options.membershipFilter ?? config.membershipFilter ?? "all";
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
  const pageSize = options.pageSize ?? config.pageSize ?? 100;
  const regionCodes = options.regionCodes ?? config.regionCodes ?? ["US"];
  const membership = resolveMembership(config, options);
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
      membership,
      status: "active",
      type: "all",
      regionCodes,
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
