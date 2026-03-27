import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a dollar amount. */
export function formatPrice(price?: number | null): string {
  if (price == null) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(price);
}

/** Format a percentage. */
export function formatPct(val?: number | null, decimals = 1): string {
  if (val == null) return "-";
  return `${(val * 100).toFixed(decimals)}%`;
}

/** Map a recommendation key to a display colour class. */
export function recColorClass(key: string): string {
  const map: Record<string, string> = {
    strong_buy:  "text-emerald-400",
    buy:         "text-green-400",
    hold:        "text-amber-400",
    sell:        "text-orange-400",
    strong_sell: "text-red-400",
  };
  return map[key] ?? "text-slate-300";
}

/** Clamp a value between min and max. */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
