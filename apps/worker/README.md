# MyPerkFinder Worker (Railway cron CLIs)

Production imports and maintenance run as **one-shot cron jobs** — not an always-on BullMQ worker.

## Commands

| Script | Railway service | Schedule |
| ------ | --------------- | -------- |
| `pnpm import:awin` | `myperkfinder-worker-awin-import` | `30 18 * * *` (2:30 PM EDT) |
| `pnpm expire:offers` | `myperkfinder-worker-expire-offers` | `30 18 * * *` (2:30 PM EDT) |

Build first: `pnpm build` (from repo root: `pnpm build:worker`).

## Environment

| Variable | Required |
| -------- | -------- |
| `DATABASE_URL` | Yes |
| `AWIN_ACCESS_TOKEN` | Yes when `MOCK_EXTERNAL=false` |
| `AWIN_PUBLISHER_ID` | Yes when `MOCK_EXTERNAL=false` |
| `MOCK_EXTERNAL=true` | Optional — mocks Awin for local/staging |

Optional: `DEBUG_RAW_PAGES=true` saves full Awin API page payloads to `RawRecord` (debug only).

Legacy BullMQ worker code was removed. Use `pnpm dev:all` only if you still run `apps/api` locally.
