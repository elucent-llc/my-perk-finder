import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { DealFilterQuery } from "@mpf/types";
import { prisma, type Prisma } from "@mpf/db";
import { serializePublicDeal } from "../lib/serialize.js";

const DealResponse = z.object({
  data: z.array(z.record(z.unknown())),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

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

export async function dealsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/",
    {
      schema: {
        tags: ["deals"],
        summary: "List deals with filters, sorting and pagination",
        querystring: DealFilterQuery,
        response: { 200: DealResponse },
      },
    },
    async (req) => {
      const q = req.query;
      const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
      const where: Prisma.DealWhereInput = {
        status: "active",
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
          ? { expiryDate: { lte: new Date(Date.now() + 3 * 864e5), gte: new Date() } }
          : {}),
      };

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
  );

  r.get(
    "/:slug",
    {
      schema: {
        tags: ["deals"],
        summary: "Get a single deal by slug",
        params: z.object({ slug: z.string() }),
        response: { 200: z.record(z.unknown()), 404: z.object({ message: z.string() }) },
      },
    },
    async (req, reply) => {
      const deal = await prisma.deal.findUnique({
        where: { slug: req.params.slug },
        include: { merchant: true, category: true },
      });
      if (!deal || deal.status !== "active") {
        return reply.code(404).send({ message: "Deal not found" });
      }
      return serializePublicDeal(deal);
    }
  );
}
