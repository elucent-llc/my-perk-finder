import { prisma, type Prisma } from "@mpf/db";
import type { DealFilterQuery } from "@mpf/types";
import { serializeDeal, serializePublicDeal } from "./serialize.js";

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

export function buildDealWhere(q: Partial<DealFilterQuery>): Prisma.DealWhereInput {
  return {
    status: q.status ?? "active",
    ...(q.store ? { merchant: { slug: q.store } } : {}),
    ...(q.category ? { category: { slug: q.category } } : {}),
    ...(q.brand ? { brand: { contains: q.brand, mode: "insensitive" } } : {}),
    ...(q.minDiscount ? { discountPercent: { gte: q.minDiscount } } : {}),
    ...(q.couponAvailable ? { couponCode: { not: null } } : {}),
    ...(q.q ? { title: { contains: q.q, mode: "insensitive" } } : {}),
    ...(q.expiresSoon
      ? { expiryDate: { lte: new Date(Date.now() + 3 * 864e5), gte: new Date() } }
      : {}),
  };
}

export async function listDeals(q: DealFilterQuery) {
  const where = buildDealWhere(q);
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
  return deal ? serializePublicDeal(deal) : null;
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
  const [active, needsReview, expired, subscribers, clicksToday, importsToday] = await Promise.all([
    prisma.deal.count({ where: { status: "active" } }),
    prisma.deal.count({ where: { status: "needs_review" } }),
    prisma.deal.count({ where: { status: "expired" } }),
    prisma.subscriber.count(),
    prisma.click.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.importJob.count({ where: { createdAt: { gte: startOfDay } } }),
  ]);
  return {
    activeOffers: active,
    needsReview,
    expiredToday: expired,
    importsToday,
    clicksToday,
    emailSubscribers: subscribers,
  };
}

export async function getReviewQueue() {
  const rows = await prisma.deal.findMany({
    where: { status: "needs_review" },
    include: { merchant: true, category: true },
    orderBy: { confidenceScore: "asc" },
    take: 50,
  });
  return rows.map(serializeDeal);
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

export interface StoreCardData {
  name: string;
  slug: string;
  initials: string;
  dealsCount: number;
  couponsCount: number;
  verified: boolean;
}

function merchantInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const DEMO_STORES: StoreCardData[] = [
  { name: "Best Buy", slug: "best-buy", initials: "BB", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Amazon", slug: "amazon", initials: "AZ", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Walmart", slug: "walmart", initials: "WM", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Target", slug: "target", initials: "TG", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Nike", slug: "nike", initials: "NK", dealsCount: 0, couponsCount: 0, verified: false },
  { name: "Dell", slug: "dell", initials: "DL", dealsCount: 0, couponsCount: 0, verified: false },
];

/** Active merchants with deal/coupon counts. Falls back to demo list when DB is empty. */
export async function listStores(): Promise<StoreCardData[]> {
  const merchants = await prisma.merchant.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { deals: true, coupons: true } },
    },
    orderBy: { name: "asc" },
  });

  if (merchants.length === 0) {
    return process.env.NODE_ENV === "development" ? DEMO_STORES : [];
  }

  return merchants.map((m) => ({
    name: m.name,
    slug: m.slug,
    initials: merchantInitials(m.name),
    dealsCount: m._count.deals,
    couponsCount: m._count.coupons,
    verified: Boolean(m.network),
  }));
}
