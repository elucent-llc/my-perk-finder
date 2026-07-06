import { createHmac } from "node:crypto";

const SESSION_PREFIX = "admin:";

/** Create signed admin session token: `{expMs}.{hmacHex}` — Node.js only (login route). */
export function signAdminSession(secret: string, maxAgeSeconds: number): string {
  const exp = String(Date.now() + maxAgeSeconds * 1000);
  const sig = createHmac("sha256", secret).update(`${SESSION_PREFIX}${exp}`).digest("hex");
  return `${exp}.${sig}`;
}
