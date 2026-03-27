"""
config.py - Central configuration for the NASDAQ Trading Analysis Tool.

All tunable parameters, API keys, and stock lists live here so that
nothing is hardcoded in the business-logic modules.
"""

import os
from dotenv import load_dotenv

# Load optional .env file (silently skipped if not present)
load_dotenv()

# ── API Keys (all optional; the tool degrades gracefully without them) ────────
NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
FINNHUB_API_KEY: str = os.getenv("FINNHUB_API_KEY", "")

# ── Financial Constants ───────────────────────────────────────────────────────
RISK_FREE_RATE: float = float(os.getenv("RISK_FREE_RATE", "0.05"))  # annualised
TRADING_DAYS_PER_YEAR: int = 252

# ── Data Fetch Settings ───────────────────────────────────────────────────────
# yfinance period strings: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
PRICE_HISTORY_PERIOD: str = "1y"      # used for technical / quant calculations
LONG_TERM_PERIOD: str = "2y"          # used for long-term trend detection
SHORT_TERM_PERIOD: str = "3mo"        # used for short-term momentum
MAX_NEWS_ARTICLES: int = 15           # per-ticker cap

# ── Scoring Weights ───────────────────────────────────────────────────────────
# Each strategy allocates 100 % across the three pillars.
WEIGHTS = {
    "short_term": {
        "technical": 0.50,
        "quant":     0.20,
        "sentiment": 0.30,
    },
    "long_term": {
        "technical": 0.30,
        "quant":     0.45,
        "sentiment": 0.25,
    },
}

# ── Recommendation Thresholds (final score 0–100) ────────────────────────────
THRESHOLDS = {
    "strong_buy":  70,
    "buy":         58,
    "hold":        42,
    "sell":        30,
    # anything below 30 → Strong Sell
}

# ── Technical Indicator Parameters ───────────────────────────────────────────
SMA_SHORT   = 20
SMA_MEDIUM  = 50
SMA_LONG    = 200
EMA_SHORT   = 12
EMA_LONG    = 26
RSI_PERIOD  = 14
MACD_SIGNAL = 9
BB_PERIOD   = 20
BB_STD      = 2.0

# ── NASDAQ Universe to scan ───────────────────────────────────────────────────
# Curated list of large-/mid-cap NASDAQ-listed equities.
# Adjust freely - no tickers are ever hardcoded as picks.
NASDAQ_UNIVERSE = [
    # Mega-cap tech
    "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA", "AVGO",
    # Consumer / Media
    "NFLX", "COST", "SBUX", "CMCSA", "EBAY", "ABNB", "PYPL",
    # Semiconductors
    "AMD", "QCOM", "INTC", "TXN", "MU", "LRCX", "AMAT", "ADI", "KLAC",
    "MRVL", "NXPI", "MCHP", "ON",
    # Software / Cloud
    "ADBE", "INTU", "CSCO", "CRM", "NOW", "WDAY", "DDOG", "CRWD",
    "PANW", "FTNT", "ZS", "SNPS", "CDNS", "ANSS", "SPLK", "TEAM",
    # Biotech / Healthcare
    "AMGN", "GILD", "VRTX", "REGN", "BIIB", "ISRG", "IDXX", "DXCM",
    "MRNA", "ILMN",
    # Industrials / Other NASDAQ
    "ADP", "CTAS", "PAYX", "ORLY", "ROST", "FAST", "CPRT", "ODFL",
    "PCAR", "VRSK", "MNST", "MDLZ",
    # Growth / Fintech
    "COIN", "HOOD", "SOFI", "PLTR", "RBLX", "SNOW", "NET", "APP",
    # International ADRs listed on NASDAQ
    "MELI", "BIDU",
]

# ── Scanner Output Settings ───────────────────────────────────────────────────
TOP_N_SHORT_TERM: int = 5
TOP_N_LONG_TERM:  int = 5
