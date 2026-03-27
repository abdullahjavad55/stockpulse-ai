# StockPulse AI — Deployment Guide

Everything deploys **100% free** using Render (Python backend) + Vercel (Next.js frontend).

---

## Architecture

```
Browser → Vercel (Next.js) → Render (FastAPI/Python)
```

---

## 1. Run Locally (5 minutes)

### 1a. Start the Python API

```bash
# From the project root (trading_agent/)
cd C:\Users\Abdullah\Documents\trading_agent

# Install dependencies
pip install -r requirements.txt

# Download NLTK data (first time only)
python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('stopwords'); nltk.download('punkt')"

# Start the API server
python api_server.py
# → running at http://localhost:8000
# → Swagger docs at http://localhost:8000/docs
```

### 1b. Start the Next.js Frontend

```bash
# Open a second terminal
cd C:\Users\Abdullah\Documents\trading_agent\frontend

# Copy env file
cp .env.local.example .env.local
# .env.local already has: NEXT_PUBLIC_API_URL=http://localhost:8000

# Install Node dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000
```

---

## 2. Deploy Backend to Render (Free)

### Step 1 — Push to GitHub

```bash
cd C:\Users\Abdullah\Documents\trading_agent
git init
git add .
git commit -m "Initial commit"
# Create a new GitHub repo and push:
git remote add origin https://github.com/YOUR_USERNAME/trading-agent.git
git push -u origin main
```

### Step 2 — Create a Render Web Service

1. Go to **https://render.com** → Sign up / Log in (free)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` — confirm the settings:
   - **Name:** `trading-analysis-api`
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt && python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('stopwords'); nltk.download('punkt')"`
   - **Start Command:** `uvicorn api_server:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
5. (Optional) Add environment variables:
   - `NEWS_API_KEY` — get free at https://newsapi.org
   - `FINNHUB_API_KEY` — get free at https://finnhub.io
6. Click **Create Web Service**

Render will build and deploy. Note the URL:
```
https://trading-analysis-api.onrender.com
```

> ⚠️ Free tier **spins down after 15 min of inactivity**. First request after sleep takes ~30s.
> The cached results mean subsequent requests are instant.

---

## 3. Deploy Frontend to Vercel (Free)

### Step 1 — Deploy with Vercel

```bash
cd C:\Users\Abdullah\Documents\trading_agent\frontend

# Option A: Vercel CLI
npm i -g vercel
vercel

# Option B: Vercel dashboard
# → https://vercel.com → New Project → Import from GitHub
# → Set root directory to: frontend/
```

### Step 2 — Set Environment Variable

In the Vercel dashboard → Your project → **Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://trading-analysis-api.onrender.com` |

Then click **Redeploy**.

Your app is live at:
```
https://stockpulse-ai.vercel.app   (or your custom domain)
```

---

## 4. Environment Variables Reference

### Backend (.env in project root)

| Variable | Default | Description |
|---|---|---|
| `NEWS_API_KEY` | `""` | Optional — newsapi.org free key |
| `FINNHUB_API_KEY` | `""` | Optional — finnhub.io free key |
| `RISK_FREE_RATE` | `0.05` | Sharpe ratio risk-free rate |

### Frontend (.env.local in frontend/)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | FastAPI backend URL |

---

## 5. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/tickers` | GET | NASDAQ universe list |
| `/analyze` | POST | Analyze one ticker |
| `/scan` | GET | Scan top NASDAQ picks |
| `/docs` | GET | Swagger UI |

**POST /analyze body:**
```json
{
  "ticker": "AAPL",
  "strategy": "short_term"
}
```

**GET /scan params:**
- `strategy` = `short_term` | `long_term` | `both` (default: `both`)
- `limit` = 1–10 (default: 5)

---

## 6. Performance Notes

- Analysis results are **cached in-memory for 1 hour** — repeated calls are instant
- The `/scan` endpoint scans 20 stocks; first run takes ~30–60 s
- After the first scan, subsequent requests return cached data immediately
- Render free tier sleeps after 15 min; use UptimeRobot (free) to keep it warm:
  - https://uptimerobot.com → New Monitor → HTTP → URL: `https://YOUR-APP.onrender.com/health` → Every 14 min

---

## 7. Optional: Get Free API Keys (Improves News Quality)

Without API keys, news falls back to Yahoo Finance (always works).
With keys, you get more recent and comprehensive news:

1. **NewsAPI** (free, 100 req/day): https://newsapi.org/register
2. **Finnhub** (free, 60 req/min): https://finnhub.io/register

Add both to Render environment variables after signup.

---

## 8. Project Structure (after build)

```
trading_agent/
├── api_server.py           ← FastAPI backend (NEW)
├── config.py               ← All configuration
├── requirements.txt        ← Python deps (updated)
├── Procfile                ← Render process config
├── render.yaml             ← Render deploy config
├── analysis/               ← Technical + quant analysis
├── data/                   ← Data fetchers
├── decision_engine/        ← Core scoring engine
├── scanner/                ← NASDAQ batch scanner
├── sentiment/              ← News sentiment
└── frontend/               ← Next.js SaaS app (NEW)
    ├── app/
    │   ├── layout.tsx      ← Root layout + navbar + footer
    │   ├── page.tsx        ← Landing page
    │   └── dashboard/
    │       └── page.tsx    ← Main dashboard
    ├── components/
    │   ├── Navbar.tsx
    │   ├── ResultCard.tsx  ← Full analysis display
    │   ├── ScannerResults.tsx
    │   ├── PriceChart.tsx
    │   ├── ScoreGauge.tsx
    │   └── LoadingState.tsx
    └── lib/
        ├── api.ts          ← Typed API client
        └── utils.ts        ← Helpers
```

---

> ⚠️ **Disclaimer:** StockPulse AI provides data-driven insights and **not financial advice**.
> Always conduct your own research and consult a qualified financial advisor before investing.
