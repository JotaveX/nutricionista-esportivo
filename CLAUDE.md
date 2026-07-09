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

[backend/src/database.ts](backend/src/database.ts) creates a singleton `pg.Pool` against `process.env.neon_DATABASE_URL` (note the lowercase `neon_` prefix — it is intentional and must match `.env`). SSL uses `rejectUnauthorized: false` because Neon's cert is not in Node's trust store on the host. On module load it runs `CREATE TABLE IF NOT EXISTS clicks (...)` — schema is owned by the app, not by migrations — and then a one-off `DELETE FROM clicks WHERE timestamp < NOW() - INTERVAL '180 days'` (data-retention purge, runs once per cold start; see LGPD note below).

[backend/src/validApiKey.ts](backend/src/validApiKey.ts) is a middleware that checks the `x-api-key` header (timing-safe compare) against `process.env.API_KEY`. It's applied only to the two read endpoints below, **not** to `POST /api/click` — that route stays public because it's called by anonymous site visitors who can't hold a secret.

[backend/src/routes.ts](backend/src/routes.ts) exposes three endpoints:

- `POST /api/click` — rate-limited (20 req/min per IP via `express-rate-limit`), reads the client IP from `req.ip` (see trust proxy note above), looks up geo via [GeoLocationService](backend/src/geoLocation.ts), and inserts a row with the IP **truncated** via [ipUtils.ts](backend/src/ipUtils.ts) (last IPv4 octet / last 80 IPv6 bits zeroed — country/city already cover the analytics use case, so the untruncated IP isn't retained). Public, no API key required.
- `GET /api/clicks` — last 100 rows, pt-BR formatted. Requires `x-api-key` (exposes visitor IPs + geolocation).
- `GET /api/clicks/stats` — aggregates (totals, top countries/cities, 7-day breakdown). Requires `x-api-key`.

[backend/src/geoLocation.ts](backend/src/geoLocation.ts) prefers Vercel's own edge-injected geolocation headers (`x-vercel-ip-country`, `x-vercel-ip-city`, `x-vercel-ip-latitude`, `x-vercel-ip-longitude` — see `GeoLocationService.fromVercelHeaders`) over an external call: no extra round-trip, and the visitor's IP isn't shared with another third party. These headers only exist on requests that actually pass through Vercel's network, so `routes.ts` falls back to `GeoLocationService.getLocationByIp`, which calls the free `ipwho.is` service (HTTPS, no key — chosen over `ip-api.com` because ip-api's free tier is HTTP-only), whenever they're absent (e.g. local `npm run dev`). Both paths still bottom out at city-level accuracy — IP-derived geolocation has no path to street-level precision, only browser Geolocation API (`navigator.geolocation`) does, and that requires an explicit per-visit permission prompt plus a much heavier LGPD justification, so it isn't used here. Localhost IPs (`::1`, `127.0.0.1`) short-circuit to a `Localhost / Desenvolvimento` stub, which the stats query then filters out — keep that filter in sync if the stub strings change.

### Timestamp handling (non-obvious)

`routes.ts` deliberately formats `new Date()` into an ISO-shaped string **without** timezone conversion and inserts it as a `TIMESTAMP` (no tz). The intent is to store BRT-as-local on a server that runs UTC. If you change this, also update the read path in `GET /api/clicks` which assumes the stored value is already in display-local time.

### LGPD posture (non-obvious)

The click tracker stores personal data (IP, geolocation) from anonymous site visitors, so three mitigations exist to keep this defensible under LGPD: (1) IP truncation before insert (`ipUtils.ts`, art. 6º III — minimização), (2) the 180-day purge in `database.ts` (art. 15/16 — eliminação), (3) the transparency note in the footer of [frontend/index.html](frontend/index.html) (art. 9º/6º VI). None of this is a formal legal basis analysis or a substitute for a real privacy policy — if the business grows beyond a single-nutritionist landing page, get an actual LGPD review.

## Frontend notes

Plain HTML + Tailwind via CDN. JS files in `frontend/src/` are loaded as classic scripts (no bundler):

- `tailwindInit.js` — Tailwind config (custom colors, fonts).
- `clickTracker.js` — WhatsApp click → POST `/api/click`. **The `API_URL` constant is hardcoded** to the Vercel backend URL (`nutricionista-esportivo-5u2i.vercel.app/api`); update it when moving environments.
- `carrousel.js`, `faqButton.js`, `scroll-animation.js`, `lucidIcons.js` — UI behavior.
- Footer contains a short LGPD transparency note about the click-tracking data collection (see backend LGPD posture above) — keep it in sync if the tracked fields change.

## Environment variables (backend/.env)

- `neon_DATABASE_URL` — Neon Postgres connection string (lowercase `neon_`).
- `ALLOWED_ORIGIN` — primary CORS origin; localhost variants are always allowed.
- `PORT` — defaults to 3000.
- `API_KEY` — secret required in the `x-api-key` header to call `GET /api/clicks` and `GET /api/clicks/stats`.