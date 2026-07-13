import { fetchCjOffers, type CjSourceConfig } from "@mpf/affiliate";
import { runSourceImport, type SourceImportCounters } from "./run-source-import.js";

export type CjImportResult = SourceImportCounters;

export async function importCjOffers(
  importJobId: string,
  log: (msg: string) => void,
  config: CjSourceConfig & { maxPages?: number }
): Promise<CjImportResult> {
  const { counters } = await runSourceImport({
    source: "cj",
    importJobId,
    log,
    pageSize: config.pageSize ?? 100,
    maxPages: config.maxPages ?? 1,
    debugRawPages: config.debugRawPages,
    fetchPage: async (page, pageSize) => {
      const result = await fetchCjOffers(config, { page, pageSize });
      return {
        offers: result.offers,
        rawResponses: result.rawResponses,
        hasMore: result.hasMore,
      };
    },
  });
  return counters;
}
