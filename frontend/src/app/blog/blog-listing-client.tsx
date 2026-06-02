"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search, ChevronLeft, ChevronRight, ChevronDown, Loader2, Calendar, User } from "lucide-react";
import { BlogImage } from "@/components/blog/BlogImage";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const CATEGORY_COLORS: Record<string, string> = {
  "Study Tips": "from-emerald-500 to-teal-500",
  "Exam Preparation": "from-blue-500 to-indigo-500",
  Technology: "from-purple-500 to-pink-500",
  Education: "from-amber-500 to-orange-500",
  "Product Updates": "from-cyan-500 to-blue-500",
};

const ITEMS_PER_PAGE = 18;

const cache = new Map<string, { blogs: any[]; totalPages: number }>();

export function BlogListingClient() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch(`${API}/blog/categories/list`)
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
    if (selectedCategory) params.set("category", selectedCategory);
    if (search.trim()) params.set("search", search.trim());
    const cacheKey = params.toString();

    const cached = cache.get(cacheKey);
    if (cached) {
      setBlogs(cached.blogs);
      setTotalPages(cached.totalPages);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`${API}/blog?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const result = { blogs: data.blogs || [], totalPages: data.totalPages || 0 };
        cache.set(cacheKey, result);
        setBlogs(result.blogs);
        setTotalPages(result.totalPages);
      })
      .catch(() => { if (!controller.signal.aborted) setBlogs([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  }, [page, search, selectedCategory]);

  useEffect(() => { setPage(1); }, [search, selectedCategory]);

  return (
    <div className="space-y-8">
      <p className="text-sm text-[#888899] leading-relaxed">
        Discover articles on exam preparation strategies, study tips, AI-powered learning insights, and
        product updates from the FOURI team. Browse by category or search for specific topics.
      </p>
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm text-[#888899] hover:text-[#f5f5f7] transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555566]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blogs..."
            className="w-full bg-[#111118] border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#f5f5f7] placeholder-[#555566] outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#111118] border border-white/5 rounded-xl px-3 py-2.5 pr-10 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888899] pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[2/1] bg-[#1a1a28]" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-[#1a1a28] rounded w-1/3" />
                <div className="h-5 bg-[#1a1a28] rounded w-3/4" />
                <div className="h-3 bg-[#1a1a28] rounded w-full" />
                <div className="h-3 bg-[#1a1a28] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-[#888899]">No blog posts found.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, i) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <Link
                  href={`/blog/${blog.slug}`}
                  className="group block bg-[#111118] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 hover:bg-[#15152a] transition-all duration-300"
                >
                  <div className="aspect-[2/1] bg-[#0a0a14] overflow-hidden">
                    {blog.thumbnailUrl ? (
                      <BlogImage
                        src={blog.thumbnailUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-[#1a1a28]">F</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {blog.categories?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {blog.categories.map((cat: any) => (
                          <span key={cat.id} className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-medium bg-gradient-to-r ${CATEGORY_COLORS[cat.name] || "from-blue-500 to-indigo-500"} text-white`}>
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-base font-semibold text-[#f5f5f7] group-hover:text-blue-300 transition-colors line-clamp-2 mb-2">
                      {blog.title}
                    </h2>
                    {blog.excerpt && (
                      <p className="text-xs text-[#888899] line-clamp-2 leading-relaxed">
                        {blog.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-4 text-[10px] text-[#555566]">
                      {blog.authorName && (
                        <span className="flex items-center gap-1">
                          <User size={10} /> {blog.authorName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {blog.publishedAt
                          ? new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-[#111118] border border-white/5 text-[#f5f5f7] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm text-[#888899]">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-[#111118] border border-white/5 text-[#f5f5f7] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
