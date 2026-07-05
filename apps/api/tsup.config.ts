import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: true,
  // Bundle workspace TS packages so their .ts source is compiled…
  noExternal: [/@mpf\//],
  // …but keep runtime-resolved native deps external (Prisma resolves its
  // engine via dynamic require; Fastify/pino/bullmq expect CJS resolution).
  external: [
    "@prisma/client",
    ".prisma/client",
    "@prisma/engines",
    "fastify",
    "pino",
    "pino-pretty",
    "bullmq",
    "ioredis",
    "meilisearch",
  ],
});
