import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { OfferStatus, UpdateDealSchema } from "@mpf/types";
import { prisma } from "@mpf/db";
import { serializeDeal } from "../lib/serialize.js";

export async function adminRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Overview KPIs
  r.get(
    "/overview",
    { schema: { tags: ["admin"], summary: "Dashboard KPI summary", response: { 200: z.record(z.number()) } } },
    async () => {
      const [active, needsReview, expired, subscribers] = await Promise.all([
        prisma.deal.count({ where: { status: "active" } }),
        prisma.deal.count({ where: { status: "needs_review" } }),
        prisma.deal.count({ where: { status: "expired" } }),
        prisma.subscriber.count(),
      ]);
      const clicks = await prisma.deal.aggregate({ _sum: { clicksCount: true } });
      const importsToday = await prisma.importJob.count();
      return {
        activeOffers: active,
        needsReview,
        expiredToday: expired,
        importsToday,
        clicksToday: clicks._sum.clicksCount ?? 0,
        emailSubscribers: subscribers,
      };
    }
  );

  // Review queue
  r.get(
    "/review",
    { schema: { tags: ["admin"], summary: "Offers needing review", response: { 200: z.array(z.record(z.unknown())) } } },
    async () => {
      const rows = await prisma.deal.findMany({
        where: { status: "needs_review" },
        include: { merchant: true, category: true },
        orderBy: { confidenceScore: "asc" },
        take: 50,
      });
      return rows.map(serializeDeal);
    }
  );

  // All offers with status filter
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

  // Update offer (edit / approve / reject / mark expired)
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
