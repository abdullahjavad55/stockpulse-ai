"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Radio, RotateCcw, AlertCircle, Clock, Bookmark } from "lucide-react";

import { analyzeStock, scanMarket, type AnalysisResult, type ScanResult } from "@/lib/api";
import { ResultCard } from "@/components/ResultCard";
import { ScannerResults } from "@/components/ScannerResults";
import { LoadingState } from "@/components/LoadingState";

/* ── Recent tickers (localStorage) ─────────────────────────────────────────── */
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

/* ── Daily scan limit (localStorage) ────────────────────────────────────────── */
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

/* ── Strategy selector ──────────────────────────────────────────────────────── */
type Strategy = "short_term" | "long_term";

function StrategyToggle({
  value,
  onChange,
}: {
  value: Strategy;
  onChange: (v: Strategy) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-bg-border overflow-hidden">
      {(["short_term", "long_term"] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${
            value === s
              ? "bg-brand text-white"
              : "text-slate-400 hover:text-white hover:bg-bg-hover"
          }`}
        >
          {s === "short_term" ? "Short-Term" : "Long-Term"}
        </button>
      ))}
    </div>
  );
}

/* ── Main dashboard ─────────────────────────────────────────────────────────── */
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

  const { recent, push } = useRecent();
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
        <h1 className="text-3xl font-extrabold mb-1">Dashboard</h1>
        <p className="text-slate-400 text-sm">
          Enter a ticker or run the market scanner to get AI-powered insights.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setMode("analyze")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            mode === "analyze"
              ? "bg-brand/20 text-brand-light border border-brand/40"
              : "text-slate-400 hover:text-white border border-transparent"
          }`}
        >
          <Search size={15} /> Analyze Stock
        </button>
        <button
          onClick={() => { setMode("scan"); setScanData(null); setResult(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            mode === "scan"
              ? "bg-brand/20 text-brand-light border border-brand/40"
              : "text-slate-400 hover:text-white border border-transparent"
          }`}
        >
          <Radio size={15} /> Scan Market
        </button>
      </div>

      {/* Control panel */}
      <div className="glass-card p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Ticker input (only in analyze mode) */}
          {mode === "analyze" && (
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
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

          {/* Strategy toggle */}
          <StrategyToggle value={strategy} onChange={setStrategy} />

          {/* Action button */}
          {mode === "analyze" ? (
            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !ticker.trim()}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <><RotateCcw size={14} className="animate-spin" /> Analysing…</>
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
                <><RotateCcw size={14} className="animate-spin" /> Scanning…</>
              ) : (
                <><Radio size={14} /> Scan Now</>
              )}
            </button>
          )}
        </div>

        {/* Recent tickers */}
        {mode === "analyze" && recent.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Bookmark size={11} /> Recent:
            </span>
            {recent.map((t) => (
              <button
                key={t}
                onClick={() => { setTicker(t); handleAnalyze(t); }}
                className="text-xs font-mono px-2 py-1 rounded-lg bg-bg-hover border border-bg-border text-slate-300 hover:border-brand/50 hover:text-brand-light transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Scan limit badge */}
        {mode === "scan" && (
          <p className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <Clock size={11} />
            {remaining > 0
              ? `${remaining} scan${remaining !== 1 ? "s" : ""} remaining today`
              : "Daily limit reached — resets at midnight"}
          </p>
        )}
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
          message={
            mode === "scan"
              ? "Scanning 20 NASDAQ stocks — this can take up to 60 s on first run…"
              : `Analysing ${ticker}…`
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
            <ScannerResults data={scanData} onSelect={(sym) => { setMode("analyze"); setTicker(sym); handleAnalyze(sym); }} />
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
