"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Clock, ExternalLink } from "lucide-react";
import type { ScanResult, AnalysisResult } from "@/lib/api";

const REC_COLOR: Record<string, string> = {
  strong_buy:  "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  buy:         "text-green-400   border-green-500/30   bg-green-500/10",
  hold:        "text-amber-400   border-amber-500/30   bg-amber-500/10",
  sell:        "text-orange-400  border-orange-500/30  bg-orange-500/10",
  strong_sell: "text-red-400     border-red-500/30     bg-red-500/10",
};

function ScoreBar({ score }: { score: number }) {
  const pct  = Math.round(score);
  const cls  = pct >= 70 ? "bg-emerald-500" : pct >= 58 ? "bg-green-500" : pct >= 42 ? "bg-amber-500" : pct >= 30 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 rounded-full bg-bg-border overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${cls}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-bold font-mono" style={{ color: undefined }}>
        {pct}
      </span>
    </div>
  );
}

function StockMiniCard({
  result,
  rank,
  onSelect,
}: {
  result:   AnalysisResult;
  rank:     number;
  onSelect: (sym: string) => void;
}) {
  const recKey = result.recommendation_key ?? "hold";
  const cls    = REC_COLOR[recKey] ?? REC_COLOR.hold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.07 }}
      className="glass-card p-4 hover:border-brand/40 transition-colors cursor-pointer group"
      onClick={() => onSelect(result.symbol)}
    >
      {/* Rank + symbol */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-bold w-5">#{rank + 1}</span>
          <div>
            <span className="font-extrabold text-base">{result.symbol}</span>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{result.name}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${cls}`}>
          {result.recommendation}
        </span>
      </div>

      {/* Price */}
      {result.price && (
        <p className="text-sm font-semibold text-slate-200 mb-1">
          ${result.price.toFixed(2)}
        </p>
      )}

      {/* Score bar */}
      <ScoreBar score={result.final_score ?? 50} />

      {/* Pillar mini scores */}
      <div className="flex gap-3 mt-3">
        {[
          { label: "T", score: result.technical_score,  title: "Technical"  },
          { label: "Q", score: result.quant_score,      title: "Quant"      },
          { label: "S", score: result.sentiment_score,  title: "Sentiment"  },
        ].map(({ label, score, title }) => (
          <div key={label} className="flex flex-col items-center" title={title}>
            <span className="text-[10px] text-slate-600">{label}</span>
            <span className="text-xs font-mono font-semibold text-slate-300">{Math.round(score ?? 50)}</span>
          </div>
        ))}
      </div>

      {/* Reasoning preview */}
      {result.reasoning?.[0] && (
        <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
          {result.reasoning[0]}
        </p>
      )}

      {/* CTA */}
      <div className="flex items-center gap-1 mt-3 text-xs text-brand-light opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
        Full Analysis <ExternalLink size={11} />
      </div>
    </motion.div>
  );
}

interface ScannerResultsProps {
  data:     ScanResult;
  onSelect: (sym: string) => void;
}

export function ScannerResults({ data, onSelect }: ScannerResultsProps) {
  const scannedAt = data.scanned_at ? new Date(data.scanned_at).toLocaleTimeString() : "—";

  const sections = [
    { key: "short_term", label: "Top Short-Term Picks", icon: TrendingUp,    color: "text-blue-400"   },
    { key: "long_term",  label: "Top Long-Term Picks",  icon: Activity,       color: "text-violet-400" },
  ].filter((s) => !!data.results?.[s.key]?.length);

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Market Scan Results</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock size={11} />
          Scanned at {scannedAt}
        </span>
      </div>

      {sections.map(({ key, label, icon: Icon, color }) => {
        const stocks = data.results[key];
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-4">
              <Icon size={16} className={color} />
              <h3 className={`font-bold ${color}`}>{label}</h3>
              <span className="text-xs text-slate-600 ml-auto">
                {data.universe?.length} stocks scanned
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {stocks.map((stock, i) => (
                <StockMiniCard key={stock.symbol} result={stock} rank={i} onSelect={onSelect} />
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-slate-600 text-center">
        ⚠️ For educational purposes only. Not financial advice.
      </p>
    </div>
  );
}
