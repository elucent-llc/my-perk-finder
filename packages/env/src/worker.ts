import { z } from "zod";
import { optionalServerEnvSchema, parseEnv } from "./shared.js";

export type AwinMembershipFilter = "all" | "joined" | "notJoined";
export type CjRelationshipStatus = "joined" | "joined_pending" | "not_joined" | "all";

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

/** When MOCK_EXTERNAL=true, CJ credentials are optional. */
export const cjWorkerEnvSchema = baseWorkerSchema.superRefine((data, ctx) => {
  const mock = data.MOCK_EXTERNAL === true;
  if (!mock) {
    if (!process.env.CJ_ACCESS_TOKEN?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CJ_ACCESS_TOKEN is required when MOCK_EXTERNAL is not true",
        path: ["CJ_ACCESS_TOKEN"],
      });
    }
    if (!process.env.CJ_WEBSITE_ID?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CJ_WEBSITE_ID is required when MOCK_EXTERNAL is not true",
        path: ["CJ_WEBSITE_ID"],
      });
    }
  }
});

/** When MOCK_EXTERNAL=true, Walmart credentials are optional. */
export const walmartWorkerEnvSchema = baseWorkerSchema.superRefine((data, ctx) => {
  const mock = data.MOCK_EXTERNAL === true;
  if (!mock) {
    if (!process.env.WALMART_API_KEY?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WALMART_API_KEY is required when MOCK_EXTERNAL is not true",
        path: ["WALMART_API_KEY"],
      });
    }
    if (!process.env.WALMART_PUBLISHER_ID?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WALMART_PUBLISHER_ID is required when MOCK_EXTERNAL is not true",
        path: ["WALMART_PUBLISHER_ID"],
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
  AWIN_MAX_PAGES: number;
  AWIN_DEBUG_RAW_PAGES: boolean;
};

export type CjWorkerEnv = {
  DATABASE_URL: string;
  DIRECT_URL?: string;
  MOCK_EXTERNAL: boolean;
  CJ_ACCESS_TOKEN?: string;
  CJ_WEBSITE_ID?: string;
  CJ_RELATIONSHIP_STATUS: CjRelationshipStatus;
  CJ_PAGE_SIZE: number;
  CJ_MAX_PAGES: number;
  CJ_DEBUG_RAW_PAGES: boolean;
};

export type WalmartWorkerEnv = {
  DATABASE_URL: string;
  DIRECT_URL?: string;
  MOCK_EXTERNAL: boolean;
  WALMART_API_KEY?: string;
  WALMART_PUBLISHER_ID?: string;
  WALMART_SEARCH_TERMS: string[];
  WALMART_PAGE_SIZE: number;
  WALMART_MAX_PAGES: number;
  WALMART_DEBUG_RAW_PAGES: boolean;
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

export function parseMaxPages(value: string | undefined, fallback: number): number {
  const n = Number(value?.trim());
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), 50);
}

export function parseCjRelationshipStatus(value?: string): CjRelationshipStatus {
  const v = value?.trim().toLowerCase();
  if (v === "joined_pending" || v === "joinedpending") return "joined_pending";
  if (v === "not_joined" || v === "notjoined") return "not_joined";
  if (v === "all") return "all";
  return "joined";
}

export function parseCjPageSize(value?: string): number {
  const n = Number(value?.trim());
  if (!Number.isFinite(n) || n <= 0) return 100;
  return Math.min(Math.floor(n), 100);
}

export function parseWalmartPageSize(value?: string): number {
  const n = Number(value?.trim());
  if (!Number.isFinite(n) || n <= 0) return 25;
  return Math.min(Math.floor(n), 25);
}

export function parseWalmartSearchTerms(value?: string): string[] {
  if (!value?.trim()) return ["electronics", "home"];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function debugRawPages(...keys: string[]): boolean {
  if (process.env.DEBUG_RAW_PAGES === "true") return true;
  return keys.some((k) => process.env[k] === "true");
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
    AWIN_MAX_PAGES: parseMaxPages(process.env.AWIN_MAX_PAGES, 50),
    AWIN_DEBUG_RAW_PAGES: debugRawPages("AWIN_DEBUG_RAW_PAGES"),
  };
}

/** Validate env for Railway cron: myperkfinder-worker-cj-import */
export function getCjWorkerEnv(): CjWorkerEnv {
  parseEnv(cjWorkerEnvSchema);
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    DIRECT_URL: process.env.DIRECT_URL,
    MOCK_EXTERNAL: process.env.MOCK_EXTERNAL === "true",
    CJ_ACCESS_TOKEN: process.env.CJ_ACCESS_TOKEN?.trim() || undefined,
    CJ_WEBSITE_ID: process.env.CJ_WEBSITE_ID?.trim() || undefined,
    CJ_RELATIONSHIP_STATUS: parseCjRelationshipStatus(process.env.CJ_RELATIONSHIP_STATUS),
    CJ_PAGE_SIZE: parseCjPageSize(process.env.CJ_PAGE_SIZE),
    CJ_MAX_PAGES: parseMaxPages(process.env.CJ_MAX_PAGES, 1),
    CJ_DEBUG_RAW_PAGES: debugRawPages("CJ_DEBUG_RAW_PAGES"),
  };
}

/** Validate env for Railway cron: myperkfinder-worker-walmart-import */
export function getWalmartWorkerEnv(): WalmartWorkerEnv {
  parseEnv(walmartWorkerEnvSchema);
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    DIRECT_URL: process.env.DIRECT_URL,
    MOCK_EXTERNAL: process.env.MOCK_EXTERNAL === "true",
    WALMART_API_KEY: process.env.WALMART_API_KEY?.trim() || undefined,
    WALMART_PUBLISHER_ID: process.env.WALMART_PUBLISHER_ID?.trim() || undefined,
    WALMART_SEARCH_TERMS: parseWalmartSearchTerms(process.env.WALMART_SEARCH_TERMS),
    WALMART_PAGE_SIZE: parseWalmartPageSize(process.env.WALMART_PAGE_SIZE),
    WALMART_MAX_PAGES: parseMaxPages(process.env.WALMART_MAX_PAGES, 1),
    WALMART_DEBUG_RAW_PAGES: debugRawPages("WALMART_DEBUG_RAW_PAGES"),
  };
}

export type ImportWorkerEnv = {
  DATABASE_URL: string;
  DIRECT_URL?: string;
  MOCK_EXTERNAL: boolean;
  /** Sources with credentials (or mock mode) that the combined import will run. */
  enabledSources: {
    awin: boolean;
    cj: boolean;
    walmart: boolean;
  };
  awin: Omit<WorkerEnv, "DATABASE_URL" | "DIRECT_URL" | "MOCK_EXTERNAL">;
  cj: Omit<CjWorkerEnv, "DATABASE_URL" | "DIRECT_URL" | "MOCK_EXTERNAL">;
  walmart: Omit<WalmartWorkerEnv, "DATABASE_URL" | "DIRECT_URL" | "MOCK_EXTERNAL">;
};

/**
 * Combined import cron env (myperkfinder-worker-import).
 * Does not require every network's credentials — missing sources are skipped.
 * When MOCK_EXTERNAL=true, all implemented sources run with mock data.
 */
export function getImportWorkerEnv(): ImportWorkerEnv {
  parseEnv(baseWorkerSchema);
  const mock = process.env.MOCK_EXTERNAL === "true";
  const awinToken = process.env.AWIN_ACCESS_TOKEN?.trim() || undefined;
  const awinPublisher = process.env.AWIN_PUBLISHER_ID?.trim() || undefined;
  const cjToken = process.env.CJ_ACCESS_TOKEN?.trim() || undefined;
  const cjWebsite = process.env.CJ_WEBSITE_ID?.trim() || undefined;
  const walmartKey = process.env.WALMART_API_KEY?.trim() || undefined;
  const walmartPublisher = process.env.WALMART_PUBLISHER_ID?.trim() || undefined;

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    DIRECT_URL: process.env.DIRECT_URL,
    MOCK_EXTERNAL: mock,
    enabledSources: {
      awin: mock || Boolean(awinToken && awinPublisher),
      cj: mock || Boolean(cjToken && cjWebsite),
      walmart: mock || Boolean(walmartKey && walmartPublisher),
    },
    awin: {
      AWIN_ACCESS_TOKEN: awinToken,
      AWIN_PUBLISHER_ID: awinPublisher,
      AWIN_MEMBERSHIP_FILTER: parseAwinMembershipFilter(process.env.AWIN_MEMBERSHIP_FILTER),
      AWIN_REGION_CODES: parseAwinRegionCodes(process.env.AWIN_REGION_CODES),
      AWIN_PAGE_SIZE: parseAwinPageSize(process.env.AWIN_PAGE_SIZE),
      AWIN_MAX_PAGES: parseMaxPages(process.env.AWIN_MAX_PAGES, 50),
      AWIN_DEBUG_RAW_PAGES: debugRawPages("AWIN_DEBUG_RAW_PAGES"),
    },
    cj: {
      CJ_ACCESS_TOKEN: cjToken,
      CJ_WEBSITE_ID: cjWebsite,
      CJ_RELATIONSHIP_STATUS: parseCjRelationshipStatus(process.env.CJ_RELATIONSHIP_STATUS),
      CJ_PAGE_SIZE: parseCjPageSize(process.env.CJ_PAGE_SIZE),
      CJ_MAX_PAGES: parseMaxPages(process.env.CJ_MAX_PAGES, 1),
      CJ_DEBUG_RAW_PAGES: debugRawPages("CJ_DEBUG_RAW_PAGES"),
    },
    walmart: {
      WALMART_API_KEY: walmartKey,
      WALMART_PUBLISHER_ID: walmartPublisher,
      WALMART_SEARCH_TERMS: parseWalmartSearchTerms(process.env.WALMART_SEARCH_TERMS),
      WALMART_PAGE_SIZE: parseWalmartPageSize(process.env.WALMART_PAGE_SIZE),
      WALMART_MAX_PAGES: parseMaxPages(process.env.WALMART_MAX_PAGES, 1),
      WALMART_DEBUG_RAW_PAGES: debugRawPages("WALMART_DEBUG_RAW_PAGES"),
    },
  };
}

/** Validate env for Railway cron: myperkfinder-worker-expire-offers */
export function getExpireWorkerEnv(): z.infer<typeof expireWorkerEnvSchema> {
  return parseEnv(expireWorkerEnvSchema);
}
