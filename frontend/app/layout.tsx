import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar }   from "@/components/Navbar";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

const inter = Inter({
  subsets:  ["latin"],
  variable: "--font-inter",
  display:  "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  `${SITE_NAME} - Stock Analysis Tool`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Multi-factor stock analysis for NASDAQ. Combine technical indicators, quantitative models, and real-time news sentiment to get instant buy/sell signals.",
  keywords: [
    "stock analysis tool",
    "NASDAQ stock analysis",
    "technical analysis tool online",
    "stock buy sell signal",
    "free stock analysis",
    "stock market analysis",
  ],
  authors:  [{ name: SITE_NAME, url: SITE_URL }],
  creator:  SITE_NAME,
  robots:   {
    index:     true,
    follow:    true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type:      "website",
    locale:    "en_US",
    url:       SITE_URL,
    siteName:  SITE_NAME,
    title:     `${SITE_NAME} - Stock Analysis Tool`,
    description:
      "Analyze any NASDAQ stock in seconds. Technical indicators, quantitative models, and news sentiment combined into one clear buy/sell recommendation.",
    images:    [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: `${SITE_NAME} - Stock Analysis` }],
  },
  twitter: {
    card:        "summary_large_image",
    site:        "@stockpulseai",
    title:       `${SITE_NAME} - Stock Analysis Tool`,
    description: "Analyze NASDAQ stocks in seconds using technical, quantitative, and sentiment analysis.",
    images:      [`${SITE_URL}/og-image.png`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="canonical" href={SITE_URL} />
      </head>
      <body className={`${inter.variable} font-sans bg-bg-base text-slate-100 min-h-screen antialiased`}>
        {/* Animated ambient background */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          {/* Top center glow - animates slowly */}
          <div
            className="absolute -top-60 left-1/2 -translate-x-1/2 h-[700px] w-[1000px] rounded-full bg-brand/5 blur-3xl"
            style={{ animation: "gradientShift 8s ease-in-out infinite" }}
          />
          {/* Right side accent */}
          <div
            className="absolute top-1/3 -right-80 h-[500px] w-[500px] rounded-full bg-violet-600/4 blur-3xl"
            style={{ animation: "gradientShiftRight 10s ease-in-out infinite" }}
          />
          {/* Bottom left accent */}
          <div
            className="absolute bottom-20 -left-60 h-[400px] w-[400px] rounded-full bg-indigo-600/4 blur-3xl"
            style={{ animation: "gradientShift 12s ease-in-out infinite reverse" }}
          />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: "linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <Navbar />
        <main id="main-content">{children}</main>

        {/* Global footer */}
        <footer className="border-t border-bg-border mt-20 py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-4 gap-8 mb-10">
              {/* Brand */}
              <div className="sm:col-span-2">
                <p className="font-extrabold text-lg mb-2">{SITE_NAME}</p>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                  Multi-factor stock analysis combining technical, quantitative, and sentiment signals
                  to help investors make more informed decisions.
                </p>
              </div>

              {/* Product links */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Product</p>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                  <li><a href="/pricing"   className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="/blog"      className="hover:text-white transition-colors">Blog</a></li>
                </ul>
              </div>

              {/* Analysis links */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Analysis</p>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="/dashboard?mode=scan"  className="hover:text-white transition-colors">Market Scanner</a></li>
                  <li><a href="/dashboard"            className="hover:text-white transition-colors">Single Stock</a></li>
                  <li><a href="/blog/best-technical-indicators-short-term-trading" className="hover:text-white transition-colors">Technical Indicators</a></li>
                </ul>
              </div>
            </div>

            {/* Disclaimer + copyright */}
            <div className="border-t border-bg-border pt-6 text-center space-y-2">
              <p className="text-xs text-slate-500">
                {SITE_NAME} provides data-driven insights for educational purposes only and does{" "}
                <strong className="text-slate-400">not constitute financial advice</strong>.
                Always conduct your own research and consult a qualified financial advisor.
              </p>
              <p className="text-xs text-slate-600">
                &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        {/* Structured data */}
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context":          "https://schema.org",
              "@type":             "SoftwareApplication",
              name:                SITE_NAME,
              applicationCategory: "FinanceApplication",
              operatingSystem:     "Web Browser",
              description:
                "Multi-factor NASDAQ stock analysis combining technical indicators, quantitative models, and real-time news sentiment to generate buy/sell signals.",
              offers:      { "@type": "Offer", price: "0", priceCurrency: "USD" },
              url:         SITE_URL,
            }),
          }}
        />
      </body>
    </html>
  );
}
