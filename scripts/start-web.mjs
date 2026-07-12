#!/usr/bin/env node
/**
 * Production web start with explicit step success logging for Railway.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function step(n, total, label) {
  console.log(`[start:web] STEP ${n}/${total} ${label}`);
}

function ok(n, total, label) {
  console.log(`[start:web] STEP ${n}/${total} SUCCESS — ${label}`);
}

function fail(n, total, label, status) {
  console.error(`[start:web] STEP ${n}/${total} FAILED — ${label} (exit ${status})`);
}

const TOTAL = 2;

step(1, TOTAL, "database schema sync (migrate deploy)");
const migrate = spawnSync("pnpm", ["db:migrate:deploy"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if ((migrate.status ?? 1) !== 0) {
  fail(1, TOTAL, "database schema sync", migrate.status ?? 1);
  process.exit(migrate.status ?? 1);
}
ok(1, TOTAL, "database schema sync");

step(2, TOTAL, "start Next.js web server");
ok(2, TOTAL, "handing off to Next.js (process stays running)");
const next = spawnSync("pnpm", ["--filter", "@mpf/web", "start"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(next.status ?? 1);
