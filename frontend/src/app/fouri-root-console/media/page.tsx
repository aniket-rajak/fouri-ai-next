"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Loader2, Copy, Trash2, ImageIcon, X, ChevronDown,
  Download, ExternalLink, Check, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import { BlogImage } from "@/components/blog/BlogImage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const ITEMS_PER_PAGE = 26;

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "general", label: "General" },
  { value: "logos", label: "Logos" },
  { value: "banners", label: "Banners" },
  { value: "templates", label: "Templates" },
];

// ── Skeleton card ──
function SkeletonCard() {
  return (
    <div className="bg-[#111118] border border-white/5 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-[#1a1a28]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#1a1a28] rounded w-3/4" />
        <div className="h-2 bg-[#1a1a28] rounded w-1/2" />
      </div>
    </div>
  );
}

// ── Full-screen preview modal ──
function PreviewModal({ file, onClose }: { file: any; onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  return (
    <motion.div
      ref={backdropRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      tabIndex={0}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-3xl w-full max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white cursor-pointer"
        >
          <X size={24} />
        </button>
        <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center p-4">
          <BlogImage
            src={file.url}
            alt={file.originalName}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-[#f5f5f7]">
          <span className="font-medium truncate">{file.originalName}</span>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(file.url); } catch { /* */ }
              }}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              <Copy size={14} /> Copy URL
            </button>
            <a href={file.url} download={file.originalName} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
              <Download size={14} /> Download
            </a>
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
              <ExternalLink size={14} /> Open
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──
export default function MediaLibraryPage() {
  const api = useOwnerApi();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Upload state
  const [uploadCategory, setUploadCategory] = useState("general");

  // Copied URL feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Preview modal
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // ── Fetch media (paginated) ──
  const mediaQuery = useQuery({
    queryKey: ["media", page, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE) });
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await api(`/owner/media?${params}`);
      return res as { files: any[]; total: number; page: number; totalPages: number; limit: number };
    },
  });

  const files = mediaQuery.data?.files || [];
  const total = mediaQuery.data?.total || 0;
  const totalPages = mediaQuery.data?.totalPages || 0;

  // ── Upload mutation ──
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", uploadCategory);
      const token = localStorage.getItem("fouri_owner_token");
      const res = await fetch(`${API_BASE}/owner/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api(`/owner/media/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      uploadMutation.mutate(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadMutation]
  );

  const copyUrl = useCallback(
    async (url: string, id: string) => {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    []
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Filtered files (client-side search by filename) ──
  const filteredFiles = searchQuery
    ? files.filter((f: any) =>
        f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  // ── Loading state ──
  if (mediaQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5f7]">Media Library</h1>
          <p className="text-sm text-[#888899] mt-1">Upload and manage images for your platform.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Preview modal */}
      <AnimatePresence>
        {previewFile && (
          <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#f5f5f7]">Media Library</h1>
        <p className="text-sm text-[#888899] mt-1">
          Upload and manage images for your platform.
        </p>
      </div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111118] border border-white/5 rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-[#f5f5f7]">Upload Image</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 pr-10 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
            >
              {CATEGORIES.filter((c) => c.value).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888899] pointer-events-none" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {uploadMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploadMutation.isPending ? "Uploading..." : "Choose File"}
          </button>
          <span className="text-xs text-[#555566]">PNG, JPG, WebP, SVG — max 10 MB</span>
        </div>
      </motion.div>

      {/* Filters & Count */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555566]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename..."
              className="w-48 sm:w-64 bg-[#111118] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
            />
          </div>
          {/* Category filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="bg-[#111118] border border-white/5 rounded-xl px-3 py-2 pr-10 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888899] pointer-events-none" />
          </div>
        </div>
        <span className="text-xs text-[#555566]">
          {searchQuery ? `Found ${filteredFiles.length} of ` : ""}
          {total} image{total !== 1 ? "s" : ""}
        </span>
      </motion.div>

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111118] border border-white/5 rounded-2xl p-6"
      >
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon size={32} className="text-[#888899] mb-3" />
            <p className="text-sm text-[#888899]">
              {searchQuery ? "No images match your search." : "No images uploaded yet."}
            </p>
            <p className="text-xs text-[#555566] mt-1">
              {searchQuery ? "Try a different filename." : "Upload an image to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map((file: any) => (
              <div
                key={file.id}
                className="bg-[#08080f] border border-white/5 rounded-xl overflow-hidden group hover:border-white/10 transition-all relative"
              >
                {/* Preview */}
                <div
                  className="aspect-square bg-[#0a0a14] flex items-center justify-center p-2 cursor-pointer"
                  onClick={() => setPreviewFile(file)}
                >
                  {file.url ? (
                    <BlogImage
                      src={file.url}
                      alt={file.originalName}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-[#555566]" />
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-[#f5f5f7] truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#555566]">{formatSize(file.fileSize)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#888899] capitalize">
                      {file.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#555566]">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                  <button
                    onClick={() => copyUrl(file.url, file.id)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                    title="Copy URL"
                  >
                    {copiedId === file.id ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-white" />
                    )}
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    title="Open"
                  >
                    <ExternalLink size={16} className="text-white" />
                  </a>
                  <a
                    href={file.url}
                    download={file.originalName}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    title="Download"
                  >
                    <Download size={16} className="text-white" />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm("Delete this image?")) deleteMutation.mutate(file.id);
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-lg bg-white/10 hover:bg-red-500/30 transition-all cursor-pointer disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && !searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-4"
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-[#111118] border border-white/5 text-[#f5f5f7] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm text-[#888899]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-[#111118] border border-white/5 text-[#f5f5f7] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Next <ChevronRight size={16} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
