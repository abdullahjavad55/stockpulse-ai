"""
analysis/technical.py — Technical indicator calculations and scoring.

Indicators implemented:
  • SMA  (20 / 50 / 200-day)
  • EMA  (12 / 26-day)
  • RSI  (14-day)
  • MACD (12-26-9)
  • Bollinger Bands (20-day, 2σ)
  • Volume analysis (relative volume vs 20-day average)
  • Support & Resistance levels (rolling window extrema)

All score helpers return a float in [0, 100].  Higher = more bullish.
"""

import logging
from typing import Any, Dict, Optional, Tuple

import numpy as np
import pandas as pd

import config

logger = logging.getLogger(__name__)


class TechnicalAnalyzer:
    """
    Computes all technical indicators for a price DataFrame and produces a
    single normalised Technical Score (0–100).
    """

    # ── Public API ────────────────────────────────────────────────────────────

    def analyze(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Run the full technical analysis pipeline.

        Parameters
        ----------
        df : pd.DataFrame
            OHLCV data with at least columns [Open, High, Low, Close, Volume].

        Returns
        -------
        dict with keys:
          indicators  – all computed series / values
          score       – Technical Score (0–100)
          signals     – list of human-readable signal strings
        """
        if df is None or len(df) < config.SMA_SHORT + 5:
            return {"indicators": {}, "score": 50.0, "signals": ["Insufficient data"]}

        df = df.copy()
        indicators: Dict[str, Any] = {}
        signals: list = []

        # ── Compute indicators ────────────────────────────────────────────────
        df = self._add_sma(df, indicators)
        df = self._add_ema(df, indicators)
        df = self._add_rsi(df, indicators)
        df = self._add_macd(df, indicators)
        df = self._add_bollinger(df, indicators)
        self._add_volume_analysis(df, indicators)
        self._add_support_resistance(df, indicators)

        # ── Score each indicator group ────────────────────────────────────────
        score_rsi,     sig_rsi     = self._score_rsi(indicators)
        score_macd,    sig_macd    = self._score_macd(indicators)
        score_trend,   sig_trend   = self._score_trend(df, indicators)
        score_bb,      sig_bb      = self._score_bollinger(df, indicators)
        score_vol,     sig_vol     = self._score_volume(indicators)
        score_sr,      sig_sr      = self._score_support_resistance(df, indicators)

        for sig_list in [sig_rsi, sig_macd, sig_trend, sig_bb, sig_vol, sig_sr]:
            signals.extend(sig_list)

        # ── Weighted composite score ──────────────────────────────────────────
        # Weights reflect typical technical-trading importance
        weighted = (
            score_rsi   * 0.25 +
            score_macd  * 0.25 +
            score_trend * 0.20 +
            score_bb    * 0.15 +
            score_vol   * 0.10 +
            score_sr    * 0.05
        )
        score = float(np.clip(weighted, 0, 100))

        indicators["component_scores"] = {
            "rsi":    round(score_rsi,   2),
            "macd":   round(score_macd,  2),
            "trend":  round(score_trend, 2),
            "bb":     round(score_bb,    2),
            "volume": round(score_vol,   2),
            "sr":     round(score_sr,    2),
        }

        return {"indicators": indicators, "score": round(score, 2), "signals": signals}

    # ── Indicator Calculations ────────────────────────────────────────────────

    def _add_sma(self, df: pd.DataFrame, ind: dict) -> pd.DataFrame:
        df[f"sma_{config.SMA_SHORT}"]  = df["Close"].rolling(config.SMA_SHORT).mean()
        df[f"sma_{config.SMA_MEDIUM}"] = df["Close"].rolling(config.SMA_MEDIUM).mean()
        df[f"sma_{config.SMA_LONG}"]   = df["Close"].rolling(config.SMA_LONG).mean()

        last = df["Close"].iloc[-1]
        ind["price"]        = last
        ind["sma_short"]    = df[f"sma_{config.SMA_SHORT}"].iloc[-1]
        ind["sma_medium"]   = df[f"sma_{config.SMA_MEDIUM}"].iloc[-1]
        ind["sma_long"]     = df[f"sma_{config.SMA_LONG}"].iloc[-1]
        return df

    def _add_ema(self, df: pd.DataFrame, ind: dict) -> pd.DataFrame:
        df[f"ema_{config.EMA_SHORT}"] = df["Close"].ewm(span=config.EMA_SHORT, adjust=False).mean()
        df[f"ema_{config.EMA_LONG}"]  = df["Close"].ewm(span=config.EMA_LONG,  adjust=False).mean()

        ind["ema_short"] = df[f"ema_{config.EMA_SHORT}"].iloc[-1]
        ind["ema_long"]  = df[f"ema_{config.EMA_LONG}"].iloc[-1]
        return df

    def _add_rsi(self, df: pd.DataFrame, ind: dict) -> pd.DataFrame:
        period = config.RSI_PERIOD
        delta  = df["Close"].diff()
        gain   = delta.clip(lower=0)
        loss   = (-delta).clip(lower=0)

        avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
        avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()

        rs  = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        df["rsi"] = rsi

        ind["rsi"]         = float(rsi.iloc[-1]) if not pd.isna(rsi.iloc[-1]) else 50.0
        ind["rsi_prev"]    = float(rsi.iloc[-2]) if len(rsi) > 1 and not pd.isna(rsi.iloc[-2]) else 50.0
        return df

    def _add_macd(self, df: pd.DataFrame, ind: dict) -> pd.DataFrame:
        ema_short = df["Close"].ewm(span=config.EMA_SHORT, adjust=False).mean()
        ema_long  = df["Close"].ewm(span=config.EMA_LONG,  adjust=False).mean()

        macd_line   = ema_short - ema_long
        signal_line = macd_line.ewm(span=config.MACD_SIGNAL, adjust=False).mean()
        histogram   = macd_line - signal_line

        df["macd"]      = macd_line
        df["macd_sig"]  = signal_line
        df["macd_hist"] = histogram

        ind["macd"]      = float(macd_line.iloc[-1])
        ind["macd_sig"]  = float(signal_line.iloc[-1])
        ind["macd_hist"] = float(histogram.iloc[-1])
        ind["macd_prev"] = float(macd_line.iloc[-2])    if len(macd_line)   > 1 else 0.0
        ind["macd_sig_prev"] = float(signal_line.iloc[-2]) if len(signal_line) > 1 else 0.0
        return df

    def _add_bollinger(self, df: pd.DataFrame, ind: dict) -> pd.DataFrame:
        sma  = df["Close"].rolling(config.BB_PERIOD).mean()
        std  = df["Close"].rolling(config.BB_PERIOD).std()

        upper = sma + config.BB_STD * std
        lower = sma - config.BB_STD * std

        df["bb_upper"] = upper
        df["bb_lower"] = lower
        df["bb_mid"]   = sma

        last_close = df["Close"].iloc[-1]
        last_upper = upper.iloc[-1]
        last_lower = lower.iloc[-1]
        last_mid   = sma.iloc[-1]

        band_width = (last_upper - last_lower) / last_mid if last_mid else 0
        # %B: position within band (0=at lower, 1=at upper)
        pct_b = (last_close - last_lower) / (last_upper - last_lower) if (last_upper - last_lower) else 0.5

        ind["bb_upper"]     = float(last_upper)
        ind["bb_lower"]     = float(last_lower)
        ind["bb_mid"]       = float(last_mid)
        ind["bb_band_width"]= float(band_width)
        ind["bb_pct_b"]     = float(pct_b)
        return df

    def _add_volume_analysis(self, df: pd.DataFrame, ind: dict) -> None:
        avg_vol_20  = df["Volume"].rolling(20).mean()
        last_vol    = df["Volume"].iloc[-1]
        avg_last    = avg_vol_20.iloc[-1]

        rel_vol = last_vol / avg_last if avg_last else 1.0

        # Detect if volume is accompanying a price move
        price_change_1d = df["Close"].pct_change().iloc[-1]
        volume_trend    = "neutral"
        if rel_vol > 1.5 and price_change_1d > 0:
            volume_trend = "bullish_confirmation"
        elif rel_vol > 1.5 and price_change_1d < 0:
            volume_trend = "bearish_confirmation"
        elif rel_vol < 0.7:
            volume_trend = "low_volume"

        ind["volume_last"]    = int(last_vol)
        ind["volume_avg_20"]  = float(avg_last) if not pd.isna(avg_last) else 0.0
        ind["relative_volume"]= float(rel_vol)
        ind["volume_trend"]   = volume_trend

    def _add_support_resistance(self, df: pd.DataFrame, ind: dict) -> None:
        # Use a 20-bar lookback for local support / resistance pivots
        window = min(20, len(df) // 4)
        highs  = df["High"].rolling(window).max()
        lows   = df["Low"].rolling(window).min()

        ind["resistance"] = float(highs.iloc[-1])
        ind["support"]    = float(lows.iloc[-1])
        ind["price_vs_support"]    = (df["Close"].iloc[-1] - ind["support"])    / ind["support"]
        ind["price_vs_resistance"] = (ind["resistance"] - df["Close"].iloc[-1]) / ind["resistance"]

    # ── Scoring sub-functions ────────────────────────────────────────────────

    def _score_rsi(self, ind: dict) -> Tuple[float, list]:
        rsi    = ind.get("rsi", 50.0)
        signals = []

        if rsi < 30:
            score = 80.0
            signals.append(f"RSI = {rsi:.1f} — strongly oversold (bullish reversal potential)")
        elif rsi < 40:
            score = 65.0
            signals.append(f"RSI = {rsi:.1f} — approaching oversold territory")
        elif rsi < 55:
            score = 50.0
            signals.append(f"RSI = {rsi:.1f} — neutral momentum")
        elif rsi < 65:
            score = 45.0
            signals.append(f"RSI = {rsi:.1f} — momentum leaning bullish but watch for overbought")
        elif rsi < 70:
            score = 35.0
            signals.append(f"RSI = {rsi:.1f} — approaching overbought territory")
        else:
            score = 20.0
            signals.append(f"RSI = {rsi:.1f} — strongly overbought (bearish reversal risk)")

        return score, signals

    def _score_macd(self, ind: dict) -> Tuple[float, list]:
        macd      = ind.get("macd", 0)
        sig       = ind.get("macd_sig", 0)
        hist      = ind.get("macd_hist", 0)
        prev_macd = ind.get("macd_prev", 0)
        prev_sig  = ind.get("macd_sig_prev", 0)
        signals   = []

        # Detect crossovers in the last bar
        bullish_cross = (macd > sig) and (prev_macd <= prev_sig)
        bearish_cross = (macd < sig) and (prev_macd >= prev_sig)

        if bullish_cross:
            score = 80.0
            signals.append("MACD bullish crossover detected — strong buy signal")
        elif bearish_cross:
            score = 20.0
            signals.append("MACD bearish crossover detected — strong sell signal")
        elif macd > sig and hist > 0:
            score = 65.0
            signals.append("MACD above signal line with positive histogram — bullish")
        elif macd < sig and hist < 0:
            score = 35.0
            signals.append("MACD below signal line with negative histogram — bearish")
        else:
            score = 50.0
            signals.append("MACD is neutral")

        # Adjust for histogram momentum (is histogram expanding?)
        if abs(hist) > 0:
            # Histogram convergence / divergence
            pass  # Already factored in above

        return score, signals

    def _score_trend(self, df: pd.DataFrame, ind: dict) -> Tuple[float, list]:
        price  = ind.get("price", df["Close"].iloc[-1])
        sma20  = ind.get("sma_short")
        sma50  = ind.get("sma_medium")
        sma200 = ind.get("sma_long")
        score  = 50.0
        signals = []

        # Price vs moving averages
        if sma20 and not pd.isna(sma20):
            if price > sma20:
                score += 8
                signals.append(f"Price above SMA-{config.SMA_SHORT} (short-term trend up)")
            else:
                score -= 8
                signals.append(f"Price below SMA-{config.SMA_SHORT} (short-term trend down)")

        if sma50 and not pd.isna(sma50):
            if price > sma50:
                score += 10
                signals.append(f"Price above SMA-{config.SMA_MEDIUM} (medium-term trend up)")
            else:
                score -= 10
                signals.append(f"Price below SMA-{config.SMA_MEDIUM} (medium-term trend down)")

        if sma200 and not pd.isna(sma200):
            if price > sma200:
                score += 8
                signals.append(f"Price above SMA-{config.SMA_LONG} (long-term trend up)")
            else:
                score -= 8
                signals.append(f"Price below SMA-{config.SMA_LONG} (long-term trend down)")

        # Golden/Death cross: SMA50 vs SMA200
        if sma50 and sma200 and not pd.isna(sma50) and not pd.isna(sma200):
            if sma50 > sma200:
                score += 5
                signals.append("Golden cross: SMA-50 above SMA-200 (macro bullish)")
            else:
                score -= 5
                signals.append("Death cross: SMA-50 below SMA-200 (macro bearish)")

        return float(np.clip(score, 0, 100)), signals

    def _score_bollinger(self, df: pd.DataFrame, ind: dict) -> Tuple[float, list]:
        pct_b  = ind.get("bb_pct_b", 0.5)
        bw     = ind.get("bb_band_width", 0)
        signals = []

        if pd.isna(pct_b):
            return 50.0, ["Bollinger Bands: insufficient data"]

        if pct_b < 0.1:
            score = 75.0
            signals.append("Price near lower Bollinger Band — potential reversal to upside")
        elif pct_b < 0.3:
            score = 60.0
            signals.append("Price in lower Bollinger Band zone — mildly oversold")
        elif pct_b < 0.7:
            score = 50.0
            signals.append("Price in Bollinger Band midzone — neutral")
        elif pct_b < 0.9:
            score = 40.0
            signals.append("Price in upper Bollinger Band zone — mildly overbought")
        else:
            score = 25.0
            signals.append("Price near upper Bollinger Band — potential reversal to downside")

        # Band squeeze (low volatility often precedes breakout)
        if bw < 0.05:
            signals.append("Bollinger Band squeeze detected — breakout may be imminent")

        return score, signals

    def _score_volume(self, ind: dict) -> Tuple[float, list]:
        rel_vol = ind.get("relative_volume", 1.0)
        vtrend  = ind.get("volume_trend", "neutral")
        signals = []

        if vtrend == "bullish_confirmation":
            score = 70.0
            signals.append(f"High volume ({rel_vol:.1f}x avg) confirming upward price move")
        elif vtrend == "bearish_confirmation":
            score = 30.0
            signals.append(f"High volume ({rel_vol:.1f}x avg) confirming downward price move")
        elif vtrend == "low_volume":
            score = 50.0
            signals.append("Low volume — current price move lacks conviction")
        else:
            score = 50.0
            signals.append(f"Volume at {rel_vol:.1f}x 20-day average — neutral")

        return score, signals

    def _score_support_resistance(self, df: pd.DataFrame, ind: dict) -> Tuple[float, list]:
        pct_support    = ind.get("price_vs_support", 0)
        pct_resistance = ind.get("price_vs_resistance", 0)
        signals        = []

        # Closer to support = more bullish (potential bounce); closer to resistance = bearish
        if pct_support < 0.02:
            score = 70.0
            signals.append(f"Price near support level ${ind['support']:.2f} — potential bounce")
        elif pct_resistance < 0.02:
            score = 35.0
            signals.append(f"Price near resistance level ${ind['resistance']:.2f} — may face rejection")
        else:
            score = 50.0
            signals.append(
                f"Support: ${ind['support']:.2f} | Resistance: ${ind['resistance']:.2f}"
            )

        return score, signals
