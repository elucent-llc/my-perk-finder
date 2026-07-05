import { prisma, type Prisma } from "@mpf/db";
import type { DealFilterQuery } from "@mpf/types";
import { serializeDeal } from "./serialize.js";

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
    data: rows.map(serializeDeal),
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
  return deal ? serializeDeal(deal) : null;
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
  return rows.map(serializeDeal);
}

export async function getAdminOverview() {
  const [active, needsReview, expired, subscribers] = await Promise.all([
    prisma.deal.count({ where: { status: "active" } }),
    prisma.deal.count({ where: { status: "needs_review" } }),
    prisma.deal.count({ where: { status: "expired" } }),
    prisma.subscriber.count(),
  ]);
  const clicks = await prisma.deal.aggregate({ _sum: { clicksCount: true } });
  const importsToday = await prisma.importJob.count({
    where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  });
  return {
    activeOffers: active,
    needsReview,
    expiredToday: expired,
    importsToday,
    clicksToday: clicks._sum.clicksCount ?? 0,
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
