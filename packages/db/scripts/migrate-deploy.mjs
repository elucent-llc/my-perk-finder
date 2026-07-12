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

function baselineAll() {
  const migrations = listMigrationNames();
  if (migrations.length === 0) {
    console.warn("[db-sync] no local migrations to baseline");
    return false;
  }
  console.warn(
    `[db-sync] baselining ${migrations.length} migration(s) as already applied…`
  );
  let ok = true;
  for (const name of migrations) {
    console.log(`[db-sync] migrate resolve --applied ${name}`);
    const r = run(["migrate", "resolve", "--applied", name], { inherit: true });
    if (r.status !== 0) {
      // Already recorded is fine; other errors are logged and we continue.
      console.warn(`[db-sync] resolve ${name} exited ${r.status} (continuing)`);
      ok = false;
    }
  }
  return ok;
}

function migrateDeploy({ inherit }) {
  console.log("[db-sync] prisma migrate deploy");
  return run(["migrate", "deploy"], { inherit });
}

function dbPush() {
  console.warn(
    "[db-sync] falling back to prisma db push --accept-data-loss (schema sync safety net)"
  );
  return run(
    ["db", "push", "--skip-generate", "--accept-data-loss"],
    { inherit: true }
  );
}

let result = migrateDeploy({ inherit: false });
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);

if (result.status === 0) {
  console.log("[db-sync] migrate deploy ok");
  process.exit(0);
}

if (isP3005(result.output)) {
  console.warn("[db-sync] P3005 — DB has tables but no migration history");
  baselineAll();
  result = migrateDeploy({ inherit: true });
  if (result.status === 0) {
    console.log("[db-sync] migrate deploy ok after baseline");
    process.exit(0);
  }
}

// Any other migrate failure (drift, failed migration, partial apply, etc.)
const push = dbPush();
if (push.status !== 0) {
  console.error("[db-sync] migrate deploy and db push both failed");
  process.exit(push.status);
}

console.warn("[db-sync] db push succeeded — aligning migration history");
baselineAll();

// Best-effort final migrate (no-op if everything is marked applied)
result = migrateDeploy({ inherit: true });
if (result.status !== 0) {
  console.warn(
    "[db-sync] migrate deploy still reporting issues after push; schema was synced via push — continuing"
  );
}

console.log("[db-sync] schema sync complete");
process.exit(0);
