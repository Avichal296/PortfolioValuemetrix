# ValueMetrix — Smart Shareable Portfolio

Full-stack "Smart Shareable Portfolio" feature: create portfolios, AI-generated insights, and share via secure links. Recipients view breakdown, sector/risk, and Q&A **without signing up**.

## Tech stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, TypeScript
- **ORM:** Prisma
- **DB:** MongoDB
- **Auth:** NextAuth.js (credentials)
- **Gen AI:** OpenAI (GPT-4o-mini)
- **Stock data:** Mock prices by default; optional [Finnhub](https://finnhub.io) API

## Project structure

```
valuemetrix-portfolio/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth
│   │   ├── auth/signup/          # Signup
│   │   ├── portfolios/           # CRUD, share, insights
│   │   └── stocks/prices/        # Stock prices (mock / Finnhub)
│   ├── dashboard/                # My portfolios
│   ├── login/                    # Login
│   ├── signup/                   # Signup
│   ├── portfolio/
│   │   ├── new/                  # Create portfolio
│   │   ├── [id]/                 # My portfolio (owner)
│   │   ├── [id]/edit/            # Edit portfolio
│   │   └── share/[token]/        # Shared view (no auth)
│   ├── layout.tsx
│   └── page.tsx                  # Landing
├── components/
│   ├── navbar.tsx
│   ├── portfolio-form.tsx
│   └── providers.tsx             # SessionProvider
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── openai.ts                 # Insights + Q&A
│   ├── prisma.ts
│   ├── stock-api.ts              # Mock / Finnhub
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── types/
    └── next-auth.d.ts
```

## How to run locally

1. **MongoDB**  
   Start local MongoDB (e.g. `mongodb://localhost:27017/valuemetrix`) or use Atlas.  
   `.env` already uses `mongodb://localhost:27017/valuemetrix` by default.

2. **Env**  
   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — MongoDB connection string (default: `mongodb://localhost:27017/valuemetrix`)  
   - `NEXTAUTH_URL` — e.g. `http://localhost:3000`  
   - `NEXTAUTH_SECRET` — random string (e.g. `openssl rand -base64 32`)  
   - `OPENAI_API_KEY` — for AI insights and Q&A (optional; fallback text if missing)  
   - `FINNHUB_API_KEY` — optional; omit for mock prices  

3. **Install and DB**

   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

   If `bcryptjs` is missing, run `npm install bcryptjs @types/bcryptjs`.

4. **Dev**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. **Build / start**

   ```bash
   npm run build
   npm start
   ```

## Prompt design (AI insights)

- **System prompt:** Financial assistant for ValueMetrix; output **only** valid JSON.
- **Output shape:** `summary`, `diversification`, `sectorExposure`, `riskLevel` (LOW/MEDIUM/HIGH), `thesis` (one-liner).
- **User message:** JSON of portfolio (title, holdings, cash, current prices, equity total, total value).
- **Model:** `gpt-4o-mini`, `temperature` 0.3.
- **Fallback:** If no `OPENAI_API_KEY` or API error, return static placeholder text.

Q&A uses the same model with a system message that includes the portfolio context and instructs brief, context-only answers.

## Features

- **Portfolio CRUD:** Title, privacy (Private / Public / Smart Shared), cash, holdings (ticker, qty, buy price).
- **Share link:** Generate `/portfolio/share/[token]` (nanoid). Copy, revoke. No login required to view.
- **Shared view:** Breakdown, AI insights, Q&A chatbot. Logs view (optional `TokenAccessLog`).
- **Stock prices:** Mock by default; Finnhub when `FINNHUB_API_KEY` is set.

## Limitations

- **Stock API:** Mock data or Finnhub free tier; Indian tickers best with mock. No real-time streaming.
- **Viewer persistence:** `TokenAccessLog` stores views; “if viewer logs in later, associate access” is not implemented.
- **Cron:** No serverless cron to regenerate insights weekly.

## What I’d build next

- Associate shared access with user on login (e.g. `SharedPortfolioAccess` + fingerprint/session).
- Serverless cron (e.g. Vercel) to refresh insights weekly.
- Usage analytics dashboard (view counts per token, top portfolios).
- Optional real-time prices (e.g. WebSocket or polling) and export (CSV/PDF).

## Deploy (Vercel)

1. Push to GitHub, import in Vercel.
2. Set env vars (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`, etc.).
3. Deploy. Ensure `NEXTAUTH_URL` matches the deployed URL.
