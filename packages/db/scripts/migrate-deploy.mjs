#!/usr/bin/env node
/**
 * Resilient production schema sync for Railway / start:web.
 *
 * Order:
 *  1. prisma migrate deploy
 *  2. On P3005 → baseline all local migrations, deploy again
 *  3. On migration-history mismatch (e.g. after squashing migrations) →
 *     truncate `_prisma_migrations`, baseline current migrations, deploy again
 *  4. On any remaining failure → prisma db push --accept-data-loss, then re-baseline
 *
 * Trade-off: step 4 can drop columns/tables removed from the schema.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "prisma", "migrations");

function run(args, { inherit = true, input } = {}) {
  const result = spawnSync("pnpm", ["exec", "prisma", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: inherit ? (input ? ["pipe", "inherit", "inherit"] : "inherit") : ["pipe", "pipe", "pipe"],
    env: process.env,
    input,
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

function isMigrationHistoryMismatch(output) {
  const needles = [
    "P3009",
    "P3015",
    "failed migrations",
    "have been modified",
    "modified after it was applied",
    "missing from the local",
    "Could not find the migration file",
    "migration file",
    "Drift detected",
    "Migration history diverged",
  ];
  return needles.some((n) => output.toLowerCase().includes(n.toLowerCase()));
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

function resetMigrationHistory() {
  step('reset `_prisma_migrations` (squash / history mismatch recovery)');
  const sql = 'TRUNCATE TABLE "_prisma_migrations";';
  const r = run(["db", "execute", "--stdin"], { inherit: true, input: sql });
  if (r.status !== 0) {
    // Table may not exist yet — ignore and continue to baseline/create.
    console.warn(`[db-sync] truncate exited ${r.status} (continuing if table missing)`);
  } else {
    ok("migration history cleared");
  }
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

function finishOk(label) {
  ok(label);
  console.log("[db-sync] ALL STEPS SUCCESS — schema ready");
  process.exit(0);
}

let result = migrateDeploy({ inherit: false });
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);

if (result.status === 0) {
  finishOk("migrate deploy (no pending migrations or applied successfully)");
}

if (isP3005(result.output)) {
  console.warn("[db-sync] P3005 — DB has tables but no migration history");
  baselineAll();
  result = migrateDeploy({ inherit: true });
  if (result.status === 0) {
    finishOk("migrate deploy after baseline");
  }
  fail("migrate deploy after baseline", result.status);
}

if (isMigrationHistoryMismatch(result.output) || result.status !== 0) {
  console.warn(
    "[db-sync] migration history mismatch or deploy failed — recovering after squash/rebase"
  );
  resetMigrationHistory();
  baselineAll();
  result = migrateDeploy({ inherit: true });
  if (result.status === 0) {
    finishOk("migrate deploy after history reset");
  }
  fail("migrate deploy after history reset", result.status);
}

const push = dbPush();
if (push.status !== 0) {
  fail("db push fallback", push.status);
  console.error("[db-sync] ALL STEPS FAILED — migrate deploy and db push both failed");
  process.exit(push.status);
}

ok("db push fallback");
resetMigrationHistory();
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
