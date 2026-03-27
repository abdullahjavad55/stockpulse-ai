"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, TrendingUp, MessageSquare, Zap, Shield,
  RefreshCw, ArrowRight, ChevronRight, ChevronDown, Check,
  Brain, Clock, Globe, BookOpen,
} from "lucide-react";
import type { BlogPost }  from "@/lib/blog-posts";

/* ── Data ──────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: BarChart2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
    title: "Technical Analysis",
    desc:  "RSI, MACD, Bollinger Bands, moving averages, volume confirmation, and support/resistance levels — all weighted into a single actionable score.",
  },
  {
    icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
    title: "Quantitative Analysis",
    desc:  "Sharpe ratio, beta, multi-timeframe momentum, trend regression, and fundamental metrics (P/E, ROE, revenue growth) fused into one quant score.",
  },
  {
    icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Sentiment Analysis",
    desc:  "Real-time financial news scored with a finance-tuned NLP model covering 70+ domain-specific terms — from earnings beats to analyst upgrades.",
  },
];

const STATS = [
  { value: "3-Pillar", label: "Scoring Model"  },
  { value: "58+",      label: "NASDAQ Stocks"  },
  { value: "100-pt",   label: "Score Scale"    },
  { value: "< 10 s",   label: "Analysis Time"  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Enter a Ticker",     desc: "Type any NASDAQ symbol (e.g. AAPL, NVDA) or click 'Scan Market' to automatically find the best opportunities."          },
  { step: "02", title: "Choose a Strategy",  desc: "Select short-term (days to weeks, heavier on technicals) or long-term (months to years, heavier on fundamentals)."        },
  { step: "03", title: "Get Your Signals",   desc: "Receive a 0–100 score, a color-coded recommendation, an interactive price chart, and plain-English reasoning in seconds." },
];

const DIFFERENTIATORS = [
  { icon: Brain,     title: "Multi-Factor AI",       desc: "Three independent analysis pillars — no single indicator dominates. Reduces false signals."           },
  { icon: Globe,     title: "Real-Time Data",         desc: "Price data, fundamentals, and news fetched live from Yahoo Finance and financial news APIs."          },
  { icon: Clock,     title: "Instant Results",        desc: "Results cached for one hour. First analysis in seconds, subsequent calls are instant."               },
  { icon: Shield,    title: "Transparent Reasoning",  desc: "Every recommendation comes with bullet-point explanations. You see exactly why a score was assigned." },
  { icon: Zap,       title: "No Account Required",    desc: "Start analysing immediately. No sign-up, no credit card, no barriers."                              },
  { icon: BarChart2, title: "60+ NASDAQ Stocks",      desc: "Covers mega-cap tech, semiconductors, cloud, biotech, fintech, and international ADRs."              },
];

const FOR_WHO = [
  { title: "Retail Investors",         desc: "Get institutional-grade analysis without paying for expensive research subscriptions."  },
  { title: "Day & Swing Traders",      desc: "Quickly scan for high-probability setups using combined technical and momentum signals." },
  { title: "Long-Term Investors",      desc: "Evaluate stocks on fundamentals, risk-adjusted returns, and trend sustainability."      },
  { title: "Finance Students",         desc: "Learn how real analytical frameworks work with live market data and transparent scoring." },
];

/* ── FAQ Item ────────────────────────────────────────────────────────────── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
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

/* ── Blog card ───────────────────────────────────────────────────────────── */
function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="glass-card p-5 hover:border-brand/40 transition-colors group block"
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

/* ── Main component ──────────────────────────────────────────────────────── */
interface LandingPageContentProps {
  faqs:        { question: string; answer: string }[];
  recentPosts: BlogPost[];
}

export function LandingPageContent({ faqs, recentPosts }: LandingPageContentProps) {
  return (
    <div className="flex flex-col items-center">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="relative w-full flex flex-col items-center text-center px-4 pt-28 pb-24 overflow-hidden"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow" />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-light bg-brand/10 border border-brand/25 rounded-full px-3 py-1 mb-6">
            <Zap size={11} className="fill-brand-light" />
            AI-Powered Analysis · Real-Time Data · Free to Use
          </span>

          <h1 id="hero-heading" className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            AI-Powered Stock Analysis
            <br />
            <span className="gradient-text">for Smarter Investing</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Make data-driven decisions using technical indicators, quantitative models, and real-time
            news sentiment — combined into one clear buy, hold, or sell recommendation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn-primary flex items-center justify-center gap-2 text-base">
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard?mode=scan"
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-bg-border text-slate-300 hover:text-white hover:border-brand/50 transition-all duration-200 text-base font-semibold"
            >
              View Demo <ChevronRight size={16} />
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

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section aria-labelledby="how-heading" className="w-full max-w-6xl px-4 pb-24">
        <h2 id="how-heading" className="text-center text-3xl font-bold mb-4">How It Works</h2>
        <p className="text-center text-slate-400 text-sm mb-12 max-w-xl mx-auto">
          StockPulse AI runs a three-stage analysis pipeline in seconds — no sign-up required.
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center text-center"
            >
              <span className="text-5xl font-black gradient-text mb-4 opacity-60">{step.step}</span>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── THREE PILLARS ─────────────────────────────────────────────────── */}
      <section aria-labelledby="pillars-heading" className="w-full max-w-6xl px-4 pb-24">
        <h2 id="pillars-heading" className="text-center text-3xl font-bold mb-4">Three Pillars of Stock Analysis</h2>
        <p className="text-center text-slate-400 text-sm mb-12 max-w-2xl mx-auto">
          Most tools rely on a single data source. StockPulse AI fuses three independent analysis frameworks
          to reduce false signals and deliver higher-conviction recommendations.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-brand/40 transition-colors duration-300"
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

      {/* ── WHY WE'RE DIFFERENT ───────────────────────────────────────────── */}
      <section aria-labelledby="why-heading" className="w-full max-w-6xl px-4 pb-24">
        <h2 id="why-heading" className="text-center text-3xl font-bold mb-4">Why StockPulse AI?</h2>
        <p className="text-center text-slate-400 text-sm mb-12 max-w-xl mx-auto">
          We built the stock analysis tool we always wanted — transparent, fast, multi-factor, and free.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DIFFERENTIATORS.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="glass-card p-5 hover:border-brand/30 transition-colors"
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

      {/* ── WHO IT'S FOR ──────────────────────────────────────────────────── */}
      <section aria-labelledby="for-heading" className="w-full max-w-6xl px-4 pb-24">
        <h2 id="for-heading" className="text-center text-3xl font-bold mb-12">Built for Every Investor</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FOR_WHO.map((w, i) => (
            <motion.div
              key={w.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass-card p-5 text-center"
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

      {/* ── PRODUCT PREVIEW / CTA BANNER ─────────────────────────────────── */}
      <section aria-labelledby="cta-heading" className="w-full max-w-6xl px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 sm:p-12 bg-card-glow text-center"
        >
          <h2 id="cta-heading" className="text-3xl font-extrabold mb-4">
            Analyse Any NASDAQ Stock — <span className="gradient-text">Right Now</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8">
            No account. No credit card. Enter a ticker and get a full technical, quantitative, and
            sentiment analysis with a clear buy/hold/sell signal in under 10 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn-primary flex items-center justify-center gap-2 text-base">
              Launch the Tool <ArrowRight size={16} />
            </Link>
            <Link href="/pricing" className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-bg-border text-slate-300 hover:text-white hover:border-brand/50 transition-all duration-200 text-base font-semibold">
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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section aria-labelledby="faq-heading" className="w-full max-w-3xl px-4 pb-24">
        <h2 id="faq-heading" className="text-center text-3xl font-bold mb-12">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <FAQItem key={f.question} question={f.question} answer={f.answer} />
          ))}
        </div>
      </section>

      {/* ── BLOG PREVIEW ─────────────────────────────────────────────────── */}
      <section aria-labelledby="blog-heading" className="w-full max-w-6xl px-4 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 id="blog-heading" className="text-2xl font-bold">From the Blog</h2>
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

      {/* ── DISCLAIMER ────────────────────────────────────────────────────── */}
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
