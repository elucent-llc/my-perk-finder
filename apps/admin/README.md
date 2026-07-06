# Legacy Admin App — not deployed to Railway

Production admin UI lives in **`apps/web`** under `/admin/*`:

- `/admin` — overview
- `/admin/review` — review queue
- `/admin/offers`, `/admin/imports`

This standalone Next.js app remains for local comparison/dev with `pnpm dev:all` only.

**Railway:** deploy the **web service at repo root** with config `apps/web/railway.json` — not this legacy app as Root Directory.
