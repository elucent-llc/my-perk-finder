import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { dealsRoutes } from "./routes/deals.js";
import { storesRoutes } from "./routes/stores.js";
import { couponsRoutes } from "./routes/coupons.js";
import { categoriesRoutes } from "./routes/categories.js";
import { searchRoutes } from "./routes/search.js";
import { subscribersRoutes } from "./routes/subscribers.js";
import { adminRoutes } from "./routes/admin.js";
import { importsRoutes } from "./routes/imports.js";
import { healthRoutes } from "./routes/health.js";
import { redirectRoutes } from "./routes/redirect.js";

export async function buildServer() {
  const app = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
          : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: true });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "MyPerkFinder API",
        description: "Deal discovery platform API — deals, stores, coupons, search, admin & imports.",
        version: "0.1.0",
      },
      tags: [
        { name: "deals", description: "Public deal browsing" },
        { name: "stores", description: "Merchants / stores" },
        { name: "coupons", description: "Coupons & promo codes" },
        { name: "categories", description: "Category tree" },
        { name: "search", description: "Search across deals" },
        { name: "subscribers", description: "Email subscribers" },
        { name: "admin", description: "Admin operations" },
        { name: "imports", description: "Affiliate import operations" },
        { name: "redirect", description: "Affiliate click tracking redirects" },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, { routePrefix: "/docs" });

  await app.register(healthRoutes);
  await app.register(dealsRoutes, { prefix: "/api/deals" });
  await app.register(storesRoutes, { prefix: "/api/stores" });
  await app.register(couponsRoutes, { prefix: "/api/coupons" });
  await app.register(categoriesRoutes, { prefix: "/api/categories" });
  await app.register(searchRoutes, { prefix: "/api/search" });
  await app.register(subscribersRoutes, { prefix: "/api/subscribers" });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.register(importsRoutes, { prefix: "/api/admin/imports" });
  await app.register(redirectRoutes, { prefix: "/r" });

  return app;
}
