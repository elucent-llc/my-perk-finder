import { unstable_cache } from "next/cache";
import { prisma, type Prisma } from "@mpf/db";
import type { DealFilterQuery } from "@mpf/types";
import type { StoreCardData } from "@mpf/ui";
import { serializeDeal, serializePublicDeal } from "./serialize.js";

export type { StoreCardData };

/**
 * Exactly the columns serialize.ts reads. `include: { merchant: true, category: true }`
 * used to drag in every column of all three tables on every card query — including
 * Category.mappingKeywords (an unbounded String[]), Category.seoDescription,
 * Merchant.commissionRate and Deal.affiliateUrl, which serializePublicDeal throws away.
 */
export const DEAL_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  brand: true,
  offerType: true,
  regularPrice: true,
  salePrice: true,
  discountPercent: true,
  couponCode: true,
  currency: true,
  imageUrl: true,
  productUrl: true,
  expiryDate: true,
  lastVerifiedAt: true,
  sourceName: true,
  status: true,
  confidenceScore: true,
  validationFlags: true,
  clicksCount: true,
  savesCount: true,
  merchantId: true,
  categoryId: true,
  merchant: { select: { name: true, slug: true, logoUrl: true } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.DealSelect;

/** Admin views are the only place allowed to read the raw affiliate URL. */
const DEAL_ADMIN_SELECT = {
  ...DEAL_CARD_SELECT,
  affiliateUrl: true,
} satisfies Prisma.DealSelect;

/** Bounded defaults: these lists are rendered in full, but must never be an unbounded scan. */
const DEFAULT_STORE_LIMIT = 500;
const DEFAULT_CATEGORY_LIMIT = 200;

const orderByFor = (sort: string): Prisma.DealOrderByWithRelationInput => {
  switch (sort) {
    case "highest_discount":
      return { discountPercent: "desc" };
    case "ending_soon":
      return { expiryDate: "asc" };
    case "lowest_price":
      return { salePrice: "asc" };
    case "most_popular":
      return { clicksCount: "desc" };
    default:
      return { createdAt: "desc" };
  }
};

export function buildDealWhere(q: Partial<DealFilterQuery>, opts?: { publicOnly?: boolean }): Prisma.DealWhereInput {
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  const publicOnly = opts?.publicOnly !== false;
  return {
    status: publicOnly ? "active" : (q.status ?? "active"),
    ...(q.store ? { merchant: { slug: q.store } } : {}),
    ...(q.category ? { category: { slug: q.category } } : {}),
    ...(q.brand ? { brand: { contains: q.brand, mode: "insensitive" } } : {}),
    ...(q.minDiscount ? { discountPercent: { gte: q.minDiscount } } : {}),
    ...(q.minPrice != null || q.maxPrice != null
      ? {
          salePrice: {
            ...(q.minPrice != null ? { gte: q.minPrice } : {}),
            ...(q.maxPrice != null ? { lte: q.maxPrice } : {}),
          },
        }
      : {}),
    // `not: null` alone let empty-string codes through, which feeds do produce. Callers then
    // dropped them in JS after pagination, so a page of 24 could render 21 rows with no way
    // to reach the missing three. Excluded in SQL so the count and the rows agree.
    ...(q.couponAvailable ? { couponCode: { not: null, notIn: [""] } } : {}),
    ...(q.q ? { title: { contains: q.q, mode: "insensitive" } } : {}),
    ...(q.verifiedToday ? { lastVerifiedAt: { gte: startOfToday } } : {}),
    ...(q.expiresSoon
      ? {
          // Keep in sync with EXPIRING_SOON_DAYS in apps/web/lib/expiry.ts (30 days).
          expiryDate: { lte: new Date(Date.now() + 30 * 864e5), gte: new Date() },
        }
      : {}),
  };
}

/**
 * @param opts.withTotal pass `false` when the caller only renders rows. `count(*)` on the
 * deals table is a full index scan in Postgres, and the homepage was paying for two of
 * them per render just to discard the numbers.
 */
export async function listDeals(q: DealFilterQuery, opts?: { withTotal?: boolean }) {
  const where = buildDealWhere(q, { publicOnly: true });
  const withTotal = opts?.withTotal !== false;
  const [rows, counted] = await Promise.all([
    prisma.deal.findMany({
      where,
      select: DEAL_CARD_SELECT,
      orderBy: orderByFor(q.sort),
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    withTotal ? prisma.deal.count({ where }) : Promise.resolve(null),
  ]);

  // Without the count we can still report a truthful lower bound, so the shape never changes.
  const total = counted ?? (q.page - 1) * q.pageSize + rows.length;

  return {
    data: rows.map(serializePublicDeal),
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

/** Convenience wrapper for callers that never read `total`. */
export async function listDealsNoCount(q: DealFilterQuery) {
  return listDeals(q, { withTotal: false });
}

export async function getDealBySlug(slug: string) {
  const deal = await prisma.deal.findUnique({
    where: { slug },
    select: DEAL_CARD_SELECT,
  });
  if (!deal || deal.status !== "active") return null;
  return serializePublicDeal(deal);
}

/**
 * "More like this" in one indexed query. The deal page used to pull the 20 newest deals
 * site-wide plus a COUNT and filter in JS, so matches were both slow and usually wrong
 * (a related deal outside the newest 20 could never surface).
 */
export async function getRelatedDeals(
  slug: string,
  merchantId: string | null,
  categoryId: string | null,
  take = 4
) {
  const or: Prisma.DealWhereInput[] = [
    ...(merchantId ? [{ merchantId }] : []),
    ...(categoryId ? [{ categoryId }] : []),
  ];
  if (or.length === 0) return [];

  const rows = await prisma.deal.findMany({
    where: { status: "active", slug: { not: slug }, OR: or },
    select: DEAL_CARD_SELECT,
    orderBy: [{ discountPercent: "desc" }, { createdAt: "desc" }],
    take,
  });
  return rows.map(serializePublicDeal);
}

function searchDealWhere(q: string): Prisma.DealWhereInput {
  return {
    status: "active",
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { merchant: { name: { contains: q, mode: "insensitive" } } },
    ],
  };
}

export async function searchDealsPostgres(q: string, limit = 24) {
  const rows = await prisma.deal.findMany({
    where: searchDealWhere(q),
    select: DEAL_CARD_SELECT,
    orderBy: { clicksCount: "desc" },
    take: limit,
  });
  return rows.map(serializePublicDeal);
}

/**
 * Paginated search. The search page hard-truncated at 24 results while telling the user
 * "N deals found", so anything past the first page was unreachable.
 */
export async function searchDealsPage(q: string, opts?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 24));
  const where = searchDealWhere(q);
  const [rows, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      select: DEAL_CARD_SELECT,
      orderBy: { clicksCount: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.deal.count({ where }),
  ]);
  return {
    data: rows.map(serializePublicDeal),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const PUBLIC_STATS_TAG = "public-stats";

/**
 * 3x COUNT(*) + a findFirst feeding a decorative trust bar. Content only changes when the
 * cron importer runs, so serve it from the data cache and let the importer bust the tag.
 */
const cachedPublicStats = unstable_cache(
  async () => {
    const [activeDeals, stores, coupons, latest] = await Promise.all([
      prisma.deal.count({ where: { status: "active" } }),
      prisma.merchant.count({ where: { deals: { some: { status: "active" } } } }),
      prisma.deal.count({ where: { status: "active", couponCode: { not: null } } }),
      prisma.deal.findFirst({
        where: { status: "active" },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);
    // ISO string, not Date: unstable_cache round-trips values through JSON, so a Date
    // would come back as a string on a cache hit and lie about its type.
    return { activeDeals, stores, coupons, updatedAt: latest?.updatedAt?.toISOString() ?? null };
  },
  ["public-stats"],
  { revalidate: 600, tags: [PUBLIC_STATS_TAG] }
);

/** Lightweight public counts for the homepage trust bar. */
export async function getPublicStats() {
  const s = await cachedPublicStats();
  return { ...s, updatedAt: s.updatedAt ? new Date(s.updatedAt) : null };
}

export async function getAdminOverview() {
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const [active, needsReview, expiredToday, subscribers, clicksToday, importsToday] =
    await Promise.all([
      prisma.deal.count({ where: { status: "active" } }),
      prisma.deal.count({ where: { status: "needs_review" } }),
      prisma.deal.count({
        where: {
          status: "expired",
          expiryDate: { gte: startOfDay, lt: new Date(startOfDay.getTime() + 864e5) },
        },
      }),
      prisma.subscriber.count(),
      prisma.click.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.importJob.count({ where: { createdAt: { gte: startOfDay } } }),
    ]);
  return {
    activeOffers: active,
    needsReview,
    expiredToday,
    importsToday,
    clicksToday,
    emailSubscribers: subscribers,
  };
}

export async function getReviewQueue(page = 1, pageSize = 50) {
  const where = { status: "needs_review" as const };
  const [rows, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      select: DEAL_ADMIN_SELECT,
      orderBy: { confidenceScore: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.deal.count({ where }),
  ]);
  return {
    data: rows.map(serializeDeal),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAdminOffers(params: { status?: string; q?: string }) {
  const rows = await prisma.deal.findMany({
    where: {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.q ? { title: { contains: params.q, mode: "insensitive" } } : {}),
    },
    select: DEAL_ADMIN_SELECT,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return rows.map(serializeDeal);
}

export async function listImportJobs() {
  const jobs = await prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return jobs.map((j) => ({
    id: j.id,
    source: j.source,
    status: j.status,
    startedAt: j.startedAt?.toISOString() ?? null,
    finishedAt: j.finishedAt?.toISOString() ?? null,
    offersFound: j.offersFound,
    created: j.created,
    updated: j.updated,
    rejected: j.rejected,
    needsReview: j.needsReview,
    error: j.error,
  }));
}

const DEMO_STORES: StoreCardData[] = [
  { name: "Best Buy", slug: "best-buy", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Amazon", slug: "amazon", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Walmart", slug: "walmart", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Target", slug: "target", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Nike", slug: "nike", dealsCount: 0, couponsCount: 0, verified: false },
  { name: "Dell", slug: "dell", dealsCount: 0, couponsCount: 0, verified: false },
];

/**
 * Active merchants with active-deal counts. Falls back to demo list when DB is empty.
 * @param limit omit for the full /stores listing (still capped, it was unbounded before);
 * pass a small number on the homepage, which only renders the first 12.
 */
export async function listStores(limit?: number): Promise<StoreCardData[]> {
  const merchants = await prisma.merchant.findMany({
    where: {
      isActive: true,
      deals: { some: { status: "active" } },
    },
    select: {
      name: true,
      slug: true,
      network: true,
      logoUrl: true,
      _count: {
        select: {
          deals: { where: { status: "active" } },
          coupons: true,
        },
      },
    },
    orderBy: [{ deals: { _count: "desc" } }, { name: "asc" }],
    take: limit ?? DEFAULT_STORE_LIMIT,
  });

  if (merchants.length === 0) {
    return process.env.NODE_ENV === "development" ? DEMO_STORES : [];
  }

  return merchants.map((m) => ({
    name: m.name,
    slug: m.slug,
    dealsCount: m._count.deals,
    couponsCount: m._count.coupons,
    verified: Boolean(m.network),
    logoUrl: m.logoUrl,
  }));
}

export async function getStoreBySlug(slug: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      network: true,
      logoUrl: true,
      homepageUrl: true,
      isActive: true,
      _count: {
        select: {
          deals: { where: { status: "active" } },
          coupons: true,
        },
      },
    },
  });
  if (!merchant || !merchant.isActive) return null;

  const [deals, verifiedAgg, categoryGroups, storeCategories, similar] = await Promise.all([
    prisma.deal.findMany({
      where: { status: "active", merchantId: merchant.id },
      select: DEAL_CARD_SELECT,
      orderBy: { createdAt: "desc" },
      take: 48,
    }),
    prisma.deal.aggregate({
      where: { status: "active", merchantId: merchant.id, lastVerifiedAt: { not: null } },
      _max: { lastVerifiedAt: true },
    }),
    prisma.deal.groupBy({
      by: ["categoryId"],
      where: { status: "active", merchantId: merchant.id, categoryId: { not: null } },
      // Prisma requires the field an `orderBy: { _count: … }` names to be selected in
      // `_count` as well; pairing `_count: { _all: true }` with `orderBy` on `categoryId`
      // fails validation at query time, which took the whole store page down with it. Since
      // the where clause already excludes null categoryId, this count equals the row count.
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: "desc" } },
      take: 6,
    }),
    // The groupBy supplies counts + ordering, this supplies display names. Neither depends
    // on the other (it filters by relation, not by the grouped ids), so it no longer has to
    // wait a serial round-trip for the groupBy to come back.
    prisma.category.findMany({
      where: { deals: { some: { status: "active", merchantId: merchant.id } } },
      select: { id: true, name: true, slug: true },
    }),
    // Similar stores: other active retailers, most active first.
    prisma.merchant.findMany({
      where: { isActive: true, slug: { not: slug }, deals: { some: { status: "active" } } },
      select: {
        name: true,
        slug: true,
        network: true,
        logoUrl: true,
        _count: { select: { deals: { where: { status: "active" } }, coupons: true } },
      },
      orderBy: [{ deals: { _count: "desc" } }, { name: "asc" }],
      take: 6,
    }),
  ]);

  // Map lookup instead of a .find() per group, which was O(groups x categories).
  const categoryById = new Map(storeCategories.map((c) => [c.id, c]));
  const topCategories = categoryGroups
    .map((g) => {
      const cat = g.categoryId ? categoryById.get(g.categoryId) : undefined;
      return cat ? { name: cat.name, slug: cat.slug, count: g._count.categoryId } : null;
    })
    .filter((v): v is { name: string; slug: string; count: number } => Boolean(v));

  const serialized = deals.map(serializePublicDeal);

  return {
    store: {
      name: merchant.name,
      slug: merchant.slug,
      dealsCount: merchant._count.deals,
      couponsCount: merchant._count.coupons,
      verified: Boolean(merchant.network),
      logoUrl: merchant.logoUrl,
      homepageUrl: merchant.homepageUrl,
    } satisfies StoreCardData & { homepageUrl?: string | null },
    deals: serialized,
    coupons: serialized.filter((d) => d.couponCode),
    lastVerifiedAt: verifiedAgg._max.lastVerifiedAt?.toISOString() ?? null,
    topCategories,
    similarStores: similar.map((m) => ({
      name: m.name,
      slug: m.slug,
      dealsCount: m._count.deals,
      couponsCount: m._count.coupons,
      verified: Boolean(m.network),
      logoUrl: m.logoUrl,
    })) satisfies StoreCardData[],
  };
}

/**
 * All categories that currently have at least one active deal.
 * @param limit omit for the full /categories listing; the homepage only renders 6.
 */
export async function listCategories(limit?: number) {
  const rows = await prisma.category.findMany({
    where: { deals: { some: { status: "active" } } },
    select: {
      name: true,
      slug: true,
      seoDescription: true,
      _count: { select: { deals: { where: { status: "active" } } } },
    },
    orderBy: [{ deals: { _count: "desc" } }, { name: "asc" }],
    take: limit ?? DEFAULT_CATEGORY_LIMIT,
  });
  return rows.map((c) => ({
    name: c.name,
    slug: c.slug,
    dealsCount: c._count.deals,
    seoDescription: c.seoDescription,
  }));
}

/**
 * @param opts pass page/pageSize to paginate the deal grid. Defaults reproduce the old
 * behaviour (first 24) but now expose totalPages so the page can stop advertising a
 * total it refuses to show.
 */
export async function getCategoryBySlug(slug: string, opts?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 24));

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, seoTitle: true, seoDescription: true },
  });
  if (!category) return null;

  const [deals, total, verifiedAgg, stores, related] = await Promise.all([
    prisma.deal.findMany({
      where: { status: "active", categoryId: category.id },
      select: DEAL_CARD_SELECT,
      orderBy: [{ discountPercent: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.deal.count({ where: { status: "active", categoryId: category.id } }),
    prisma.deal.aggregate({
      where: { status: "active", categoryId: category.id, lastVerifiedAt: { not: null } },
      _max: { lastVerifiedAt: true },
    }),
    prisma.merchant.findMany({
      where: {
        isActive: true,
        deals: { some: { status: "active", categoryId: category.id } },
      },
      select: {
        name: true,
        slug: true,
        network: true,
        logoUrl: true,
        _count: {
          select: { deals: { where: { status: "active", categoryId: category.id } }, coupons: true },
        },
      },
      orderBy: [{ deals: { _count: "desc" } }, { name: "asc" }],
      take: 8,
    }),
    prisma.category.findMany({
      where: { slug: { not: slug }, deals: { some: { status: "active" } } },
      select: {
        name: true,
        slug: true,
        _count: { select: { deals: { where: { status: "active" } } } },
      },
      orderBy: [{ deals: { _count: "desc" } }, { name: "asc" }],
      take: 8,
    }),
  ]);

  if (total === 0) return null;

  return {
    category: {
      name: category.name,
      slug: category.slug,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
    },
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    lastVerifiedAt: verifiedAgg._max.lastVerifiedAt?.toISOString() ?? null,
    deals: deals.map(serializePublicDeal),
    stores: stores.map((m) => ({
      name: m.name,
      slug: m.slug,
      dealsCount: m._count.deals,
      couponsCount: m._count.coupons,
      verified: Boolean(m.network),
      logoUrl: m.logoUrl,
    })) satisfies StoreCardData[],
    related: related.map((c) => ({ name: c.name, slug: c.slug, dealsCount: c._count.deals })),
  };
}

/** Slugs + timestamps for the sitemap. Only indexable, active content. */
export async function getSitemapData() {
  const [deals, stores, categories] = await Promise.all([
    prisma.deal.findMany({
      where: { status: "active" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.merchant.findMany({
      where: { isActive: true, deals: { some: { status: "active" } } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { deals: { some: { status: "active" } } },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  return { deals, stores, categories };
}
