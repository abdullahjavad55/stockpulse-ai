"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, TrendingUp, MessageSquare, Zap, Shield,
  RefreshCw, ArrowRight, ChevronRight, ChevronDown, Check,
  Brain, Clock, Globe, BookOpen, LineChart, Target,
} from "lucide-react";
import type { BlogPost }  from "@/lib/blog-posts";

/* Data */
const FEATURES = [
  {
    icon: BarChart2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
    title: "Technical Analysis",
    desc:  "RSI, MACD, Bollinger Bands, moving averages, volume confirmation, and support/resistance - all weighted into a single actionable score.",
  },
  {
    icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
    title: "Quantitative Analysis",
    desc:  "Sharpe ratio, beta, multi-timeframe momentum, trend regression, and fundamental metrics (P/E, ROE, revenue growth) fused into one quant score.",
  },
  {
    icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Sentiment Analysis",
    desc:  "Real-time financial news scored with a finance-tuned NLP model covering 70+ domain-specific terms - from earnings beats to analyst upgrades.",
  },
];

const STATS = [
  { value: "3-Pillar", label: "Scoring Model"  },
  { value: "58+",      label: "NASDAQ Stocks"  },
  { value: "100-pt",   label: "Score Scale"    },
  { value: "< 10 s",   label: "Analysis Time"  },
];

const HOW_IT_WORKS = [
  {
    step: "01", title: "Enter a Ticker",
    desc: "Type any NASDAQ symbol (e.g. AAPL, NVDA) or click 'Scan Market' to automatically surface the strongest opportunities.",
  },
  {
    step: "02", title: "Choose a Strategy",
    desc: "Short-term weights RSI and MACD for near-term trades. Long-term weights trend regression and fundamentals for sustainable positions.",
  },
  {
    step: "03", title: "Read the Signals",
    desc: "Get a 0-100 score, a color-coded recommendation, an interactive price chart, and plain-English reasoning in seconds.",
  },
];

const DIFFERENTIATORS = [
  {
    icon: Brain,     title: "Multi-Factor Scoring",
    desc: "Three independent analysis pillars - no single indicator dominates. Reduces false signals and improves conviction.",
  },
  {
    icon: Globe,     title: "Live Market Data",
    desc: "Price data, fundamentals, and news fetched directly from Yahoo Finance and financial news APIs on every request.",
  },
  {
    icon: Clock,     title: "Fast Results",
    desc: "Results cached for one hour. First analysis takes seconds; repeat calls are instant.",
  },
  {
    icon: Shield,    title: "Transparent Reasoning",
    desc: "Every recommendation includes plain-English bullet points. You see exactly which signals drove the score.",
  },
  {
    icon: Zap,       title: "No Account Required",
    desc: "Start analysing immediately. No sign-up, no credit card, no barriers.",
  },
  {
    icon: BarChart2, title: "60+ NASDAQ Stocks",
    desc: "Covers mega-cap tech, semiconductors, cloud, biotech, fintech, and international ADRs.",
  },
];

const FOR_WHO = [
  {
    title: "Retail Investors",
    desc: "Get data-driven analysis without paying for expensive research subscriptions.",
  },
  {
    title: "Day and Swing Traders",
    desc: "Quickly scan for high-probability setups using combined technical and momentum signals.",
  },
  {
    title: "Long-Term Investors",
    desc: "Evaluate stocks on fundamentals, risk-adjusted returns, and trend sustainability.",
  },
  {
    title: "Finance Students",
    desc: "Learn how analytical frameworks work with live market data and transparent scoring.",
  },
];

/* Strategy comparison section */
const STRATEGY_COMPARE = [
  {
    icon: Zap, label: "Short-Term", color: "text-blue-400", border: "border-blue-500/25", bg: "bg-blue-500/5",
    timeframe: "Days to weeks",
    pillars:   [
      { name: "Technical", weight: "50%", focus: "RSI (35%), MACD (35%)" },
      { name: "Sentiment", weight: "30%", focus: "Recent news spikes"    },
      { name: "Quant",     weight: "20%", focus: "Momentum (55%)"        },
    ],
    best: "Traders watching price momentum and near-term catalysts.",
  },
  {
    icon: LineChart, label: "Long-Term", color: "text-violet-400", border: "border-violet-500/25", bg: "bg-violet-500/5",
    timeframe: "Months to years",
    pillars:   [
      { name: "Quant",     weight: "45%", focus: "Trend (35%), Sharpe (30%)" },
      { name: "Technical", weight: "30%", focus: "Trend MAs (45%)"           },
      { name: "Sentiment", weight: "25%", focus: "Sustained coverage"         },
    ],
    best: "Investors building positions based on quality and durability.",
  },
];

/* FAQ Item */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-bg-hover/30 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-sm sm:text-base">{question}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Blog card */
function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="glass-card p-5 hover:border-brand/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/5 transition-all duration-200 group block"
    >
      <span className="text-xs font-semibold text-brand-light bg-brand/10 px-2 py-0.5 rounded-full">
        {post.category}
      </span>
      <h3 className="font-bold mt-3 mb-2 leading-snug group-hover:text-brand-light transition-colors">
        {post.title}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{post.excerpt}</p>
      <div className="flex items-center justify-between mt-4 text-xs text-slate-600">
        <span>{post.publishedAt}</span>
        <span className="flex items-center gap-1 text-brand-light font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          Read <ChevronRight size={12} />
        </span>
      </div>
    </Link>
  );
}

/* Main component */
interface LandingPageContentProps {
  faqs:        { question: string; answer: string }[];
  recentPosts: BlogPost[];
}

export function LandingPageContent({ faqs, recentPosts }: LandingPageContentProps) {
  return (
    <div className="flex flex-col items-center">

      {/* HERO */}
      <section
        aria-labelledby="hero-heading"
        className="relative w-full flex flex-col items-center text-center px-4 pt-28 pb-24 overflow-hidden"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow" />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-light bg-brand/10 border border-brand/25 rounded-full px-3 py-1 mb-6">
            <Target size={11} className="fill-brand-light" />
            Multi-Factor Analysis &middot; Live Data &middot; Free to Use
          </span>

          <h1 id="hero-heading" className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            Data-Driven Stock Analysis
            <br />
            <span className="gradient-text">for Serious Investors</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Combine technical indicators, quantitative models, and real-time news sentiment
            into one clear buy, hold, or sell recommendation. No fluff, no guesswork.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn-primary flex items-center justify-center gap-2 text-base">
              Start Analysing <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard?mode=scan" className="btn-ghost text-base">
              Scan the Market <ChevronRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-20 max-w-2xl w-full"
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-2xl font-extrabold gradient-text">{s.value}</span>
              <span className="text-xs text-slate-500 mt-1">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section aria-labelledby="how-heading" className="w-full max-w-6xl px-4 pb-24">
        <h2 id="how-heading" className="text-center text-3xl font-bold mb-4 tracking-tight">How It Works</h2>
        <p className="text-center text-slate-400 text-sm mb-12 max-w-xl mx-auto">
          A three-stage analysis pipeline runs in seconds. No sign-up required.
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center text-center"
            >
              <span className="text-5xl font-black gradient-text mb-4 opacity-50">{step.step}</span>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* THREE PILLARS */}
      <section aria-labelledby="pillars-heading" className="w-full max-w-6xl px-4 pb-24">
        <h2 id="pillars-heading" className="text-center text-3xl font-bold mb-4 tracking-tight">Three Independent Pillars</h2>
        <p className="text-center text-slate-400 text-sm mb-12 max-w-2xl mx-auto">
          Most tools rely on a single data source. StockPulse fuses three independent frameworks
          to reduce false signals and improve recommendation quality.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-brand/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`inline-flex p-3 rounded-xl border ${f.bg} mb-4`}>
                <f.icon size={22} className={f.color} />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STRATEGY COMPARISON */}
      <section aria-labelledby="strategy-heading" className="w-full max-w-6xl px-4 pb-24">
        <h2 id="strategy-heading" className="text-center text-3xl font-bold mb-4 tracking-tight">Two Distinct Strategies</h2>
        <p className="text-center text-slate-400 text-sm mb-12 max-w-2xl mx-auto">
          Short-term and long-term modes use different internal weights so the same stock
          produces genuinely different scores depending on your time horizon.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          {STRATEGY_COMPARE.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className={`glass-card p-6 border ${s.border} ${s.bg}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-bg-card border ${s.border}`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${s.color}`}>{s.label}</h3>
                  <p className="text-xs text-slate-500">{s.timeframe}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {s.pillars.map((p) => (
                  <div key={p.name} className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 w-20 shrink-0 pt-0.5">{p.name} {p.weight}</span>
                    <span className="text-xs text-slate-500 leading-relaxed">{p.focus}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 border-t border-bg-border pt-3 mt-3">
                <span className="font-semibold text-slate-300">Best for:</span> {s.best}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHY WE'RE DIFFERENT */}
      <section aria-labelledby="why-heading" className="w-full max-w-6xl px-4 pb-24">
        <h2 id="why-heading" className="text-center text-3xl font-bold mb-4 tracking-tight">Why StockPulse?</h2>
        <p className="text-center text-slate-400 text-sm mb-12 max-w-xl mx-auto">
          Built for investors who want clear signals, not marketing promises.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DIFFERENTIATORS.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="glass-card p-5 hover:border-brand/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <d.icon size={16} className="text-brand-light shrink-0" />
                <h3 className="font-semibold text-sm">{d.title}</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{d.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section aria-labelledby="for-heading" className="w-full max-w-6xl px-4 pb-24">
        <h2 id="for-heading" className="text-center text-3xl font-bold mb-12 tracking-tight">Built for Every Investor</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FOR_WHO.map((w, i) => (
            <motion.div
              key={w.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass-card p-5 text-center hover:border-brand/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/25 flex items-center justify-center mx-auto mb-3">
                <Check size={14} className="text-brand-light" />
              </div>
              <h3 className="font-bold text-sm mb-1.5">{w.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{w.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section aria-labelledby="cta-heading" className="w-full max-w-6xl px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 sm:p-12 bg-card-glow text-center border-brand/20"
        >
          <h2 id="cta-heading" className="text-3xl font-extrabold mb-4 tracking-tight">
            Analyse Any NASDAQ Stock <span className="gradient-text">Right Now</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8">
            No account. No credit card. Enter a ticker and get a full technical, quantitative, and
            sentiment breakdown with a clear buy, hold, or sell signal in under 10 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn-primary flex items-center justify-center gap-2 text-base">
              Open the Dashboard <ArrowRight size={16} />
            </Link>
            <Link href="/pricing" className="btn-ghost text-base">
              View Pricing <ChevronRight size={16} />
            </Link>
          </div>
          <div className="flex justify-center gap-6 mt-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Shield size={11} className="text-emerald-400" /> No login required</span>
            <span className="flex items-center gap-1.5"><RefreshCw size={11} className="text-blue-400" /> Live market data</span>
            <span className="flex items-center gap-1.5"><Zap size={11} className="text-amber-400" /> Results in seconds</span>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="w-full max-w-3xl px-4 pb-24">
        <h2 id="faq-heading" className="text-center text-3xl font-bold mb-12 tracking-tight">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <FAQItem key={f.question} question={f.question} answer={f.answer} />
          ))}
        </div>
      </section>

      {/* BLOG PREVIEW */}
      <section aria-labelledby="blog-heading" className="w-full max-w-6xl px-4 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 id="blog-heading" className="text-2xl font-bold tracking-tight">From the Blog</h2>
          <Link href="/blog" className="flex items-center gap-1.5 text-sm text-brand-light hover:text-brand font-semibold transition-colors">
            <BookOpen size={14} /> All Articles <ChevronRight size={13} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {recentPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="w-full max-w-6xl px-4 pb-16">
        <div className="glass-card border-amber-500/20 bg-amber-500/5 p-5 text-center">
          <p className="text-xs text-amber-200/70 leading-relaxed">
            <strong className="text-amber-300">Disclaimer:</strong> StockPulse AI provides data-driven insights for educational purposes
            only and does not constitute financial advice. Stock markets are inherently unpredictable. Always conduct
            your own due diligence and consult a qualified financial advisor before making investment decisions.
            Past performance is not indicative of future results.
          </p>
        </div>
      </section>
    </div>
  );
}
