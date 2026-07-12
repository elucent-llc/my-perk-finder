import {
  fetchAwinOffers,
  type AffiliateSourceConfig,
  type NormalizedOffer,
  type OfferType,
} from "@mpf/affiliate";
import {
  prisma,
  saveRawImportRecord,
  upsertImportedOffer,
  inferCategoryFromText,
  loadCategoryKeywordMap,
} from "@mpf/db";
import { validateOfferForImport } from "@mpf/validators";

export interface AwinImportResult {
  offersFound: number;
  created: number;
  updated: number;
  rejected: number;
  needsReview: number;
  expired: number;
  pages: number;
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

function toImportedInput(offer: NormalizedOffer, status: ReturnType<typeof validateOfferForImport>) {
  return {
    externalId: offer.externalId,
    source: offer.source,
    title: offer.title,
    slug: offer.slug,
    merchantName: offer.merchantName,
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
 * Full Awin import pipeline: fetch → save raw → validate → upsert.
 * Runs in worker/cron only — never from browser.
 */
export async function importAwinOffers(
  importJobId: string,
  log: (msg: string) => void,
  config: AffiliateSourceConfig
): Promise<AwinImportResult> {
  const counters = {
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

  let page = 1;
  let hasMore = true;
  const pageSize = config.pageSize ?? 100;
  const regionCodes = config.regionCodes ?? ["US"];
  const membershipFilter = config.membershipFilter ?? "all";

  try {
    while (hasMore) {
      log(`Fetching Awin page ${page} (membership=${membershipFilter}, regions=${regionCodes.join(",")})…`);
      const result = await fetchAwinOffers(config, {
        page,
        pageSize,
        regionCodes,
        membershipFilter,
      });
      counters.pages += 1;

      if (config.debugRawPages) {
        for (const rawResponse of result.rawResponses) {
          await saveRawImportRecord({
            source: "awin",
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
          source: "awin",
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
      if (page > 50) break;
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
      `Awin import done — fetched=${counters.offersFound} pages=${counters.pages} ` +
        `created=${counters.created} updated=${counters.updated} expired=${counters.expired} ` +
        `needsReview=${counters.needsReview} rejected=${counters.rejected}`
    );

    return counters;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.importJob.update({
      where: { id: importJobId },
      data: { status: "failed", finishedAt: new Date(), error: message },
    });
    throw err;
  }
}
