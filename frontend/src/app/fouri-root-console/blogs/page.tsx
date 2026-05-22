"use client";

import { useEffect, useState, useCallback } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Plus, Trash2, Loader2, Eye, EyeOff, Calendar, User, Link as LinkIcon,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

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

export default function OwnerBlogsPage() {
  const api = useOwnerApi();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState({
    title: "", slug: "", content: "", excerpt: "",
    imageUrl: "", author: "FOURI Team", published: false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchBlogs = useCallback(async () => {
    try {
      const data = await api("/owner/blogs") as { blogs: Blog[] };
      setBlogs(data.blogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const resetForm = () => {
    setForm({
      title: "", slug: "", content: "", excerpt: "",
      imageUrl: "", author: "FOURI Team", published: false,
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (blog: Blog) => {
    setForm({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt || "",
      imageUrl: blog.imageUrl || "",
      author: blog.author,
      published: blog.published,
    });
    setEditing(blog);
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: editing ? prev.slug : generateSlug(title),
    }));
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.content) return;
    setSaving(true);
    try {
      const body = { ...form, excerpt: form.excerpt || null, imageUrl: form.imageUrl || null };
      if (editing) {
        await api(`/owner/blogs/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/owner/blogs", { method: "POST", body: JSON.stringify(body) });
      }
      resetForm();
      fetchBlogs();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (blog: Blog) => {
    try {
      await api(`/owner/blogs/${blog.id}`, {
        method: "PUT",
        body: JSON.stringify({ published: !blog.published }),
      });
      fetchBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      await api(`/owner/blogs/${id}`, { method: "DELETE" });
      fetchBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#f5f5f7]">Blog Manager</h1>
          <p className="text-sm text-[#888899] mt-1">Create and manage blog posts</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all cursor-pointer"
        >
          <Plus size={14} /> New Post
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
              {editing ? "Edit Blog Post" : "Create New Blog Post"}
            </h3>
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#888899] mb-1">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Blog post title"
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888899] mb-1">Slug *</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="blog-post-slug"
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#888899] mb-1">Excerpt</label>
                <input
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Brief summary for the blog card..."
                  className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-[#888899] mb-1">Content (Markdown text) *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your blog content here... Use ## for headings, ### for subheadings."
                  rows={10}
                  className="w-full px-3 py-2 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50 resize-y"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#888899] mb-1">Image URL</label>
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
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-[#888899] mb-1">Author</label>
                  <input
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    placeholder="FOURI Team"
                    className="w-full h-10 px-3 rounded-xl bg-[#08080f] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <button
                    onClick={() => setForm({ ...form, published: !form.published })}
                    className={`flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      form.published
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        : "bg-white/5 text-[#888899] border border-white/5"
                    }`}
                  >
                    {form.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    {form.published ? "Published" : "Draft"}
                  </button>
                </div>
              </div>

              {form.imageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-white/5">
                  <Image
                    src={form.imageUrl}
                    alt="Preview"
                    width={400}
                    height={130}
                    className="w-full h-32 object-cover"
                    onError={(e) => { (e.currentTarget).style.display = "none"; }}
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={resetForm}
                  className="h-9 px-4 rounded-xl text-xs text-[#888899] hover:text-[#f5f5f7] bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title || !form.slug || !form.content}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                  {editing ? "Update Post" : "Create Post"}
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
        <div className="space-y-3">
          {blogs.map((blog, i) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-[#111118] rounded-2xl border p-4 transition-all ${
                blog.published
                  ? "border-white/5 hover:border-blue-500/20"
                  : "border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-[#08080f] border border-white/5">
                  {blog.imageUrl ? (
                    <Image src={blog.imageUrl} alt="" width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <LinkIcon size={16} className="text-[#888899]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-[#f5f5f7] truncate">
                      {blog.title}
                    </h3>
                    {!blog.published && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] border border-amber-500/20">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#888899]">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {new Date(blog.createdAt).toLocaleDateString("en-IN")}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={10} /> {blog.author}
                    </span>
                    <span className="text-[10px]">/blog/{blog.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => togglePublished(blog)}
                    className={`flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                      blog.published
                        ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        : "bg-white/5 text-[#888899] hover:bg-white/10"
                    }`}
                  >
                    {blog.published ? <Eye size={10} /> : <EyeOff size={10} />}
                    {blog.published ? "Published" : "Draft"}
                  </button>
                  <button
                    onClick={() => handleEdit(blog)}
                    className="h-7 px-2.5 rounded-lg bg-white/5 text-[10px] text-[#888899] hover:text-[#f5f5f7] hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    className="h-7 px-2.5 rounded-lg bg-white/5 text-[10px] text-[#888899] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {blogs.length === 0 && (
            <p className="text-center text-xs text-[#888899] py-12">
              No blog posts yet. Click &quot;New Post&quot; to create one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
