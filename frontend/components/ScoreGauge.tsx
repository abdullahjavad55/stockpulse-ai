"use client";

import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  score:  number;   // 0-100
  label:  string;
  color?: string;   // override stroke colour
  size?:  number;
}

function scoreColor(score: number): string {
  if (score >= 70) return "#22C55E";   // green (strong buy)
  if (score >= 58) return "#4ade80";   // light green (buy)
  if (score >= 42) return "#fbbf24";   // amber (hold)
  if (score >= 30) return "#f97316";   // orange (sell)
  return "#EF4444";                     // red (strong sell)
}

function scoreGlow(score: number): string {
  if (score >= 70) return "drop-shadow(0 0 6px rgba(34,197,94,0.5))";
  if (score >= 58) return "drop-shadow(0 0 5px rgba(74,222,128,0.4))";
  if (score >= 42) return "drop-shadow(0 0 4px rgba(251,191,36,0.35))";
  if (score >= 30) return "drop-shadow(0 0 4px rgba(249,115,22,0.35))";
  return "drop-shadow(0 0 5px rgba(239,68,68,0.4))";
}

export function ScoreGauge({ score, label, color, size = 88 }: ScoreGaugeProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 150);
    return () => clearTimeout(t);
  }, [score]);

  const r            = (size / 2) - 8;
  const cx           = size / 2;
  const cy           = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress     = ((100 - animated) / 100) * circumference;
  const strokeColor  = color ?? scoreColor(score);
  const glowFilter   = scoreGlow(score);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          style={{ filter: glowFilter }}
        >
          {/* Track */}
          <circle
            className="score-ring-track"
            cx={cx}
            cy={cy}
            r={r}
            strokeWidth={6}
          />
          {/* Fill */}
          <circle
            className="score-ring-fill"
            cx={cx}
            cy={cy}
            r={r}
            strokeWidth={6}
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={progress}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold tabular-nums" style={{ color: strokeColor }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-medium text-center leading-tight">{label}</span>
    </div>
  );
}
