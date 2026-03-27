"use client";

import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  score: number;      // 0-100
  label: string;
  color?: string;     // stroke colour
  size?: number;
}

function scoreColor(score: number) {
  if (score >= 70) return "#10b981";   // emerald
  if (score >= 58) return "#34d399";   // green
  if (score >= 42) return "#fbbf24";   // amber
  if (score >= 30) return "#f97316";   // orange
  return "#ef4444";                     // red
}

export function ScoreGauge({ score, label, color, size = 88 }: ScoreGaugeProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 150);
    return () => clearTimeout(t);
  }, [score]);

  const r          = (size / 2) - 7;
  const cx         = size / 2;
  const cy         = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress   = ((100 - animated) / 100) * circumference;
  const strokeColor = color ?? scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            className="score-ring-track"
            cx={cx} cy={cy} r={r}
            strokeWidth={6}
          />
          <circle
            className="score-ring-fill"
            cx={cx} cy={cy} r={r}
            strokeWidth={6}
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={progress}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold" style={{ color: strokeColor }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-medium text-center leading-tight">{label}</span>
    </div>
  );
}
