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

- [ ] `myperkfinder-worker-awin-import` — **Cron** service, schedule `0 */6 * * *`
- [ ] `myperkfinder-worker-expire-offers` — **Cron** service, schedule `0 3 * * *`
- [ ] Worker logs show JSON lines, process exits code 0
- [ ] ImportJob rows visible at `/admin/imports`

## Affiliate pipeline

- [ ] One `RawRecord` per normalized offer (not duplicate page payloads unless `DEBUG_RAW_PAGES=true`)
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
- [ ] **No** `apps/api`, `apps/admin`, always-on BullMQ worker, Redis, or Meilisearch in prod

## Post-deploy smoke test

```bash
curl -s https://myperkfinder.com/api/health | jq
curl -sI "https://myperkfinder.com/api/r/<active-offer-id>" | head -8
```

- [ ] Public homepage loads DB-backed deals and merchants
- [ ] Admin `/admin` loads after login
