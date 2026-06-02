import Link from "next/link";
import { Calendar, User } from "lucide-react";
import { BlogImage } from "./BlogImage";

interface BlogCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  categories: { name: string; slug: string }[] | null;
  authorName: string | null;
  publishedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Study Tips": "from-emerald-500 to-teal-500",
  "Exam Preparation": "from-blue-500 to-indigo-500",
  Technology: "from-purple-500 to-pink-500",
  Education: "from-amber-500 to-orange-500",
  "Product Updates": "from-cyan-500 to-blue-500",
};

export function BlogCard({
  title,
  slug,
  excerpt,
  thumbnailUrl,
  categories,
  authorName,
  publishedAt,
}: BlogCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block bg-[#111118] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 hover:bg-[#15152a] transition-all duration-300"
    >
      <div className="aspect-[2/1] bg-[#0a0a14] overflow-hidden">
        {thumbnailUrl ? (
          <BlogImage
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-[#1a1a28]">F</span>
          </div>
        )}
      </div>
      <div className="p-5">
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categories.map((cat) => (
              <span
                key={cat.slug}
                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-medium bg-gradient-to-r ${
                  CATEGORY_COLORS[cat.name] || "from-blue-500 to-indigo-500"
                } text-white`}
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}
        <h3 className="text-base font-semibold text-[#f5f5f7] group-hover:text-blue-300 transition-colors line-clamp-2 mb-2">
          {title}
        </h3>
        {excerpt && (
          <p className="text-xs text-[#888899] line-clamp-2 leading-relaxed">{excerpt}</p>
        )}
        <div className="flex items-center gap-3 mt-4 text-[10px] text-[#555566]">
          {authorName && (
            <span className="flex items-center gap-1">
              <User size={10} /> {authorName}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {publishedAt
              ? new Date(publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
