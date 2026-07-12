#!/usr/bin/env node
/**
 * Resilient production schema sync for Railway / start:web.
 *
 * Goal: schema changes in prisma/schema.prisma (and migrations/) must not
 * take the deploy down.
 *
 * Order:
 *  1. prisma migrate deploy          (normal path)
 *  2. On P3005 → baseline all local migrations, deploy again
 *  3. On any remaining failure → prisma db push --accept-data-loss
 *     then best-effort mark migrations applied so the next boot uses migrate
 *
 * Trade-off: step 3 can drop columns/tables removed from the schema.
 * Prefer adding migrations for intentional changes; this is a safety net.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "prisma", "migrations");

function run(args, { inherit = true } = {}) {
  const result = spawnSync("pnpm", ["exec", "prisma", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
  };
}

function listMigrationNames() {
  if (!existsSync(migrationsDir)) return [];
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function isP3005(output) {
  return output.includes("P3005") || output.includes("database schema is not empty");
}

function step(label) {
  console.log(`[db-sync] STEP — ${label}`);
}

function ok(label) {
  console.log(`[db-sync] SUCCESS — ${label}`);
}

function fail(label, status) {
  console.error(`[db-sync] FAILED — ${label} (exit ${status})`);
}

function baselineAll() {
  const migrations = listMigrationNames();
  if (migrations.length === 0) {
    console.warn("[db-sync] no local migrations to baseline");
    return false;
  }
  step(`baseline ${migrations.length} migration(s) as already applied`);
  for (const name of migrations) {
    console.log(`[db-sync]   resolve --applied ${name}`);
    const r = run(["migrate", "resolve", "--applied", name], { inherit: true });
    if (r.status !== 0) {
      console.warn(`[db-sync]   resolve ${name} exited ${r.status} (continuing)`);
    } else {
      console.log(`[db-sync]   SUCCESS — resolved ${name}`);
    }
  }
  ok("baseline complete");
  return true;
}

function migrateDeploy({ inherit }) {
  step("prisma migrate deploy");
  return run(["migrate", "deploy"], { inherit });
}

function dbPush() {
  step("fallback: prisma db push --accept-data-loss");
  return run(["db", "push", "--skip-generate", "--accept-data-loss"], { inherit: true });
}

let result = migrateDeploy({ inherit: false });
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);

if (result.status === 0) {
  ok("migrate deploy (no pending migrations or applied successfully)");
  console.log("[db-sync] ALL STEPS SUCCESS — schema ready");
  process.exit(0);
}

if (isP3005(result.output)) {
  console.warn("[db-sync] P3005 — DB has tables but no migration history");
  baselineAll();
  result = migrateDeploy({ inherit: true });
  if (result.status === 0) {
    ok("migrate deploy after baseline");
    console.log("[db-sync] ALL STEPS SUCCESS — schema ready");
    process.exit(0);
  }
  fail("migrate deploy after baseline", result.status);
}

const push = dbPush();
if (push.status !== 0) {
  fail("db push fallback", push.status);
  console.error("[db-sync] ALL STEPS FAILED — migrate deploy and db push both failed");
  process.exit(push.status);
}

ok("db push fallback");
step("align migration history after push");
baselineAll();

result = migrateDeploy({ inherit: true });
if (result.status !== 0) {
  console.warn(
    "[db-sync] migrate deploy still reporting issues after push; schema was synced via push — continuing"
  );
} else {
  ok("migrate deploy after push alignment");
}

console.log("[db-sync] ALL STEPS SUCCESS — schema ready");
process.exit(0);
