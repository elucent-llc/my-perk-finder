import "../load-env.js";
import { getWalmartWorkerEnv } from "@mpf/env/worker";
import { prisma } from "@mpf/db";
import { importWalmartOffers } from "../jobs/import-walmart-offers.js";
import { runCli, printImportSummary } from "./_runner.js";

// Local debug only — Railway cron uses apps/worker/railway.import.json → pnpm worker:import

void runCli("myperkfinder-worker-walmart-import", async ({ log, stepOk }) => {
  stepOk("1/4", "worker process started");

  const env = getWalmartWorkerEnv();
  stepOk(
    "2/4",
    `environment validated (mock=${env.MOCK_EXTERNAL}, terms=${env.WALMART_SEARCH_TERMS.join("|")}, ` +
      `pageSize=${env.WALMART_PAGE_SIZE}, maxPages=${env.WALMART_MAX_PAGES})`
  );

  const job = await prisma.importJob.create({ data: { source: "walmart", status: "pending" } });
  stepOk("3/4", `ImportJob created id=${job.id}`);

  const result = await importWalmartOffers(job.id, (msg) => log(msg, "import"), {
    apiKey: env.WALMART_API_KEY ?? "mock",
    publisherId: env.WALMART_PUBLISHER_ID ?? "mock",
    searchTerms: env.WALMART_SEARCH_TERMS,
    mockExternal: env.MOCK_EXTERNAL,
    pageSize: env.WALMART_PAGE_SIZE,
    maxPages: env.WALMART_MAX_PAGES,
    debugRawPages: env.WALMART_DEBUG_RAW_PAGES,
  });
  stepOk("4/4", `import finished ${JSON.stringify(result)}`);
  printImportSummary("Walmart import summary", result, job.id);
  log("ALL STEPS SUCCESS — exiting 0", "done");
});
