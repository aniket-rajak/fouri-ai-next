"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus, Loader2, Search, Trash2, Edit3, FileText, ChevronDown,
  ChevronLeft, ChevronRight, AlertCircle, Tag,
} from "lucide-react";
import { BlogImage } from "@/components/blog/BlogImage";

const STATUS_BADGES: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-zinc-500/10", text: "text-zinc-400" },
  SCHEDULED: { bg: "bg-amber-500/10", text: "text-amber-400" },
  PUBLISHED: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-[#1a1a28] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[#1a1a28] rounded w-3/4" />
        <div className="h-3 bg-[#1a1a28] rounded w-1/3" />
      </div>
      <div className="h-6 w-16 bg-[#1a1a28] rounded-full shrink-0" />
    </div>
  );
}

export default function BlogListPage() {
  const api = useOwnerApi();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["owner-blogs", page, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      return api(`/owner/blog?${params}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api(`/owner/blog/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-blogs"] });
      setDeleteId(null);
    },
  });

  const blogs = (data as any)?.blogs || [];
  const total = (data as any)?.total || 0;
  const totalPages = (data as any)?.totalPages || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-[#f5f5f7]">Blog Posts</h1>
          <p className="text-sm text-[#888899] mt-1">Create and manage blog posts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/fouri-root-console/blog/categories"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-[#f5f5f7] hover:bg-white/10 transition-all"
          >
            <Tag size={16} />
            + Add Category
          </Link>
          <Link
            href="/fouri-root-console/blog/editor"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all"
          >
            <Plus size={16} />
            New Blog
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555566]" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search blogs..."
            className="w-full bg-[#111118] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#111118] border border-white/5 rounded-xl px-3 py-2 pr-10 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888899] pointer-events-none" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#111118] border border-white/5 rounded-2xl divide-y divide-white/5"
          >
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </motion.div>
        ) : blogs.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111118] border border-white/5 rounded-2xl p-12 text-center"
          >
            <FileText size={40} className="mx-auto text-[#555566] mb-3" />
            <p className="text-sm text-[#888899]">
              {search || statusFilter ? "No blogs match your filters." : "No blogs yet."}
            </p>
            <Link
              href="/fouri-root-console/blog/editor"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all"
            >
              <Plus size={16} />
              Create Your First Blog
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden"
          >
            {blogs.map((blog: any) => {
              const badge = STATUS_BADGES[blog.status] || STATUS_BADGES.DRAFT;
              return (
                <div
                  key={blog.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-[#08080f] flex items-center justify-center overflow-hidden shrink-0">
                      {blog.thumbnailUrl ? (
                        <BlogImage src={blog.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={20} className="text-[#555566]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#f5f5f7] truncate">{blog.title}</p>
                      <p className="text-xs text-[#555566] mt-0.5">
                        <span className="flex flex-wrap gap-1">
                          {blog.categories?.length
                            ? blog.categories.map((c: any) => (
                                <span key={c.id} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-600/10 text-blue-300 border border-blue-500/10">
                                  {c.name}
                                </span>
                              ))
                            : <span className="text-[#555566]">Uncategorized</span>}
                        </span>
                        {blog.authorName ? ` · ${blog.authorName}` : ""}
                        {blog.publishedAt
                          ? ` · ${new Date(blog.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-1 shrink-0 self-end sm:self-auto">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                      {blog.status}
                    </span>
                    <Link
                      href={`/fouri-root-console/blog/editor?id=${blog.id}`}
                      className="p-2 rounded-lg text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5 transition-all"
                    >
                      <Edit3 size={14} />
                    </Link>
                    <button
                      onClick={() => setDeleteId(blog.id)}
                      className="p-2 rounded-lg text-[#888899] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
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

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] border border-white/5 rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#f5f5f7]">Delete Blog</h3>
                  <p className="text-xs text-[#888899]">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-[#888899] hover:text-[#f5f5f7] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteId)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
