import { Worker } from "bullmq";
import { QUEUE_NAMES, type ImportJobPayload } from "@mpf/jobs";
import type IORedis from "ioredis";
import { importAwinOffers } from "../jobs/import-awin-offers.js";

export function startImportWorker(connection: IORedis) {
  return new Worker<ImportJobPayload>(
    QUEUE_NAMES.import,
    async (job) => {
      const { source, importJobId } = job.data;
      job.log(`Import started for source=${source} jobId=${importJobId}`);

      switch (source) {
        case "awin":
          return importAwinOffers(importJobId, (msg) => job.log(msg));
        default:
          throw new Error(`Import adapter for source "${source}" is not implemented yet`);
      }
    },
    { connection, concurrency: 2 }
  );
}
