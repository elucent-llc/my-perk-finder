import { disconnectDb } from "@mpf/db";

console.log(
  "MyPerkFinder worker: BullMQ mode is legacy/local-only.\n" +
    "Production uses Railway cron CLIs:\n" +
    "  pnpm worker:import-awin\n" +
    "  pnpm worker:expire-offers\n"
);

await disconnectDb();
process.exit(0);
