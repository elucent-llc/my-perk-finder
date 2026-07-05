# Railway deployment checklist — MyPerkFinder

Use this before and after each production deploy.

## Domain & TLS

- [ ] Custom domain `myperkfinder.com` (and `www`) points to Railway `myperkfinder-web`
- [ ] HTTPS certificate is active (Railway managed)
- [ ] `NEXT_PUBLIC_SITE_URL` matches production URL (e.g. `https://myperkfinder.com`)

## Health & uptime

- [ ] `GET https://myperkfinder.com/api/health` returns `{ "status": "ok", "service": "myperkfinder-web" }`
- [ ] Web service health check path is `/api/health` in Railway settings

## Database

- [ ] Railway PostgreSQL plugin attached; `DATABASE_URL` injected into web + worker services
- [ ] `DIRECT_URL` set to same value as `DATABASE_URL` (Prisma)
- [ ] Migrations applied: `pnpm db:migrate:deploy` (one-time or release command)
- [ ] No seed/mock data published as live offers in production

## Secrets & security

- [ ] `AWIN_ACCESS_TOKEN` and `AWIN_PUBLISHER_ID` set on **worker only** (and optional manual import), never `NEXT_PUBLIC_*`
- [ ] No affiliate credentials in client bundle (inspect Network tab — no Awin API calls from browser)
- [ ] No secrets committed to GitHub (`.env` in `.gitignore`)
- [ ] `MOCK_EXTERNAL=false` on production worker services

## Cron workers

- [ ] `myperkfinder-worker-awin-import` configured as **Cron** service (not always-on)
- [ ] Cron schedule: `0 */6 * * *` (every 6 hours) or your chosen interval
- [ ] Worker logs show JSON lines, job completes, process exits code 0
- [ ] `myperkfinder-worker-expire-offers` cron schedule: `0 3 * * *` (daily 03:00 UTC)
- [ ] Expire worker logs count of offers marked expired, exits cleanly

## Affiliate pipeline

- [ ] Import creates `ImportJob` rows (visible at `/admin/imports`)
- [ ] Raw records saved before normalization
- [ ] Low-confidence offers land in `needs_review` — not auto-published as `active`
- [ ] Admin review queue at `/admin/review` shows pending offers
- [ ] Approve / reject / mark expired actions work

## Click tracking & redirects

- [ ] “Go to Deal” links use `/api/r/{offerId}` (not raw affiliate URLs in HTML)
- [ ] Links include `rel="nofollow sponsored noopener noreferrer"` and `target="_blank"`
- [ ] Redirect returns 302 to merchant; click count increments in database
- [ ] Inactive/expired offers return 404/410 on redirect

## Content & compliance

- [ ] Affiliate disclosure visible on deal pages
- [ ] Privacy policy page live (add before launch if not yet present)
- [ ] Terms of service page live (add before launch if not yet present)
- [ ] No placeholder/mock offers shown on public site in production

## Cost controls

- [ ] Only **3 compute services** deployed: web + 2 cron workers
- [ ] **No** always-on `apps/api`, `apps/admin`, or `apps/worker` BullMQ service
- [ ] **No** Redis plugin unless you re-enable queue-based imports
- [ ] **No** Meilisearch Cloud — Postgres search via `/api/search`

## Post-deploy smoke test

```bash
curl -s https://myperkfinder.com/api/health | jq
curl -sI "https://myperkfinder.com/api/r/<active-offer-id>" | head -5
```

- [ ] Public homepage loads deals from database
- [ ] Admin `/admin` overview loads KPIs
