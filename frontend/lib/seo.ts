import type { Metadata } from "next";

export const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stockpulse-ai.vercel.app";
export const SITE_NAME = "StockPulse AI";

const BASE_KEYWORDS = [
  "stock analysis tool",
  "NASDAQ stock analysis",
  "technical analysis tool online",
  "AI stock analysis tool",
  "stock buy sell signal tool",
  "stock market analysis",
  "free stock analysis",
];

/** Build full Next.js Metadata for any page. */
export function buildMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  noIndex = false,
}: {
  title:       string;
  description: string;
  path?:       string;
  keywords?:   string[];
  noIndex?:    boolean;
}): Metadata {
  const url        = `${SITE_URL}${path}`;
  const allKeywords = [...BASE_KEYWORDS, ...keywords];

  return {
    title,
    description,
    keywords: allKeywords,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type:     "website",
      locale:   "en_US",
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description,
      site:        "@stockpulseai",
      images:      [`${SITE_URL}/og-image.png`],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index:     true,
          follow:    true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        },
  };
}

/* ── JSON-LD Schemas ─────────────────────────────────────────────────────────── */

/** SoftwareApplication schema for the homepage. */
export function softwareAppSchema() {
  return {
    "@context":          "https://schema.org",
    "@type":             "SoftwareApplication",
    name:                SITE_NAME,
    applicationCategory: "FinanceApplication",
    operatingSystem:     "Web Browser",
    description:
      "AI-powered NASDAQ stock analysis combining technical indicators, quantitative models, and real-time news sentiment to generate buy/sell signals.",
    offers:      { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url:         SITE_URL,
    featureList: [
      "Technical Analysis (RSI, MACD, Bollinger Bands, Moving Averages)",
      "Quantitative Analysis (Sharpe Ratio, Beta, Momentum)",
      "Real-time News Sentiment Analysis",
      "AI-Powered Buy/Sell Signal Generation",
      "NASDAQ Market Scanner",
      "60+ NASDAQ Stocks Covered",
    ],
  };
}

/** FAQPage schema. */
export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context":  "https://schema.org",
    "@type":     "FAQPage",
    mainEntity:  faqs.map(({ question, answer }) => ({
      "@type":         "Question",
      name:            question,
      acceptedAnswer:  { "@type": "Answer", text: answer },
    })),
  };
}

/** Article schema for blog posts. */
export function articleSchema({
  title,
  description,
  slug,
  publishedAt,
  modifiedAt,
}: {
  title:       string;
  description: string;
  slug:        string;
  publishedAt: string;
  modifiedAt?: string;
}) {
  return {
    "@context":    "https://schema.org",
    "@type":       "Article",
    headline:      title,
    description,
    url:           `${SITE_URL}/blog/${slug}`,
    datePublished: publishedAt,
    dateModified:  modifiedAt ?? publishedAt,
    author:        { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name:    SITE_NAME,
      url:     SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
  };
}

/** BreadcrumbList schema. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context":     "https://schema.org",
    "@type":        "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type":   "ListItem",
      position:  i + 1,
      name:      item.name,
      item:      `${SITE_URL}${item.path}`,
    })),
  };
}
