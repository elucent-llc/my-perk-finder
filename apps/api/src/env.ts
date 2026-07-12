import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// Load root .env (monorepo-level), then local overrides.
config({ path: resolve(process.cwd(), "../../.env") });
config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  MEILI_HOST: z.string().default("http://localhost:7700"),
  MEILI_MASTER_KEY: z.string().default("mpf_dev_master_key"),
  ADMIN_AUTH_SECRET: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(16).optional()
  ),
  CLICK_HASH_SECRET: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(16).optional()
  ),
  ALLOW_DEV_ADMIN_BYPASS: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  MOCK_EXTERNAL: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
});

export const env = EnvSchema.parse(process.env);
