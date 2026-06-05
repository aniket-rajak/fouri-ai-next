import type { MetadataRoute } from "next";
import { examPages } from "@/lib/seo";

const BASE_URL = "https://fouri.in";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/disclaimer`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  ];

  // Blog categories
  let categorySlugs: string[] = [];
  try {
    const res = await fetch(`${API}/blog/categories/list`);
    if (res.ok) {
      const data = await res.json();
      categorySlugs = (data.categories || []).map((c: any) => c.slug);
    }
  } catch {}

  // Blog tags
  let tagSlugs: string[] = [];
  try {
    const res = await fetch(`${API}/blog/tags/list`);
    if (res.ok) {
      const data = await res.json();
      tagSlugs = (data.tags || []).map((t: any) => t.slug);
    }
  } catch {}

  // Blog posts
  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API}/blog?limit=50`);
    if (res.ok) {
      const data = await res.json();
      blogPosts = (data.blogs || []).map((b: any) => ({
        url: `${BASE_URL}/blog/${b.slug}`,
        lastModified: new Date(b.updatedAt || b.publishedAt || b.createdAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch {}  

  const examPagesSitemap: MetadataRoute.Sitemap = examPages.map((page) => ({
    url: `${BASE_URL}/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${BASE_URL}/blog?category=${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...examPagesSitemap, ...blogPosts, ...categoryPages];
}
