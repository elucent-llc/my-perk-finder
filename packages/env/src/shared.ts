import { z } from "zod";

/** Shared optional vars — never expose via NEXT_PUBLIC_. */
export const optionalServerEnvSchema = z.object({
  DIRECT_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  MEILI_HOST: z.string().url().optional(),
  MEILI_MASTER_KEY: z.string().min(1).optional(),
  MEILISEARCH_HOST: z.string().url().optional(),
  MEILISEARCH_API_KEY: z.string().min(1).optional(),
  // Empty string in .env should be treated as unset (worker doesn't need this).
  ADMIN_AUTH_SECRET: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(16).optional()
  ),
  MOCK_EXTERNAL: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: z.string().optional(),
});

export type OptionalServerEnv = z.infer<typeof optionalServerEnvSchema>;

export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env
): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join("\n")}`);
  }
  return result.data;
}
