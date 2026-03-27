import type { Metadata } from "next";
import Script from "next/script";
import { LandingPageContent } from "@/components/LandingPageContent";
import { buildMetadata, softwareAppSchema, faqSchema } from "@/lib/seo";
import { BLOG_POSTS } from "@/lib/blog-posts";

export const metadata: Metadata = buildMetadata({
  title:       "AI Stock Analysis Tool | NASDAQ Buy/Sell Signals | StockPulse AI",
  description: "Analyze stocks using technical indicators, quantitative models, and news sentiment. Get data-driven buy/sell signals for NASDAQ stocks in seconds. Free to use.",
  path:        "/",
  keywords:    ["AI stock analysis", "NASDAQ buy sell signals", "stock technical analysis online", "free stock scanner"],
});

const FAQS = [
  {
    question: "Is StockPulse AI free to use?",
    answer:
      "Yes. The core stock analysis tool is free to use with no account required. You can analyze any NASDAQ stock and run market scans at no cost.",
  },
  {
    question: "How accurate are the buy/sell signals?",
    answer:
      "StockPulse AI generates signals based on a weighted combination of technical indicators, quantitative metrics, and news sentiment. While no tool can predict markets with certainty, the multi-factor approach is designed to surface high-probability opportunities. Always treat signals as one input in your research, not as guaranteed outcomes.",
  },
  {
    question: "Which stocks can I analyze?",
    answer:
      "You can analyze any NASDAQ-listed stock by entering its ticker symbol. The market scanner covers a curated universe of 60+ major NASDAQ stocks including technology, semiconductors, biotech, and fintech.",
  },
  {
    question: "How often is the data updated?",
    answer:
      "Price and fundamental data is sourced in real-time from Yahoo Finance. News is fetched at analysis time. Analysis results are cached for one hour to ensure fast response times.",
  },
  {
    question: "What is the difference between short-term and long-term analysis?",
    answer:
      "Short-term analysis (days to weeks) weights technical signals more heavily (50% technical, 20% quant, 30% sentiment). Long-term analysis (months to years) prioritizes quantitative and fundamental metrics (30% technical, 45% quant, 25% sentiment).",
  },
  {
    question: "Is this financial advice?",
    answer:
      "No. StockPulse AI is an educational data analysis tool. All outputs are data-driven insights, not financial advice. We strongly recommend consulting a qualified financial advisor before making any investment decisions.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* FAQ structured data */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(FAQS)) }}
      />
      {/* SoftwareApp schema */}
      <Script
        id="software-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema()) }}
      />
      <LandingPageContent faqs={FAQS} recentPosts={BLOG_POSTS.slice(0, 3)} />
    </>
  );
}
