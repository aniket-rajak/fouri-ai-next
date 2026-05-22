"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, User, ArrowLeft, Loader2, Sparkles } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export function BlogDetail({ slug }: { slug: string }) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/blogs/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: { blog: Blog }) => setBlog(data.blog))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#888899] mb-4">Blog post not found.</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f]">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-[#888899] hover:text-blue-400 transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to Blog
          </Link>

          {blog.imageUrl && (
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-8 border border-white/5">
              <Image
                src={blog.imageUrl}
                alt={blog.title}
                width={800}
                height={450}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-transparent" />
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-[#888899] mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <User size={13} />
              {blog.author}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-[#f5f5f7] leading-tight mb-6">
            {blog.title}
          </h1>

          <div className="prose prose-invert prose-blue max-w-none">
            {blog.content.split("\n").map((paragraph, i) => {
              if (paragraph.trim().startsWith("## ")) {
                return (
                  <h2 key={i} className="text-xl font-semibold text-[#f5f5f7] mt-8 mb-4">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.trim().startsWith("### ")) {
                return (
                  <h3 key={i} className="text-lg font-semibold text-[#f5f5f7] mt-6 mb-3">
                    {paragraph.replace("### ", "")}
                  </h3>
                );
              }
              if (paragraph.trim() === "") return null;
              return (
                <p key={i} className="text-[#c0c0cc] leading-relaxed mb-4">
                  {paragraph}
                </p>
              );
            })}
          </div>

          <div className="mt-12 pt-8 border-t border-white/5">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={14} /> Back to all articles
            </Link>
          </div>
        </motion.div>
      </article>
    </div>
  );
}
