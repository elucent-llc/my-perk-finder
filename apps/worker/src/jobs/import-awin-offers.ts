import { fetchAwinOffers, type AffiliateSourceConfig } from "@mpf/affiliate";
import { runSourceImport, type SourceImportCounters } from "./run-source-import.js";

export type AwinImportResult = SourceImportCounters;

/**
 * Awin import — thin wrapper over the shared source import runner.
 */
export async function importAwinOffers(
  importJobId: string,
  log: (msg: string) => void,
  config: AffiliateSourceConfig & { maxPages?: number }
): Promise<AwinImportResult> {
  const maxPages = config.maxPages ?? 50;
  const { counters } = await runSourceImport({
    source: "awin",
    importJobId,
    log,
    pageSize: config.pageSize ?? 100,
    maxPages,
    debugRawPages: config.debugRawPages,
    fetchPage: async (page, pageSize) => {
      const result = await fetchAwinOffers(config, {
        page,
        pageSize,
        regionCodes: config.regionCodes,
        membershipFilter: config.membershipFilter,
      });
      return {
        offers: result.offers,
        rawResponses: result.rawResponses,
        hasMore: result.hasMore,
      };
    },
  });
  return counters;
}
