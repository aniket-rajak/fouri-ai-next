"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion, AnimatePresence } from "framer-motion";
import { BlogImage } from "@/components/blog/BlogImage";
import { getFileUrl } from "@/lib/getFileUrl";
import {
  Plus, Trash2, Eye, EyeOff, Loader2, Sparkles, Upload, Link as LinkIcon, Images, X, ExternalLink,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  blogUrl: string | null;
  referenceUrl: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  clicks: number;
  impressions: number;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SCHEDULED", label: "Scheduled" },
];

export default function OwnerAdsPage() {
  const api = useOwnerApi();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ctaText, setCtaText] = useState("Learn More");
  const [ctaLink, setCtaLink] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [status, setStatus] = useState("ACTIVE");
  const [scheduledAt, setScheduledAt] = useState("");

  // Thumbnail
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState<"url" | "upload">("url");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string>("");
  const objectUrlRef = useRef("");

  // Media library picker
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  // AI generation
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiInstructions, setAiInstructions] = useState("");
  const [generating, setGenerating] = useState(false);

  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const res: any = await api("/ads");
      return res.ads as Ad[];
    },
  });

  const ads = data || [];

  // Preview blob URL for image
  useEffect(() => {
    if (!imageUrl) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
      }
      setObjectUrl("");
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    (async () => {
      try {
        const res = await fetch(getFileUrl(imageUrl));
        if (!res.ok) return;
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        objectUrlRef.current = blobUrl;
        setObjectUrl(blobUrl);
      } catch {
        // fallback
      }
    })();

    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [imageUrl]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCtaText("Learn More");
    setCtaLink("");
    setBlogUrl("");
    setReferenceUrls([]);
    setStatus("ACTIVE");
    setScheduledAt("");
    setImageUrl("");
    setEditing(null);
    setShowForm(false);
    setShowAiPrompt(false);
    setAiInstructions("");
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
    setObjectUrl("");
  };

  const handleEdit = (ad: Ad) => {
    setTitle(ad.title);
    setDescription(ad.description || "");
    setCtaText(ad.ctaText);
    setCtaLink(ad.ctaLink);
    setBlogUrl(ad.blogUrl || "");
    try {
      const parsed = JSON.parse(ad.referenceUrl || "[]");
      setReferenceUrls(Array.isArray(parsed) ? parsed.filter(Boolean) : [ad.referenceUrl].filter(Boolean));
    } catch {
      setReferenceUrls(ad.referenceUrl ? [ad.referenceUrl] : []);
    }
    setStatus(ad.status);
    setScheduledAt(ad.scheduledAt ? new Date(ad.scheduledAt).toISOString().slice(0, 16) : "");
    setImageUrl(ad.imageUrl);
    setEditing(ad);
    setShowForm(true);
  };

  const handleAiGenerate = async () => {
    if (!aiInstructions.trim() || generating) return;
    setGenerating(true);
    try {
      const res: any = await api("/ads/generate-ai", {
        method: "POST",
        body: JSON.stringify({ instructions: aiInstructions.trim() }),
      });
      const g = res.generated;
      if (g.title) setTitle(g.title);
      if (g.description) setDescription(g.description);
      if (g.ctaText) setCtaText(g.ctaText);
      if (g.ctaLink) setCtaLink(g.ctaLink);
      setShowAiPrompt(false);
      setAiInstructions("");
    } catch (err) {
      console.error("AI generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Maximum 2 MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("fouri_owner_token");
      const res = await fetch(`${API_BASE}/ads/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.url) setImageUrl(data.url);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploadingImage(false);
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

  const handleSave = async () => {
    if (!title.trim() || !imageUrl || !ctaLink.trim() || saving) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        description: description.trim() || null,
        imageUrl,
        ctaText: ctaText.trim() || "Learn More",
        ctaLink: ctaLink.trim(),
        blogUrl: blogUrl.trim() || null,
        referenceUrl: referenceUrls.filter(Boolean).length
          ? JSON.stringify(referenceUrls.filter(Boolean))
          : null,
        status,
        ...(status === "SCHEDULED" && scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      };

      if (editing) {
        await api(`/ads/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/ads", { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (err) {
      console.error("Save ad failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (ad: Ad) => {
    try {
      const newStatus = ad.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await api(`/ads/${ad.id}`, { method: "PUT", body: JSON.stringify({ status: newStatus }) });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    try {
      await api(`/ads/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (err) {
      console.error(err);
    }
  };

  const statusBadge = (s: string, scheduled: string | null) => {
    if (s === "ACTIVE") return { label: "Active", cls: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" };
    if (s === "SCHEDULED") return { label: scheduled ? `Scheduled: ${new Date(scheduled).toLocaleDateString()}` : "Scheduled", cls: "bg-amber-500/10 text-amber-300 border border-amber-500/20" };
    return { label: "Inactive", cls: "bg-rose-500/10 text-rose-300 border border-rose-500/20" };
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#f5f5f7]">Ad Manager</h1>
          <p className="text-sm text-[#888899] mt-1">Create and manage dashboard advertisements</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all cursor-pointer"
        >
          <Plus size={14} /> New Ad
        </button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#111118] rounded-2xl border border-white/5 p-5 overflow-hidden"
          >
            <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4">
              {editing ? "Edit Ad" : "Create New Ad"}
            </h3>

            {/* AI Generate */}
            <motion.div className="bg-[#0a0a14] border border-white/5 rounded-xl p-3 mb-4">
              {!showAiPrompt ? (
                <button
                  onClick={() => setShowAiPrompt(true)}
                  className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
                >
                  <Sparkles size={14} />
                  Generate with AI
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] text-[#888899]">Describe the ad you want to generate:</label>
                  <textarea
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    placeholder="e.g., Create an ad promoting our JEE Mains mock test series with a 50% discount..."
                    rows={2}
                    className="w-full bg-[#08080f] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#f5f5f7] placeholder-[#555566] outline-none focus:border-blue-500/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAiGenerate}
                      disabled={generating || !aiInstructions.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {generating ? "Generating..." : "Generate"}
                    </button>
                    <button
                      onClick={() => { setShowAiPrompt(false); setAiInstructions(""); }}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-[#888899] hover:text-[#f5f5f7] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#888899] mb-1">Title *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ad title"
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888899] mb-1">CTA Link *</label>
                  <input
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888899] mb-1">CTA Text</label>
                  <input
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Learn More"
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888899] mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] outline-none focus:border-blue-500/50"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {status === "SCHEDULED" && (
                  <div>
                    <label className="block text-xs text-[#888899] mb-1">Schedule Date & Time</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] outline-none focus:border-blue-500/50"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-[#888899] mb-1">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description..."
                  className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* blogUrl / referenceUrl */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#888899] mb-1">Blog URL (optional)</label>
                  <input
                    value={blogUrl}
                    onChange={(e) => setBlogUrl(e.target.value)}
                    placeholder="https://fouri.in/blog/..."
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888899] mb-1">Reference URLs (optional)</label>
                  <div className="space-y-1.5">
                    {referenceUrls.map((url, idx) => (
                      <div key={idx} className="flex gap-1.5">
                        <input
                          value={url}
                          onChange={(e) => {
                            const next = [...referenceUrls];
                            next[idx] = e.target.value;
                            setReferenceUrls(next);
                          }}
                          placeholder="https://..."
                          className="flex-1 h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                        />
                        <button
                          onClick={() => setReferenceUrls(referenceUrls.filter((_, i) => i !== idx))}
                          className="h-10 px-2.5 rounded-xl bg-rose-500/10 text-rose-300 text-xs hover:bg-rose-500/20 transition-all cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setReferenceUrls([...referenceUrls, ""])}
                      className="flex items-center gap-1 h-8 px-3 rounded-lg bg-white/5 text-[11px] text-[#888899] hover:text-[#f5f5f7] hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <Plus size={12} /> ADD +
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnail Section */}
              <div>
                <label className="block text-xs text-[#888899] mb-1.5">Ad Image *</label>
                <span className="block text-[10px] text-[#666677] mb-2">
                  Recommended Size: 1200 × 630 px | Format: JPG, PNG, WebP | Max Size: 2 MB
                </span>
                <div className="flex gap-1.5 mb-2">
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
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555566]" />
                    <input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value.trim())}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                )}

                {thumbnailMode === "upload" && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex items-center gap-2 w-full h-10 px-3 rounded-xl bg-[#08080f] border border-dashed border-white/5 text-xs text-[#888899] hover:text-[#f5f5f7] hover:border-white/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      {uploadingImage ? "Uploading..." : "Click to upload from device"}
                    </button>
                  </div>
                )}

                {/* Image Preview */}
                {imageUrl && (
                  <div className="mt-2 bg-[#08080f] border border-white/5 rounded-xl p-2 flex items-center justify-center min-h-[80px]">
                    {objectUrl ? (
                      <img
                        src={objectUrl}
                        alt="Preview"
                        className="max-w-full max-h-[200px] object-contain rounded-lg"
                      />
                    ) : (
                      <BlogImage src={imageUrl} alt="Preview" className="max-w-full max-h-[200px] object-contain rounded-lg" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={resetForm} className="h-9 px-4 rounded-xl text-xs text-[#888899] hover:text-[#f5f5f7] bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim() || !imageUrl || !ctaLink.trim()}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                  {editing ? "Update Ad" : "Create Ad"}
                </button>
              </div>
            </div>

            {/* Preview */}
            {title.trim() && imageUrl && (
              <div className="mt-4 bg-[#0a0a14] border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
                  <Eye size={12} className="text-[#888899]" />
                  <span className="text-[11px] font-medium text-[#888899]">Preview</span>
                </div>
                <div className="p-4">
                  <div className="bg-[#111118] rounded-xl border border-white/5 overflow-hidden max-w-sm mx-auto">
                    <div className="relative h-36 overflow-hidden bg-[#08080f]">
                      {imageUrl && (
                        <>
                          <BlogImage src={imageUrl} alt={title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-transparent" />
                        </>
                      )}
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] ${
                        status === "SCHEDULED"
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          : status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                      }`}>
                        {status === "SCHEDULED" && scheduledAt
                          ? `Scheduled: ${new Date(scheduledAt).toLocaleDateString()}`
                          : status === "ACTIVE" ? "Active" : "Inactive"}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-[#f5f5f7]">{title}</h3>
                      {description && (
                        <p className="text-xs text-[#888899] mt-1 line-clamp-2">{description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[11px] font-medium text-blue-400 truncate">{ctaText || "Learn More"}</span>
                        {ctaLink && <span className="text-[10px] text-[#555566] truncate">→ {ctaLink}</span>}
                      </div>
                      {blogUrl && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-400">
                          <ExternalLink size={10} /> Related Blog
                        </div>
                      )}
                      {referenceUrls.filter(Boolean).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {referenceUrls.filter(Boolean).map((url, idx) => (
                            <span key={idx} className="text-[9px] text-[#555566] bg-white/5 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                              {url}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
              <h3 className="text-sm font-semibold text-[#f5f5f7]">Select Image</h3>
              <button onClick={() => setShowMediaPicker(false)} className="text-[#888899] hover:text-[#f5f5f7] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            {mediaLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-blue-500" />
              </div>
            ) : mediaFiles.length === 0 ? (
              <p className="text-sm text-[#888899] text-center py-8">No images in library.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {mediaFiles.map((f: any) => (
                  <button
                    key={f.id}
                    onClick={() => { setImageUrl(f.url); setShowMediaPicker(false); }}
                    className="bg-[#08080f] border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer text-left group"
                  >
                    <div className="aspect-square bg-[#0a0a14] flex items-center justify-center p-2">
                      <BlogImage src={f.url} alt={f.originalName} className="max-w-full max-h-full object-contain" />
                    </div>
                    <p className="text-[10px] text-[#888899] truncate px-2 py-1.5">{f.originalName}</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Ads List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-blue-400" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad, i) => {
            const badge = statusBadge(ad.status, ad.scheduledAt);
            return (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-[#111118] rounded-2xl border overflow-hidden group transition-all ${
                  ad.status === "ACTIVE" ? "border-white/5 hover:border-blue-500/20" : "border-white/5 opacity-60"
                }`}
              >
                <div className="relative h-36 overflow-hidden">
                  <BlogImage src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-transparent" />
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] ${badge.cls}`}>
                    {badge.label}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-[#f5f5f7]">{ad.title}</h3>
                  {ad.description && (
                    <p className="text-xs text-[#888899] mt-1 line-clamp-2">{ad.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#888899]">
                    <span className="flex items-center gap-1"><Eye size={10} /> {ad.impressions}</span>
                    <span className="flex items-center gap-1"><ExternalLink size={10} /> {ad.clicks}</span>
                    {ad.impressions > 0 && (
                      <span>{(ad.clicks / ad.impressions * 100).toFixed(1)}% CTR</span>
                    )}
                  </div>
                  {ad.blogUrl && (
                    <a href={ad.blogUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-1.5 text-[10px] text-blue-400 hover:text-blue-300">
                      <ExternalLink size={10} /> Related Blog
                    </a>
                  )}
                  <div className="flex items-center gap-1.5 mt-3">
                    <button
                      onClick={() => toggleStatus(ad)}
                      className={`flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                        ad.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                          : "bg-white/5 text-[#888899] hover:bg-white/10"
                      }`}
                    >
                      {ad.status === "ACTIVE" ? <Eye size={10} /> : <EyeOff size={10} />}
                      {ad.status === "ACTIVE" ? "Active" : "Disabled"}
                    </button>
                    <button onClick={() => handleEdit(ad)} className="h-7 px-2.5 rounded-lg bg-white/5 text-[10px] text-[#888899] hover:text-[#f5f5f7] hover:bg-white/10 transition-all cursor-pointer">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(ad.id)} className="h-7 px-2.5 rounded-lg bg-white/5 text-[10px] text-[#888899] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {ads.length === 0 && (
            <p className="col-span-full text-center text-xs text-[#888899] py-12">
              No ads created yet. Click &quot;New Ad&quot; to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
