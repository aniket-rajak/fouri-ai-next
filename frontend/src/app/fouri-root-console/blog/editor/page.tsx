"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion } from "framer-motion";
import {
  Loader2,
  Sparkles,
  Upload,
  Link as LinkIcon,
  AlertCircle,
  ChevronDown,
  Save,
  ArrowLeft,
  Images,
  X,
  Eye,
  Calendar,
} from "lucide-react";
import { BlogImage } from "@/components/blog/BlogImage";
import { getFileUrl } from "@/lib/getFileUrl";
import MultiSelect from "@/components/ui/MultiSelect";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function buildScheduledIso(
  date: string,
  hour: string,
  minute: string,
  ampm: "AM" | "PM",
): string {
  let h = parseInt(hour);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const d = new Date(date + "T00:00:00");
  d.setHours(h, parseInt(minute), 0, 0);
  return d.toISOString();
}

export default function BlogEditorPage() {
  const api = useOwnerApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiInstructions, setAiInstructions] = useState("");

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleHour, setScheduleHour] = useState("12");
  const [scheduleMinute, setScheduleMinute] = useState("00");
  const [scheduleAmPm, setScheduleAmPm] = useState<"AM" | "PM">("AM");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);

  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // Thumbnail
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState<"upload" | "url">("url");
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  // Media library picker
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  // AI prompts toggle
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    Promise.all([
      api("/blog/categories/list").catch(() => ({ categories: [] })),
      api("/blog/tags/list").catch(() => ({ tags: [] })),
    ]).then(([catRes, tagRes]) => {
      setCategories((catRes as any).categories || []);
      setTags((tagRes as any).tags || []);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editId) {
      api(`/owner/blog/${editId}`)
        .then((res: any) => {
          const blog = res.blog;
          setTitle(blog.title);
          setExcerpt(blog.excerpt || "");
          setContent(blog.content);
          setThumbnailUrl(blog.thumbnailUrl || "");
          setAuthorName(blog.authorName || "");
          setStatus(blog.status);
          if (blog.scheduledAt) {
            const d = new Date(blog.scheduledAt);
            setScheduleDate(d.toISOString().slice(0, 10));
            const h = d.getHours();
            setScheduleAmPm(h >= 12 ? "PM" : "AM");
            const h12 = h % 12 || 12;
            setScheduleHour(String(h12).padStart(2, "0"));
            setScheduleMinute(String(d.getMinutes()).padStart(2, "0"));
          }
          setCategoryIds(blog.categories?.map((c: any) => c.id) || []);
          setTagIds(blog.tags?.map((t: any) => t.id) || []);
        })
        .finally(() => setLoading(false));
    }
  }, [editId]); // eslint-disable-line react-hooks/exhaustive-deps



  const handleAiGenerate = async () => {
    if (!aiInstructions.trim() || generating) return;
    setGenerating(true);
    try {
      const res: any = await api("/owner/blog/generate-ai", {
        method: "POST",
        body: JSON.stringify({ instructions: aiInstructions.trim() }),
      });
      const g = res.generated;
      setTitle(g.title || "");
      setExcerpt(g.excerpt || "");
      setContent(g.content || "");
      if (g.tags?.length) {
        const matched = tags.filter((t: any) =>
          g.tags.some(
            (gt: string) => gt.toLowerCase() === t.name.toLowerCase(),
          ),
        );
        setTagIds(matched.map((t: any) => t.id));
      }
      if (g.category) {
        const matched = categories.find(
          (c: any) => c.name.toLowerCase() === g.category.toLowerCase(),
        );
        if (matched)
          setCategoryIds((prev) =>
            prev.includes(matched.id) ? prev : [...prev, matched.id],
          );
      }
      setShowAiPrompt(false);
    } catch (err) {
      console.error("AI generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Maximum 2 MB.");
      return;
    }

    setUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("fouri_owner_token");
      const res = await fetch(`${API_BASE}/owner/blog/upload-thumbnail`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.url) setThumbnailUrl(data.url);
    } catch (err) {
      console.error("Thumbnail upload failed:", err);
    } finally {
      setUploadingThumbnail(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openMediaPicker = async () => {
    setShowMediaPicker(true);
    setMediaLoading(true);
    try {
      const res: any = await api("/owner/media");
      setMediaFiles(res.files || []);
    } catch {
      setMediaFiles([]);
    } finally {
      setMediaLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || saving) return;
    if (categoryIds.length === 0) {
      setCategoryError("Please select at least one category");
      return;
    }
    setCategoryError("");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
        thumbnailUrl: thumbnailUrl || undefined,
        authorName: authorName.trim() || undefined,
        status,
        ...(status === "SCHEDULED" && scheduleDate
          ? { scheduledAt: buildScheduledIso(scheduleDate, scheduleHour, scheduleMinute, scheduleAmPm) }
          : {}),
        categoryIds: categoryIds.length ? categoryIds : undefined,
        tagIds: tagIds.length ? tagIds : undefined,
      };

      if (editId) {
        await api(`/owner/blog/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/owner/blog", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/fouri-root-console/blog");
    } catch (err) {
      console.error("Save blog failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/fouri-root-console/blog")}
            className="p-2 rounded-lg text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5 transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#f5f5f7]">
              {editId ? "Edit Blog" : "New Blog"}
            </h1>
            <p className="text-sm text-[#888899] mt-1">
              {editId ? "Update your blog post." : "Create a new blog post."}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim() || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {editId ? "Update" : "Publish"}
        </button>
      </div>

      {/* AI Generate */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111118] border border-white/5 rounded-2xl p-4"
      >
        {!showAiPrompt ? (
          <button
            onClick={() => setShowAiPrompt(true)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            Generate with AI
          </button>
        ) : (
          <div className="space-y-3">
            <label className="text-xs text-[#888899]">
              Describe the blog you want to generate:
            </label>
            <textarea
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              placeholder="e.g., Write a blog about effective study techniques for JEE Mains preparation..."
              rows={3}
              className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] placeholder-[#555566] outline-none focus:border-blue-500/50 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAiGenerate}
                disabled={generating || !aiInstructions.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {generating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                {generating ? "Generating..." : "Generate"}
              </button>
              <button
                onClick={() => {
                  setShowAiPrompt(false);
                  setAiInstructions("");
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-[#888899] hover:text-[#f5f5f7] transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Main Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#111118] border border-white/5 rounded-2xl p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-[#888899] mb-1.5">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter blog title"
              className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-[#888899] mb-1.5">
              Author Name
            </label>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="FOURI Team"
              className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-[#888899] mb-1.5">
              Status
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 pr-10 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888899] pointer-events-none" />
            </div>
          </div>
          {status === "SCHEDULED" && (
            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs text-[#888899] mb-1.5">
                Schedule Date & Time
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {/* Date */}
                <div className="relative flex-1 min-w-[180px]">
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Calendar
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none"
                  />
                </div>

                {/* Hour */}
                <select
                  value={scheduleHour}
                  onChange={(e) => setScheduleHour(e.target.value)}
                  className="bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 w-20"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const v = String(i + 1).padStart(2, "0");
                    return <option key={v} value={v}>{v}</option>;
                  })}
                </select>

                <span className="text-[#888899] text-sm font-medium">:</span>

                {/* Minute */}
                <select
                  value={scheduleMinute}
                  onChange={(e) => setScheduleMinute(e.target.value)}
                  className="bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50 w-20"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const v = String(i * 5).padStart(2, "0");
                    return <option key={v} value={v}>{v}</option>;
                  })}
                </select>

                {/* AM / PM toggle switch */}
                <button
                  type="button"
                  onClick={() =>
                    setScheduleAmPm((p) => (p === "AM" ? "PM" : "AM"))
                  }
                  className={`relative w-16 h-8 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    scheduleAmPm === "AM"
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "bg-amber-600/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-7 h-7 rounded-lg bg-white/10 transition-transform duration-200 ${
                      scheduleAmPm === "AM" ? "left-0.5" : "left-[calc(100%-30px)]"
                    }`}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-1">
                    {scheduleAmPm === "AM" ? (
                      <>
                        <span className="text-blue-300">AM</span>
                        <span className="text-[#555566]">PM</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#555566]">AM</span>
                        <span className="text-amber-300">PM</span>
                      </>
                    )}
                  </span>
                </button>
            </div>
          </div>
          )}
          <div>
            <MultiSelect
              label="Categories"
              required
              options={categories}
              selectedIds={categoryIds}
              onChange={(ids) => {
                setCategoryIds(ids);
                setCategoryError("");
              }}
              error={categoryError}
              placeholder="Search categories..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#888899] mb-1.5">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short summary of the blog post..."
            rows={2}
            className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] placeholder-[#555566] outline-none focus:border-blue-500/50 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-[#888899] mb-1.5">
            Content (HTML) *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="<p>Blog content HTML...</p>"
            rows={16}
            className="w-full bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] font-mono outline-none focus:border-blue-500/50 resize-y"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs text-[#888899] mb-1.5">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: any) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tagIds.includes(tag.id)
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/20"
                    : "bg-white/5 text-[#888899] border border-white/5 hover:text-[#f5f5f7]"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Thumbnail Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111118] border border-white/5 rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-[#f5f5f7]">
          Thumbnail Image
        </h2>

        <span className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-blue-300">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>
            Recommended Thumbnail Specifications — Size: 1200 × 630 px | Format:
            JPG, JPEG, PNG, or WebP | Maximum Size: 2 MB | Aspect Ratio: 1.91:1
          </span>
        </span>

        <div className="flex gap-1.5">
          <button
            onClick={() => setThumbnailMode("url")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              thumbnailMode === "url"
                ? "bg-blue-600/10 text-blue-300 border border-blue-500/10"
                : "bg-white/5 text-[#888899] hover:text-[#f5f5f7]"
            }`}
          >
            <LinkIcon size={12} /> URL
          </button>
          <button
            onClick={() => setThumbnailMode("upload")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              thumbnailMode === "upload"
                ? "bg-blue-600/10 text-blue-300 border border-blue-500/10"
                : "bg-white/5 text-[#888899] hover:text-[#f5f5f7]"
            }`}
          >
            <Upload size={12} /> Upload
          </button>
          <button
            onClick={openMediaPicker}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 text-[#888899] hover:text-[#f5f5f7] transition-all cursor-pointer"
          >
            <Images size={12} /> Media Library
          </button>
        </div>

        {thumbnailMode === "url" && (
          <div className="relative">
            <LinkIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555566]"
            />
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value.trim())}
              placeholder="https://example.com/thumbnail.jpg"
              className="w-full bg-[#08080f] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
            />
          </div>
        )}

        {thumbnailMode === "upload" && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleThumbnailUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingThumbnail}
              className="flex items-center gap-2 w-full bg-[#08080f] border border-dashed border-white/10 rounded-xl px-4 py-3 text-sm text-[#888899] hover:text-[#f5f5f7] hover:border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {uploadingThumbnail ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {uploadingThumbnail
                ? "Uploading..."
                : "Click to upload from device"}
            </button>
          </div>
        )}

        {/* Thumbnail Preview */}
        {thumbnailUrl && (
          <div className="bg-[#08080f] border border-white/5 rounded-xl p-3 flex items-center justify-center min-h-[100px]">
            <BlogImage
              src={getFileUrl(thumbnailUrl)}
              alt="Thumbnail preview"
              className="max-w-full max-h-[300px] object-contain rounded-lg"
            />
          </div>
        )}
      </motion.div>

      {/* Media Library Picker Modal */}
      {showMediaPicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowMediaPicker(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111118] border border-white/5 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#f5f5f7]">
                Select Image
              </h3>
              <button
                onClick={() => setShowMediaPicker(false)}
                className="text-[#888899] hover:text-[#f5f5f7] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {mediaLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-blue-500" />
              </div>
            ) : mediaFiles.length === 0 ? (
              <p className="text-sm text-[#888899] text-center py-8">
                No images in library.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {mediaFiles.map((f: any) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setThumbnailUrl(getFileUrl(f.url));
                      setShowMediaPicker(false);
                    }}
                    className="bg-[#08080f] border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer text-left group"
                  >
                    <div className="aspect-square bg-[#0a0a14] flex items-center justify-center p-2">
                      <BlogImage
                        src={getFileUrl(f.url)}
                        alt={f.originalName}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-[#888899] truncate px-2 py-1.5">
                      {f.originalName}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Preview */}
      {content && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#111118] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Eye size={14} className="text-[#888899]" />
            <h2 className="text-sm font-semibold text-[#f5f5f7]">Preview</h2>
          </div>
          <div
            className="bg-[#08080f] rounded-xl p-6 max-w-3xl mx-auto overflow-auto max-h-[600px]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </motion.div>
      )}
    </div>
  );
}
