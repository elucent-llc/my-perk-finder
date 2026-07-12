import "../load-env.js";
import { getWorkerEnv } from "@mpf/env/worker";
import { prisma, disconnectDb } from "@mpf/db";
import { importAwinOffers, type AwinImportResult } from "../jobs/import-awin-offers.js";

function log(msg: string) {
  console.log(
    JSON.stringify({
      level: "info",
      service: "myperkfinder-worker-awin-import",
      msg,
      ts: new Date().toISOString(),
    })
  );
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
  const env = getWorkerEnv();
  log(
    `Environment validated (mock=${env.MOCK_EXTERNAL}, membership=${env.AWIN_MEMBERSHIP_FILTER}, ` +
      `regions=${env.AWIN_REGION_CODES.join(",")}, pageSize=${env.AWIN_PAGE_SIZE})`
  );

  const job = await prisma.importJob.create({
    data: { source: "awin", status: "pending" },
  });
  log(`ImportJob created id=${job.id}`);

  try {
    const result = await importAwinOffers(job.id, log, {
      accessToken: env.AWIN_ACCESS_TOKEN ?? "mock",
      publisherId: env.AWIN_PUBLISHER_ID ?? "mock",
      mockExternal: env.MOCK_EXTERNAL,
      membershipFilter: env.AWIN_MEMBERSHIP_FILTER,
      regionCodes: env.AWIN_REGION_CODES,
      pageSize: env.AWIN_PAGE_SIZE,
      debugRawPages: env.AWIN_DEBUG_RAW_PAGES,
    });
    log(`Import finished ${JSON.stringify(result)}`);
    printSummary(result, job.id);
    await disconnectDb();
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        level: "error",
        service: "myperkfinder-worker-awin-import",
        msg: message,
        ts: new Date().toISOString(),
      })
    );
    await disconnectDb();
    process.exit(1);
  }
}

void main();
