import { z } from "zod";
import { optionalServerEnvSchema, parseEnv } from "./shared.js";

const baseWorkerSchema = optionalServerEnvSchema.extend({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

/** When MOCK_EXTERNAL=true, Awin credentials are optional (mock import). */
export const workerEnvSchema = baseWorkerSchema.superRefine((data, ctx) => {
  const mock = data.MOCK_EXTERNAL === true;
  if (!mock) {
    if (!process.env.AWIN_ACCESS_TOKEN?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AWIN_ACCESS_TOKEN is required when MOCK_EXTERNAL is not true",
        path: ["AWIN_ACCESS_TOKEN"],
      });
    }
    if (!process.env.AWIN_PUBLISHER_ID?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AWIN_PUBLISHER_ID is required when MOCK_EXTERNAL is not true",
        path: ["AWIN_PUBLISHER_ID"],
      });
    }
  }
});

export const expireWorkerEnvSchema = baseWorkerSchema;

export type WorkerEnv = z.infer<typeof baseWorkerSchema> & {
  AWIN_ACCESS_TOKEN?: string;
  AWIN_PUBLISHER_ID?: string;
};

/** Validate env for Railway cron: myperkfinder-worker-awin-import */
export function getWorkerEnv(): WorkerEnv {
  parseEnv(workerEnvSchema);
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    DIRECT_URL: process.env.DIRECT_URL,
    MOCK_EXTERNAL: process.env.MOCK_EXTERNAL === "true",
    AWIN_ACCESS_TOKEN: process.env.AWIN_ACCESS_TOKEN?.trim() || undefined,
    AWIN_PUBLISHER_ID: process.env.AWIN_PUBLISHER_ID?.trim() || undefined,
  };
}

/** Validate env for Railway cron: myperkfinder-worker-expire-offers */
export function getExpireWorkerEnv(): z.infer<typeof expireWorkerEnvSchema> {
  return parseEnv(expireWorkerEnvSchema);
}
