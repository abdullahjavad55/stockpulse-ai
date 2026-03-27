"""
sentiment/analyzer.py — Financial news sentiment analysis using VADER.

VADER (Valence Aware Dictionary and sEntiment Reasoner) is purpose-built
for short, social-media-style text and generalises well to financial
headlines without requiring GPU resources.

The analyser also injects a custom finance-specific lexicon on top of
VADER's default word-valence dictionary to better capture market language
(e.g., "beats", "misses", "downgrade", "outperform").

Output: sentiment score mapped to 0–100 (50 = neutral, >50 = bullish, <50 = bearish).
"""

import logging
import re
import string
from collections import Counter
from typing import Any, Dict, List

import nltk

# Ensure required NLTK data is present (silently downloads if missing)
for resource in ["vader_lexicon", "punkt", "stopwords"]:
    try:
        nltk.data.find(f"{'tokenizers' if resource == 'punkt' else 'corpora' if resource == 'stopwords' else 'sentiment'}/{resource}")
    except LookupError:
        nltk.download(resource, quiet=True)

from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.corpus import stopwords

logger = logging.getLogger(__name__)

# ── Finance-specific lexicon additions ───────────────────────────────────────
# Values follow VADER convention: positive float = positive sentiment.
FINANCE_LEXICON: Dict[str, float] = {
    # Bullish language
    "beats":         2.5, "beat":          2.0,
    "outperform":    2.0, "outperforms":   2.0,
    "upgrade":       2.0, "upgraded":      2.0,
    "bullish":       2.5, "bull":          1.5,
    "rally":         1.8, "rallied":       1.5,
    "record":        1.5, "record-high":   2.0,
    "surge":         2.0, "surged":        2.0,
    "soar":          2.0, "soared":        2.0,
    "skyrocket":     2.5, "skyrocketed":   2.5,
    "guidance_raise":2.5, "raise":         1.0,
    "buyback":       1.5, "buy-back":      1.5,
    "dividend":      1.0, "acquisition":   0.5,
    "overweight":    1.5, "strong buy":    2.5,
    "upside":        1.5, "growth":        1.0,
    "profitable":    1.5, "profit":        1.0,
    "recover":       1.2, "recovery":      1.2,
    "innovation":    0.8, "breakthrough":  1.5,
    "partnership":   0.8, "expansion":     1.0,
    # Bearish language
    "misses":       -2.5, "miss":         -2.0,
    "underperform": -2.0, "underperforms":-2.0,
    "downgrade":    -2.0, "downgraded":   -2.0,
    "bearish":      -2.5, "bear":         -1.5,
    "crash":        -2.5, "crashed":      -2.5,
    "plunge":       -2.5, "plunged":      -2.5,
    "tumble":       -2.0, "tumbled":      -2.0,
    "selloff":      -2.0, "sell-off":     -2.0,
    "layoffs":      -1.5, "layoff":       -1.5,
    "scandal":      -2.5, "fraud":        -3.0,
    "lawsuit":      -1.5, "recall":       -2.0,
    "bankruptcy":   -3.0, "default":      -2.5,
    "guidance_cut": -2.5, "cut":          -1.0,
    "loss":         -1.5, "losses":       -1.5,
    "debt":         -0.5, "concern":      -1.0,
    "warning":      -1.5, "risk":         -0.8,
    "investigation":-2.0, "probe":        -1.5,
    "weaker":       -1.5, "disappoints":  -2.0,
    "deterioration":-1.8, "headwinds":    -1.2,
}

# Common English stopwords (used in theme extraction)
try:
    _STOP_WORDS = set(stopwords.words("english"))
except Exception:
    _STOP_WORDS = set()


class SentimentAnalyzer:
    """
    Analyses a list of news article dicts and returns a sentiment score (0–100)
    and a summary of dominant themes.
    """

    def __init__(self) -> None:
        self._vader = SentimentIntensityAnalyzer()
        # Inject finance-specific lexicon
        self._vader.lexicon.update(FINANCE_LEXICON)
        logger.debug("SentimentAnalyzer initialised with %d finance lexicon entries", len(FINANCE_LEXICON))

    # ── Public API ────────────────────────────────────────────────────────────

    def analyze(self, articles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Score a list of news articles.

        Parameters
        ----------
        articles : list of dicts with 'title' and/or 'description' keys.

        Returns
        -------
        dict:
          score         – 0–100 (50 neutral, higher = more bullish)
          raw_compound  – raw VADER compound average (–1 to +1)
          article_count – number of articles analysed
          positive_pct  – % of articles that are positive
          negative_pct  – % of articles that are negative
          themes        – list of key theme strings
          signals       – human-readable signal strings
        """
        if not articles:
            return {
                "score":         50.0,
                "raw_compound":  0.0,
                "article_count": 0,
                "positive_pct":  0.0,
                "negative_pct":  0.0,
                "themes":        [],
                "signals":       ["No news data available — sentiment score set to neutral"],
            }

        scores_compound: List[float] = []
        all_text: List[str]          = []

        for art in articles:
            text = self._combine_text(art)
            if not text:
                continue

            cleaned = self._clean_text(text)
            all_text.append(cleaned)

            vs = self._vader.polarity_scores(cleaned)
            scores_compound.append(vs["compound"])

        if not scores_compound:
            return {
                "score": 50.0, "raw_compound": 0.0,
                "article_count": 0, "positive_pct": 0.0, "negative_pct": 0.0,
                "themes": [], "signals": ["Could not extract text from news articles"],
            }

        avg_compound = sum(scores_compound) / len(scores_compound)
        pos_count    = sum(1 for s in scores_compound if s >  0.05)
        neg_count    = sum(1 for s in scores_compound if s < -0.05)
        n            = len(scores_compound)

        # Map compound (–1 to +1) → 0–100
        mapped_score = (avg_compound + 1) / 2 * 100

        themes  = self._extract_themes(all_text)
        signals = self._build_signals(avg_compound, pos_count, neg_count, n, themes)

        return {
            "score":         round(float(mapped_score), 2),
            "raw_compound":  round(float(avg_compound),  4),
            "article_count": n,
            "positive_pct":  round(pos_count / n * 100, 1),
            "negative_pct":  round(neg_count / n * 100, 1),
            "themes":        themes,
            "signals":       signals,
        }

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _combine_text(article: Dict[str, Any]) -> str:
        """Combine title and description into a single string."""
        parts = []
        if article.get("title"):
            parts.append(str(article["title"]))
        if article.get("description"):
            parts.append(str(article["description"]))
        return " ".join(parts)

    @staticmethod
    def _clean_text(text: str) -> str:
        """
        Normalise text for sentiment scoring.
        Removes URLs, HTML entities, extra whitespace.  Preserves case because
        VADER relies on capitalisation (ALL-CAPS = emphasis).
        """
        text = re.sub(r"https?://\S+", "", text)            # URLs
        text = re.sub(r"<[^>]+>",      "", text)            # HTML tags
        text = re.sub(r"&\w+;",        " ", text)           # HTML entities
        text = re.sub(r"\s+",          " ", text).strip()   # whitespace
        return text

    @staticmethod
    def _extract_themes(texts: List[str]) -> List[str]:
        """
        Return the top-5 non-trivial words / bigrams from the corpus to surface
        dominant themes without using heavy NLP libraries.
        """
        if not texts:
            return []

        all_tokens: List[str] = []
        for text in texts:
            words = re.sub(r"[^a-zA-Z\s]", "", text.lower()).split()
            tokens = [
                w for w in words
                if w not in _STOP_WORDS and len(w) > 3
                and w not in {"stock", "share", "shares", "market", "company", "says"}
            ]
            all_tokens.extend(tokens)

        # Unigram frequencies
        freq = Counter(all_tokens)
        return [word for word, _ in freq.most_common(5)]

    @staticmethod
    def _build_signals(
        compound: float,
        pos_count: int,
        neg_count: int,
        n: int,
        themes: List[str],
    ) -> List[str]:
        """Translate numeric sentiment into human-readable signals."""
        signals = []

        if compound >= 0.35:
            signals.append(
                f"Strong positive news sentiment (avg compound: {compound:+.2f}) — "
                f"{pos_count}/{n} articles bullish"
            )
        elif compound >= 0.10:
            signals.append(
                f"Mild positive news sentiment (avg compound: {compound:+.2f})"
            )
        elif compound <= -0.35:
            signals.append(
                f"Strong negative news sentiment (avg compound: {compound:+.2f}) — "
                f"{neg_count}/{n} articles bearish"
            )
        elif compound <= -0.10:
            signals.append(
                f"Mild negative news sentiment (avg compound: {compound:+.2f})"
            )
        else:
            signals.append(f"Neutral news sentiment (avg compound: {compound:+.2f})")

        if themes:
            signals.append(f"Key themes: {', '.join(themes)}")

        return signals
