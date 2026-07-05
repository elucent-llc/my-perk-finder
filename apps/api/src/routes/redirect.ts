import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@mpf/db";

/**
 * Affiliate click redirect — tracks clicks then 302 to affiliateUrl.
 * Public route: GET /r/:offerId
 */
export async function redirectRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/:offerId",
    {
      schema: {
        tags: ["redirect"],
        summary: "Track click and redirect to affiliate URL",
        params: z.object({ offerId: z.string() }),
        response: {
          302: z.void(),
          404: z.object({ message: z.string() }),
          410: z.object({ message: z.string() }),
        },
      },
    },
    async (req, reply) => {
      const deal = await prisma.deal.findUnique({ where: { id: req.params.offerId } });
      if (!deal) {
        return reply.code(404).send({ message: "Offer not found" });
      }
      if (deal.status !== "active" || !deal.affiliateUrl) {
        return reply.code(410).send({ message: "Offer is no longer available" });
      }

      await prisma.deal.update({
        where: { id: deal.id },
        data: { clicksCount: { increment: 1 } },
      });

      req.log.info({ offerId: deal.id, slug: deal.slug }, "Affiliate click redirect");

      return reply.redirect(deal.affiliateUrl, 302);
    }
  );
}
