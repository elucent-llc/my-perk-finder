import { Worker } from "bullmq";
import type IORedis from "ioredis";
import { QUEUE_NAMES, type LlmExtractionPayload } from "@mpf/jobs";
import { prisma, Prisma } from "@mpf/db";
import { extractDeal } from "../providers/llm.js";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

export function startLlmWorker(connection: IORedis) {
  return new Worker<LlmExtractionPayload>(
    QUEUE_NAMES.llm,
    async (job) => {
      const { rawRecordId, text } = job.data;
      const extracted = await extractDeal(text);

      const flags: string[] = [];
      if (!extracted.merchantName) flags.push("missing_merchant");
      if (!extracted.category) flags.push("missing_category");
      if (extracted.confidenceScore < 0.6) flags.push("low_confidence_score");
      if (extracted.salePrice && extracted.regularPrice && extracted.salePrice > extracted.regularPrice)
        flags.push("sale_higher_than_regular");

      const sale = extracted.salePrice ?? 0;
      const regular = extracted.regularPrice ?? sale;
      const discount = regular > 0 ? Math.round(((regular - sale) / regular) * 100) : 0;
      const status = flags.length > 0 || extracted.confidenceScore < 0.8 ? "needs_review" : "active";

      await prisma.deal.upsert({
        where: { slug: slugify(`${extracted.title}-${sale}`) },
        update: {
          salePrice: new Prisma.Decimal(sale),
          confidenceScore: extracted.confidenceScore,
          validationFlags: flags,
          status: status as never,
        },
        create: {
          title: extracted.title,
          slug: slugify(`${extracted.title}-${sale}`),
          brand: extracted.brand,
          regularPrice: new Prisma.Decimal(regular),
          salePrice: new Prisma.Decimal(sale),
          discountPercent: discount,
          couponCode: extracted.couponCode,
          confidenceScore: extracted.confidenceScore,
          validationFlags: flags,
          status: status as never,
          sourceName: "llm-extraction",
        },
      });

      await prisma.rawRecord.update({
        where: { id: rawRecordId },
        data: { status: "processed", normalized: extracted as unknown as Prisma.InputJsonValue },
      });

      return { status, confidence: extracted.confidenceScore, flags };
    },
    { connection, concurrency: 4 }
  );
}
