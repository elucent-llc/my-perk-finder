import type { SourceKind } from "@mpf/types";
import type { NormalizedOffer, OfferType } from "@mpf/affiliate";
import {
  prisma,
  saveRawImportRecord,
  upsertImportedOffer,
  inferCategoryFromText,
  loadCategoryKeywordMap,
} from "@mpf/db";
import { validateOfferForImport } from "@mpf/validators";

export interface SourceImportCounters {
  offersFound: number;
  created: number;
  updated: number;
  rejected: number;
  needsReview: number;
  expired: number;
  pages: number;
}

export interface SourcePageResult {
  offers: NormalizedOffer[];
  /** Full API page payloads (optional; saved when debugRawPages is true). */
  rawResponses?: unknown[];
  hasMore: boolean;
}

export interface RunSourceImportParams {
  source: SourceKind;
  log: (msg: string) => void;
  /** 1-based page fetch. */
  fetchPage: (page: number, pageSize: number) => Promise<SourcePageResult>;
  pageSize: number;
  maxPages: number;
  debugRawPages?: boolean;
  /** When omitted, a new ImportJob is created. */
  importJobId?: string;
}

function resolveOfferType(offer: NormalizedOffer): OfferType {
  if (offer.offerType) return offer.offerType;
  if (offer.couponCode) return "coupon";
  const regular = offer.regularPrice ?? 0;
  const sale = offer.salePrice ?? 0;
  if (regular > 0 && sale > 0 && sale < regular) return "sale";
  if (sale > 0 || regular > 0) return "product";
  return "promotion";
}

function toImportedInput(
  offer: NormalizedOffer,
  status: ReturnType<typeof validateOfferForImport>
) {
  return {
    externalId: offer.externalId,
    source: offer.source,
    title: offer.title,
    slug: offer.slug,
    merchantName: offer.merchantName,
    merchantLogoUrl: offer.merchantLogoUrl,
    brand: offer.brand,
    category: offer.category,
    offerType: resolveOfferType(offer),
    regularPrice: offer.regularPrice,
    salePrice: offer.salePrice,
    discountPercent: offer.discountPercent,
    couponCode: offer.couponCode,
    currency: offer.currency,
    imageUrl: offer.imageUrl,
    affiliateUrl: offer.affiliateUrl,
    productUrl: offer.productUrl,
    expiryDate: offer.expiryDate,
    confidenceScore: status.confidenceScore,
    validationFlags: status.flags,
    status: status.status,
  };
}

/**
 * Shared affiliate/retail import pipeline used by Awin, CJ, Walmart, etc.
 * fetch → raw → normalize (already done by adapter) → validate → upsert.
 */
export async function runSourceImport(
  params: RunSourceImportParams
): Promise<{ jobId: string; counters: SourceImportCounters }> {
  const {
    source,
    log,
    fetchPage,
    pageSize,
    maxPages,
    debugRawPages = false,
  } = params;

  const job =
    params.importJobId != null
      ? await prisma.importJob.findUniqueOrThrow({ where: { id: params.importJobId } })
      : await prisma.importJob.create({
          data: { source, status: "pending" },
        });

  const importJobId = job.id;
  const counters: SourceImportCounters = {
    offersFound: 0,
    created: 0,
    updated: 0,
    rejected: 0,
    needsReview: 0,
    expired: 0,
    pages: 0,
  };

  await prisma.importJob.update({
    where: { id: importJobId },
    data: { status: "running", startedAt: new Date(), error: null },
  });

  const categoryMaps = await loadCategoryKeywordMap(() =>
    prisma.category.findMany({
      select: { name: true, mappingKeywords: true },
    })
  );

  const safeMaxPages = Math.max(1, Math.min(Math.floor(maxPages) || 1, 50));
  const safePageSize = Math.max(1, Math.min(Math.floor(pageSize) || 25, 500));

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= safeMaxPages) {
      log(`Fetching ${source} page ${page}/${safeMaxPages} (pageSize=${safePageSize})…`);
      const result = await fetchPage(page, safePageSize);
      counters.pages += 1;

      if (debugRawPages && result.rawResponses?.length) {
        for (const rawResponse of result.rawResponses) {
          await saveRawImportRecord({
            source,
            payload: rawResponse,
            importJobId,
          });
        }
      }

      for (const offer of result.offers) {
        counters.offersFound += 1;

        if (!offer.category) {
          offer.category = inferCategoryFromText(
            {
              title: offer.title,
              description: offer.description,
              merchantName: offer.merchantName,
            },
            categoryMaps
          );
        }

        const rawRecord = await saveRawImportRecord({
          source,
          payload: offer.rawPayload,
          normalized: offer,
          importJobId,
        });

        const validation = validateOfferForImport(offer);

        if (validation.rejected) {
          counters.rejected += 1;
          await prisma.rawRecord.update({
            where: { id: rawRecord.id },
            data: { status: "failed", normalized: offer as object },
          });
          log(`Rejected offer ${offer.externalId}: ${validation.flags.join(", ")}`);
          continue;
        }

        if (validation.status === "expired") {
          await upsertImportedOffer(toImportedInput(offer, validation));
          counters.expired += 1;
          await prisma.rawRecord.update({
            where: { id: rawRecord.id },
            data: { status: "processed", normalized: offer as object },
          });
          log(`Expired offer ${offer.externalId} stored as expired`);
          continue;
        }

        const { created } = await upsertImportedOffer(toImportedInput(offer, validation));

        if (validation.status === "needs_review") {
          counters.needsReview += 1;
        } else if (created) {
          counters.created += 1;
        } else {
          counters.updated += 1;
        }

        await prisma.rawRecord.update({
          where: { id: rawRecord.id },
          data: { status: "processed", normalized: offer as object },
        });
      }

      hasMore = result.hasMore;
      page += 1;
    }

    const finalStatus =
      counters.rejected > 0 && counters.created + counters.updated + counters.expired === 0
        ? "failed"
        : counters.rejected > 0 || counters.needsReview > 0
          ? "partial_success"
          : "completed";

    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: finalStatus,
        finishedAt: new Date(),
        offersFound: counters.offersFound,
        created: counters.created,
        updated: counters.updated,
        rejected: counters.rejected,
        needsReview: counters.needsReview,
      },
    });

    log(
      `${source} import done — fetched=${counters.offersFound} pages=${counters.pages} ` +
        `created=${counters.created} updated=${counters.updated} expired=${counters.expired} ` +
        `needsReview=${counters.needsReview} rejected=${counters.rejected}`
    );

    return { jobId: importJobId, counters };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.importJob.update({
      where: { id: importJobId },
      data: { status: "failed", finishedAt: new Date(), error: message },
    });
    throw err;
  }
}
