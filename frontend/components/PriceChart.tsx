"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface PricePoint {
  date:  string;
  close: number;
}

interface PriceChartProps {
  data:   PricePoint[];
  symbol: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card !rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className="font-bold text-white">${payload[0].value.toFixed(2)}</p>
    </div>
  );
}

export function PriceChart({ data, symbol }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
        No chart data available
      </div>
    );
  }

  // Determine gradient color based on trend
  const first = data[0]?.close ?? 0;
  const last  = data[data.length - 1]?.close ?? 0;
  const isUp  = last >= first;
  const color = isUp ? "#10b981" : "#ef4444";

  const pctChange = first > 0 ? (((last - first) / first) * 100).toFixed(2) : "0.00";

  // Thin out x-axis labels
  const xTicks = data
    .filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0)
    .map((d) => d.date);

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-sm text-slate-400">6-Month Price Trend</span>
        <span className={`text-xs font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {isUp ? "+" : ""}{pctChange}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tick={{ fontSize: 10, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.slice(5)}   // show MM-DD
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            width={54}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${symbol})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
