import "../load-env.js";
import { getWorkerEnv } from "@mpf/env/worker";
import { prisma, disconnectDb } from "@mpf/db";
import { importAwinOffers, type AwinImportResult } from "../jobs/import-awin-offers.js";

// Railway cron: apps/worker/railway.import-awin.json → "30 18 * * *" (2:30 PM EDT / 18:30 UTC)
const CRON_HINT =
  "30 18 * * * (2:30 PM EDT / 1:30 PM EST — Railway cron is UTC; redeploy worker for schedule changes)";

function log(msg: string, step?: string) {
  console.log(
    JSON.stringify({
      level: "info",
      service: "myperkfinder-worker-awin-import",
      step: step ?? undefined,
      msg,
      ts: new Date().toISOString(),
    })
  );
}

function stepOk(step: string, msg: string) {
  log(`SUCCESS — ${msg}`, step);
}

function printSummary(result: AwinImportResult, jobId: string) {
  const lines = [
    "",
    "======== Awin import summary ========",
    `  ImportJob:     ${jobId}`,
    `  Fetched:       ${result.offersFound}`,
    `  Pages:         ${result.pages}`,
    `  Created:       ${result.created}`,
    `  Updated:       ${result.updated}`,
    `  Expired:       ${result.expired}`,
    `  Needs review:  ${result.needsReview}`,
    `  Rejected:      ${result.rejected}`,
    "=====================================",
    "",
  ];
  console.log(lines.join("\n"));
}

async function main() {
  log(`Cron config: ${CRON_HINT}`, "cron");
  stepOk("1/4", "worker process started");

  const env = getWorkerEnv();
  stepOk(
    "2/4",
    `environment validated (mock=${env.MOCK_EXTERNAL}, membership=${env.AWIN_MEMBERSHIP_FILTER}, ` +
      `regions=${env.AWIN_REGION_CODES.join(",")}, pageSize=${env.AWIN_PAGE_SIZE})`
  );

  const job = await prisma.importJob.create({
    data: { source: "awin", status: "pending" },
  });
  stepOk("3/4", `ImportJob created id=${job.id}`);

  try {
    const result = await importAwinOffers(job.id, (msg) => log(msg, "import"), {
      accessToken: env.AWIN_ACCESS_TOKEN ?? "mock",
      publisherId: env.AWIN_PUBLISHER_ID ?? "mock",
      mockExternal: env.MOCK_EXTERNAL,
      membershipFilter: env.AWIN_MEMBERSHIP_FILTER,
      regionCodes: env.AWIN_REGION_CODES,
      pageSize: env.AWIN_PAGE_SIZE,
      debugRawPages: env.AWIN_DEBUG_RAW_PAGES,
    });
    stepOk("4/4", `import finished ${JSON.stringify(result)}`);
    printSummary(result, job.id);
    log("ALL STEPS SUCCESS — exiting 0", "done");
    await disconnectDb();
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        level: "error",
        service: "myperkfinder-worker-awin-import",
        step: "failed",
        msg: message,
        ts: new Date().toISOString(),
      })
    );
    await disconnectDb();
    process.exit(1);
  }
}

void main();
