"""
api_server.py - FastAPI backend for the Trading Analysis SaaS.

Endpoints:
  GET  /health              - liveness probe
  POST /analyze             - single-ticker analysis
  GET  /scan                - scan top NASDAQ picks
  GET  /tickers             - return the curated NASDAQ universe

Results are cached in-memory with a 1-hour TTL so repeated calls
are instant without hitting external APIs again.
"""

import logging
import math
import os
import sys
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
import yfinance as yf
from cachetools import TTLCache
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Ensure project root is on the path ────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

import config
from data.fetcher import StockDataFetcher
from decision_engine.engine import DecisionEngine, StockResult
from scanner.nasdaq_scanner import NasdaqScanner

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Trading Analysis API", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Shared singletons ─────────────────────────────────────────────────────────
_engine  = DecisionEngine()
_scanner = NasdaqScanner()
_fetcher = StockDataFetcher()

# In-memory result cache  (max 200 entries, 1-hour TTL)
_cache      = TTLCache(maxsize=200, ttl=3_600)
_cache_lock = threading.Lock()

# Reduced ticker list for the scan endpoint (keeps response under ~60 s)
SCAN_UNIVERSE = [
    "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA",
    "AMD",  "AVGO", "NFLX", "COST", "QCOM", "ADBE", "CRM",
    "CRWD", "PANW", "NOW",  "INTU", "AMGN", "COIN",
]


# ── Serialisation helpers ─────────────────────────────────────────────────────

def _safe_float(val: Any) -> Optional[float]:
    """Return a JSON-safe float, or None for NaN / Inf / non-numeric."""
    if val is None:
        return None
    try:
        f = float(val)
        return None if (math.isnan(f) or math.isinf(f)) else round(f, 4)
    except (TypeError, ValueError):
        return None


def _clean(obj: Any) -> Any:
    """Recursively coerce numpy / pandas types to plain Python."""
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_clean(v) for v in obj]
    if isinstance(obj, (np.floating,)):
        return _safe_float(float(obj))
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, float):
        return _safe_float(obj)
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    return obj


def _build_price_history(ticker: str, period: str = "6mo") -> List[Dict]:
    """Return the last 90 OHLCV closes as [{date, close}, ...]."""
    try:
        df = _fetcher.get_price_history(ticker, period=period)
        if df is None or df.empty:
            return []
        rows = []
        for idx, row in df.tail(90).iterrows():
            date_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)[:10]
            close    = _safe_float(row.get("Close"))
            if close is not None:
                rows.append({"date": date_str, "close": close})
        return rows
    except Exception as exc:
        logger.warning("Price history fetch failed for %s: %s", ticker, exc)
        return []


def _serialize(result: StockResult, price_history: Optional[List] = None) -> Dict:
    """Convert a StockResult dataclass to a JSON-safe dict."""
    return {
        "symbol":            result.symbol,
        "name":              result.name or result.symbol,
        "price":             _safe_float(result.price),
        "strategy":          result.strategy,
        "technical_score":   _safe_float(result.technical_score),
        "quant_score":       _safe_float(result.quant_score),
        "sentiment_score":   _safe_float(result.sentiment_score),
        "final_score":       _safe_float(result.final_score),
        "recommendation":    result.recommendation,
        "recommendation_key":result.recommendation_key,
        "technical_signals": result.technical_signals or [],
        "quant_signals":     result.quant_signals or [],
        "sentiment_signals": result.sentiment_signals or [],
        "reasoning":         result.reasoning or [],
        "indicators":        _clean(result.indicators),
        "metrics":           _clean(result.metrics),
        "sentiment_data":    _clean(result.sentiment_data),
        "fundamentals":      _clean(result.fundamentals),
        "price_history":     price_history or [],
        "analyzed_at":       datetime.now(timezone.utc).isoformat(),
        "error":             result.error,
    }


# ── Request / Response models ─────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    ticker:   str
    strategy: str = "short_term"


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/tickers")
def get_tickers():
    return {"tickers": config.NASDAQ_UNIVERSE, "scan_universe": SCAN_UNIVERSE}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    ticker   = req.ticker.upper().strip()
    strategy = req.strategy if req.strategy in ("short_term", "long_term") else "short_term"

    cache_key = f"analyze:{ticker}:{strategy}"
    with _cache_lock:
        if cache_key in _cache:
            logger.info("Cache hit: %s", cache_key)
            return _cache[cache_key]

    logger.info("Analysing %s (%s)…", ticker, strategy)
    result = _engine.analyze(ticker, strategy)

    if result.error:
        raise HTTPException(status_code=400, detail=result.error)

    price_history = _build_price_history(ticker)
    data = _serialize(result, price_history)

    with _cache_lock:
        _cache[cache_key] = data

    return data


@app.get("/scan")
def scan(strategy: str = "both", limit: int = 5):
    """
    Scan SCAN_UNIVERSE and return the top-N picks per strategy.
    Results are cached for 1 hour; the first call may take 30-60 s.
    """
    if strategy not in ("short_term", "long_term", "both"):
        strategy = "both"
    limit = max(1, min(limit, 10))

    cache_key = f"scan:{strategy}:{limit}"
    with _cache_lock:
        if cache_key in _cache:
            logger.info("Cache hit: %s", cache_key)
            return _cache[cache_key]

    strats = ["short_term", "long_term"] if strategy == "both" else [strategy]
    output: Dict[str, List] = {}

    for strat in strats:
        logger.info("Scanning %d tickers for %s…", len(SCAN_UNIVERSE), strat)
        results = _scanner.scan(tickers=SCAN_UNIVERSE, strategy=strat, verbose=False)
        top     = _scanner.get_top_opportunities(results, n=limit)
        output[strat] = [_serialize(r) for r in top]

    response = {
        "results":    output,
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "universe":   SCAN_UNIVERSE,
    }

    with _cache_lock:
        _cache[cache_key] = response

    return response


# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
