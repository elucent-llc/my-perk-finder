import "../load-env.js";
import { getExpireWorkerEnv } from "@mpf/env/worker";
import { disconnectDb } from "@mpf/db";
import { expireOffers } from "../jobs/expire-offers.js";

function log(msg: string) {
  console.log(JSON.stringify({ level: "info", service: "myperkfinder-worker-expire-offers", msg, ts: new Date().toISOString() }));
}

async function main() {
  getExpireWorkerEnv();
  log("Environment validated");

  try {
    const result = await expireOffers(log);
    log(`Done ${JSON.stringify(result)}`);
    await disconnectDb();
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        level: "error",
        service: "myperkfinder-worker-expire-offers",
        msg: message,
        ts: new Date().toISOString(),
      })
    );
    await disconnectDb();
    process.exit(1);
  }
}

void main();
