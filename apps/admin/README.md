# Legacy Admin App — not deployed to Railway

Production admin UI lives in **`apps/web`** under `/admin/*`:

- `/admin` — overview
- `/admin/review` — review queue
- `/admin/offers`, `/admin/imports`

This standalone Next.js app remains for local comparison/dev with `pnpm dev:all` only.

**Railway:** deploy `apps/web` (`myperkfinder-web`), not this service.
