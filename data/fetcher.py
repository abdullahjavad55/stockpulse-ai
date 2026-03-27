"""
data/fetcher.py - Stock price and fundamental data fetching via yfinance.

Provides a lightweight caching layer so that each yfinance.Ticker object is
created only once per session, and repeated calls for the same symbol are cheap.
"""

import logging
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


class StockDataFetcher:
    """
    Wraps yfinance to fetch price history and fundamental data.

    All public methods return None (or an empty dict) on failure so that
    callers never have to worry about uncaught exceptions.
    """

    def __init__(self) -> None:
        # In-process Ticker cache: symbol → yf.Ticker
        self._ticker_cache: Dict[str, yf.Ticker] = {}

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _get_ticker(self, symbol: str) -> yf.Ticker:
        """Return a cached yf.Ticker, creating it on first access."""
        if symbol not in self._ticker_cache:
            self._ticker_cache[symbol] = yf.Ticker(symbol)
        return self._ticker_cache[symbol]

    # ── Price data ────────────────────────────────────────────────────────────

    def get_price_history(
        self,
        symbol: str,
        period: str = "1y",
        interval: str = "1d",
    ) -> Optional[pd.DataFrame]:
        """
        Fetch OHLCV history from Yahoo Finance.

        Returns a DataFrame with columns [Open, High, Low, Close, Volume]
        indexed by date, or None if the request fails.
        """
        try:
            ticker = self._get_ticker(symbol)
            df = ticker.history(period=period, interval=interval, auto_adjust=True)
            if df is None or df.empty:
                logger.warning("No price history returned for %s", symbol)
                return None
            # Drop any rows where Close is NaN
            df = df.dropna(subset=["Close"])
            return df
        except Exception as exc:
            logger.error("Price history fetch failed for %s: %s", symbol, exc)
            return None

    def get_current_price(self, symbol: str) -> Optional[float]:
        """
        Return the most-recent closing price.

        Tries ticker.info first (real-time quote), falls back to the last
        row of the 5-day history.
        """
        try:
            info = self._get_ticker(symbol).info
            price = info.get("currentPrice") or info.get("regularMarketPrice")
            if price:
                return float(price)
        except Exception:
            pass  # Fall through to history-based fallback

        hist = self.get_price_history(symbol, period="5d")
        if hist is not None and not hist.empty:
            return float(hist["Close"].iloc[-1])
        return None

    # ── Fundamental data ──────────────────────────────────────────────────────

    def get_fundamentals(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch key fundamental metrics from ticker.info.

        Returns a dict; missing fields are represented as None so callers
        can check existence without KeyError.
        """
        fields = {
            "market_cap":       "marketCap",
            "pe_ratio":         "trailingPE",
            "forward_pe":       "forwardPE",
            "peg_ratio":        "pegRatio",
            "eps":              "trailingEps",
            "revenue_growth":   "revenueGrowth",
            "earnings_growth":  "earningsGrowth",
            "profit_margin":    "profitMargins",
            "gross_margin":     "grossMargins",
            "debt_to_equity":   "debtToEquity",
            "current_ratio":    "currentRatio",
            "return_on_equity": "returnOnEquity",
            "return_on_assets": "returnOnAssets",
            "beta":             "beta",
            "52w_high":         "fiftyTwoWeekHigh",
            "52w_low":          "fiftyTwoWeekLow",
            "avg_volume":       "averageVolume",
            "short_ratio":      "shortRatio",
            "dividend_yield":   "dividendYield",
            "sector":           "sector",
            "industry":         "industry",
            "name":             "longName",
        }
        result: Dict[str, Any] = {k: None for k in fields}
        try:
            info = self._get_ticker(symbol).info
            for our_key, yf_key in fields.items():
                val = info.get(yf_key)
                # yfinance sometimes returns 'Infinity' as a float
                if isinstance(val, float) and (np.isinf(val) or np.isnan(val)):
                    val = None
                result[our_key] = val

            # Derive current price if not already captured
            result["price"] = (
                info.get("currentPrice")
                or info.get("regularMarketPrice")
                or self.get_current_price(symbol)
            )
        except Exception as exc:
            logger.error("Fundamentals fetch failed for %s: %s", symbol, exc)
        return result
