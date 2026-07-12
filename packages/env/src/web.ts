import { z } from "zod";
import { optionalServerEnvSchema, parseEnv } from "./shared.js";

export const webEnvSchema = optionalServerEnvSchema.extend({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_SITE_URL: z.string().url("NEXT_PUBLIC_SITE_URL must be a valid URL"),
  ADMIN_AUTH_SECRET: z
    .string()
    .min(16, "ADMIN_AUTH_SECRET must be at least 16 characters in production")
    .optional(),
  CLICK_HASH_SECRET: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(16).optional()
  ),
}).superRefine((data, ctx) => {
  if (process.env.NODE_ENV === "production" && !data.ADMIN_AUTH_SECRET?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "ADMIN_AUTH_SECRET is required in production",
      path: ["ADMIN_AUTH_SECRET"],
    });
  }
  if (
    process.env.NODE_ENV === "production" &&
    !data.CLICK_HASH_SECRET?.trim() &&
    !data.ADMIN_AUTH_SECRET?.trim()
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CLICK_HASH_SECRET or ADMIN_AUTH_SECRET is required in production for click hashing",
      path: ["CLICK_HASH_SECRET"],
    });
  }
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
