import { prisma, type Prisma } from "@mpf/db";
import type { DealFilterQuery } from "@mpf/types";
import type { StoreCardData } from "@mpf/ui";
import { serializeDeal, serializePublicDeal } from "./serialize.js";

export type { StoreCardData };
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
    ...(q.couponAvailable ? { couponCode: { not: null } } : {}),
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

export async function listDeals(q: DealFilterQuery) {
  const where = buildDealWhere(q, { publicOnly: true });
  const [rows, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: { merchant: true, category: true },
      orderBy: orderByFor(q.sort),
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.deal.count({ where }),
  ]);

  return {
    data: rows.map(serializePublicDeal),
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

export async function getDealBySlug(slug: string) {
  const deal = await prisma.deal.findUnique({
    where: { slug },
    include: { merchant: true, category: true },
  });
  if (!deal || deal.status !== "active") return null;
  return serializePublicDeal(deal);
}

export async function searchDealsPostgres(q: string, limit = 24) {
  const rows = await prisma.deal.findMany({
    where: {
      status: "active",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { merchant: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { merchant: true, category: true },
    orderBy: { clicksCount: "desc" },
    take: limit,
  });
  return rows.map(serializePublicDeal);
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
      include: { merchant: true, category: true },
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
    include: { merchant: true, category: true },
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

/** Active merchants with deal/coupon counts. Falls back to demo list when DB is empty. */
export async function listStores(): Promise<StoreCardData[]> {
  const merchants = await prisma.merchant.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { deals: true, coupons: true } },
    },
    orderBy: [{ deals: { _count: "desc" } }, { name: "asc" }],
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
    include: {
      _count: {
        select: {
          deals: { where: { status: "active" } },
          coupons: true,
        },
      },
    },
  });
  if (!merchant || !merchant.isActive) return null;

  const deals = await prisma.deal.findMany({
    where: { status: "active", merchantId: merchant.id },
    include: { merchant: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

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
    deals: deals.map(serializePublicDeal),
  };
}
