"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, BarChart2, MessageSquare,
  ChevronDown, ChevronUp, Clock, DollarSign, Activity,
  Zap, LineChart, Shield,
} from "lucide-react";
import type { AnalysisResult } from "@/lib/api";
import { ScoreGauge }  from "@/components/ScoreGauge";
import { PriceChart }  from "@/components/PriceChart";

/* Recommendation badge config */
const REC_CONFIG: Record<string, {
  bg: string; text: string; border: string; glow: string; icon: React.ElementType;
}> = {
  strong_buy:  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/40", glow: "shadow-[0_0_24px_rgba(34,197,94,0.25)]",  icon: TrendingUp   },
  buy:         { bg: "bg-green-500/15",   text: "text-green-400",   border: "border-green-500/40",   glow: "shadow-[0_0_20px_rgba(74,222,128,0.20)]",  icon: TrendingUp   },
  hold:        { bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/40",   glow: "shadow-[0_0_16px_rgba(251,191,36,0.20)]",  icon: Activity     },
  sell:        { bg: "bg-orange-500/15",  text: "text-orange-400",  border: "border-orange-500/40",  glow: "shadow-[0_0_16px_rgba(249,115,22,0.20)]",  icon: TrendingDown },
  strong_sell: { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/40",     glow: "shadow-[0_0_24px_rgba(239,68,68,0.25)]",   icon: TrendingDown },
};

/* Strategy display config */
const STRATEGY_INFO = {
  short_term: {
    label:       "Short-Term",
    icon:        Zap,
    color:       "text-blue-400",
    bg:          "bg-blue-500/10 border-blue-500/25",
    focus:       "RSI, MACD, momentum",
    weights:     { technical: "50%", quant: "20%", sentiment: "30%" },
    techWeights: { "RSI": "35%", "MACD": "35%", "Trend": "15%", "BB": "10%", "Volume": "5%" },
    quantWeights:{ "Momentum": "55%", "Sharpe": "10%", "Trend": "5%", "Vol": "15%", "Fund.": "5%" },
    desc:        "Focuses on near-term momentum. RSI and MACD carry the most weight.",
  },
  long_term: {
    label:       "Long-Term",
    icon:        LineChart,
    color:       "text-violet-400",
    bg:          "bg-violet-500/10 border-violet-500/25",
    focus:       "Trend, fundamentals, stability",
    weights:     { technical: "30%", quant: "45%", sentiment: "25%" },
    techWeights: { "Trend": "45%", "BB": "15%", "Volume": "15%", "RSI": "10%", "MACD": "10%" },
    quantWeights:{ "Trend": "35%", "Sharpe": "30%", "Fund.": "20%", "Vol.": "5%", "Momentum": "5%" },
    desc:        "Focuses on sustainable growth. Trend regression and fundamentals carry the most weight.",
  },
};

function RecBadge({ recKey, label }: { recKey: string; label: string }) {
  const cfg  = REC_CONFIG[recKey] ?? REC_CONFIG.hold;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${cfg.glow}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}

/* Confidence bar */
function ConfidenceBar({ score }: { score: number }) {
  const pct      = Math.round(score);
  const colorCls = pct >= 70 ? "bg-emerald-500" : pct >= 58 ? "bg-green-500" : pct >= 42 ? "bg-amber-500" : pct >= 30 ? "bg-orange-500" : "bg-red-500";
  const label    = pct >= 75 ? "High" : pct >= 55 ? "Moderate" : "Low";
  const glowCls  = pct >= 70 ? "shadow-[0_0_10px_rgba(34,197,94,0.4)]" : pct >= 42 ? "shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "shadow-[0_0_10px_rgba(239,68,68,0.3)]";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-bg-border overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colorCls} ${glowCls}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
        {label} ({pct}/100)
      </span>
    </div>
  );
}

/* Pillar weight bar */
function WeightBar({ label, value, score }: { label: string; value: string; score: number }) {
  const colorCls = score >= 70 ? "bg-emerald-500/70" : score >= 42 ? "bg-amber-500/70" : "bg-red-500/70";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-20 shrink-0">{label} ({value})</span>
      <div className="flex-1 h-1.5 rounded-full bg-bg-border overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colorCls}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <span className="text-xs font-mono font-semibold text-slate-300 w-8 text-right">{Math.round(score)}</span>
    </div>
  );
}

/* Metric row */
function MetricRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-bg-border last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-200 font-mono">{value}</span>
    </div>
  );
}

/* Main component */
export function ResultCard({ result }: { result: AnalysisResult }) {
  const [showDetails, setShowDetails] = useState(false);

  const recKey    = result.recommendation_key ?? "hold";
  const cfg       = REC_CONFIG[recKey] ?? REC_CONFIG.hold;
  const strategy  = (result.strategy ?? "short_term") as "short_term" | "long_term";
  const stratInfo = STRATEGY_INFO[strategy] ?? STRATEGY_INFO.short_term;
  const StratIcon = stratInfo.icon;

  const updatedAt = result.analyzed_at
    ? new Date(result.analyzed_at).toLocaleTimeString()
    : "N/A";

  const fund = result.fundamentals ?? {};

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      {/* Header */}
      <div className={`border-b border-bg-border px-6 py-5 ${cfg.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold tracking-tight">{result.symbol}</h2>
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
          <p className="text-xs text-slate-500 mb-1.5">Confidence Score</p>
          <ConfidenceBar score={result.final_score ?? 50} />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Strategy context banner */}
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${stratInfo.bg}`}>
          <div className={`mt-0.5 p-1.5 rounded-lg bg-bg-card/50`}>
            <StratIcon size={14} className={stratInfo.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${stratInfo.color}`}>
                {stratInfo.label} Strategy
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{stratInfo.desc}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {Object.entries(stratInfo.weights).map(([k, v]) => (
                <span key={k} className="text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-400 capitalize">{k.replace("_", " ")}</span> {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Score gauges */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Pillar Scores</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <ScoreGauge score={result.final_score ?? 50}      label="Final"      size={96} />
            <ScoreGauge score={result.technical_score ?? 50}  label="Technical"  size={80} />
            <ScoreGauge score={result.quant_score ?? 50}      label="Quant"      size={80} />
            <ScoreGauge score={result.sentiment_score ?? 50}  label="Sentiment"  size={80} />
          </div>

          {/* Weighted breakdown bars */}
          <div className="space-y-2">
            <WeightBar
              label="Technical"
              value={stratInfo.weights.technical}
              score={result.technical_score ?? 50}
            />
            <WeightBar
              label="Quant"
              value={stratInfo.weights.quant}
              score={result.quant_score ?? 50}
            />
            <WeightBar
              label="Sentiment"
              value={stratInfo.weights.sentiment}
              score={result.sentiment_score ?? 50}
            />
          </div>
        </div>

        {/* Price chart */}
        {result.price_history && result.price_history.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Price History</h3>
            <PriceChart data={result.price_history} symbol={result.symbol} />
          </div>
        )}

        {/* Reasoning */}
        {result.reasoning && result.reasoning.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Key Signals</h3>
            <ul className="space-y-2">
              {result.reasoning.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className={`mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full ${cfg.text.replace("text-", "bg-")}`} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed signals (collapsible) */}
        <div>
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-2 text-sm text-brand-light hover:text-brand font-semibold transition-colors"
          >
            {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {showDetails ? "Hide" : "Show"} detailed signals and metrics
          </button>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 grid sm:grid-cols-3 gap-4"
            >
              {result.technical_signals && result.technical_signals.length > 0 && (
                <div className="glass-card !rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 size={14} className="text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase">Technical</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.technical_signals.map((s, i) => (
                      <li key={i} className="text-xs text-slate-400 leading-snug">&bull; {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.quant_signals && result.quant_signals.length > 0 && (
                <div className="glass-card !rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-violet-400" />
                    <span className="text-xs font-bold text-violet-400 uppercase">Quant</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.quant_signals.map((s, i) => (
                      <li key={i} className="text-xs text-slate-400 leading-snug">&bull; {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.sentiment_signals && result.sentiment_signals.length > 0 && (
                <div className="glass-card !rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase">Sentiment</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.sentiment_signals.map((s, i) => (
                      <li key={i} className="text-xs text-slate-400 leading-snug">&bull; {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Fundamentals table */}
          {showDetails && fund && (
            <div className="mt-4 glass-card !rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Fundamentals</p>
              <div className="grid sm:grid-cols-2 gap-x-8">
                <MetricRow label="P/E Ratio"      value={fund.pe_ratio       ? fund.pe_ratio.toFixed(1)             : null} />
                <MetricRow label="ROE"            value={fund.roe            ? (fund.roe * 100).toFixed(1) + "%"    : null} />
                <MetricRow label="Profit Margin"  value={fund.profit_margin  ? (fund.profit_margin * 100).toFixed(1) + "%" : null} />
                <MetricRow label="Revenue Growth" value={fund.revenue_growth ? (fund.revenue_growth * 100).toFixed(1) + "%" : null} />
                <MetricRow label="Debt / Equity"  value={fund.debt_to_equity ? fund.debt_to_equity.toFixed(2)       : null} />
                <MetricRow label="Beta"           value={fund.beta           ? fund.beta.toFixed(2)                 : null} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-bg-border pt-4">
          <span className="flex items-center gap-1.5">
            <Shield size={10} className="text-slate-600" />
            For educational purposes only - not financial advice
          </span>
          <span className="font-mono text-slate-600">{result.symbol} &middot; {stratInfo.label}</span>
        </div>
      </div>
    </div>
  );
}
