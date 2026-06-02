"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { BlogCard } from "./BlogCard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function BlogSection() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/blog?limit=3`)
      .then((r) => r.json())
      .then((data) => setBlogs(data.blogs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24 lg:py-28 relative overflow-hidden bg-[#0C0C0C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        </div>
      </section>
    );
  }

  if (blogs.length === 0) return null;

  return (
    <section className="py-16 md:py-24 lg:py-28 relative overflow-hidden bg-[#0C0C0C]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C0C] via-[#0d0d15] to-[#0C0C0C] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-12"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-[#00D2FF] bg-[#00D2FF]/10 px-4 py-1.5 rounded-full border border-[#00D2FF]/10">
            Blog
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
            Latest From Our Blog
          </h2>
          <p className="mt-3 text-[#888899] text-sm sm:text-base max-w-lg mx-auto">
            Tips, guides, and insights to help you prepare smarter.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog, i) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <BlogCard
                title={blog.title}
                slug={blog.slug}
                excerpt={blog.excerpt}
                thumbnailUrl={blog.thumbnailUrl}
                categories={blog.categories}
                authorName={blog.authorName}
                publishedAt={blog.publishedAt}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#f5f5f7] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
          >
            View All Blogs
            <ArrowRight size={16} className="text-[#00D2FF]" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
