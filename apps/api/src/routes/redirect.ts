import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@mpf/db";
import { env } from "../env.js";

function isValidAffiliateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function hashIp(ip: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 32);
}

function clientIp(request: { headers: Record<string, unknown> }): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? "unknown";
  const real = request.headers["x-real-ip"];
  return typeof real === "string" ? real : "unknown";
}

function clickHashSecret(): string | null {
  return env.CLICK_HASH_SECRET?.trim() || env.ADMIN_AUTH_SECRET?.trim() || null;
}

/**
 * Affiliate click redirect — tracks Click row + count, then 302.
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
          503: z.object({ message: z.string() }),
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
      if (!isValidAffiliateUrl(deal.affiliateUrl)) {
        return reply.code(410).send({ message: "Invalid affiliate URL" });
      }

      const secret = clickHashSecret();
      if (!secret) {
        return reply.code(503).send({ message: "Click tracking is not configured" });
      }

      const referrer = typeof req.headers.referer === "string" ? req.headers.referer : null;
      const userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null;

      try {
        await prisma.$transaction([
          prisma.click.create({
            data: {
              dealId: deal.id,
              referrer: referrer?.slice(0, 2048) ?? null,
              userAgent: userAgent?.slice(0, 512) ?? null,
              ipHash: hashIp(clientIp(req), secret),
            },
          }),
          prisma.deal.update({
            where: { id: deal.id },
            data: { clicksCount: { increment: 1 } },
          }),
        ]);
      } catch (err) {
        req.log.error({ err, offerId: deal.id }, "Click tracking failed");
      }

      return reply.redirect(deal.affiliateUrl, 302);
    }
  );
}
