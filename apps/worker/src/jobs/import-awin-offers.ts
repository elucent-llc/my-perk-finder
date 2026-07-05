import { fetchAwinOffers, type NormalizedOffer, type AffiliateSourceConfig } from "@mpf/affiliate";
import { prisma } from "@mpf/db";
import { saveRawImportRecord, upsertImportedOffer } from "@mpf/db";
import { validateOfferForImport } from "@mpf/validators";

export interface AwinImportResult {
  offersFound: number;
  created: number;
  updated: number;
  rejected: number;
  needsReview: number;
  pages: number;
}

function resolveAwinConfig(override?: AffiliateSourceConfig): AffiliateSourceConfig {
  if (override) return override;
  return {
    accessToken: process.env.AWIN_ACCESS_TOKEN ?? "mock",
    publisherId: process.env.AWIN_PUBLISHER_ID ?? "mock",
    mockExternal: process.env.MOCK_EXTERNAL === "true",
  };
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
  config?: AffiliateSourceConfig
): Promise<AwinImportResult> {
  const counters = { offersFound: 0, created: 0, updated: 0, rejected: 0, needsReview: 0, pages: 0 };

  await prisma.importJob.update({
    where: { id: importJobId },
    data: { status: "running", startedAt: new Date(), error: null },
  });

  const awinConfig = resolveAwinConfig(config);

  let page = 1;
  let hasMore = true;
  const updatedSince = new Date(Date.now() - 7 * 864e5);

  try {
    while (hasMore) {
      log(`Fetching Awin page ${page}…`);
      const result = await fetchAwinOffers(awinConfig, {
        page,
        pageSize: 100,
        regionCodes: ["US"],
        updatedSince,
      });
      counters.pages += 1;

      for (const rawResponse of result.rawResponses) {
        await saveRawImportRecord({
          source: "awin",
          payload: rawResponse,
          importJobId,
        });
      }

      for (const offer of result.offers) {
        counters.offersFound += 1;

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
      counters.rejected > 0 && counters.created + counters.updated === 0
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
      `Awin import done — found=${counters.offersFound} created=${counters.created} ` +
        `updated=${counters.updated} needsReview=${counters.needsReview} rejected=${counters.rejected}`
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
