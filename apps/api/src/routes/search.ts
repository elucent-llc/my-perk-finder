import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { SearchQuery } from "@mpf/types";
import { prisma } from "@mpf/db";
import { searchDeals } from "@mpf/search";
import { serializeDeal } from "../lib/serialize.js";

export async function searchRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/",
    {
      schema: {
        tags: ["search"],
        summary: "Search deals (Meilisearch with Postgres fallback)",
        querystring: SearchQuery,
        response: { 200: z.object({ query: z.string(), source: z.string(), data: z.array(z.record(z.unknown())) }) },
      },
    },
    async (req) => {
      const { q } = req.query;
      // Try Meilisearch first; gracefully fall back to Postgres ILIKE.
      try {
        const res = await searchDeals(q, { limit: 24, filter: "status = active" });
        if (res.hits.length > 0) {
          const data = res.hits.map((h) => ({ ...h }) as Record<string, unknown>);
          return { query: q, source: "meilisearch", data };
        }
      } catch {
        // fall through to DB
      }
      const rows = await prisma.deal.findMany({
        where: { status: "active", title: { contains: q, mode: "insensitive" } },
        include: { merchant: true, category: true },
        take: 24,
      });
      return { query: q, source: "postgres", data: rows.map(serializeDeal) };
    }
  );
}
