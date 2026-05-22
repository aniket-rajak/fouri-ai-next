"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, Loader2, Sparkles } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  author: string;
  createdAt: string;
}

export function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/blogs`)
      .then((r) => r.json())
      .then((data: { blogs: Blog[] }) => setBlogs(data.blogs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#08080f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7]">
              FOURI Blog
            </h1>
          </div>
          <p className="text-[#888899] max-w-2xl mx-auto">
            Insights, tips, and resources for smarter exam preparation with AI-powered mock tests.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-blue-400" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#888899]">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, i) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#111118] rounded-2xl border border-white/5 overflow-hidden group hover:border-blue-500/20 transition-all duration-300"
              >
                <Link href={`/blog/${blog.slug}`}>
                  <div className="relative h-48 overflow-hidden">
                    {blog.imageUrl ? (
                      <Image
                        src={blog.imageUrl}
                        alt={blog.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-blue-500/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-transparent" />
                  </div>
                </Link>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-[#888899] mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {blog.author}
                    </span>
                  </div>
                  <Link href={`/blog/${blog.slug}`}>
                    <h2 className="text-lg font-semibold text-[#f5f5f7] group-hover:text-blue-300 transition-colors line-clamp-2 mb-2">
                      {blog.title}
                    </h2>
                  </Link>
                  {blog.excerpt && (
                    <p className="text-sm text-[#888899] line-clamp-3 leading-relaxed">
                      {blog.excerpt}
                    </p>
                  )}
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Read More <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
