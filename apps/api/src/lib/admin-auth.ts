import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../env.js";

/**
 * Protect admin / sensitive routes with Bearer ADMIN_AUTH_SECRET.
 * In development, ALLOW_DEV_ADMIN_BYPASS=true skips auth when secret is unset.
 */
export async function requireAdminAuth(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const secret = env.ADMIN_AUTH_SECRET?.trim();
  if (!secret) {
    if (env.ALLOW_DEV_ADMIN_BYPASS && env.NODE_ENV !== "production") {
      return true;
    }
    await reply.code(503).send({ message: "Admin auth is not configured. Set ADMIN_AUTH_SECRET." });
    return false;
  }

  const header = request.headers.authorization;
  if (header === `Bearer ${secret}`) return true;

  await reply.code(401).send({ message: "Unauthorized" });
  return false;
}

/** Register a preHandler hook that requires admin auth for matching prefixes. */
export async function registerAdminAuthGuard(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    const path = request.url.split("?")[0] ?? "";

    // Public newsletter signup stays open
    if (path === "/api/subscribers" && request.method === "POST") return;

    const needsAuth =
      path.startsWith("/api/admin") ||
      path === "/api/subscribers" ||
      path.startsWith("/api/subscribers/");

    if (!needsAuth) return;

    const ok = await requireAdminAuth(request, reply);
    if (!ok) return;
  });
}
