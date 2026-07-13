import { disconnectDb } from "@mpf/db";
import type { SourceImportCounters } from "../jobs/run-source-import.js";

export interface CliLogger {
  log: (msg: string, step?: string) => void;
  error: (msg: string, step?: string) => void;
  stepOk: (step: string, msg: string) => void;
}

/** JSON structured logger scoped to a worker service name. */
export function createLogger(service: string): CliLogger {
  const emit = (
    stream: "log" | "error",
    level: "info" | "error",
    msg: string,
    step?: string
  ) => {
    console[stream](
      JSON.stringify({
        level,
        service,
        step: step ?? undefined,
        msg,
        ts: new Date().toISOString(),
      })
    );
  };

  return {
    log: (msg, step) => emit("log", "info", msg, step),
    error: (msg, step) => emit("error", "error", msg, step),
    stepOk: (step, msg) => emit("log", "info", `SUCCESS — ${msg}`, step),
  };
}

/** Pretty per-source counters block for local runs / logs. */
export function printImportSummary(
  title: string,
  result: SourceImportCounters,
  jobId: string
): void {
  const bar = "=".repeat(Math.max(title.length + 8, 36));
  console.log(
    [
      "",
      `==== ${title} ====`,
      `  ImportJob:     ${jobId}`,
      `  Fetched:       ${result.offersFound}`,
      `  Pages:         ${result.pages}`,
      `  Created:       ${result.created}`,
      `  Updated:       ${result.updated}`,
      `  Expired:       ${result.expired}`,
      `  Needs review:  ${result.needsReview}`,
      `  Rejected:      ${result.rejected}`,
      bar,
      "",
    ].join("\n")
  );
}

/**
 * Standard cron entrypoint wrapper: runs `main`, then disconnects Prisma and
 * exits 0. Any thrown error is logged and the process exits 1.
 */
export async function runCli(
  service: string,
  main: (logger: CliLogger) => Promise<void>
): Promise<void> {
  const logger = createLogger(service);
  try {
    await main(logger);
    await disconnectDb();
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(message, "failed");
    await disconnectDb();
    process.exit(1);
  }
}
