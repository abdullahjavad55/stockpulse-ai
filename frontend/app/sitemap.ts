import type { MetadataRoute } from "next";
import { SITE_URL }            from "@/lib/seo";
import { getAllSlugs }          from "@/lib/blog-posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,               lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/dashboard`,lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/pricing`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog`,     lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = getAllSlugs().map((slug) => ({
    url:             `${SITE_URL}/blog/${slug}`,
    lastModified:    now,
    changeFrequency: "monthly",
    priority:        0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
