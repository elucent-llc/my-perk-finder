import "./env.js";
import { createRedisConnection } from "@mpf/jobs";
import { startImportWorker } from "./workers/import.js";
import { startLlmWorker } from "./workers/llm.js";
import { startEmailWorker } from "./workers/email.js";
import { env } from "./env.js";

async function main() {
  const connection = createRedisConnection();

  const workers = [
    startImportWorker(connection),
    startLlmWorker(connection),
    startEmailWorker(connection),
  ];

  for (const w of workers) {
    w.on("completed", (job) => console.log(`✅ ${w.name} · job ${job.id} completed`));
    w.on("failed", (job, err) => console.error(`❌ ${w.name} · job ${job?.id} failed:`, err.message));
  }

  console.log(
    `🛠  MyPerkFinder worker up — import · llm · email queues listening. ` +
      `External providers ${env.MOCK_EXTERNAL ? "MOCKED" : "LIVE"}.`
  );

  const shutdown = async () => {
    console.log("Shutting down workers…");
    await Promise.all(workers.map((w) => w.close()));
    connection.disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void main();
