import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@mpf/db";

export async function subscribersRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    "/",
    {
      schema: {
        tags: ["subscribers"],
        summary: "Newsletter signup",
        body: z.object({
          email: z.string().email(),
          categoryPreferences: z.array(z.string()).optional(),
        }),
        response: { 200: z.object({ id: z.string(), email: z.string(), status: z.string() }) },
      },
    },
    async (req) => {
      const sub = await prisma.subscriber.upsert({
        where: { email: req.body.email },
        update: { categoryPreferences: req.body.categoryPreferences ?? [] },
        create: {
          email: req.body.email,
          status: "unconfirmed",
          dailyDigest: true,
          categoryPreferences: req.body.categoryPreferences ?? [],
        },
      });
      return { id: sub.id, email: sub.email, status: sub.status };
    }
  );

  r.get(
    "/",
    {
      schema: {
        tags: ["subscribers"],
        summary: "List subscribers (admin)",
        response: { 200: z.array(z.record(z.unknown())) },
      },
    },
    async () => {
      const subs = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
      return subs.map((s) => ({
        id: s.id,
        email: s.email,
        status: s.status,
        dailyDigest: s.dailyDigest,
        alerts: s.alerts,
        categoryPreferences: s.categoryPreferences,
        createdAt: s.createdAt.toISOString(),
      }));
    }
  );
}
