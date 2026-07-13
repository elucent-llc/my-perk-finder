import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "cli/import-all": "src/cli/import-all.ts",
    "cli/import-awin": "src/cli/import-awin.ts",
    "cli/import-cj": "src/cli/import-cj.ts",
    "cli/import-walmart": "src/cli/import-walmart.ts",
    "cli/expire-offers": "src/cli/expire-offers.ts",
  },
  format: ["esm"],
  target: "node24",
  platform: "node",
  clean: true,
  sourcemap: true,
  noExternal: [/@mpf\//],
  external: ["@prisma/client", ".prisma/client", "@prisma/engines"],
});
