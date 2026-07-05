import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "cli/import-awin": "src/cli/import-awin.ts",
    "cli/expire-offers": "src/cli/expire-offers.ts",
  },
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: true,
  noExternal: [/@mpf\//],
  external: [
    "@prisma/client",
    ".prisma/client",
    "@prisma/engines",
    "bullmq",
    "ioredis",
    "openai",
    "resend",
    "meilisearch",
  ],
});
