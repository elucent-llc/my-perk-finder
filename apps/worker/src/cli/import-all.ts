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
const CRON_HINT = "0 */6 * * * (every 6 hours UTC — combined import; Awin only until CJ/Walmart are ready)";

/**
 * DEPLOY SAFETY — keep CJ/Walmart adapters + CLIs in the repo, but do NOT run them
 * on the Railway combined cron until accounts/APIs work.
 *
 * - false (current): skipped → no API calls, no failed ImportJobs, no cron noise
 * - true: run when credentials (or MOCK_EXTERNAL) are present
 *
 * Local single-source CLIs still work: `pnpm worker:import-cj` / `worker:import-walmart`
 */
const ENABLE_CJ_IN_COMBINED_IMPORT = false;
const ENABLE_WALMART_IN_COMBINED_IMPORT = false;

type SourceResult = {
  source: string;
  status: "ok" | "skipped" | "failed";
  jobId?: string;
  counters?: SourceImportCounters;
  error?: string;
  skipReason?: string;
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
      lines.push(`  ${r.source}: skipped (${r.skipReason ?? "no credentials"})`);
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
      ? { source: "awin", status: "skipped", skipReason: "no credentials" }
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

  // --- CJ (disabled for Railway deploy until affiliate account/API is ready) ---
  if (!ENABLE_CJ_IN_COMBINED_IMPORT) {
    results.push({
      source: "cj",
      status: "skipped",
      skipReason: "disabled for deploy (ENABLE_CJ_IN_COMBINED_IMPORT=false)",
    });
  } else {
    results.push(
      !env.enabledSources.cj
        ? { source: "cj", status: "skipped", skipReason: "no credentials" }
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
  }

  // --- Walmart (disabled for Railway deploy — needs walmart.io signed API, not labs keys) ---
  if (!ENABLE_WALMART_IN_COMBINED_IMPORT) {
    results.push({
      source: "walmart",
      status: "skipped",
      skipReason: "disabled for deploy (ENABLE_WALMART_IN_COMBINED_IMPORT=false)",
    });
  } else {
    results.push(
      !env.enabledSources.walmart
        ? { source: "walmart", status: "skipped", skipReason: "no credentials" }
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
  }

  return results;
}

void runCli("myperkfinder-worker-import", async (logger) => {
  const { log, stepOk } = logger;
  log(`Cron config: ${CRON_HINT}`, "cron");
  stepOk("1/3", "worker process started");

  const env = getImportWorkerEnv();
  // Only count sources that are allowed on this cron (CJ/Walmart off until ready).
  const enabled = [
    env.enabledSources.awin ? "awin" : null,
    ENABLE_CJ_IN_COMBINED_IMPORT && env.enabledSources.cj ? "cj" : null,
    ENABLE_WALMART_IN_COMBINED_IMPORT && env.enabledSources.walmart ? "walmart" : null,
  ].filter(Boolean) as string[];
  stepOk(
    "2/3",
    `environment validated (mock=${env.MOCK_EXTERNAL}, enabled=${enabled.join(",") || "none"}, ` +
      `cjCombined=${ENABLE_CJ_IN_COMBINED_IMPORT}, walmartCombined=${ENABLE_WALMART_IN_COMBINED_IMPORT})`
  );

  if (enabled.length === 0) {
    throw new Error(
      "No import sources enabled. Provide AWIN_* credentials (or MOCK_EXTERNAL=true). " +
        "CJ/Walmart are disabled on the combined cron until ENABLE_*_IN_COMBINED_IMPORT is flipped."
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
