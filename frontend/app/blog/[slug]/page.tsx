import type { Metadata }                    from "next";
import { notFound }                           from "next/navigation";
import Link                                   from "next/link";
import Script                                 from "next/script";
import { ChevronLeft, Clock, BookOpen, ArrowRight } from "lucide-react";
import { getPostBySlug, getAllSlugs, type ContentBlock } from "@/lib/blog-posts";
import { buildMetadata, articleSchema, breadcrumbSchema } from "@/lib/seo";

/* ── Static params ────────────────────────────────────────────────────────── */
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

/* ── Metadata ─────────────────────────────────────────────────────────────── */
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  return buildMetadata({
    title:       `${post.title} | StockPulse AI Blog`,
    description: post.description,
    path:        `/blog/${post.slug}`,
    keywords:    post.keywords,
  });
}

/* ── Content renderer ─────────────────────────────────────────────────────── */
function renderBlock(block: ContentBlock, idx: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2 key={idx} className="text-2xl font-bold mt-10 mb-4 text-white">
          {block.content as string}
        </h2>
      );
    case "h3":
      return (
        <h3 key={idx} className="text-lg font-bold mt-7 mb-3 text-slate-100">
          {block.content as string}
        </h3>
      );
    case "p":
      return (
        <p key={idx} className="text-slate-400 leading-relaxed mb-4 text-[15px]">
          {block.content as string}
        </p>
      );
    case "ul":
      return (
        <ul key={idx} className="space-y-2.5 mb-5 pl-1">
          {(block.content as string[]).map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div key={idx} className="my-6 border-l-4 border-brand/60 bg-brand/5 rounded-r-xl px-5 py-4">
          <p className="text-sm text-brand-light leading-relaxed italic">
            {block.content as string}
          </p>
        </div>
      );
    default:
      return null;
  }
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const structuredData = articleSchema({
    title:       post.title,
    description: post.description,
    slug:        post.slug,
    publishedAt: post.publishedAt,
    modifiedAt:  post.modifiedAt,
  });

  const breadcrumbs = breadcrumbSchema([
    { name: "Home",  path: "/" },
    { name: "Blog",  path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  return (
    <>
      <Script id="article-schema"    type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Script id="breadcrumb-schema" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs)   }} />

      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Breadcrumb nav */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link href="/"     className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-slate-400 line-clamp-1">{post.title}</span>
        </nav>

        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-brand-light hover:text-brand font-semibold mb-6 transition-colors">
          <ChevronLeft size={15} /> All Articles
        </Link>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-brand-light bg-brand/10 px-2 py-0.5 rounded-full">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={10} /> {post.readTime} min read
            </span>
            <time dateTime={post.publishedAt} className="text-xs text-slate-600">
              {post.publishedAt}
            </time>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-slate-400 text-base leading-relaxed">{post.description}</p>
        </header>

        {/* Divider */}
        <div className="border-t border-bg-border mb-10" />

        {/* Article content */}
        <article itemScope itemType="https://schema.org/Article">
          <meta itemProp="headline"      content={post.title}       />
          <meta itemProp="datePublished" content={post.publishedAt} />
          <meta itemProp="description"   content={post.description} />
          {post.content.map((block, i) => renderBlock(block, i))}
        </article>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-bg-border">
          {post.keywords.map((kw) => (
            <span key={kw} className="text-xs text-slate-500 bg-bg-hover px-3 py-1 rounded-lg border border-bg-border">
              {kw}
            </span>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 glass-card border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-200/60 leading-relaxed">
            <strong className="text-amber-300">Disclaimer:</strong> This article is for educational purposes only
            and does not constitute financial advice. Always consult a qualified financial advisor before making
            investment decisions.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10 glass-card p-7 text-center bg-card-glow">
          <BookOpen size={20} className="text-brand-light mx-auto mb-3" />
          <h2 className="font-bold text-lg mb-2">Apply These Insights with StockPulse AI</h2>
          <p className="text-sm text-slate-400 mb-5">
            Analyse any NASDAQ stock using technical indicators, quantitative models, and news sentiment  - for free.
          </p>
          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
            Try the Free Tool <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </>
  );
}
