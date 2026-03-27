/**
 * lib/api.ts — Typed client for the FastAPI backend.
 *
 * Set NEXT_PUBLIC_API_URL in .env.local to point at your deployed backend.
 * Defaults to http://localhost:8000 for local development.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ── Types ──────────────────────────────────────────────────────────────────── */

export interface PricePoint {
  date:  string;
  close: number;
}

export interface Fundamentals {
  name?:             string;
  price?:            number;
  pe_ratio?:         number;
  peg_ratio?:        number;
  roe?:              number;
  profit_margin?:    number;
  revenue_growth?:   number;
  earnings_growth?:  number;
  debt_to_equity?:   number;
  beta?:             number;
  market_cap?:       number;
  [key: string]:     unknown;
}

export interface AnalysisResult {
  symbol:             string;
  name:               string;
  price?:             number;
  strategy:           string;
  technical_score?:   number;
  quant_score?:       number;
  sentiment_score?:   number;
  final_score?:       number;
  recommendation:     string;
  recommendation_key: string;
  technical_signals:  string[];
  quant_signals:      string[];
  sentiment_signals:  string[];
  reasoning:          string[];
  indicators?:        Record<string, unknown>;
  metrics?:           Record<string, unknown>;
  sentiment_data?:    Record<string, unknown>;
  fundamentals?:      Fundamentals;
  price_history:      PricePoint[];
  analyzed_at?:       string;
  error?:             string;
}

export interface ScanResult {
  results:    Record<string, AnalysisResult[]>;
  scanned_at: string;
  universe?:  string[];
}

export interface HealthResult {
  status:    string;
  version:   string;
  timestamp: string;
}

/* ── Fetch helper ───────────────────────────────────────────────────────────── */

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  let res: Response;

  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new Error(
      "Cannot reach the analysis server. Make sure the backend is running and NEXT_PUBLIC_API_URL is set correctly."
    );
  }

  if (!res.ok) {
    let detail = `Server error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

/* ── Public API ─────────────────────────────────────────────────────────────── */

/**
 * Analyse a single ticker.
 */
export async function analyzeStock(
  ticker:   string,
  strategy: "short_term" | "long_term" = "short_term"
): Promise<AnalysisResult> {
  return apiFetch<AnalysisResult>("/analyze", {
    method: "POST",
    body:   JSON.stringify({ ticker, strategy }),
  });
}

/**
 * Scan the NASDAQ universe and return top picks.
 */
export async function scanMarket(
  strategy: "short_term" | "long_term" | "both" = "both",
  limit     = 5
): Promise<ScanResult> {
  return apiFetch<ScanResult>(`/scan?strategy=${strategy}&limit=${limit}`);
}

/**
 * Get the curated NASDAQ ticker universe.
 */
export async function getTickers(): Promise<{ tickers: string[]; scan_universe: string[] }> {
  return apiFetch("/tickers");
}

/**
 * Health-check the backend.
 */
export async function healthCheck(): Promise<HealthResult> {
  return apiFetch<HealthResult>("/health");
}
