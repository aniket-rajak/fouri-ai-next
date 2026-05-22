"use client";

import { useEffect, useState, useCallback } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Image as ImageIcon, Plus, Trash2, Eye, EyeOff, Loader2,
  ExternalLink, BarChart3, Link as LinkIcon,
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
  active: boolean;
  clicks: number;
  impressions: number;
  createdAt: string;
}

export default function OwnerAdsPage() {
  const api = useOwnerApi();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", ctaText: "Learn More", ctaLink: "", blogUrl: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchAds = useCallback(async () => {
    try {
      const data = await api("/ads") as { ads: Ad[] };
      setAds(data.ads);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const resetForm = () => {
    setForm({ title: "", description: "", imageUrl: "", ctaText: "Learn More", ctaLink: "", blogUrl: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (ad: Ad) => {
    setForm({
      title: ad.title, description: ad.description || "", imageUrl: ad.imageUrl,
      ctaText: ad.ctaText, ctaLink: ad.ctaLink, blogUrl: ad.blogUrl || "",
    });
    setEditing(ad);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("fouri_owner_token");
      const res = await fetch(`${API_BASE}/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json() as { url: string };
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.imageUrl || !form.ctaLink) return;
    setSaving(true);
    try {
      const body = { ...form, blogUrl: form.blogUrl || null };
      if (editing) {
        await api(`/ads/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/ads", { method: "POST", body: JSON.stringify(body) });
      }
      resetForm();
      fetchAds();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad: Ad) => {
    try {
      await api(`/ads/${ad.id}`, { method: "PUT", body: JSON.stringify({ active: !ad.active }) });
      fetchAds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    try {
      await api(`/ads/${id}`, { method: "DELETE" });
      fetchAds();
    } catch (err) {
      console.error(err);
    }
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
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#888899] mb-1">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ad title"
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888899] mb-1">Image URL *</label>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888899] mb-1">Or Upload Image</label>
                  <label className="flex items-center justify-center h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 border-dashed text-xs text-[#888899] hover:text-[#f5f5f7] hover:border-blue-500/30 cursor-pointer transition-all">
                    {uploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Choose Image"
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-[#888899] mb-1">CTA Link *</label>
                  <input
                    value={form.ctaLink}
                    onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888899] mb-1">CTA Text</label>
                  <input
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    placeholder="Learn More"
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#888899] mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description..."
                  className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#888899] mb-1">Blog URL (optional)</label>
                <input
                  value={form.blogUrl}
                  onChange={(e) => setForm({ ...form, blogUrl: e.target.value })}
                  placeholder="https://www.fouri.in/blog/your-blog-post"
                  className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {form.imageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-white/5">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-32 object-cover" onError={(e) => { (e.currentTarget).style.display = "none"; }} />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button onClick={resetForm} className="h-9 px-4 rounded-xl text-xs text-[#888899] hover:text-[#f5f5f7] bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title || !form.imageUrl || !form.ctaLink}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                  {editing ? "Update Ad" : "Create Ad"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-blue-400" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad, i) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-[#111118] rounded-2xl border overflow-hidden group transition-all ${
                ad.active ? "border-white/5 hover:border-blue-500/20" : "border-white/5 opacity-60"
              }`}
            >
              <div className="relative h-36 overflow-hidden">
                <Image src={ad.imageUrl} alt={ad.title} width={400} height={250} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-transparent" />
                {!ad.active && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] border border-rose-500/20">
                    Disabled
                  </div>
                )}
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
                  {ad.blogUrl && (
                    <span className="flex items-center gap-1 text-blue-400">
                      <LinkIcon size={10} /> Blog
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <button
                    onClick={() => toggleActive(ad)}
                    className={`flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                      ad.active
                        ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        : "bg-white/5 text-[#888899] hover:bg-white/10"
                    }`}
                  >
                    {ad.active ? <Eye size={10} /> : <EyeOff size={10} />}
                    {ad.active ? "Active" : "Disabled"}
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
          ))}
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
