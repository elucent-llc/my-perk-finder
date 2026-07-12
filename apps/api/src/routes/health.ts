import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@mpf/db";

export async function healthRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.get(
    "/health",
    {
      schema: {
        tags: ["admin"],
        summary: "Liveness + database probe",
        response: {
          200: z.object({
            status: z.literal("ok"),
            database: z.literal("up"),
            uptime: z.number(),
          }),
          503: z.object({
            status: z.literal("error"),
            database: z.literal("down"),
            uptime: z.number(),
          }),
        },
      },
    },
    async (_req, reply) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: "ok" as const, database: "up" as const, uptime: process.uptime() };
      } catch {
        return reply.code(503).send({
          status: "error" as const,
          database: "down" as const,
          uptime: process.uptime(),
        });
      }
    }
  );
}
