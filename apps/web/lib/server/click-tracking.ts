import { createHash } from "node:crypto";

export function hashIp(ip: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 32);
}
