"use client";

import { motion } from "framer-motion";
import { Activity, Zap, LineChart } from "lucide-react";

const STEPS_SHORT = [
  "Fetching 12 months of price data...",
  "Computing RSI and MACD signals...",
  "Measuring momentum across timeframes...",
  "Scanning recent news sentiment...",
  "Calculating weighted score...",
];

const STEPS_LONG = [
  "Fetching 24 months of price data...",
  "Running trend regression analysis...",
  "Evaluating fundamentals and Sharpe ratio...",
  "Scanning news sentiment history...",
  "Calculating weighted score...",
];

interface LoadingStateProps {
  message?:  string;
  strategy?: "short_term" | "long_term";
}

export function LoadingState({ message, strategy = "short_term" }: LoadingStateProps) {
  const steps     = strategy === "long_term" ? STEPS_LONG : STEPS_SHORT;
  const StratIcon = strategy === "long_term" ? LineChart : Zap;
  const stratLabel= strategy === "long_term" ? "Long-Term" : "Short-Term";

  return (
    <div className="glass-card p-10 flex flex-col items-center text-center animate-fade-in">
      {/* Animated rings */}
      <div className="relative w-16 h-16 mb-5">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-brand/25"
          animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-brand/15"
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.2, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-brand/10"
          animate={{ scale: [1, 2.1, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.2, delay: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          >
            <Activity size={22} className="text-brand-light" />
          </motion.div>
        </div>
      </div>

      {/* Strategy badge */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-light bg-brand/10 border border-brand/20 rounded-full px-3 py-1 mb-3">
        <StratIcon size={11} />
        {stratLabel} Analysis
      </div>

      <p className="text-sm font-semibold text-slate-200 mb-1">
        {message ?? "Running analysis..."}
      </p>
      <p className="text-xs text-slate-500 mb-6">Results are cached for 1 hour after first run</p>

      {/* Step shimmer */}
      <div className="w-full max-w-xs space-y-2.5">
        {steps.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: [0, 0.75, 0.35] }}
            transition={{
              delay: i * 0.65,
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: steps.length * 0.65,
            }}
            className="flex items-center gap-2.5 text-xs text-slate-500"
          >
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-brand/60 shrink-0"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ delay: i * 0.65, duration: 0.5, repeat: Infinity, repeatDelay: steps.length * 0.65 }}
            />
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
