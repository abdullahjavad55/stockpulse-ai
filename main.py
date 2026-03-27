"""
main.py — NASDAQ Trading Analysis Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Production-grade quantitative analysis combining:
  • Real-time and historical stock price data (yfinance)
  • Technical indicators (RSI, MACD, Bollinger Bands, SMA/EMA, Volume)
  • Quantitative metrics (Sharpe, Beta, Trend, Momentum, Volatility)
  • News sentiment analysis (VADER with finance-specific lexicon)
  • Weighted decision engine → Buy / Hold / Sell recommendations

DISCLAIMER:
  This tool provides data-driven insights and not financial advice.
  Always conduct your own research before making investment decisions.
  Past performance is not indicative of future results.

Usage:
  python main.py                          # full scan, both strategies
  python main.py --tickers AAPL MSFT      # scan specific tickers
  python main.py --strategy long_term     # long-term mode only
  python main.py --top 10                 # show top 10 instead of 5
"""

import argparse
import io
import logging
import sys
import time
from typing import List, Optional

# Force UTF-8 output on Windows so Unicode characters render correctly
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ── Optional colour / formatting libraries ────────────────────────────────────
try:
    from colorama import Fore, Style, init as colorama_init
    colorama_init(autoreset=True)
    HAS_COLOR = True
except ImportError:
    HAS_COLOR = False

try:
    from tabulate import tabulate
    HAS_TABULATE = True
except ImportError:
    HAS_TABULATE = False

import config
from decision_engine.engine import DecisionEngine, StockResult
from scanner.nasdaq_scanner import NasdaqScanner

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.WARNING,               # suppress info noise from libraries
    format="%(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Colour helpers ────────────────────────────────────────────────────────────

def _col(text: str, colour: str) -> str:
    if not HAS_COLOR:
        return text
    return f"{colour}{text}{Style.RESET_ALL}"


RECOMMENDATION_COLORS = {
    "STRONG BUY":  Fore.GREEN  if HAS_COLOR else "",
    "BUY":         Fore.CYAN   if HAS_COLOR else "",
    "HOLD":        Fore.YELLOW if HAS_COLOR else "",
    "SELL":        Fore.RED    if HAS_COLOR else "",
    "STRONG SELL": Fore.MAGENTA if HAS_COLOR else "",
}


def _colour_rec(rec: str) -> str:
    if not HAS_COLOR:
        return rec
    colour = RECOMMENDATION_COLORS.get(rec, "")
    return f"{colour}{rec}{Style.RESET_ALL}"


def _score_bar(score: float, width: int = 20) -> str:
    """ASCII progress bar for scores 0–100."""
    filled = int(round(score / 100 * width))
    bar    = "█" * filled + "░" * (width - filled)
    return f"[{bar}] {score:5.1f}"


# ── Printing helpers ──────────────────────────────────────────────────────────

SEPARATOR      = "─" * 72
DOUBLE_SEP     = "═" * 72
SECTION_SEP    = "╌" * 72


def _print_disclaimer() -> None:
    print()
    print(_col(DOUBLE_SEP, Fore.YELLOW if HAS_COLOR else ""))
    print(_col(
        "  ⚠  DISCLAIMER: This tool provides data-driven insights and not",
        Fore.YELLOW if HAS_COLOR else "",
    ))
    print(_col(
        "     financial advice. Conduct your own research before investing.",
        Fore.YELLOW if HAS_COLOR else "",
    ))
    print(_col(DOUBLE_SEP, Fore.YELLOW if HAS_COLOR else ""))
    print()


def _print_banner(strategy: str) -> None:
    strat_label = "SHORT-TERM (Days–Weeks)" if strategy == "short_term" else "LONG-TERM (Months–Years)"
    print()
    print(DOUBLE_SEP)
    print(f"  NASDAQ TRADING ANALYSIS TOOL  •  Strategy: {strat_label}")
    print(DOUBLE_SEP)
    print()


def print_stock_report(result: StockResult, rank: Optional[int] = None) -> None:
    """Print a detailed per-stock analysis report."""
    prefix = f"#{rank}  " if rank is not None else ""

    print(SEPARATOR)
    # Header
    name_str = f" ({result.name})" if result.name and result.name != result.symbol else ""
    price_str = f"${result.price:.2f}" if result.price else "N/A"
    print(f"  {prefix}Ticker: {_col(result.symbol, Fore.WHITE if HAS_COLOR else '')} {name_str}")
    print(f"  Price:  {price_str}")
    print()

    # Pillar scores with bars
    print(f"  Technical  Score : {_score_bar(result.technical_score)}")
    print(f"  Quant      Score : {_score_bar(result.quant_score)}")
    print(f"  Sentiment  Score : {_score_bar(result.sentiment_score)}")
    print(f"  {'─'*48}")
    print(f"  Final      Score : {_score_bar(result.final_score)}")
    print()

    # Recommendation (coloured)
    rec_str = _colour_rec(result.recommendation)
    print(f"  Recommendation   : {rec_str}")
    print()

    # Reasoning
    if result.reasoning:
        print("  Key Signals:")
        for sig in result.reasoning:
            print(f"    • {sig}")
    print()

    # Key metrics quick-view
    m = result.metrics
    f = result.fundamentals
    _kv_line("  Sharpe Ratio",    m.get("sharpe_ratio"),    fmt=".2f")
    _kv_line("  Annlsd Volatility", m.get("annualised_volatility"), fmt=".1%")
    _kv_line("  Beta",            m.get("beta"),             fmt=".2f")
    _kv_line("  1M Return",       m.get("momentum_1m"),      fmt=".1%")
    _kv_line("  3M Return",       m.get("momentum_3m"),      fmt=".1%")
    _kv_line("  P/E Ratio",       f.get("pe_ratio"),         fmt=".1f")
    _kv_line("  Rev Growth (YoY)",f.get("revenue_growth"),   fmt=".1%")
    _kv_line("  Sentiment Articles", result.sentiment_data.get("article_count"))
    print()


def _kv_line(label: str, value, fmt: str = "") -> None:
    """Print a key:value line, skipping if value is None."""
    if value is None:
        return
    try:
        val_str = format(value, fmt)
    except (ValueError, TypeError):
        val_str = str(value)
    print(f"  {label:<26}: {val_str}")


def print_summary_table(results: List[StockResult], strategy: str) -> None:
    """Print a compact summary table of all analysed stocks."""
    if not results:
        print("  No results to display.")
        return

    strat_label = "Short-Term" if strategy == "short_term" else "Long-Term"
    print(f"\n  ── {strat_label} Ranking Summary ──\n")

    rows = []
    for i, r in enumerate(results, start=1):
        price = f"${r.price:.2f}" if r.price else "N/A"
        rows.append([
            i,
            r.symbol,
            price,
            f"{r.technical_score:.1f}",
            f"{r.quant_score:.1f}",
            f"{r.sentiment_score:.1f}",
            f"{r.final_score:.1f}",
            r.recommendation,
        ])

    headers = ["#", "Ticker", "Price", "Tech", "Quant", "Sent", "Final", "Signal"]

    if HAS_TABULATE:
        print(tabulate(rows, headers=headers, tablefmt="rounded_outline"))
    else:
        # Plain fallback
        col_w = [4, 8, 9, 6, 6, 6, 7, 13]
        header_line = "  " + " ".join(h.ljust(w) for h, w in zip(headers, col_w))
        print(header_line)
        print("  " + "-" * (sum(col_w) + len(col_w)))
        for row in rows:
            print("  " + " ".join(str(v).ljust(w) for v, w in zip(row, col_w)))


# ── Core API function ─────────────────────────────────────────────────────────

def get_best_stock(
    strategy: str = "short_term",
    tickers:  List[str] = None,
) -> dict:
    """
    Identify and return the single best stock for the given strategy.

    Parameters
    ----------
    strategy : "short_term" | "long_term"
    tickers  : Optional subset of tickers to consider.  Defaults to
               config.NASDAQ_UNIVERSE.

    Returns
    -------
    dict with keys:
      ticker           – stock symbol
      name             – company name
      recommendation   – e.g. "STRONG BUY"
      final_score      – 0–100
      price            – current price
      technical_score  – 0–100
      quant_score      – 0–100
      sentiment_score  – 0–100
      key_metrics      – dict of selected metrics
      explanation      – list of reasoning strings
    """
    scanner = NasdaqScanner()
    print(f"\nScanning for best {strategy.replace('_', '-')} opportunity …\n")
    results = scanner.scan(tickers=tickers, strategy=strategy, verbose=True)

    if not results:
        return {"error": "No stocks could be analysed."}

    best = results[0]
    return {
        "ticker":          best.symbol,
        "name":            best.name,
        "recommendation":  best.recommendation,
        "final_score":     best.final_score,
        "price":           best.price,
        "technical_score": best.technical_score,
        "quant_score":     best.quant_score,
        "sentiment_score": best.sentiment_score,
        "key_metrics": {
            "sharpe_ratio":          best.metrics.get("sharpe_ratio"),
            "annualised_volatility": best.metrics.get("annualised_volatility"),
            "beta":                  best.metrics.get("beta"),
            "momentum_1m":           best.metrics.get("momentum_1m"),
            "momentum_3m":           best.metrics.get("momentum_3m"),
            "pe_ratio":              best.fundamentals.get("pe_ratio"),
            "revenue_growth":        best.fundamentals.get("revenue_growth"),
        },
        "explanation": best.reasoning,
    }


# ── Main execution ────────────────────────────────────────────────────────────

def run_analysis(
    tickers:      List[str],
    strategy:     str,
    top_n:        int,
    show_all:     bool,
    detail_top_n: int,
) -> List[StockResult]:
    """Run the full scan pipeline and print results."""
    _print_banner(strategy)

    print(f"  Scanning {len(tickers)} tickers — strategy: {strategy}\n")
    scanner = NasdaqScanner()
    results = scanner.scan(tickers=tickers, strategy=strategy, verbose=True)

    if not results:
        print("\n  No results returned. Check your network connection and ticker list.")
        return []

    # ── Summary table ─────────────────────────────────────────────────────────
    print("\n")
    print_summary_table(results if show_all else results[:top_n * 3], strategy)

    # ── Top N detail reports ──────────────────────────────────────────────────
    top = results[:top_n]
    strat_label = "Short-Term" if strategy == "short_term" else "Long-Term"
    print(f"\n\n{DOUBLE_SEP}")
    print(f"  TOP {top_n} {strat_label.upper()} OPPORTUNITIES — DETAILED REPORTS")
    print(DOUBLE_SEP)

    for rank, result in enumerate(top, start=1):
        print_stock_report(result, rank=rank)

    return results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="NASDAQ Trading Analysis Tool — data-driven buy/hold/sell signals",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--tickers", nargs="+", default=None,
        help="Space-separated list of tickers to analyse (default: NASDAQ universe in config.py)",
    )
    parser.add_argument(
        "--strategy", choices=["short_term", "long_term", "both"], default="both",
        help="Analysis strategy (default: both)",
    )
    parser.add_argument(
        "--top", type=int, default=config.TOP_N_SHORT_TERM,
        help=f"Number of top stocks to show in detail (default: {config.TOP_N_SHORT_TERM})",
    )
    parser.add_argument(
        "--all", action="store_true",
        help="Show all analysed stocks in summary table (not just top N*3)",
    )
    parser.add_argument(
        "--best", action="store_true",
        help="Print get_best_stock() result and exit",
    )
    parser.add_argument(
        "--best-strategy", choices=["short_term", "long_term"], default="short_term",
        help="Strategy to use with --best flag",
    )
    args = parser.parse_args()

    _print_disclaimer()

    tickers = args.tickers or config.NASDAQ_UNIVERSE

    # ── --best shortcut ────────────────────────────────────────────────────────
    if args.best:
        result = get_best_stock(strategy=args.best_strategy, tickers=tickers)
        print("\n" + DOUBLE_SEP)
        print(f"  BEST {args.best_strategy.replace('_','-').upper()} STOCK")
        print(DOUBLE_SEP)
        print(f"  Ticker        : {result.get('ticker', 'N/A')}")
        print(f"  Name          : {result.get('name', 'N/A')}")
        print(f"  Recommendation: {_colour_rec(result.get('recommendation', 'N/A'))}")
        print(f"  Final Score   : {result.get('final_score', 0):.1f} / 100")
        print(f"  Price         : ${result.get('price') or 0:.2f}")
        print(f"  Tech / Quant / Sentiment: "
              f"{result.get('technical_score',0):.1f} / "
              f"{result.get('quant_score',0):.1f} / "
              f"{result.get('sentiment_score',0):.1f}")
        print("\n  Explanation:")
        for line in result.get("explanation", []):
            print(f"    • {line}")
        km = result.get("key_metrics", {})
        print("\n  Key Metrics:")
        _kv_line("    Sharpe Ratio",        km.get("sharpe_ratio"),          fmt=".2f")
        _kv_line("    Ann. Volatility",     km.get("annualised_volatility"), fmt=".1%")
        _kv_line("    Beta",                km.get("beta"),                  fmt=".2f")
        _kv_line("    1M Return",           km.get("momentum_1m"),           fmt=".1%")
        _kv_line("    P/E Ratio",           km.get("pe_ratio"),              fmt=".1f")
        _kv_line("    Revenue Growth",      km.get("revenue_growth"),        fmt=".1%")
        print()
        _print_disclaimer()
        return

    # ── Full scan ─────────────────────────────────────────────────────────────
    strategies = (
        ["short_term", "long_term"]
        if args.strategy == "both"
        else [args.strategy]
    )

    all_results = {}
    for strat in strategies:
        results = run_analysis(
            tickers      = tickers,
            strategy     = strat,
            top_n        = args.top,
            show_all     = args.all,
            detail_top_n = args.top,
        )
        all_results[strat] = results

    # ── Cross-strategy summary ────────────────────────────────────────────────
    if len(strategies) > 1:
        st_res  = all_results.get("short_term", [])
        lt_res  = all_results.get("long_term",  [])

        print(f"\n\n{DOUBLE_SEP}")
        print("  CROSS-STRATEGY HIGHLIGHTS")
        print(DOUBLE_SEP)

        if st_res:
            print(f"\n  Top {args.top} SHORT-TERM opportunities:")
            for i, r in enumerate(st_res[:args.top], 1):
                price_str = f"${r.price:.2f}" if r.price else "N/A"
                print(f"    {i}. {r.symbol:<6} — {_colour_rec(r.recommendation):<14} "
                      f"Score: {r.final_score:.1f}   Price: {price_str}")

        if lt_res:
            print(f"\n  Top {args.top} LONG-TERM opportunities:")
            for i, r in enumerate(lt_res[:args.top], 1):
                price_str = f"${r.price:.2f}" if r.price else "N/A"
                print(f"    {i}. {r.symbol:<6} — {_colour_rec(r.recommendation):<14} "
                      f"Score: {r.final_score:.1f}   Price: {price_str}")

    _print_disclaimer()


if __name__ == "__main__":
    main()
