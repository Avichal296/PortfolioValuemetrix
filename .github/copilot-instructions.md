# Copilot instructions for ValueMetrix (repo-specific)

This file gives concise, actionable guidance so an AI coding agent can be productive immediately in this repository.

1) Big picture (what to edit and why)
- This is a Next.js 16 (App Router) full-stack app that serves both the UI and server code from `app/`.
- UI pages and server endpoints live together: add UI under `app/*` and server endpoints under `app/api/*` as `route.ts` files.
- Data flow: UI -> `app/api/*` route.ts handlers -> `lib/*` helpers (notably `lib/prisma.ts`, `lib/stock-api.ts`, `lib/openai.ts`) -> Prisma -> MongoDB.

2) Key files and where to look first
- `app/` — app router pages and API routes. Example server endpoints: `app/api/portfolios/route.ts`, `app/api/auth/[...nextauth]/route.ts`.
- `lib/auth.ts` — NextAuth configuration (credentials provider). When adjusting auth behaviour, update this file and the NextAuth API route.
- `lib/prisma.ts` — Prisma client wrapper used throughout the API layer.
- `lib/openai.ts` — AI prompt construction and JSON-output enforcement for portfolio insights and Q&A. Model choices and system prompt live here.
- `lib/stock-api.ts` — Provides mock prices by default and switches to Finnhub when `FINNHUB_API_KEY` is present.
- `prisma/schema.prisma` — DB schema. Prisma is configured for MongoDB here.
- `components/providers.tsx` — SessionProvider wiring for client components.

3) Developer workflows and commands (what an agent should run/expect)
- Install & generate Prisma client: `npm install` then `npx prisma generate` and `npx prisma db push` (README shows defaults).
- Dev server: `npm run dev` (runs `next dev`) — default localhost:3000.
- Build: `npm run build` then `npm start` (Next production server).
- Lint: `npm run lint` (uses `eslint`).
- DB: by default `.env` uses `mongodb://localhost:27017/valuemetrix`. If you change schema, run `npx prisma db push`.

4) Environment variables (important ones and defaults)
- `DATABASE_URL` — MongoDB connection string (default used in README: `mongodb://localhost:27017/valuemetrix`).
- `NEXTAUTH_URL` — app base URL (e.g. `http://localhost:3000`).
- `NEXTAUTH_SECRET` — required for NextAuth sessions.
- `OPENAI_API_KEY` — optional; if missing the app returns static fallback text for insights (see `lib/openai.ts`).
- `FINNHUB_API_KEY` — optional; when present `lib/stock-api.ts` calls Finnhub for prices.

5) Project-specific conventions and patterns
- App Router API routes use `route.ts` handlers (exported functions handling Request/Response). Follow the existing pattern in `app/api/*` for shape and error handling.
- Data access always goes through `lib/prisma.ts`. Reuse that client to avoid multiple client instances.
- AI endpoints expect and enforce a strict JSON output shape for insights: `summary`, `diversification`, `sectorExposure`, `riskLevel`, `thesis`. See `lib/openai.ts` and README prompt-design for exact expectations.
- Authentication uses NextAuth credentials plus `bcryptjs` for password hashing. See signup at `app/api/auth/signup/route.ts` and the auth config in `lib/auth.ts` for password flow.
- Share tokens are generated with `nanoid` and exposed at `/portfolio/share/[token]` (UI) and mirrored by API share routes under `app/api/portfolios/[id]/share/` and `app/api/portfolios/share/[token]/` for access and logs.

6) Integration points and external services
- MongoDB via Prisma (`prisma/schema.prisma`). Be careful: Mongo DB provider has different query semantics than SQL.
- OpenAI (`openai` SDK) is used for insights and a QA chatbot. `lib/openai.ts` contains system messages and output shaping—do not change the JSON output contract without updating UI consumers.
- Finnhub is optional for real prices; code falls back to mock prices (see `lib/stock-api.ts`).

7) Editing/adding APIs (how to keep consistency)
- Add a new API route as `app/api/<name>/route.ts` and follow existing patterns (try/catch, return JSON, reuse `lib/prisma.ts`, validate Request body). Example endpoints to mirror: `app/api/portfolios/route.ts` and `app/api/stocks/prices/route.ts`.
- Server-only logic should live in `app/api` or `lib/` (not in client components). Keep secrets in `.env`.

8) Quick debugging tips
- If a route fails, run the dev server (`npm run dev`) and inspect the terminal stack traces — Next dev prints server errors for `route.ts` handlers.
- If Prisma complains about models, run `npx prisma db push` and `npx prisma generate`. For schema edits, review `prisma/schema.prisma` first.
- For AI behaviour issues, check `lib/openai.ts` for system prompts and the fallback text used when `OPENAI_API_KEY` is missing.

9) What not to change lightly
- `lib/openai.ts`'s output contract (JSON shape) — UI components assume fields in a fixed shape.
- `lib/prisma.ts` client initialization — avoid creating multiple PrismaClients in serverless contexts.

10) Where to add tests / docs
- There are no tests yet. If you add tests, prefer a lightweight Jest or Vitest setup and place tests in a `__tests__` or `tests/` folder. Keep them focused on `lib/*` pure logic first (e.g., prompt formatting, stock price helpers).

If anything above is unclear or you want more examples (for example: a template `route.ts` file or the exact OpenAI system prompt), tell me which piece and I will iterate.
