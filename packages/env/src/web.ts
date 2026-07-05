import { z } from "zod";
import { optionalServerEnvSchema, parseEnv } from "./shared.js";

export const webEnvSchema = optionalServerEnvSchema.extend({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_SITE_URL: z.string().url("NEXT_PUBLIC_SITE_URL must be a valid URL"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

let cached: WebEnv | null = null;

/** Validate env for the Next.js web service (Railway: myperkfinder-web). */
export function getWebEnv(): WebEnv {
  if (!cached) cached = parseEnv(webEnvSchema);
  return cached;
}

/** Lenient parse for health checks — does not throw if optional vars missing. */
export function tryGetWebEnv(): WebEnv | null {
  const result = webEnvSchema.safeParse(process.env);
  return result.success ? result.data : null;
}
