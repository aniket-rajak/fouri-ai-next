import type { MetadataRoute } from "next";
import { examPages } from "@/lib/seo";

const BASE_URL = "https://fouri.in";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${BASE_URL}/dashboard`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/discover`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
  ];

  const examPagesSitemap: MetadataRoute.Sitemap = examPages.map((page) => ({
    url: `${BASE_URL}/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  let blogSlugs: string[] = [];
  try {
    const res = await fetch(`${API_URL}/blogs`, { next: { revalidate: 3600 } });
    const data = await res.json();
    blogSlugs = (data.blogs || []).map((b: { slug: string }) => b.slug);
  } catch {
    // backend not available during build
  }

  const blogSitemap: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...examPagesSitemap, ...blogSitemap];
}
