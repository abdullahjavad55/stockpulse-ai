"""
analysis/quantitative.py - Quantitative / mathematical analysis.

Metrics:
  - Annualised volatility (sigma of daily log-returns x sqrt(252))
  - Sharpe Ratio  (annualised excess return / sigma)
  - Beta          (vs QQQ as NASDAQ proxy; from fundamentals if unavailable)
  - Linear-regression trend (slope of log-price over trailing window)
  - Momentum score (multi-timeframe: 1m / 3m / 6m returns)
  - Composite Risk Score
  - Quant Score (0-100)

Strategy-aware weights:
  short_term: Sharpe 10%, Trend 5%, Momentum 55%, Volatility 15%, Fundamentals 5%, Risk 10%
  long_term:  Sharpe 30%, Trend 35%, Momentum 5%, Volatility 5%, Fundamentals 20%, Risk 5%
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy import stats

import config

logger = logging.getLogger(__name__)

# Component weights per strategy
QUANT_WEIGHTS = {
    "short_term": {
        "sharpe":       0.10,
        "trend":        0.05,
        "momentum":     0.55,
        "volatility":   0.15,
        "fundamentals": 0.05,
        "risk":         0.10,
    },
    "long_term": {
        "sharpe":       0.30,
        "trend":        0.35,
        "momentum":     0.05,
        "volatility":   0.05,
        "fundamentals": 0.20,
        "risk":         0.05,
    },
}


class QuantitativeAnalyzer:
    """
    Runs quantitative analysis on price data and fundamentals, returning a
    single normalised Quant Score (0–100) plus detailed metrics.
    """

    # ── Public API ────────────────────────────────────────────────────────────

    def analyze(
        self,
        df: pd.DataFrame,
        fundamentals: Dict[str, Any],
        benchmark_df: Optional[pd.DataFrame] = None,
        strategy: str = "short_term",
    ) -> Dict[str, Any]:
        """
        Parameters
        ----------
        df           : OHLCV DataFrame (1-year daily by default).
        fundamentals : dict from StockDataFetcher.get_fundamentals().
        benchmark_df : Optional OHLCV for benchmark (e.g. QQQ). If None,
                       beta from fundamentals is used.
        strategy     : "short_term" or "long_term"; controls internal component weights.

        Returns dict with keys:
          metrics  - all computed values
          score    - Quant Score (0-100)
          signals  - human-readable signal strings
        """
        if df is None or len(df) < 30:
            return {"metrics": {}, "score": 50.0, "signals": ["Insufficient data for quant analysis"]}

        metrics: Dict[str, Any] = {}
        signals: List[str]      = []

        # Select component weights based on strategy
        weights = QUANT_WEIGHTS.get(strategy, QUANT_WEIGHTS["short_term"])

        # Choose the calculation window:
        #   short_term -> last 63 trading days (~3 months)
        #   long_term  -> full history (2 years)
        # Using a short window for short-term means Sharpe, trend, and volatility
        # reflect RECENT price action rather than the long-run average.
        # This is what makes a stock with a strong 2-year trend but a recent 3-month
        # pullback score very differently between the two strategies.
        SHORT_WINDOW = 63
        if strategy == "short_term" and len(df) > SHORT_WINDOW:
            df_window = df.tail(SHORT_WINDOW).copy()
        else:
            df_window = df

        # Core calculations:
        # - Sharpe / volatility / trend -> use df_window (strategy-specific time-frame)
        # - Momentum                    -> always use full df for 1m / 3m / 6m lookbacks
        # - Beta                        -> full df (needs alignment with benchmark)
        self._calc_returns(df_window, metrics)
        self._calc_volatility(metrics)
        self._calc_sharpe(metrics)
        self._calc_beta(df, benchmark_df, fundamentals, metrics)   # full df
        self._calc_trend(df_window, metrics)
        self._calc_momentum(df, metrics)                            # full df
        self._calc_fundamentals_score(fundamentals, metrics)
        self._calc_risk_score(metrics)

        # Score each component
        score_sharpe,    sig_sharpe   = self._score_sharpe(metrics)
        score_trend,     sig_trend    = self._score_trend(metrics)
        score_momentum,  sig_momentum = self._score_momentum(metrics)
        score_vol,       sig_vol      = self._score_volatility(metrics)
        score_fund,      sig_fund     = self._score_fundamentals(metrics)
        score_risk,      sig_risk     = self._score_risk(metrics)

        for sig_list in [sig_sharpe, sig_trend, sig_momentum, sig_vol, sig_fund, sig_risk]:
            signals.extend(sig_list)

        # Strategy-aware weighted composite score
        weighted = (
            score_sharpe   * weights["sharpe"]       +
            score_trend    * weights["trend"]         +
            score_momentum * weights["momentum"]      +
            score_vol      * weights["volatility"]    +
            score_fund     * weights["fundamentals"]  +
            score_risk     * weights["risk"]
        )
        score = float(np.clip(weighted, 0, 100))

        metrics["component_scores"] = {
            "sharpe":       round(score_sharpe,   2),
            "trend":        round(score_trend,    2),
            "momentum":     round(score_momentum, 2),
            "volatility":   round(score_vol,      2),
            "fundamentals": round(score_fund,     2),
            "risk":         round(score_risk,     2),
        }

        window_days = len(df_window)
        logger.info(
            "[QUANT][%s][window=%dd] Sharpe=%.1f Trend=%.1f Mom=%.1f Vol=%.1f Fund=%.1f Risk=%.1f -> Score=%.2f",
            strategy, window_days,
            score_sharpe, score_trend, score_momentum, score_vol, score_fund, score_risk, score,
        )

        return {"metrics": metrics, "score": round(score, 2), "signals": signals}

    # ── Calculation methods ───────────────────────────────────────────────────

    def _calc_returns(self, df: pd.DataFrame, m: dict) -> None:
        log_ret = np.log(df["Close"] / df["Close"].shift(1)).dropna()
        m["log_returns"]      = log_ret
        m["total_return_1y"]  = float((df["Close"].iloc[-1] / df["Close"].iloc[0]) - 1)
        m["mean_daily_return"]= float(log_ret.mean())

    def _calc_volatility(self, m: dict) -> None:
        log_ret = m.get("log_returns", pd.Series(dtype=float))
        ann_vol = float(log_ret.std() * np.sqrt(config.TRADING_DAYS_PER_YEAR))
        m["annualised_volatility"] = ann_vol
        m["daily_volatility"]      = float(log_ret.std())

    def _calc_sharpe(self, m: dict) -> None:
        ann_ret = m.get("mean_daily_return", 0) * config.TRADING_DAYS_PER_YEAR
        ann_vol = m.get("annualised_volatility", 1)
        rf      = config.RISK_FREE_RATE
        sharpe  = (ann_ret - rf) / ann_vol if ann_vol > 0 else 0.0
        m["annualised_return"] = ann_ret
        m["sharpe_ratio"]      = round(float(sharpe), 3)

    def _calc_beta(
        self,
        df: pd.DataFrame,
        benchmark_df: Optional[pd.DataFrame],
        fundamentals: dict,
        m: dict,
    ) -> None:
        # Prefer computed beta from benchmark; fall back to yfinance-supplied beta
        beta = None
        if benchmark_df is not None and len(benchmark_df) > 30:
            try:
                stock_ret = np.log(df["Close"] / df["Close"].shift(1)).dropna()
                bench_ret = np.log(
                    benchmark_df["Close"] / benchmark_df["Close"].shift(1)
                ).dropna()

                # Align on common dates
                aligned = pd.concat([stock_ret, bench_ret], axis=1, join="inner").dropna()
                if len(aligned) > 20:
                    cov = np.cov(aligned.iloc[:, 0], aligned.iloc[:, 1])
                    beta = cov[0, 1] / cov[1, 1] if cov[1, 1] != 0 else None
            except Exception as exc:
                logger.debug("Beta calculation failed: %s", exc)

        if beta is None:
            beta = fundamentals.get("beta")  # from ticker.info

        m["beta"] = round(float(beta), 3) if beta is not None else None

    def _calc_trend(self, df: pd.DataFrame, m: dict) -> None:
        """Linear regression of log-price over the full history."""
        try:
            log_price = np.log(df["Close"].values)
            x         = np.arange(len(log_price))
            slope, intercept, r_value, p_value, _ = stats.linregress(x, log_price)

            # Annualise the slope (daily slope → annual slope)
            m["trend_slope_daily"]    = float(slope)
            m["trend_slope_annual"]   = float(slope * config.TRADING_DAYS_PER_YEAR)
            m["trend_r_squared"]      = float(r_value ** 2)
            m["trend_p_value"]        = float(p_value)
            m["trend_direction"]      = "up" if slope > 0 else "down"
        except Exception as exc:
            logger.debug("Trend calculation failed: %s", exc)
            m["trend_slope_annual"] = 0.0
            m["trend_r_squared"]    = 0.0
            m["trend_direction"]    = "flat"

    def _calc_momentum(self, df: pd.DataFrame, m: dict) -> None:
        """Multi-timeframe price momentum (1-month, 3-month, 6-month returns)."""
        closes = df["Close"]
        n      = len(closes)

        def _ret(days: int) -> Optional[float]:
            if n > days:
                return float((closes.iloc[-1] / closes.iloc[-days]) - 1)
            return None

        m["momentum_1m"]  = _ret(21)
        m["momentum_3m"]  = _ret(63)
        m["momentum_6m"]  = _ret(126)

        # Composite momentum score: weighted average of available timeframes
        weights = {21: 0.5, 63: 0.3, 126: 0.2}
        total_w = 0.0
        total_m = 0.0
        for days, w in weights.items():
            ret = _ret(days)
            if ret is not None:
                total_m += ret * w
                total_w += w

        m["momentum_composite"] = total_m / total_w if total_w > 0 else 0.0

    def _calc_fundamentals_score(self, fundamentals: dict, m: dict) -> None:
        """Derive a simple fundamental quality sub-score."""
        pe  = fundamentals.get("pe_ratio")
        peg = fundamentals.get("peg_ratio")
        roe = fundamentals.get("return_on_equity")
        rev = fundamentals.get("revenue_growth")
        eps = fundamentals.get("earnings_growth")
        pm  = fundamentals.get("profit_margin")
        de  = fundamentals.get("debt_to_equity")

        m["pe_ratio"]         = pe
        m["peg_ratio"]        = peg
        m["return_on_equity"] = roe
        m["revenue_growth"]   = rev
        m["earnings_growth"]  = eps
        m["profit_margin"]    = pm
        m["debt_to_equity"]   = de

    def _calc_risk_score(self, m: dict) -> None:
        """
        Composite risk score (lower = riskier).

        Considers: volatility, beta, and short ratio.
        """
        vol  = m.get("annualised_volatility", 0.3)
        beta = m.get("beta")

        # Normalise volatility (< 0.2 = low risk, > 0.6 = very high risk)
        vol_risk  = np.clip(vol / 0.6, 0, 1)          # 0=safe, 1=risky
        beta_risk = np.clip(abs(beta or 1.0) / 2.5, 0, 1)

        m["risk_score_raw"] = float((vol_risk * 0.6 + beta_risk * 0.4))  # 0=safe, 1=risky

    # ── Scoring sub-functions ─────────────────────────────────────────────────

    def _score_sharpe(self, m: dict) -> Tuple[float, list]:
        sharpe  = m.get("sharpe_ratio", 0)
        signals = []

        if sharpe > 2.0:
            score = 90.0
            signals.append(f"Sharpe Ratio = {sharpe:.2f} - excellent risk-adjusted return")
        elif sharpe > 1.0:
            score = 72.0
            signals.append(f"Sharpe Ratio = {sharpe:.2f} - good risk-adjusted return")
        elif sharpe > 0.5:
            score = 58.0
            signals.append(f"Sharpe Ratio = {sharpe:.2f} - acceptable risk-adjusted return")
        elif sharpe > 0:
            score = 48.0
            signals.append(f"Sharpe Ratio = {sharpe:.2f} - marginal risk-adjusted return")
        elif sharpe > -0.5:
            score = 35.0
            signals.append(f"Sharpe Ratio = {sharpe:.2f} - negative risk-adjusted return")
        else:
            score = 18.0
            signals.append(f"Sharpe Ratio = {sharpe:.2f} - poor risk-adjusted return")

        return score, signals

    def _score_trend(self, m: dict) -> Tuple[float, list]:
        slope  = m.get("trend_slope_annual", 0)
        r2     = m.get("trend_r_squared", 0)
        signals = []

        # slope is already annualised log-return equivalent
        if slope > 0.30 and r2 > 0.5:
            score = 85.0
            signals.append(f"Strong uptrend: annualised trend slope = {slope:.1%}, R² = {r2:.2f}")
        elif slope > 0.10:
            score = 65.0
            signals.append(f"Moderate uptrend: slope = {slope:.1%}")
        elif slope > 0:
            score = 53.0
            signals.append(f"Slight uptrend: slope = {slope:.1%}")
        elif slope > -0.10:
            score = 40.0
            signals.append(f"Slight downtrend: slope = {slope:.1%}")
        elif slope > -0.30:
            score = 30.0
            signals.append(f"Moderate downtrend: slope = {slope:.1%}")
        else:
            score = 15.0
            signals.append(f"Strong downtrend: slope = {slope:.1%}")

        return score, signals

    def _score_momentum(self, m: dict) -> Tuple[float, list]:
        mom    = m.get("momentum_composite", 0)
        mom_1m = m.get("momentum_1m")
        signals = []

        if mom > 0.25:
            score = 82.0
            signals.append(f"Strong positive momentum: composite = {mom:.1%}")
        elif mom > 0.10:
            score = 65.0
            signals.append(f"Positive momentum: composite = {mom:.1%}")
        elif mom > 0:
            score = 53.0
            signals.append(f"Slight positive momentum: composite = {mom:.1%}")
        elif mom > -0.10:
            score = 40.0
            signals.append(f"Slight negative momentum: composite = {mom:.1%}")
        elif mom > -0.25:
            score = 30.0
            signals.append(f"Negative momentum: composite = {mom:.1%}")
        else:
            score = 15.0
            signals.append(f"Strong negative momentum: composite = {mom:.1%}")

        if mom_1m is not None:
            signals.append(f"1-month return: {mom_1m:.1%}")

        return score, signals

    def _score_volatility(self, m: dict) -> Tuple[float, list]:
        vol     = m.get("annualised_volatility", 0.3)
        signals = []

        # Lower volatility → higher score for quant purposes
        if vol < 0.15:
            score = 70.0
            signals.append(f"Low volatility: {vol:.1%} annualised - stable price action")
        elif vol < 0.30:
            score = 58.0
            signals.append(f"Moderate volatility: {vol:.1%} annualised")
        elif vol < 0.50:
            score = 42.0
            signals.append(f"High volatility: {vol:.1%} annualised - elevated risk")
        else:
            score = 25.0
            signals.append(f"Very high volatility: {vol:.1%} annualised - significant risk")

        return score, signals

    def _score_fundamentals(self, m: dict) -> Tuple[float, list]:
        pe  = m.get("pe_ratio")
        roe = m.get("return_on_equity")
        rev = m.get("revenue_growth")
        pm  = m.get("profit_margin")
        de  = m.get("debt_to_equity")
        signals = []

        score = 50.0  # start neutral; adjust per metric

        if pe is not None:
            if 0 < pe < 15:
                score += 10; signals.append(f"P/E = {pe:.1f} - value territory")
            elif 15 <= pe < 30:
                score += 5;  signals.append(f"P/E = {pe:.1f} - fair value")
            elif pe >= 30:
                score -= 5;  signals.append(f"P/E = {pe:.1f} - growth premium")
            elif pe < 0:
                score -= 5;  signals.append(f"P/E = {pe:.1f} - negative earnings")

        if roe is not None:
            if roe > 0.20:
                score += 10; signals.append(f"ROE = {roe:.1%} - high return on equity")
            elif roe > 0.10:
                score += 5;  signals.append(f"ROE = {roe:.1%} - solid return on equity")
            elif roe < 0:
                score -= 8;  signals.append(f"ROE = {roe:.1%} - negative return on equity")

        if rev is not None:
            if rev > 0.20:
                score += 10; signals.append(f"Revenue growth = {rev:.1%} - strong growth")
            elif rev > 0.05:
                score += 5;  signals.append(f"Revenue growth = {rev:.1%} - moderate growth")
            elif rev < 0:
                score -= 8;  signals.append(f"Revenue growth = {rev:.1%} - declining revenue")

        if de is not None:
            if de < 0.5:
                score += 5;  signals.append(f"Debt/Equity = {de:.2f} - low leverage")
            elif de > 2.0:
                score -= 5;  signals.append(f"Debt/Equity = {de:.2f} - high leverage")

        return float(np.clip(score, 0, 100)), signals

    def _score_risk(self, m: dict) -> Tuple[float, list]:
        risk_raw = m.get("risk_score_raw", 0.5)   # 0=safe, 1=risky
        beta     = m.get("beta")
        signals  = []

        # Invert: low risk → high score
        score = (1 - risk_raw) * 100

        if beta is not None:
            if beta < 0.8:
                signals.append(f"Beta = {beta:.2f} - defensive stock (low market sensitivity)")
            elif beta < 1.2:
                signals.append(f"Beta = {beta:.2f} - market-neutral sensitivity")
            elif beta < 1.8:
                signals.append(f"Beta = {beta:.2f} - higher market sensitivity (amplified moves)")
            else:
                signals.append(f"Beta = {beta:.2f} - highly aggressive (strong market amplifier)")
        else:
            signals.append("Beta not available")

        return float(np.clip(score, 0, 100)), signals
