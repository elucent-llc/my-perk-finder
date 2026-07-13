import { fetchWalmartOffers, type WalmartSourceConfig } from "@mpf/affiliate";
import { runSourceImport, type SourceImportCounters } from "./run-source-import.js";

export type WalmartImportResult = SourceImportCounters;

export async function importWalmartOffers(
  importJobId: string,
  log: (msg: string) => void,
  config: WalmartSourceConfig & { maxPages?: number }
): Promise<WalmartImportResult> {
  const { counters } = await runSourceImport({
    source: "walmart",
    importJobId,
    log,
    pageSize: config.pageSize ?? 25,
    maxPages: config.maxPages ?? 1,
    debugRawPages: config.debugRawPages,
    fetchPage: async (page, pageSize) => {
      const result = await fetchWalmartOffers(config, { page, pageSize });
      return {
        offers: result.offers,
        rawResponses: result.rawResponses,
        hasMore: result.hasMore,
      };
    },
  });
  return counters;
}
