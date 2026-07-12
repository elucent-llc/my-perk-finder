# Railway deployment checklist — MyPerkFinder

Use this before and after each production deploy.

## Service root & config path

- [ ] **Root Directory** is the **repo root** (`/`) on web and both cron services
- [ ] **Do not** set Root Directory to `apps/web` or `apps/worker`
- [ ] Point **Config file** to the JSON under `apps/*` (e.g. `apps/web/railway.json`) — config path does not replace repo root
- [ ] Build/start use root scripts: `pnpm build:web`, `pnpm start:web`, `pnpm build:worker`, `pnpm worker:import-awin`, `pnpm worker:expire-offers`

## Domain & TLS

- [ ] Custom domain `myperkfinder.com` (and `www`) points to Railway `myperkfinder-web`
- [ ] HTTPS certificate is active (Railway managed)
- [ ] `NEXT_PUBLIC_SITE_URL` set to production URL (e.g. `https://myperkfinder.com` or Railway public URL)
- [ ] `DIRECT_URL` set (same as `DATABASE_URL`)
- [ ] `ADMIN_AUTH_SECRET` set on web service (min 16 chars)
- [ ] `NODE_ENV` is **not** `development` on Railway (remove manual override)
- [ ] Optional: `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` if you see post-deploy Server Action log noise

## Health & uptime

- [ ] `GET https://myperkfinder.com/api/health` returns `{ "status": "ok", "service": "myperkfinder-web" }`
- [ ] Web service health check path is `/api/health` in Railway settings

## Database

- [ ] Railway PostgreSQL plugin attached; `DATABASE_URL` injected into web + worker services
- [ ] `DIRECT_URL` set to same value as `DATABASE_URL` (Prisma)
- [ ] Migrations applied: `pnpm db:migrate:deploy` (includes `Click` table + nullable prices)
- [ ] No seed/mock data published as live offers in production

## Admin authentication

- [ ] `ADMIN_AUTH_SECRET` set on **myperkfinder-web** (min 16 chars; e.g. `openssl rand -base64 32`)
- [ ] `/admin` redirects to `/admin/login` when not authenticated
- [ ] `/api/admin/*` returns 401 without session (except `/api/admin/login`)
- [ ] Anonymous `PATCH /api/admin/offers/[id]` is blocked
- [ ] Admin secret is **not** prefixed with `NEXT_PUBLIC_`

## Secrets & affiliate

- [ ] `AWIN_ACCESS_TOKEN` and `AWIN_PUBLISHER_ID` on **import worker only**, never `NEXT_PUBLIC_*`
- [ ] `MOCK_EXTERNAL=false` on production Awin cron worker
- [ ] `MOCK_EXTERNAL=true` works locally without Awin credentials (`pnpm worker:import-awin`)
- [ ] No affiliate credentials in client bundle (no Awin API calls from browser)
- [ ] No secrets committed to GitHub

## Cron workers

- [ ] Separate services (not the web service): `myperkfinder-worker-awin-import`, `myperkfinder-worker-expire-offers`
- [ ] Config files set: `apps/worker/railway.import-awin.json`, `apps/worker/railway.expire-offers.json`
- [ ] Schedules come from config (`cronSchedule`) — **not** from Variables / env vars
- [ ] Import + expire: `0 16 * * *` (12:00 PM EDT / 16:00 UTC daily; 11:00 AM EST in winter)
- [ ] Worker logs show JSON lines, process exits code 0
- [ ] ImportJob rows visible at `/admin/imports`

## Awin import worker (Phase 3)

- [ ] Separate Railway service: `myperkfinder-worker-awin-import`
- [ ] Root directory `/`, config file `apps/worker/railway.import-awin.json`
- [ ] Service type: **Cron Job** (not always-on)
- [ ] `AWIN_ACCESS_TOKEN` and `AWIN_PUBLISHER_ID` on **worker only** — never on web service
- [ ] No `NEXT_PUBLIC_AWIN_*` variables anywhere
- [ ] `MOCK_EXTERNAL=true` manual test passes (`pnpm worker:import-awin` exits 0)
- [ ] `MOCK_EXTERNAL=false` real Awin test passes with `AWIN_MEMBERSHIP_FILTER=all`
- [ ] Worker exits cleanly (no long-running process, no setInterval)
- [ ] Imported offers visible at `/admin/review` or `/admin/offers`
- [ ] ImportJob row at `/admin/imports` shows counts
- [ ] Production: `AWIN_MEMBERSHIP_FILTER=joined`
- [ ] Cron schedule `0 16 * * *` configured **only after** manual tests pass

## Affiliate pipeline

- [ ] One `RawRecord` per normalized offer (not duplicate page payloads unless `AWIN_DEBUG_RAW_PAGES=true`)
- [ ] Missing affiliate URL / merchant → rejected (not upserted)
- [ ] Low confidence / suspicious discount → `needs_review`
- [ ] Admin review at `/admin/review` — approve / reject / mark expired works

## Click tracking & redirects

- [ ] “Go to Deal” uses `/api/r/{offerId}` (not raw affiliate URLs in HTML)
- [ ] Links: `rel="nofollow sponsored noopener noreferrer"` + `target="_blank"`
- [ ] Redirect returns 302 with `Cache-Control: no-store`
- [ ] `Click` row created per redirect; `clicksToday` in admin counts today's `Click` rows
- [ ] Inactive/expired offers return 404/410 on redirect

Verify:

```bash
curl -sI "https://myperkfinder.com/api/r/<active-offer-id>" | grep -E 'HTTP|Location|Cache-Control'
```

## Legal pages (affiliate / AdSense review)

- [ ] `/about`, `/contact`, `/privacy-policy`, `/terms`, `/affiliate-disclosure` live
- [ ] Footer links to all legal pages
- [ ] Affiliate disclosure on deal detail pages and footer
- [ ] No broken Blog/Alerts nav links

## Cost controls

- [ ] Only **web + 2 cron workers + Postgres** deployed
- [ ] **No** always-on BullMQ worker, Redis, or Meilisearch in prod (web + cron workers + Postgres only)
- [ ] Do **not** deploy `apps/api` or `apps/admin` to Railway (use `apps/web` only)
- [ ] Web start runs `pnpm db:migrate:deploy` before `next start`
- [ ] `/api/health` returns 503 when Postgres is down

## Post-deploy smoke test

```bash
curl -s https://myperkfinder.com/api/health | jq
curl -sI "https://myperkfinder.com/api/r/<active-offer-id>" | head -8
```

- [ ] Public homepage loads DB-backed deals and merchants
- [ ] Admin `/admin` loads after login
