import type { Metadata } from "next";
import Link from "next/link";
import { Check, Zap, ArrowRight, Star } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title:       "Pricing - StockPulse AI Stock Analysis Tool",
  description: "Simple, transparent pricing for StockPulse AI. Start free, upgrade when you're ready. Monthly, 6-month, and annual plans available.",
  path:        "/pricing",
  keywords:    ["stock analysis pricing", "stock tool subscription", "NASDAQ analysis plans"],
});

const FREE_FEATURES = [
  "Analyze any NASDAQ stock",
  "Short-term & long-term strategies",
  "Technical score (RSI, MACD, Bollinger Bands)",
  "Quantitative score (Sharpe, beta, momentum)",
  "News sentiment score",
  "6-month price chart",
  "Plain-English reasoning",
  "5 market scans per day",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited market scans",
  "Full 58+ stock universe scan",
  "Portfolio tracking (up to 20 stocks)",
  "Email alerts for recommendation changes",
  "Historical signal performance",
  "CSV data export",
  "Priority support",
];

const ANNUAL_EXTRAS = [
  "Everything in Pro",
  "Unlimited portfolio size",
  "API access for personal automation",
  "Advanced screener (custom filters)",
  "Earnings calendar integration",
  "Dedicated account manager",
];

interface PlanProps {
  name:        string;
  price:       string;
  period:      string;
  badge?:      string;
  badgeColor?: string;
  savings?:    string;
  features:    string[];
  cta:         string;
  ctaHref:     string;
  highlighted: boolean;
  comingSoon?: boolean;
}

function PlanCard({
  name, price, period, badge, badgeColor, savings, features,
  cta, ctaHref, highlighted, comingSoon,
}: PlanProps) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-300 ${
        highlighted
          ? "border-brand bg-brand/5 shadow-lg shadow-brand/10 scale-[1.02]"
          : "border-bg-border bg-bg-card hover:border-brand/40"
      }`}
    >
      {/* Badge */}
      {badge && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
          {badge}
        </div>
      )}

      {/* Name + price */}
      <div className="mb-6">
        <h3 className="font-extrabold text-lg mb-3">{name}</h3>
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-black">{price}</span>
          {period && <span className="text-slate-400 text-sm mb-1">/{period}</span>}
        </div>
        {savings && (
          <p className="text-xs font-semibold text-emerald-400 mt-1">{savings}</p>
        )}
      </div>

      {/* CTA */}
      {comingSoon ? (
        <div className="w-full py-2.5 rounded-xl border border-bg-border text-center text-sm text-slate-500 font-semibold mb-6">
          Coming Soon
        </div>
      ) : (
        <Link
          href={ctaHref}
          className={`w-full py-2.5 rounded-xl text-center text-sm font-bold transition-all duration-200 mb-6 ${
            highlighted
              ? "bg-brand hover:bg-brand-dark text-white"
              : "border border-bg-border text-slate-300 hover:border-brand/50 hover:text-white"
          }`}
        >
          {cta}
        </Link>
      )}

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">

      {/* Header */}
      <header className="text-center mb-16">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-light bg-brand/10 border border-brand/25 rounded-full px-3 py-1 mb-4">
          <Star size={11} className="fill-brand-light" />
          Simple, Transparent Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
          Start Free. <span className="gradient-text">Upgrade Anytime.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          The core stock analysis tool is free forever. Upgrade to Pro for unlimited scans,
          portfolio tracking, and alerts.
        </p>
      </header>

      {/* Plans grid */}
      <div className="grid sm:grid-cols-3 gap-6 mb-16">
        <PlanCard
          name="Free"
          price="$0"
          period="forever"
          features={FREE_FEATURES}
          cta="Start Analysing"
          ctaHref="/dashboard"
          highlighted={false}
        />
        <PlanCard
          name="Pro - Monthly"
          price="$30"
          period="month"
          badge="Most Popular"
          badgeColor="bg-brand text-white"
          features={PRO_FEATURES}
          cta="Get Pro Monthly"
          ctaHref="/dashboard"
          highlighted={true}
          comingSoon
        />
        <PlanCard
          name="Pro - Annual"
          price="$20"
          period="month"
          savings="Billed $240/year - Save 33%"
          badge="Best Value"
          badgeColor="bg-emerald-500 text-white"
          features={ANNUAL_EXTRAS}
          cta="Get Annual Plan"
          ctaHref="/dashboard"
          highlighted={false}
          comingSoon
        />
      </div>

      {/* 6-month option */}
      <div className="glass-card p-6 mb-16 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-base">6-Month Plan - Best of Both Worlds</p>
          <p className="text-sm text-slate-400 mt-1">
            Pay for 6 months at <strong className="text-white">$25/month</strong> ($150 total) - save 17% vs monthly.
            Ideal if you want to try Pro for half a year.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-2xl font-extrabold">$150</span>
          <span className="text-sm text-slate-400">/ 6 months</span>
          <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Feature comparison table */}
      <section className="mb-16" aria-labelledby="compare-heading">
        <h2 id="compare-heading" className="text-2xl font-bold text-center mb-8">Full Feature Comparison</h2>
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="text-left p-4 font-semibold text-slate-400">Feature</th>
                <th className="text-center p-4 font-semibold">Free</th>
                <th className="text-center p-4 font-semibold text-brand-light">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {[
                ["Single stock analysis",           true,  true  ],
                ["Short & long-term strategies",     true,  true  ],
                ["Technical analysis score",         true,  true  ],
                ["Quantitative analysis score",      true,  true  ],
                ["News sentiment score",             true,  true  ],
                ["Price chart (6 months)",           true,  true  ],
                ["Bullet-point reasoning",           true,  true  ],
                ["Market scans per day",             "5",   "Unlimited"],
                ["Stocks in scan universe",          "20",  "58+"    ],
                ["Portfolio tracking",               "-",   "Up to unlimited"],
                ["Email alerts",                     "-",   true  ],
                ["CSV export",                       "-",   true  ],
                ["API access",                       "-",   "Annual only"],
              ].map(([feature, free, pro]) => (
                <tr key={String(feature)} className="hover:bg-bg-hover/50">
                  <td className="p-4 text-slate-300">{feature}</td>
                  <td className="p-4 text-center text-slate-400">
                    {free === true ? <Check size={15} className="text-emerald-400 mx-auto" /> : free === false ? <span className="text-slate-600">-</span> : free}
                  </td>
                  <td className="p-4 text-center">
                    {pro === true ? <Check size={15} className="text-emerald-400 mx-auto" /> : pro === false ? <span className="text-slate-600">-</span> : <span className="text-brand-light font-semibold">{pro}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16" aria-labelledby="pricing-faq-heading">
        <h2 id="pricing-faq-heading" className="text-2xl font-bold text-center mb-8">Pricing FAQ</h2>
        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {[
            { q: "When will Pro launch?",      a: "Pro tier is currently in development. Join the waitlist by using the free tool - early users will get discounted pricing." },
            { q: "Is the free plan really free?", a: "Yes, permanently. The core analysis tool - single-stock analysis and limited market scans - will always be free to use." },
            { q: "Will you charge for existing features?", a: "No. Features already available in the free tier will remain free when Pro launches." },
            { q: "What payment methods will you accept?", a: "We plan to support all major credit/debit cards and PayPal. Crypto payment may be added in a later phase." },
          ].map(({ q, a }) => (
            <div key={q} className="glass-card p-5">
              <p className="font-semibold text-sm mb-2">{q}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="glass-card p-10 text-center bg-card-glow">
        <h2 className="text-2xl font-extrabold mb-3">
          Start with the Free Plan Today
        </h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          No account required. Analyse any NASDAQ stock in seconds and see why thousands
          of investors use StockPulse AI for their research.
        </p>
        <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
          <Zap size={15} /> Launch Free Tool <ArrowRight size={15} />
        </Link>
        <p className="text-xs text-slate-600 mt-4">
          ⚠️ This tool provides data-driven insights for educational purposes only - not financial advice.
        </p>
      </div>
    </div>
  );
}
