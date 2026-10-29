# INTRIX site

Landing page for the INTRIX Roblox studio. Remix 3 + TypeScript + MongoDB Atlas, deployed on Railway with Cloudflare for the domain.

- `npm run dev` start locally (reads `.env` if present)
- `npm test` run tests
- `npm run typecheck` TypeScript check
- `npm start` production mode (what Railway runs)

Needs Node 24.3 or newer. Setup and deploy steps are in [DEPLOY.md](DEPLOY.md).

## Layout

- `app/actions/home-page.tsx` the landing page
- `app/actions/controller.tsx` routes: `/`, `/health`, `POST /contact`
- `app/data/mongo.ts` MongoDB connection and the `messages` collection
- `app/config.ts` environment variables (fails fast in production if `MONGODB_URI` is missing)
- `app/ui/logo.tsx` INTRIX wordmark and X symbol
