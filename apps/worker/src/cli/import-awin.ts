import "../load-env.js";
import { getWorkerEnv } from "@mpf/env/worker";
import { prisma } from "@mpf/db";
import { importAwinOffers } from "../jobs/import-awin-offers.js";
import { runCli, printImportSummary } from "./_runner.js";

// Local debug only — Railway cron uses apps/worker/railway.import.json → pnpm worker:import

void runCli("myperkfinder-worker-awin-import", async ({ log, stepOk }) => {
  stepOk("1/4", "worker process started");

  const env = getWorkerEnv();
  stepOk(
    "2/4",
    `environment validated (mock=${env.MOCK_EXTERNAL}, membership=${env.AWIN_MEMBERSHIP_FILTER}, ` +
      `regions=${env.AWIN_REGION_CODES.join(",")}, pageSize=${env.AWIN_PAGE_SIZE}, maxPages=${env.AWIN_MAX_PAGES})`
  );

  const job = await prisma.importJob.create({ data: { source: "awin", status: "pending" } });
  stepOk("3/4", `ImportJob created id=${job.id}`);

  const result = await importAwinOffers(job.id, (msg) => log(msg, "import"), {
    accessToken: env.AWIN_ACCESS_TOKEN ?? "mock",
    publisherId: env.AWIN_PUBLISHER_ID ?? "mock",
    mockExternal: env.MOCK_EXTERNAL,
    membershipFilter: env.AWIN_MEMBERSHIP_FILTER,
    regionCodes: env.AWIN_REGION_CODES,
    pageSize: env.AWIN_PAGE_SIZE,
    maxPages: env.AWIN_MAX_PAGES,
    debugRawPages: env.AWIN_DEBUG_RAW_PAGES,
  });
  stepOk("4/4", `import finished ${JSON.stringify(result)}`);
  printImportSummary("Awin import summary", result, job.id);
  log("ALL STEPS SUCCESS — exiting 0", "done");
});
