"""
scanner/nasdaq_scanner.py — Batch scan of NASDAQ stocks.

The scanner iterates a list of tickers, runs DecisionEngine.analyze() on
each one, and returns ranked results for short-term and long-term strategies.

A shared benchmark DataFrame (QQQ) is fetched once and reused across all
tickers to keep beta calculations consistent and reduce API calls.
"""

import logging
import time
from typing import Dict, List, Optional, Tuple

import yfinance as yf

import config
from decision_engine.engine import DecisionEngine, StockResult

logger = logging.getLogger(__name__)

# Seconds to sleep between ticker requests (be polite to free-tier APIs)
INTER_TICKER_SLEEP = 0.5


class NasdaqScanner:
    """
    Scans a universe of NASDAQ tickers and ranks them by strategy score.

    Usage:
        scanner = NasdaqScanner()
        results = scanner.scan(tickers=["AAPL", "MSFT", ...], strategy="short_term")
        top     = scanner.get_top_opportunities(results, n=5)
    """

    def __init__(self) -> None:
        self._engine    = DecisionEngine()
        self._benchmark = None   # Cached QQQ history for beta computation

    # ── Public API ────────────────────────────────────────────────────────────

    def scan(
        self,
        tickers:  List[str] = None,
        strategy: str       = "short_term",
        verbose:  bool      = True,
    ) -> List[StockResult]:
        """
        Analyse every ticker and return a list of StockResult objects sorted
        by final_score (descending).

        Parameters
        ----------
        tickers  : List of ticker symbols.  Defaults to config.NASDAQ_UNIVERSE.
        strategy : "short_term" | "long_term"
        verbose  : Print progress to stdout.
        """
        tickers = tickers or config.NASDAQ_UNIVERSE

        # Fetch benchmark once for beta calculation
        self._benchmark = self._fetch_benchmark()

        results: List[StockResult] = []
        total = len(tickers)

        for i, symbol in enumerate(tickers, start=1):
            if verbose:
                print(f"  [{i:>3}/{total}] Analysing {symbol:<6} ...", end=" ", flush=True)

            try:
                result = self._engine.analyze(
                    symbol,
                    strategy=strategy,
                    benchmark_df=self._benchmark,
                )

                if result.error:
                    if verbose:
                        print(f"SKIP ({result.error})")
                else:
                    results.append(result)
                    if verbose:
                        print(
                            f"Score={result.final_score:5.1f}  "
                            f"[{result.recommendation}]"
                        )

            except Exception as exc:
                logger.error("Unexpected error for %s: %s", symbol, exc)
                if verbose:
                    print(f"ERROR: {exc}")

            # Throttle to avoid hitting rate limits on free-tier APIs
            time.sleep(INTER_TICKER_SLEEP)

        # Sort by final score, highest first
        results.sort(key=lambda r: r.final_score, reverse=True)
        return results

    def get_top_opportunities(
        self,
        results: List[StockResult],
        n:       int = 5,
    ) -> List[StockResult]:
        """Return the top-N results by final score."""
        return results[:n]

    def get_bottom_opportunities(
        self,
        results: List[StockResult],
        n:       int = 5,
    ) -> List[StockResult]:
        """Return the bottom-N results (potential shorting candidates)."""
        return results[-n:][::-1]

    def split_by_recommendation(
        self, results: List[StockResult]
    ) -> Dict[str, List[StockResult]]:
        """Group results by recommendation label."""
        buckets: Dict[str, List[StockResult]] = {
            "strong_buy": [], "buy": [], "hold": [], "sell": [], "strong_sell": []
        }
        for r in results:
            buckets.setdefault(r.recommendation_key, []).append(r)
        return buckets

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _fetch_benchmark(symbol: str = "QQQ") -> Optional[object]:
        """Fetch the NASDAQ-100 ETF (QQQ) history for beta computation."""
        try:
            ticker = yf.Ticker(symbol)
            df     = ticker.history(period=config.PRICE_HISTORY_PERIOD, interval="1d", auto_adjust=True)
            if df is not None and not df.empty:
                logger.debug("Benchmark %s loaded (%d bars)", symbol, len(df))
                return df
        except Exception as exc:
            logger.warning("Could not fetch benchmark %s: %s", symbol, exc)
        return None
