import "../load-env.js";
import { getExpireWorkerEnv } from "@mpf/env/worker";
import { expireOffers } from "../jobs/expire-offers.js";
import { runCli } from "./_runner.js";

// Railway cron: apps/worker/railway.expire-offers.json → "30 18 * * *" (18:30 UTC daily)

void runCli("myperkfinder-worker-expire-offers", async ({ log, stepOk }) => {
  stepOk("1/3", "worker process started");

  getExpireWorkerEnv();
  stepOk("2/3", "environment validated");

  const result = await expireOffers((msg) => log(msg, "expire"));
  stepOk("3/3", `expire finished ${JSON.stringify(result)}`);
  log("ALL STEPS SUCCESS — exiting 0", "done");
});
