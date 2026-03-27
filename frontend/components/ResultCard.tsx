"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, BarChart2, MessageSquare,
  ChevronDown, ChevronUp, Clock, DollarSign, Activity,
} from "lucide-react";
import type { AnalysisResult } from "@/lib/api";
import { ScoreGauge }  from "@/components/ScoreGauge";
import { PriceChart }  from "@/components/PriceChart";

/* ── Recommendation badge config ─────────────────────────────────────────────── */
const REC_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  strong_buy:  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", icon: TrendingUp   },
  buy:         { bg: "bg-green-500/15",   text: "text-green-400",   border: "border-green-500/30",   icon: TrendingUp   },
  hold:        { bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/30",   icon: Activity     },
  sell:        { bg: "bg-orange-500/15",  text: "text-orange-400",  border: "border-orange-500/30",  icon: TrendingDown },
  strong_sell: { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/30",     icon: TrendingDown },
};

function RecBadge({ recKey, label }: { recKey: string; label: string }) {
  const cfg = REC_CONFIG[recKey] ?? REC_CONFIG.hold;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}

/* ── Confidence bar ──────────────────────────────────────────────────────────── */
function ConfidenceBar({ score }: { score: number }) {
  const pct      = Math.round(score);
  const colorCls = pct >= 70 ? "bg-emerald-500" : pct >= 58 ? "bg-green-500" : pct >= 42 ? "bg-amber-500" : pct >= 30 ? "bg-orange-500" : "bg-red-500";
  const label    = pct >= 75 ? "High" : pct >= 55 ? "Moderate" : "Low";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-bg-border overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colorCls}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">
        {label} Confidence ({pct}/100)
      </span>
    </div>
  );
}

/* ── Metric row ──────────────────────────────────────────────────────────────── */
function MetricRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-bg-border last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-200 font-mono">{value}</span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */
export function ResultCard({ result }: { result: AnalysisResult }) {
  const [showDetails, setShowDetails] = useState(false);

  const recKey = result.recommendation_key ?? "hold";
  const cfg    = REC_CONFIG[recKey] ?? REC_CONFIG.hold;

  const updatedAt = result.analyzed_at
    ? new Date(result.analyzed_at).toLocaleTimeString()
    : "—";

  /* Fundamentals shortlist */
  const fund = result.fundamentals ?? {};

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className={`border-b border-bg-border px-6 py-5 ${cfg.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold">{result.symbol}</h2>
              <RecBadge recKey={recKey} label={result.recommendation} />
            </div>
            <p className="text-slate-400 text-sm mt-0.5 line-clamp-1">{result.name}</p>
          </div>

          <div className="flex items-center gap-4">
            {result.price && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-xl font-bold">
                  <DollarSign size={16} className="text-slate-400" />
                  {result.price.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                  <Clock size={10} /> {updatedAt}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-4">
          <ConfidenceBar score={result.final_score ?? 50} />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* ── Score gauges ─────────────────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Pillar Scores</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            <ScoreGauge score={result.final_score ?? 50}      label="Final"      size={92} />
            <ScoreGauge score={result.technical_score ?? 50}  label="Technical"  size={80} />
            <ScoreGauge score={result.quant_score ?? 50}      label="Quant"      size={80} />
            <ScoreGauge score={result.sentiment_score ?? 50}  label="Sentiment"  size={80} />
          </div>
        </div>

        {/* ── Price chart ──────────────────────────────────────────────── */}
        {result.price_history && result.price_history.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Price History</h3>
            <PriceChart data={result.price_history} symbol={result.symbol} />
          </div>
        )}

        {/* ── Reasoning ────────────────────────────────────────────────── */}
        {result.reasoning && result.reasoning.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Key Reasoning</h3>
            <ul className="space-y-2">
              {result.reasoning.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className={`mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full ${cfg.text.replace("text-", "bg-")}`} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Detailed signals (collapsible) ────────────────────────────── */}
        <div>
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-2 text-sm text-brand-light hover:text-brand font-semibold transition-colors"
          >
            {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {showDetails ? "Hide" : "Show"} detailed signals & metrics
          </button>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 grid sm:grid-cols-3 gap-4"
            >
              {/* Technical signals */}
              {result.technical_signals && result.technical_signals.length > 0 && (
                <div className="glass-card !rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 size={14} className="text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase">Technical</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.technical_signals.map((s, i) => (
                      <li key={i} className="text-xs text-slate-400 leading-snug">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quant signals */}
              {result.quant_signals && result.quant_signals.length > 0 && (
                <div className="glass-card !rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-violet-400" />
                    <span className="text-xs font-bold text-violet-400 uppercase">Quant</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.quant_signals.map((s, i) => (
                      <li key={i} className="text-xs text-slate-400 leading-snug">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sentiment signals */}
              {result.sentiment_signals && result.sentiment_signals.length > 0 && (
                <div className="glass-card !rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase">Sentiment</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.sentiment_signals.map((s, i) => (
                      <li key={i} className="text-xs text-slate-400 leading-snug">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Fundamentals mini-table */}
          {showDetails && fund && (
            <div className="mt-4 glass-card !rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Fundamentals</p>
              <div className="grid sm:grid-cols-2 gap-x-8">
                <MetricRow label="P/E Ratio"        value={fund.pe_ratio       ? fund.pe_ratio.toFixed(1)       : null} />
                <MetricRow label="ROE"              value={fund.roe            ? (fund.roe * 100).toFixed(1) + "%" : null} />
                <MetricRow label="Profit Margin"    value={fund.profit_margin  ? (fund.profit_margin * 100).toFixed(1) + "%" : null} />
                <MetricRow label="Revenue Growth"   value={fund.revenue_growth ? (fund.revenue_growth * 100).toFixed(1) + "%" : null} />
                <MetricRow label="Debt / Equity"    value={fund.debt_to_equity ? fund.debt_to_equity.toFixed(2) : null} />
                <MetricRow label="Beta"             value={fund.beta           ? fund.beta.toFixed(2)           : null} />
              </div>
            </div>
          )}
        </div>

        {/* Strategy badge */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-bg-border pt-4">
          <span>Strategy: <strong className="text-slate-300">{result.strategy === "short_term" ? "Short-Term" : "Long-Term"}</strong></span>
          <span className="text-slate-600">⚠️ Not financial advice</span>
        </div>
      </div>
    </div>
  );
}
