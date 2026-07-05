import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { SourceKind } from "@mpf/types";
import { prisma } from "@mpf/db";
import { createQueues } from "@mpf/jobs";

export async function importsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/",
    { schema: { tags: ["imports"], summary: "Recent import jobs", response: { 200: z.array(z.record(z.unknown())) } } },
    async () => {
      const jobs = await prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
      return jobs.map((j) => ({
        id: j.id,
        source: j.source,
        status: j.status,
        startedAt: j.startedAt?.toISOString() ?? null,
        finishedAt: j.finishedAt?.toISOString() ?? null,
        offersFound: j.offersFound,
        created: j.created,
        updated: j.updated,
        rejected: j.rejected,
        needsReview: j.needsReview,
        error: j.error,
      }));
    }
  );

  r.post(
    "/run",
    {
      schema: {
        tags: ["imports"],
        summary: "Enqueue an import job for a source",
        body: z.object({ source: SourceKind }),
        response: { 200: z.object({ jobId: z.string(), queued: z.boolean() }) },
      },
    },
    async (req, reply) => {
      const job = await prisma.importJob.create({
        data: { source: req.body.source, status: "pending" },
      });
      try {
        const { importQueue, connection } = createQueues();
        await importQueue.add("import", { source: req.body.source, importJobId: job.id });
        await importQueue.close();
        connection.disconnect();
      } catch (err) {
        req.log.warn({ err }, "Could not enqueue import (Redis unavailable?)");
        return reply.send({ jobId: job.id, queued: false });
      }
      return { jobId: job.id, queued: true };
    }
  );
}
