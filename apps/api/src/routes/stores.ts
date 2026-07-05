import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@mpf/db";
import { serializeDeal, serializeCoupon } from "../lib/serialize.js";

export async function storesRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/",
    { schema: { tags: ["stores"], summary: "List all stores", response: { 200: z.array(z.record(z.unknown())) } } },
    async () => {
      const merchants = await prisma.merchant.findMany({
        where: { isActive: true },
        include: { _count: { select: { deals: true, coupons: true } } },
        orderBy: { name: "asc" },
      });
      return merchants.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        logoUrl: m.logoUrl,
        network: m.network,
        commissionRate: m.commissionRate,
        dealsCount: m._count.deals,
        couponsCount: m._count.coupons,
      }));
    }
  );

  r.get(
    "/:slug",
    {
      schema: {
        tags: ["stores"],
        summary: "Store detail with active deals & coupons",
        params: z.object({ slug: z.string() }),
        response: { 200: z.record(z.unknown()), 404: z.object({ message: z.string() }) },
      },
    },
    async (req, reply) => {
      const m = await prisma.merchant.findUnique({
        where: { slug: req.params.slug },
        include: {
          deals: { where: { status: "active" }, include: { merchant: true, category: true }, take: 12 },
          coupons: { where: { isActive: true }, include: { merchant: true }, take: 12 },
        },
      });
      if (!m) return reply.code(404).send({ message: "Store not found" });
      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        network: m.network,
        homepageUrl: m.homepageUrl,
        deals: m.deals.map(serializeDeal),
        coupons: m.coupons.map(serializeCoupon),
      };
    }
  );
}
