import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function healthRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.get(
    "/health",
    {
      schema: {
        tags: ["admin"],
        summary: "Liveness probe",
        response: { 200: z.object({ status: z.literal("ok"), uptime: z.number() }) },
      },
    },
    async () => ({ status: "ok" as const, uptime: process.uptime() })
  );
}
