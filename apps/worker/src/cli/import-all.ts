import "../load-env.js";
import { getImportWorkerEnv, type ImportWorkerEnv } from "@mpf/env/worker";
import { prisma } from "@mpf/db";
import { importAwinOffers } from "../jobs/import-awin-offers.js";
import { importCjOffers } from "../jobs/import-cj-offers.js";
import { importWalmartOffers } from "../jobs/import-walmart-offers.js";
import type { SourceKind } from "@mpf/types";
import type { SourceImportCounters } from "../jobs/run-source-import.js";
import { runCli, type CliLogger } from "./_runner.js";

// Railway cron: apps/worker/railway.import.json → "0 */6 * * *"
const CRON_HINT = "0 */6 * * * (every 6 hours UTC — combined Awin + CJ + Walmart)";

type SourceResult = {
  source: string;
  status: "ok" | "skipped" | "failed";
  jobId?: string;
  counters?: SourceImportCounters;
  error?: string;
};

/** Run one source end-to-end, capturing failures instead of aborting the batch. */
async function runSource(
  source: SourceKind,
  logger: CliLogger,
  run: (jobId: string) => Promise<SourceImportCounters>
): Promise<SourceResult> {
  try {
    const job = await prisma.importJob.create({ data: { source, status: "pending" } });
    logger.log(`${source} ImportJob created id=${job.id}`, source);
    const counters = await run(job.id);
    return { source, status: "ok", jobId: job.id, counters };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(message, source);
    return { source, status: "failed", error: message };
  }
}

function printSummary(results: SourceResult[]) {
  const lines = ["", "======== Combined import summary ========"];
  for (const r of results) {
    if (r.status === "skipped") {
      lines.push(`  ${r.source}: skipped (no credentials)`);
    } else if (r.status === "failed") {
      lines.push(`  ${r.source}: FAILED — ${r.error}`);
    } else {
      const c = r.counters!;
      lines.push(
        `  ${r.source}: ok job=${r.jobId} fetched=${c.offersFound} created=${c.created} updated=${c.updated} rejected=${c.rejected}`
      );
    }
  }
  lines.push("=========================================", "");
  console.log(lines.join("\n"));
}

async function runAllSources(env: ImportWorkerEnv, logger: CliLogger): Promise<SourceResult[]> {
  const { log } = logger;
  const results: SourceResult[] = [];

  results.push(
    !env.enabledSources.awin
      ? { source: "awin", status: "skipped" }
      : await runSource("awin", logger, (jobId) =>
          importAwinOffers(jobId, (msg) => log(msg, "awin"), {
            accessToken: env.awin.AWIN_ACCESS_TOKEN ?? "mock",
            publisherId: env.awin.AWIN_PUBLISHER_ID ?? "mock",
            mockExternal: env.MOCK_EXTERNAL,
            membershipFilter: env.awin.AWIN_MEMBERSHIP_FILTER,
            regionCodes: env.awin.AWIN_REGION_CODES,
            pageSize: env.awin.AWIN_PAGE_SIZE,
            maxPages: env.awin.AWIN_MAX_PAGES,
            debugRawPages: env.awin.AWIN_DEBUG_RAW_PAGES,
          })
        )
  );

  results.push(
    !env.enabledSources.cj
      ? { source: "cj", status: "skipped" }
      : await runSource("cj", logger, (jobId) =>
          importCjOffers(jobId, (msg) => log(msg, "cj"), {
            accessToken: env.cj.CJ_ACCESS_TOKEN ?? "mock",
            websiteId: env.cj.CJ_WEBSITE_ID ?? "mock",
            mockExternal: env.MOCK_EXTERNAL,
            relationshipStatus: env.cj.CJ_RELATIONSHIP_STATUS,
            pageSize: env.cj.CJ_PAGE_SIZE,
            maxPages: env.cj.CJ_MAX_PAGES,
            debugRawPages: env.cj.CJ_DEBUG_RAW_PAGES,
          })
        )
  );

  results.push(
    !env.enabledSources.walmart
      ? { source: "walmart", status: "skipped" }
      : await runSource("walmart", logger, (jobId) =>
          importWalmartOffers(jobId, (msg) => log(msg, "walmart"), {
            apiKey: env.walmart.WALMART_API_KEY ?? "mock",
            publisherId: env.walmart.WALMART_PUBLISHER_ID ?? "mock",
            searchTerms: env.walmart.WALMART_SEARCH_TERMS,
            mockExternal: env.MOCK_EXTERNAL,
            pageSize: env.walmart.WALMART_PAGE_SIZE,
            maxPages: env.walmart.WALMART_MAX_PAGES,
            debugRawPages: env.walmart.WALMART_DEBUG_RAW_PAGES,
          })
        )
  );

  return results;
}

void runCli("myperkfinder-worker-import", async (logger) => {
  const { log, stepOk } = logger;
  log(`Cron config: ${CRON_HINT}`, "cron");
  stepOk("1/3", "worker process started");

  const env = getImportWorkerEnv();
  const enabled = Object.entries(env.enabledSources)
    .filter(([, on]) => on)
    .map(([name]) => name);
  stepOk(
    "2/3",
    `environment validated (mock=${env.MOCK_EXTERNAL}, enabled=${enabled.join(",") || "none"})`
  );

  if (enabled.length === 0) {
    throw new Error(
      "No import sources enabled. Set MOCK_EXTERNAL=true or provide credentials for at least one of Awin / CJ / Walmart."
    );
  }

  const results = await runAllSources(env, logger);
  printSummary(results);

  const ok = results.filter((r) => r.status === "ok");
  const failed = results.filter((r) => r.status === "failed");

  // Throwing here would exit 1 and (with ON_FAILURE retries) re-run every
  // source, wasting API quota. Only fail hard if nothing succeeded; otherwise
  // log the partial result and exit 0 — failed sources are visible as failed
  // ImportJob rows in /admin/imports.
  if (ok.length === 0) {
    throw new Error("ALL STEPS FAILED — no source completed successfully");
  }
  if (failed.length > 0) {
    log(
      `PARTIAL SUCCESS — ${ok.length} ok, ${failed.length} failed (${failed
        .map((r) => r.source)
        .join(", ")}); exiting 0`,
      "3/3"
    );
    return;
  }

  stepOk("3/3", "all enabled sources finished — exiting 0");
});
