"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Radio, RotateCcw, AlertCircle, Clock, Bookmark,
  TrendingUp, BarChart2, Zap, LineChart,
} from "lucide-react";

import { analyzeStock, scanMarket, type AnalysisResult, type ScanResult } from "@/lib/api";
import { ResultCard }      from "@/components/ResultCard";
import { ScannerResults }  from "@/components/ScannerResults";
import { LoadingState }    from "@/components/LoadingState";

/* Recent tickers (localStorage) */
function useRecent() {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sp_recent");
      if (stored) setRecent(JSON.parse(stored).slice(0, 6));
    } catch {}
  }, []);
  const push = (ticker: string) => {
    setRecent((prev) => {
      const next = [ticker, ...prev.filter((t) => t !== ticker)].slice(0, 6);
      try { localStorage.setItem("sp_recent", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  return { recent, push };
}

/* Daily scan limit (localStorage) */
const DAILY_LIMIT = 5;
function useDailyLimit() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("sp_scans") || "{}");
      const today  = new Date().toDateString();
      if (stored.date === today) setCount(stored.count ?? 0);
    } catch {}
  }, []);
  const increment = () => {
    setCount((prev) => {
      const next  = prev + 1;
      const today = new Date().toDateString();
      try { localStorage.setItem("sp_scans", JSON.stringify({ date: today, count: next })); } catch {}
      return next;
    });
  };
  const remaining = Math.max(0, DAILY_LIMIT - count);
  return { count, remaining, increment };
}

/* Strategy selector */
type Strategy = "short_term" | "long_term";

const STRATEGY_CONFIG = {
  short_term: {
    label:    "Short-Term",
    focus:    "RSI, MACD, momentum signals",
    icon:     Zap,
    timeframe:"Days to weeks",
    desc:     "Momentum-focused. Weights RSI and MACD heavily to identify near-term price moves.",
  },
  long_term: {
    label:    "Long-Term",
    focus:    "Trend, fundamentals, stability",
    icon:     LineChart,
    timeframe:"Months to years",
    desc:     "Stability-focused. Weights trend regression and fundamentals to find quality compounders.",
  },
} as const;

function StrategyToggle({
  value,
  onChange,
}: {
  value: Strategy;
  onChange: (v: Strategy) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex rounded-xl border border-bg-border overflow-hidden bg-bg-card">
        {(["short_term", "long_term"] as const).map((s) => {
          const cfg  = STRATEGY_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                value === s
                  ? "bg-brand text-white shadow-lg shadow-brand/30"
                  : "text-slate-400 hover:text-white hover:bg-bg-hover"
              }`}
            >
              <Icon size={13} />
              {cfg.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 px-1">
        <span className="text-slate-400 font-medium">{STRATEGY_CONFIG[value].timeframe}.</span>{" "}
        {STRATEGY_CONFIG[value].desc}
      </p>
    </div>
  );
}

/* Main dashboard */
function DashboardContent() {
  const searchParams = useSearchParams();
  const initialMode  = searchParams.get("mode") === "scan" ? "scan" : "analyze";

  const [mode,     setMode]     = useState<"analyze" | "scan">(initialMode as "analyze" | "scan");
  const [ticker,   setTicker]   = useState("");
  const [strategy, setStrategy] = useState<Strategy>("short_term");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [result,   setResult]   = useState<AnalysisResult | null>(null);
  const [scanData, setScanData] = useState<ScanResult | null>(null);

  const { recent, push }    = useRecent();
  const { remaining, increment } = useDailyLimit();

  const handleAnalyze = useCallback(
    async (sym?: string) => {
      const t = (sym ?? ticker).toUpperCase().trim();
      if (!t) return;
      setLoading(true);
      setError(null);
      setResult(null);
      setScanData(null);
      try {
        const data = await analyzeStock(t, strategy);
        setResult(data);
        push(t);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [ticker, strategy, push]
  );

  const handleScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setScanData(null);
    increment();
    try {
      const data = await scanMarket(strategy === "short_term" ? "short_term" : "both");
      setScanData(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [strategy, increment]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Dashboard</h1>
        <p className="text-slate-400 text-sm">
          Enter a ticker or scan the market to get data-driven buy, hold, or sell signals.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-2 mb-6">
        {([
          { id: "analyze", label: "Analyze Stock", icon: Search },
          { id: "scan",    label: "Scan Market",   icon: Radio  },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setMode(id); if (id === "scan") { setScanData(null); setResult(null); }}}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
              mode === id
                ? "bg-brand/15 text-brand-light border border-brand/35 shadow-sm shadow-brand/10"
                : "text-slate-400 hover:text-white border border-transparent hover:border-bg-border"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Control panel */}
      <div className="glass-card p-5 mb-8 border-bg-border/80">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-start">
            {/* Ticker input */}
            {mode === "analyze" && (
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder="Ticker symbol (e.g. AAPL, NVDA)"
                  className="input-field pl-10 font-mono"
                  maxLength={10}
                />
              </div>
            )}

            {/* Action button */}
            <div className="flex items-start gap-3">
              {mode === "analyze" ? (
                <button
                  onClick={() => handleAnalyze()}
                  disabled={loading || !ticker.trim()}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? (
                    <><RotateCcw size={14} className="animate-spin" /> Analysing...</>
                  ) : (
                    <><Search size={14} /> Analyse</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleScan}
                  disabled={loading || remaining === 0}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? (
                    <><RotateCcw size={14} className="animate-spin" /> Scanning...</>
                  ) : (
                    <><Radio size={14} /> Scan Now</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Strategy selector */}
          <div className="border-t border-bg-border pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Analysis Strategy</p>
            <StrategyToggle value={strategy} onChange={setStrategy} />
          </div>

          {/* Recent tickers */}
          {mode === "analyze" && recent.length > 0 && (
            <div className="border-t border-bg-border pt-3 flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-xs text-slate-500 self-center">
                <Bookmark size={11} /> Recent:
              </span>
              {recent.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTicker(t); handleAnalyze(t); }}
                  className="text-xs font-mono px-2.5 py-1 rounded-lg bg-bg-hover border border-bg-border text-slate-300 hover:border-brand/50 hover:text-brand-light transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Scan limit badge */}
          {mode === "scan" && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5 border-t border-bg-border pt-3">
              <Clock size={11} />
              {remaining > 0
                ? `${remaining} scan${remaining !== 1 ? "s" : ""} remaining today`
                : "Daily limit reached - resets at midnight"}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card border-red-500/30 bg-red-500/5 p-4 mb-6 flex items-start gap-3"
          >
            <AlertCircle size={17} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <LoadingState
          strategy={strategy}
          message={
            mode === "scan"
              ? "Scanning 20 NASDAQ stocks - this can take up to 60 s on first run..."
              : `Analysing ${ticker}...`
          }
        />
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ResultCard result={result} />
          </motion.div>
        )}

        {scanData && !loading && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ScannerResults
              data={scanData}
              onSelect={(sym) => { setMode("analyze"); setTicker(sym); handleAnalyze(sym); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
