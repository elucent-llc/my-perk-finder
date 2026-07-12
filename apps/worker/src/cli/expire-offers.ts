import "../load-env.js";
import { getExpireWorkerEnv } from "@mpf/env/worker";
import { disconnectDb } from "@mpf/db";
import { expireOffers } from "../jobs/expire-offers.js";

// Railway cron: apps/worker/railway.expire-offers.json → "30 18 * * *" (2:30 PM EDT / 18:30 UTC)
const CRON_HINT =
  "30 18 * * * (2:30 PM EDT / 1:30 PM EST — Railway cron is UTC; redeploy worker for schedule changes)";

function log(msg: string, step?: string) {
  console.log(
    JSON.stringify({
      level: "info",
      service: "myperkfinder-worker-expire-offers",
      step: step ?? undefined,
      msg,
      ts: new Date().toISOString(),
      })
  );
}

function stepOk(step: string, msg: string) {
  log(`SUCCESS — ${msg}`, step);
}

async function main() {
  log(`Cron config: ${CRON_HINT}`, "cron");
  stepOk("1/3", "worker process started");

  getExpireWorkerEnv();
  stepOk("2/3", "environment validated");

  try {
    const result = await expireOffers((msg) => log(msg, "expire"));
    stepOk("3/3", `expire finished ${JSON.stringify(result)}`);
    log("ALL STEPS SUCCESS — exiting 0", "done");
    await disconnectDb();
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        level: "error",
        service: "myperkfinder-worker-expire-offers",
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
