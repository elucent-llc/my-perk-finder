import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@mpf/db";
import { serializeCoupon } from "../lib/serialize.js";

export async function couponsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/",
    {
      schema: {
        tags: ["coupons"],
        summary: "List active coupons",
        querystring: z.object({ q: z.string().optional() }),
        response: { 200: z.array(z.record(z.unknown())) },
      },
    },
    async (req) => {
      const coupons = await prisma.coupon.findMany({
        where: {
          isActive: true,
          ...(req.query.q ? { title: { contains: req.query.q, mode: "insensitive" } } : {}),
        },
        include: { merchant: true },
        orderBy: { expiryDate: "asc" },
      });
      return coupons.map(serializeCoupon);
    }
  );

  r.post(
    "/:id/reveal",
    {
      schema: {
        tags: ["coupons"],
        summary: "Track a coupon code reveal",
        params: z.object({ id: z.string() }),
        response: { 200: z.object({ revealCount: z.number() }) },
      },
    },
    async (req) => {
      const c = await prisma.coupon.update({
        where: { id: req.params.id },
        data: { revealCount: { increment: 1 } },
      });
      return { revealCount: c.revealCount };
    }
  );
}
