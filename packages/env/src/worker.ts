import { z } from "zod";
import { optionalServerEnvSchema, parseEnv } from "./shared.js";

export type AwinMembershipFilter = "all" | "joined" | "notJoined";

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

export type WorkerEnv = {
  DATABASE_URL: string;
  DIRECT_URL?: string;
  MOCK_EXTERNAL: boolean;
  AWIN_ACCESS_TOKEN?: string;
  AWIN_PUBLISHER_ID?: string;
  AWIN_MEMBERSHIP_FILTER: AwinMembershipFilter;
  AWIN_REGION_CODES: string[];
  AWIN_PAGE_SIZE: number;
  AWIN_DEBUG_RAW_PAGES: boolean;
};

export function parseAwinMembershipFilter(value?: string): AwinMembershipFilter {
  const v = value?.trim().toLowerCase();
  if (v === "joined") return "joined";
  if (v === "notjoined" || v === "not_joined") return "notJoined";
  return "all";
}

export function parseAwinRegionCodes(value?: string): string[] {
  if (!value?.trim()) return ["US"];
  return value
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export function parseAwinPageSize(value?: string): number {
  const n = Number(value?.trim());
  if (!Number.isFinite(n) || n <= 0) return 100;
  return Math.min(Math.floor(n), 500);
}

/** Validate env for Railway cron: myperkfinder-worker-awin-import */
export function getWorkerEnv(): WorkerEnv {
  parseEnv(workerEnvSchema);
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    DIRECT_URL: process.env.DIRECT_URL,
    MOCK_EXTERNAL: process.env.MOCK_EXTERNAL === "true",
    AWIN_ACCESS_TOKEN: process.env.AWIN_ACCESS_TOKEN?.trim() || undefined,
    AWIN_PUBLISHER_ID: process.env.AWIN_PUBLISHER_ID?.trim() || undefined,
    AWIN_MEMBERSHIP_FILTER: parseAwinMembershipFilter(process.env.AWIN_MEMBERSHIP_FILTER),
    AWIN_REGION_CODES: parseAwinRegionCodes(process.env.AWIN_REGION_CODES),
    AWIN_PAGE_SIZE: parseAwinPageSize(process.env.AWIN_PAGE_SIZE),
    AWIN_DEBUG_RAW_PAGES:
      process.env.AWIN_DEBUG_RAW_PAGES === "true" || process.env.DEBUG_RAW_PAGES === "true",
  };
}

/** Validate env for Railway cron: myperkfinder-worker-expire-offers */
export function getExpireWorkerEnv(): z.infer<typeof expireWorkerEnvSchema> {
  return parseEnv(expireWorkerEnvSchema);
}
