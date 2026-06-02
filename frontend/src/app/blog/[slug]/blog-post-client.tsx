"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { BlogContactForm } from "@/components/blog/BlogContactForm";
import { BlogImage } from "@/components/blog/BlogImage";

const CATEGORY_COLORS: Record<string, string> = {
  "Study Tips": "from-emerald-500 to-teal-500",
  "Exam Preparation": "from-blue-500 to-indigo-500",
  Technology: "from-purple-500 to-pink-500",
  Education: "from-amber-500 to-orange-500",
  "Product Updates": "from-cyan-500 to-blue-500",
};

interface BlogPostClientProps {
  blog: any;
}

export function BlogPostClient({ blog }: BlogPostClientProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-[#888899] hover:text-[#f5f5f7] transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back to Blog
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {blog.thumbnailUrl && (
          <div className="aspect-[2/1] rounded-2xl overflow-hidden mb-8 bg-[#111118]">
            <BlogImage
              src={blog.thumbnailUrl}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {blog.categories?.length > 0 && blog.categories.map((cat: any) => (
            <span
              key={cat.id}
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${CATEGORY_COLORS[cat.name] || "from-blue-500 to-indigo-500"} text-white`}
            >
              {cat.name}
            </span>
          ))}
          {blog.publishedAt && (
            <span className="flex items-center gap-1 text-xs text-[#555566]">
              <Calendar size={12} />
              {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          )}
          {blog.updatedAt && blog.updatedAt !== blog.publishedAt && (
            <span className="text-xs text-[#444455]">
              (Updated {new Date(blog.updatedAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })})
            </span>
          )}
          {blog.authorName && (
            <span className="flex items-center gap-1 text-xs text-[#555566]">
              <User size={12} />
              {blog.authorName}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#f5f5f7] leading-tight mb-6">
          {blog.title}
        </h1>

        {blog.excerpt && (
          <p className="text-lg text-[#888899] leading-relaxed mb-8 border-l-2 border-blue-500/30 pl-4">
            {blog.excerpt}
          </p>
        )}

        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-10 pt-8 border-t border-white/5">
            <Tag size={14} className="text-[#555566]" />
            {blog.tags.map((tag: any) => (
              <span
                key={tag.id}
                className="px-3 py-1 rounded-full text-xs bg-white/5 text-[#888899] border border-white/5"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </motion.article>

      {/* Contact Form */}
      <div className="mt-16 pt-12 border-t border-white/5">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-heading text-[#f5f5f7]">Have Questions?</h2>
          <p className="text-sm text-[#888899] mt-2">
            We&apos;d love to hear from you. Send us a message and we&apos;ll get back to you.
          </p>
        </div>
        <BlogContactForm blogTitle={blog.title} />
      </div>
    </div>
  );
}
