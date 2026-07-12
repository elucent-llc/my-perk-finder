import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { OfferStatus, UpdateDealSchema } from "@mpf/types";
import { prisma } from "@mpf/db";
import { serializeDeal } from "../lib/serialize.js";

export async function adminRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/overview",
    { schema: { tags: ["admin"], summary: "Dashboard KPI summary", response: { 200: z.record(z.number()) } } },
    async () => {
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
  );

  r.get(
    "/review",
    {
      schema: {
        tags: ["admin"],
        summary: "Offers needing review (paginated)",
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          pageSize: z.coerce.number().int().min(1).max(100).default(50),
        }),
        response: { 200: z.record(z.unknown()) },
      },
    },
    async (req) => {
      const { page, pageSize } = req.query;
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
  );

  r.get(
    "/offers",
    {
      schema: {
        tags: ["admin"],
        summary: "List offers by status",
        querystring: z.object({ status: OfferStatus.optional(), q: z.string().optional() }),
        response: { 200: z.array(z.record(z.unknown())) },
      },
    },
    async (req) => {
      const rows = await prisma.deal.findMany({
        where: {
          ...(req.query.status ? { status: req.query.status } : {}),
          ...(req.query.q ? { title: { contains: req.query.q, mode: "insensitive" } } : {}),
        },
        include: { merchant: true, category: true },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
      return rows.map(serializeDeal);
    }
  );

  r.patch(
    "/offers/:id",
    {
      schema: {
        tags: ["admin"],
        summary: "Update / moderate an offer",
        params: z.object({ id: z.string() }),
        body: UpdateDealSchema.extend({ status: OfferStatus.optional() }),
        response: { 200: z.record(z.unknown()) },
      },
    },
    async (req) => {
      const b = req.body;
      const updated = await prisma.deal.update({
        where: { id: req.params.id },
        data: {
          ...(b.title !== undefined ? { title: b.title } : {}),
          ...(b.brand !== undefined ? { brand: b.brand } : {}),
          ...(b.couponCode !== undefined ? { couponCode: b.couponCode } : {}),
          ...(b.status !== undefined ? { status: b.status } : {}),
          ...(b.salePrice !== undefined ? { salePrice: b.salePrice } : {}),
          ...(b.regularPrice !== undefined ? { regularPrice: b.regularPrice } : {}),
        },
        include: { merchant: true, category: true },
      });
      return serializeDeal(updated);
    }
  );
}
