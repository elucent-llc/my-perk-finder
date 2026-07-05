import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@mpf/db";

export async function categoriesRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/",
    { schema: { tags: ["categories"], summary: "Category tree", response: { 200: z.array(z.record(z.unknown())) } } },
    async () => {
      const cats = await prisma.category.findMany({
        include: { _count: { select: { deals: true } }, children: true },
        orderBy: { name: "asc" },
      });
      return cats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parentId,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
        mappingKeywords: c.mappingKeywords,
        dealsCount: c._count.deals,
        childrenCount: c.children.length,
      }));
    }
  );
}
