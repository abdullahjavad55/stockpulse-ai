"""
data/news_fetcher.py — Multi-source financial news retrieval.

Priority order (highest quality first):
  1. Finnhub Company News API  (requires FINNHUB_API_KEY)
  2. NewsAPI Everything endpoint (requires NEWS_API_KEY)
  3. yfinance built-in ticker.news  (always available, no key needed)

Each source is tried in order; on failure the next is attempted.
The final result is a deduplicated list of article dicts with keys:
  title, description, source, published_at, url
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import requests
import yfinance as yf

import config

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
FINNHUB_BASE = "https://finnhub.io/api/v1"
NEWSAPI_BASE  = "https://newsapi.org/v2"
REQUEST_TIMEOUT = 10  # seconds


class NewsFetcher:
    """
    Aggregates recent news for a stock ticker from multiple APIs.

    Usage:
        fetcher = NewsFetcher()
        articles = fetcher.fetch_news("AAPL", max_articles=15)
    """

    def __init__(self) -> None:
        self._session = requests.Session()
        self._session.headers.update({"User-Agent": "trading-analysis-tool/1.0"})

    # ── Public interface ──────────────────────────────────────────────────────

    def fetch_news(self, symbol: str, max_articles: int = 15) -> List[Dict[str, Any]]:
        """
        Return up to *max_articles* recent news articles for *symbol*.

        Articles are deduplicated by title before being returned.
        """
        articles: List[Dict[str, Any]] = []

        # Source 1: Finnhub
        if config.FINNHUB_API_KEY:
            articles.extend(self._fetch_finnhub(symbol, max_articles))

        # Source 2: NewsAPI
        if len(articles) < max_articles and config.NEWS_API_KEY:
            articles.extend(self._fetch_newsapi(symbol, max_articles))

        # Source 3: yfinance (always available)
        if len(articles) < max_articles:
            articles.extend(self._fetch_yfinance(symbol, max_articles))

        # Deduplicate by title (case-insensitive)
        seen_titles: set = set()
        unique: List[Dict[str, Any]] = []
        for art in articles:
            key = (art.get("title") or "").lower().strip()
            if key and key not in seen_titles:
                seen_titles.add(key)
                unique.append(art)

        return unique[:max_articles]

    # ── Private source implementations ────────────────────────────────────────

    def _fetch_finnhub(self, symbol: str, max_articles: int) -> List[Dict[str, Any]]:
        """Fetch news from Finnhub Company News endpoint."""
        try:
            today = datetime.today()
            from_date = (today - timedelta(days=30)).strftime("%Y-%m-%d")
            to_date   = today.strftime("%Y-%m-%d")

            resp = self._session.get(
                f"{FINNHUB_BASE}/company-news",
                params={
                    "symbol": symbol,
                    "from":   from_date,
                    "to":     to_date,
                    "token":  config.FINNHUB_API_KEY,
                },
                timeout=REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            raw = resp.json()

            articles = []
            for item in raw[:max_articles]:
                articles.append({
                    "title":        item.get("headline", ""),
                    "description":  item.get("summary", ""),
                    "source":       item.get("source", "Finnhub"),
                    "published_at": datetime.fromtimestamp(
                        item.get("datetime", 0)
                    ).isoformat(),
                    "url": item.get("url", ""),
                })
            logger.debug("Finnhub returned %d articles for %s", len(articles), symbol)
            return articles

        except Exception as exc:
            logger.debug("Finnhub news failed for %s: %s", symbol, exc)
            return []

    def _fetch_newsapi(self, symbol: str, max_articles: int) -> List[Dict[str, Any]]:
        """Fetch news from NewsAPI Everything endpoint."""
        try:
            from_date = (datetime.today() - timedelta(days=30)).strftime("%Y-%m-%d")
            resp = self._session.get(
                f"{NEWSAPI_BASE}/everything",
                params={
                    "q":        f"{symbol} stock",
                    "from":     from_date,
                    "language": "en",
                    "sortBy":   "relevancy",
                    "pageSize": max_articles,
                    "apiKey":   config.NEWS_API_KEY,
                },
                timeout=REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            if data.get("status") != "ok":
                return []

            articles = []
            for item in data.get("articles", []):
                articles.append({
                    "title":        item.get("title", ""),
                    "description":  item.get("description", "") or item.get("content", ""),
                    "source":       item.get("source", {}).get("name", "NewsAPI"),
                    "published_at": item.get("publishedAt", ""),
                    "url":          item.get("url", ""),
                })
            logger.debug("NewsAPI returned %d articles for %s", len(articles), symbol)
            return articles

        except Exception as exc:
            logger.debug("NewsAPI news failed for %s: %s", symbol, exc)
            return []

    def _fetch_yfinance(self, symbol: str, max_articles: int) -> List[Dict[str, Any]]:
        """Fetch news using yfinance's built-in ticker.news (no API key needed)."""
        try:
            ticker = yf.Ticker(symbol)
            raw = ticker.news or []

            articles = []
            for item in raw[:max_articles]:
                # yfinance news items use 'providerPublishTime' (Unix timestamp)
                pub_ts = item.get("providerPublishTime", 0)
                pub_str = (
                    datetime.fromtimestamp(pub_ts).isoformat()
                    if pub_ts else ""
                )
                # Content is sometimes nested under 'content' key in newer yfinance
                content_block = item.get("content", {})
                title = (
                    item.get("title")
                    or content_block.get("title", "")
                )
                description = (
                    item.get("summary")
                    or content_block.get("summary", "")
                    or content_block.get("description", "")
                )
                articles.append({
                    "title":        title,
                    "description":  description,
                    "source":       item.get("publisher", "Yahoo Finance"),
                    "published_at": pub_str,
                    "url":          item.get("link", ""),
                })

            logger.debug("yfinance returned %d articles for %s", len(articles), symbol)
            return articles

        except Exception as exc:
            logger.debug("yfinance news failed for %s: %s", symbol, exc)
            return []
