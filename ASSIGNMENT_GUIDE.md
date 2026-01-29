# ValueMetrix Assignment — Simple Guide (Hinglish)

## Assignment kya bol raha hai, ek line me?

**ValueMetrix** = retail investors ke liye research platform (AI + stock data).

**Tum banaoge** = "Smart Shareable Portfolio" — user apna portfolio banayega (stocks + cash), ek **share link** milega. Jo bhi link kholega, bina login ke **portfolio + AI insights + sector/risk** dekhega. Creator ke liye auth, viewer ke liye nahi.

---

## Website me kaun‑kaun se PAGES honge?

### 1. **Landing / Home** (`/`)

- **Kaun aata hai:** Sab (logged in / guest)
- **Kya dikhega:**
  - "ValueMetrix — Smart Shareable Portfolio" jaisa hero
  - Short description: portfolio banao, link share karo, AI insights dekho
  - CTA: "Get Started" / "Login" → `/login` ya `/dashboard`
  - Agar user logged in hai → "Dashboard" / "My Portfolios" link

**Simple:** Marketing-style landing. Zyada complex mat karo; focus portfolio + share pe.

---

### 2. **Auth — Login / Signup** (`/login`, `/signup` ya `/auth/[...nextauth]`)

- **Kaun aata hai:** Jo portfolio **create** karenge (creators)
- **Kya karna hai:**
  - NextAuth se email/password (ya Google) login
  - Signup → user create → redirect `/dashboard`
  - Login → redirect `/dashboard`

**Note:** Viewer ko login **nahi** chahiye. Sirf creator ke liye auth.

---

### 3. **Dashboard** (`/dashboard`)

- **Kaun aata hai:** Sirf **logged-in** users (creator)
- **Kya dikhega:**
  - "My Portfolios" list
  - Har portfolio: title, privacy (Private / Public / Smart Shared), "View" / "Edit" / "Share" buttons
  - **"Create new portfolio"** button → `/portfolio/new`
- **Kya karna hai:**
  - API se user ke portfolios fetch karke list dikhana
  - Click "Create" → `/portfolio/new`
  - Click "View" → `/portfolio/[id]` (apna portfolio)
  - Click "Share" (agar Smart Shared) → share link copy / show

**Flow:** Creator yahan se sab manage karta hai.

---

### 4. **Create / Edit Portfolio** (`/portfolio/new`, `/portfolio/[id]/edit`)

- **Kaun aata hai:** Logged-in user only
- **Kya dikhega:**
  - **Portfolio title** (input)
  - **Privacy:** dropdown — `Private` | `Public` | `Smart Shared`
  - **Holdings table:**
    - Ticker (e.g. INFY, RELIANCE)
    - Quantity
    - Buy price (optional but useful)
  - **Add holding** button — nayi row add
  - **Cash** field (assignment me "cash" bhi hai)
  - **Save** button
- **Kya karna hai:**
  - Form submit → portfolio + holdings + cash save (API route + Prisma)
  - Edit pe same form, pre-filled data se

**Database:** Portfolio model me `cash` add karna hoga; Holdings alag table me (tumhare schema me hai).

---

### 5. **My Portfolio (Creator view)** (`/portfolio/[id]`)

- **Kab use hota hai:** Jab creator **apna** portfolio dekh raha ho (logged in, owner)
- **Kya dikhega:**
  - Portfolio breakdown (holdings + current price + value, stock API se)
  - **AI-generated insights:**
    - Portfolio summary
    - Diversification analysis
    - Sector-wise exposure
    - One-liner investment thesis
  - **"Share"** button (agar Smart Shared) — link copy
  - Option: "Edit" → `/portfolio/[id]/edit`

**Flow:** Creator yahan apna portfolio + AI analysis dekhta hai, share link nikalta hai.

---

### 6. **Shared Portfolio (Public link)** — **YE SABSE IMPORTANT PAGE**  
**Route:** `/portfolio/share/[token]` ya `/s/[token]` (assignment `/portfolio/[token]` bhi likha hai; consistent rakhna)

- **Kaun aata hai:** **Koi bhi** — bina login ke. Link pe click kiya, yahi page khulega.
- **Kya dikhega:**
  - **Same as creator view** (breakdown + AI insights) but **read-only**
  - Portfolio breakdown (holdings, quantities, current prices, totals)
  - Sector/risk analysis
  - AI summary + one-liner thesis
  - **(Bonus)** "Ask a question" / chatbot — "What’s the largest holding?", "What’s the risk level?" etc.
- **Kya karna hai:**
  - `token` se portfolio dhundho (DB: token → portfolio mapping)
  - Agar token invalid/revoked → 404 ya "Link expired"
  - Viewer ko login **nahi** chahiye
  - **(Bonus)** Anonymous viewer track karna (fingerprint / IP) — baad me agar login kare to "access persist" kar sakte ho

**Flow:**  
Creator ne link share kiya → koi open karta hai → yahi page. No signup, no login.

---

### 7. **Share link generate / Copy** (modal ya dedicated small page)

- **Kab:** Dashboard ya "My Portfolio" pe "Share" click
- **Kya dikhega:**
  - Full URL, e.g. `https://yoursite.com/portfolio/share/abc123xyz`
  - **Copy** button
  - Optional: "Revoke access" (bonus)

**Flow:** Creator link copy karke WhatsApp/email me bhejta hai.

---

## Recap — Page-wise quick reference

| Page | Route | Who | Main content |
|------|--------|-----|----------------|
| Home | `/` | All | Landing, CTA to Login/Dashboard |
| Login/Signup | `/login`, `/signup` | Creators | Auth forms |
| Dashboard | `/dashboard` | Logged-in | List portfolios, Create, View, Share |
| New portfolio | `/portfolio/new` | Logged-in | Form: title, privacy, holdings, cash |
| Edit portfolio | `/portfolio/[id]/edit` | Logged-in, owner | Same form, edit |
| My portfolio | `/portfolio/[id]` | Logged-in, owner | Breakdown + AI insights + Share |
| **Shared view** | `/portfolio/share/[token]` | **Anyone** (no login) | Same insights, read-only |

---

## Assignment requirements — page se map

| Requirement | Kahan implement |
|------------|------------------|
| Create portfolio (tickers, quantities, cash) | `/portfolio/new`, `/portfolio/[id]/edit` |
| Privacy: Private / Public / Smart Shared | Same forms; `Portfolio.privacy` |
| Share link generate | Dashboard / My Portfolio → Share → copy `/portfolio/share/[token]` |
| Viewer bina login dekhe | `/portfolio/share/[token]` — no auth check |
| Portfolio breakdown | My portfolio + Shared view — holdings table + totals |
| AI insights (summary, diversification, sector, thesis) | Dono views me; OpenAI API call, results dikhao |
| Real-time / updated prices | Free stock API (TwelveData/Finnhub/mock); refresh pe recalc |
| Secure token (UUID/nanoid) | `shareToken` in DB; token se portfolio lookup |
| **(Bonus)** Revoke access | Share modal / dashboard — token invalidate |
| **(Bonus)** View analytics | `TokenAccessLog` — count viewers |
| **(Bonus)** Q&A chatbot | Shared (or creator) view me chat UI → GPT API |

---

## Tech flow (simple)

1. **DB (Prisma + MongoDB):**  
   `User`, `Portfolio`, `Holding`. Optional: `SharedPortfolioAccess`, `TokenAccessLog` (bonus).
2. **Auth:** NextAuth. Sirf `/dashboard`, `/portfolio/new`, `/portfolio/[id]/edit`, `/portfolio/[id]` (owner) protect karo.  
   `/portfolio/share/[token]` **mat** protect karo.
3. **APIs:**  
   - Portfolio CRUD (create, update, list, get by id).  
   - Get by token: `GET /api/portfolio/share/[token]` → portfolio + holdings.  
   - Insights: `POST /api/portfolio/[id]/insights` (ya share ke liye token-based) → OpenAI → return JSON.
4. **Stock prices:**  
   TwelveData / Finnhub / mock API → fetch prices → holdings me "current value" dikhao.  
   Refresh pe dubara fetch + insights optionally refresh.
5. **Token:**  
   Portfolio create/edit pe "Smart Shared" choose kare to `shareToken` = `nanoid()` generate karke save.  
   Share link = `baseUrl + /portfolio/share/` + `shareToken`.

---

## Kaun sa page pe kya "click" karta hai (UX flow)

- **Home** → "Get Started" / "Login" → **Login** → **Dashboard**  
- **Dashboard** → "Create portfolio" → **New portfolio** form → Save → **My portfolio** (`/portfolio/[id]`)  
- **Dashboard** → "View" on a card → **My portfolio**  
- **Dashboard** / **My portfolio** → "Share" → modal: link **Copy** → link share karo  
- **Koi aur** link kholta hai → **Shared portfolio** (`/portfolio/share/[token]`) — koi click for login nahi  

So: **create, edit, share** = logged-in flows. **Dekhna (shared)** = sirf link, no login.

---

## Limitations + Next steps (README me likhna)

- Stock API rate limits, mock use kar sakte ho agar free tier kam ho.
- "Real-time" = refresh pe update; websockets optional.
- Viewer persistence (fingerprint / IP) optional; bonus me kar sakte ho.

README me ye bhi likhna: project structure, `npm install`, `npx prisma generate`, `npm run dev`, env vars (DB, NextAuth, OpenAI, stock API), prompt design (AI insights ka system prompt), limitations, aur "what I’d build next".

---

## Summary

- **Landing** → Login → **Dashboard** → **Create/Edit portfolio** (holdings + cash + privacy) → **My portfolio** (breakdown + AI insights) → **Share** (link copy).  
- **Shared link** → **Shared portfolio** page (same insights, no login).  
- AI insights = OpenAI; prices = stock API; token = nanoid, `/portfolio/share/[token]`.

Is structure ko follow karke tum page-by-page implement kar sakte ho. Agar chaho to next step me we can add `cash` in schema, create `SharedPortfolioAccess` / `TokenAccessLog` models, and set up the routes (dashboard, portfolio CRUD, share by token) in your Next.js app.
