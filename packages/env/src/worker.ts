import { z } from "zod";
import { optionalServerEnvSchema, parseEnv } from "./shared.js";

export const workerEnvSchema = optionalServerEnvSchema.extend({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AWIN_ACCESS_TOKEN: z.string().min(1, "AWIN_ACCESS_TOKEN is required for Awin import"),
  AWIN_PUBLISHER_ID: z.string().min(1, "AWIN_PUBLISHER_ID is required for Awin import"),
});

export const expireWorkerEnvSchema = optionalServerEnvSchema.extend({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

/** Validate env for Railway cron: myperkfinder-worker-awin-import */
export function getWorkerEnv(): WorkerEnv {
  return parseEnv(workerEnvSchema);
}

/** Validate env for Railway cron: myperkfinder-worker-expire-offers */
export function getExpireWorkerEnv(): z.infer<typeof expireWorkerEnvSchema> {
  return parseEnv(expireWorkerEnvSchema);
}
