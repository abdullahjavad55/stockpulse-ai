"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";

const STEPS = [
  "Fetching price history…",
  "Computing technical indicators…",
  "Running quantitative analysis…",
  "Scanning news sentiment…",
  "Calculating final score…",
];

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="glass-card p-10 flex flex-col items-center text-center animate-fade-in">
      {/* Animated rings */}
      <div className="relative w-16 h-16 mb-6">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-brand/30"
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-brand/20"
          animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Activity size={22} className="text-brand-light" />
          </motion.div>
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-300 mb-1">
        {message ?? "Running analysis…"}
      </p>

      {/* Step shimmer */}
      <div className="mt-6 w-full max-w-xs space-y-2">
        {STEPS.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: [0, 0.7, 0.4] }}
            transition={{ delay: i * 0.6, duration: 0.6, repeat: Infinity, repeatDelay: STEPS.length * 0.6 }}
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <span className="w-1 h-1 rounded-full bg-brand-light/60 shrink-0" />
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
