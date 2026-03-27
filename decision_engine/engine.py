"""
decision_engine/engine.py — Weighted scoring model and recommendation engine.

Combines Technical, Quantitative, and Sentiment pillar scores into one
final score (0–100) and maps it to a five-level recommendation.

Strategy modes adjust pillar weights:
  short_term  : Technical 50 % / Quant 20 % / Sentiment 30 %
  long_term   : Technical 30 % / Quant 45 % / Sentiment 25 %
"""

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import yfinance as yf

import config
from analysis.quantitative import QuantitativeAnalyzer
from analysis.technical import TechnicalAnalyzer
from data.fetcher import StockDataFetcher
from data.news_fetcher import NewsFetcher
from sentiment.analyzer import SentimentAnalyzer

logger = logging.getLogger(__name__)

# ── Recommendation labels ─────────────────────────────────────────────────────
RECOMMENDATION_MAP = {
    "strong_buy":  "STRONG BUY",
    "buy":         "BUY",
    "hold":        "HOLD",
    "sell":        "SELL",
    "strong_sell": "STRONG SELL",
}


@dataclass
class StockResult:
    """All analysis output for a single ticker."""

    symbol:             str
    name:               str                 = ""
    price:              Optional[float]     = None
    strategy:           str                 = "short_term"

    # Pillar scores
    technical_score:    float               = 50.0
    quant_score:        float               = 50.0
    sentiment_score:    float               = 50.0
    final_score:        float               = 50.0

    recommendation:     str                 = "HOLD"
    recommendation_key: str                 = "hold"

    # Detailed outputs
    technical_signals:  List[str]           = field(default_factory=list)
    quant_signals:      List[str]           = field(default_factory=list)
    sentiment_signals:  List[str]           = field(default_factory=list)
    reasoning:          List[str]           = field(default_factory=list)

    # Raw data
    indicators:         Dict[str, Any]      = field(default_factory=dict)
    metrics:            Dict[str, Any]      = field(default_factory=dict)
    sentiment_data:     Dict[str, Any]      = field(default_factory=dict)
    fundamentals:       Dict[str, Any]      = field(default_factory=dict)

    error:              Optional[str]       = None


class DecisionEngine:
    """
    Orchestrates data fetching, analysis, and scoring for a single ticker.

    Usage:
        engine = DecisionEngine()
        result = engine.analyze("AAPL", strategy="short_term")
    """

    def __init__(self) -> None:
        self._data_fetcher  = StockDataFetcher()
        self._news_fetcher  = NewsFetcher()
        self._tech_analyzer = TechnicalAnalyzer()
        self._quant_analyzer= QuantitativeAnalyzer()
        self._sent_analyzer = SentimentAnalyzer()

    # ── Public API ────────────────────────────────────────────────────────────

    def analyze(
        self,
        symbol:      str,
        strategy:    str = "short_term",
        benchmark_df = None,
    ) -> StockResult:
        """
        Run the full analysis pipeline for *symbol*.

        Parameters
        ----------
        symbol      : Ticker (e.g. "AAPL")
        strategy    : "short_term" | "long_term"
        benchmark_df: Optional benchmark OHLCV (e.g. QQQ) for beta.

        Returns
        -------
        StockResult dataclass
        """
        result = StockResult(symbol=symbol.upper(), strategy=strategy)
        weights = config.WEIGHTS.get(strategy, config.WEIGHTS["short_term"])

        try:
            # 1. Fetch price history
            period = config.LONG_TERM_PERIOD if strategy == "long_term" else config.PRICE_HISTORY_PERIOD
            df = self._data_fetcher.get_price_history(symbol, period=period)
            if df is None or df.empty:
                result.error = f"No price data available for {symbol}"
                logger.warning(result.error)
                return result

            # 2. Fetch fundamentals
            fundamentals = self._data_fetcher.get_fundamentals(symbol)
            result.fundamentals = fundamentals
            result.name         = fundamentals.get("name") or symbol
            result.price        = fundamentals.get("price") or (float(df["Close"].iloc[-1]) if not df.empty else None)

            # 3. Technical analysis
            tech_result          = self._tech_analyzer.analyze(df)
            result.technical_score  = tech_result["score"]
            result.technical_signals= tech_result["signals"]
            result.indicators       = tech_result["indicators"]

            # 4. Quantitative analysis
            quant_result         = self._quant_analyzer.analyze(df, fundamentals, benchmark_df)
            result.quant_score      = quant_result["score"]
            result.quant_signals    = quant_result["signals"]
            result.metrics          = quant_result["metrics"]

            # 5. News + sentiment
            articles             = self._news_fetcher.fetch_news(symbol, config.MAX_NEWS_ARTICLES)
            sent_result          = self._sent_analyzer.analyze(articles)
            result.sentiment_score  = sent_result["score"]
            result.sentiment_signals= sent_result["signals"]
            result.sentiment_data   = sent_result

            # 6. Weighted final score
            result.final_score = (
                result.technical_score  * weights["technical"] +
                result.quant_score      * weights["quant"]     +
                result.sentiment_score  * weights["sentiment"]
            )
            result.final_score = round(float(result.final_score), 2)

            # 7. Recommendation
            result.recommendation_key, result.recommendation = self._map_recommendation(
                result.final_score
            )

            # 8. Build reasoning narrative
            result.reasoning = self._build_reasoning(result)

        except Exception as exc:
            logger.exception("Analysis failed for %s: %s", symbol, exc)
            result.error = str(exc)

        return result

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _map_recommendation(score: float):
        """Map final score to recommendation key and label."""
        t = config.THRESHOLDS
        if score >= t["strong_buy"]:
            return "strong_buy",  RECOMMENDATION_MAP["strong_buy"]
        elif score >= t["buy"]:
            return "buy",         RECOMMENDATION_MAP["buy"]
        elif score >= t["hold"]:
            return "hold",        RECOMMENDATION_MAP["hold"]
        elif score >= t["sell"]:
            return "sell",        RECOMMENDATION_MAP["sell"]
        else:
            return "strong_sell", RECOMMENDATION_MAP["strong_sell"]

    @staticmethod
    def _build_reasoning(r: StockResult) -> List[str]:
        """
        Assemble a short, prioritised list of the top reasons behind the
        recommendation. Selects the most impactful signals from each pillar.
        """
        reasoning: List[str] = []

        # Pick the first 2 signals from each pillar (most-impactful first)
        for signals in [r.technical_signals, r.quant_signals, r.sentiment_signals]:
            for sig in signals[:2]:
                if sig and sig not in reasoning:
                    reasoning.append(sig)

        return reasoning[:8]  # cap at 8 bullet points
