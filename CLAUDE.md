# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Landing page for a sports nutritionist (Diogo). Two independent deployments:

- **frontend/** — static HTML/CSS/JS site, deployed to Vercel (`nutricionista-esportivo.vercel.app`).
- **backend/** — Express + TypeScript API, deployed to Vercel as a Serverless Function (`nutricionista-esportivo-5u2i.vercel.app`), backed by a Neon Postgres database. Its only purpose is to track WhatsApp CTA clicks with geolocation. (A legacy deploy on Render was retired in 2026-05; if you see references to `nutricionista-esportivo.onrender.com`, they are stale.)

The two halves are loosely coupled: the frontend calls the backend's `/api/click` endpoint when a visitor clicks any `a[href^="https://wa.me"]` link (see [frontend/src/clickTracker.js](frontend/src/clickTracker.js)). Everything else on the page is static.

## Commands

All backend commands run from `backend/`:

```bash
npm install
npm run dev       # nodemon + ts-node, watches src/
npm run build     # tsc → dist/
npm start         # node dist/index.js (production)
```

Frontend has no build step — open `frontend/index.html` directly or serve with `npx serve frontend/`. Tailwind is loaded from the CDN (`cdn.tailwindcss.com`), Lucide icons from unpkg. There is no `package.json` in `frontend/`.

There is no test suite and no linter configured.

## Backend architecture

Entry point [backend/src/index.ts](backend/src/index.ts) wires Express, sets `trust proxy` to `1` (Vercel adds exactly one proxy hop, so this makes `req.ip` resolve the real client IP from `x-forwarded-for` instead of trusting a client-suppliable header verbatim), configures CORS (allow-list driven by `ALLOWED_ORIGIN` env var plus localhost variants), and mounts the click router at `/api`.

[backend/src/database.ts](backend/src/database.ts) creates a singleton `pg.Pool` against `process.env.neon_DATABASE_URL` (note the lowercase `neon_` prefix — it is intentional and must match `.env`). SSL uses `rejectUnauthorized: false` because Neon's cert is not in Node's trust store on the host. On module load it runs `CREATE TABLE IF NOT EXISTS clicks (...)` — schema is owned by the app, not by migrations.

[backend/src/validApiKey.ts](backend/src/validApiKey.ts) is a middleware that checks the `x-api-key` header (timing-safe compare) against `process.env.API_KEY`. It's applied only to the two read endpoints below, **not** to `POST /api/click` — that route stays public because it's called by anonymous site visitors who can't hold a secret.

[backend/src/routes.ts](backend/src/routes.ts) exposes three endpoints:

- `POST /api/click` — rate-limited (20 req/min per IP via `express-rate-limit`), reads the client IP from `req.ip` (see trust proxy note above), looks up geo via [GeoLocationService](backend/src/geoLocation.ts), and inserts a row. Public, no API key required.
- `GET /api/clicks` — last 100 rows, pt-BR formatted. Requires `x-api-key` (exposes visitor IPs + geolocation).
- `GET /api/clicks/stats` — aggregates (totals, top countries/cities, 7-day breakdown). Requires `x-api-key`.

[backend/src/geoLocation.ts](backend/src/geoLocation.ts) calls the free `ipwho.is` service (HTTPS, no key) — chosen over `ip-api.com` because ip-api's free tier is HTTP-only (confirmed: HTTPS returns 403 without a paid key), which would leak the visitor's IP in plaintext. Localhost IPs (`::1`, `127.0.0.1`) short-circuit to a `Localhost / Desenvolvimento` stub, which the stats query then filters out — keep that filter in sync if the stub strings change.

### Timestamp handling (non-obvious)

`routes.ts` deliberately formats `new Date()` into an ISO-shaped string **without** timezone conversion and inserts it as a `TIMESTAMP` (no tz). The intent is to store BRT-as-local on a server that runs UTC. If you change this, also update the read path in `GET /api/clicks` which assumes the stored value is already in display-local time.

## Frontend notes

Plain HTML + Tailwind via CDN. JS files in `frontend/src/` are loaded as classic scripts (no bundler):

- `tailwindInit.js` — Tailwind config (custom colors, fonts).
- `clickTracker.js` — WhatsApp click → POST `/api/click`. **The `API_URL` constant is hardcoded** to the Vercel backend URL (`nutricionista-esportivo-5u2i.vercel.app/api`); update it when moving environments.
- `carrousel.js`, `faqButton.js`, `scroll-animation.js`, `lucidIcons.js` — UI behavior.

## Environment variables (backend/.env)

- `neon_DATABASE_URL` — Neon Postgres connection string (lowercase `neon_`).
- `ALLOWED_ORIGIN` — primary CORS origin; localhost variants are always allowed.
- `PORT` — defaults to 3000.
- `API_KEY` — secret required in the `x-api-key` header to call `GET /api/clicks` and `GET /api/clicks/stats`.