import "../load-env.js";
import { getWorkerEnv } from "@mpf/env/worker";
import { prisma, disconnectDb } from "@mpf/db";
import { importAwinOffers } from "../jobs/import-awin-offers.js";

function log(msg: string) {
  console.log(JSON.stringify({ level: "info", service: "myperkfinder-worker-awin-import", msg, ts: new Date().toISOString() }));
}

async function main() {
  const env = getWorkerEnv();
  log("Environment validated");

  const job = await prisma.importJob.create({
    data: { source: "awin", status: "pending" },
  });
  log(`ImportJob created id=${job.id}`);

  try {
    const result = await importAwinOffers(job.id, log, {
      accessToken: env.AWIN_ACCESS_TOKEN ?? "mock",
      publisherId: env.AWIN_PUBLISHER_ID ?? "mock",
      mockExternal: env.MOCK_EXTERNAL === true,
    });
    log(`Import finished ${JSON.stringify(result)}`);
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
