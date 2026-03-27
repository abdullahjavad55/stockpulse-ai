import type { Metadata }   from "next";
import Link                  from "next/link";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import { buildMetadata }     from "@/lib/seo";
import { BLOG_POSTS }        from "@/lib/blog-posts";

export const metadata: Metadata = buildMetadata({
  title:       "Stock Analysis Blog  - Guides, Tips & Strategies | StockPulse AI",
  description: "Learn how to analyze stocks, use technical indicators, and understand market sentiment. Free beginner-friendly guides from the StockPulse AI team.",
  path:        "/blog",
  keywords:    ["stock analysis blog", "technical analysis guide", "how to invest stocks", "stock market tips"],
});

export default function BlogIndexPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <header className="mb-14 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-light bg-brand/10 border border-brand/25 rounded-full px-3 py-1 mb-4">
          <BookOpen size={11} />
          Educational Resources
        </div>
        <h1 className="text-4xl font-extrabold mb-4">Stock Analysis Blog</h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Practical guides on technical analysis, quantitative methods, and market sentiment  - written
          for investors at every level.
        </p>
      </header>

      {/* Posts grid */}
      <div className="space-y-6">
        {BLOG_POSTS.map((post, i) => (
          <article key={post.slug} className="glass-card p-6 hover:border-brand/40 transition-colors group">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Number */}
              <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 shrink-0 text-lg font-extrabold text-brand-light">
                {String(i + 1).padStart(2, "0")}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-brand-light bg-brand/10 px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={10} /> {post.readTime} min read
                  </span>
                  <span className="text-xs text-slate-600">{post.publishedAt}</span>
                </div>

                <h2 className="text-xl font-bold mb-2 group-hover:text-brand-light transition-colors leading-snug">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>

                <p className="text-sm text-slate-400 leading-relaxed mb-3">{post.excerpt}</p>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.keywords.slice(0, 3).map((kw) => (
                    <span key={kw} className="text-[10px] text-slate-500 bg-bg-hover px-2 py-0.5 rounded-md border border-bg-border">
                      {kw}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm text-brand-light hover:text-brand font-semibold transition-colors"
                >
                  Read Article <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 glass-card p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Ready to Put It into Practice?</h2>
        <p className="text-sm text-slate-400 mb-5">
          Apply everything you've learned with the free StockPulse AI analysis tool.
        </p>
        <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
          Try the Free Tool <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
