import "../load-env.js";
import { getCjWorkerEnv } from "@mpf/env/worker";
import { prisma } from "@mpf/db";
import { importCjOffers } from "../jobs/import-cj-offers.js";
import { runCli, printImportSummary } from "./_runner.js";

// Local debug only — Railway cron uses apps/worker/railway.import.json → pnpm worker:import

void runCli("myperkfinder-worker-cj-import", async ({ log, stepOk }) => {
  stepOk("1/4", "worker process started");

  const env = getCjWorkerEnv();
  stepOk(
    "2/4",
    `environment validated (mock=${env.MOCK_EXTERNAL}, relationship=${env.CJ_RELATIONSHIP_STATUS}, ` +
      `pageSize=${env.CJ_PAGE_SIZE}, maxPages=${env.CJ_MAX_PAGES})`
  );

  const job = await prisma.importJob.create({ data: { source: "cj", status: "pending" } });
  stepOk("3/4", `ImportJob created id=${job.id}`);

  const result = await importCjOffers(job.id, (msg) => log(msg, "import"), {
    accessToken: env.CJ_ACCESS_TOKEN ?? "mock",
    websiteId: env.CJ_WEBSITE_ID ?? "mock",
    mockExternal: env.MOCK_EXTERNAL,
    relationshipStatus: env.CJ_RELATIONSHIP_STATUS,
    pageSize: env.CJ_PAGE_SIZE,
    maxPages: env.CJ_MAX_PAGES,
    debugRawPages: env.CJ_DEBUG_RAW_PAGES,
  });
  stepOk("4/4", `import finished ${JSON.stringify(result)}`);
  printImportSummary("CJ import summary", result, job.id);
  log("ALL STEPS SUCCESS — exiting 0", "done");
});
