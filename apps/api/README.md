# Legacy Fastify API — not deployed to Railway

Production API routes live in **`apps/web`** as Next.js Route Handlers:

- `/api/deals`, `/api/search`, `/api/health`
- `/api/admin/*`, `/api/r/[offerId]`

This app remains for local full-stack development with `pnpm dev:all` only.

**Railway:** deploy the **web service at repo root** with config `apps/web/railway.json` — not this legacy app as Root Directory.
