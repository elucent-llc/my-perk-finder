# Legacy Fastify API — not deployed to Railway

Production API routes live in **`apps/web`** as Next.js Route Handlers:

- `/api/deals`, `/api/search`, `/api/health`
- `/api/admin/*`, `/api/r/[offerId]`

This app remains for local full-stack development with `pnpm dev:all` only.

**Railway:** deploy `apps/web` (`myperkfinder-web`), not this service.
