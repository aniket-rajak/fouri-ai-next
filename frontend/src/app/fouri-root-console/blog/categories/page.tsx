"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Trash2, Edit3, Tag, AlertCircle, ArrowLeft,
} from "lucide-react";

export default function BlogCategoriesPage() {
  const router = useRouter();
  const api = useOwnerApi();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res: any = await api("/blog/categories/list");
      setCategories(res.categories || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    setError("");
    try {
      await api("/owner/blog/categories", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await api(`/owner/blog/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editName.trim() }),
      });
      setEditingId(null);
      setEditName("");
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to update category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api(`/owner/blog/categories/${id}`, { method: "DELETE" });
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/fouri-root-console/blog")}
          className="p-2 rounded-lg text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#f5f5f7]">Blog Categories</h1>
          <p className="text-sm text-[#888899] mt-1">Manage blog post categories.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="bg-[#111118] border border-white/5 rounded-2xl p-4">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            placeholder="New category name..."
            className="flex-1 bg-[#08080f] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>
      </div>

      <div className="bg-[#111118] border border-white/5 rounded-2xl divide-y divide-white/5">
        {categories.length === 0 ? (
          <div className="p-8 text-center">
            <Tag size={32} className="mx-auto text-[#555566] mb-2" />
            <p className="text-sm text-[#888899]">No categories yet.</p>
          </div>
        ) : (
          categories.map((cat: any) => (
            <div key={cat.id} className="flex items-center gap-3 p-4">
              {editingId === cat.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(cat.id); }}
                    className="flex-1 bg-[#08080f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#f5f5f7] outline-none focus:border-blue-500/50"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(cat.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-[#888899] hover:text-[#f5f5f7] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                    <Tag size={14} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#f5f5f7]">{cat.name}</p>
                    <p className="text-xs text-[#555566]">/{cat.slug}</p>
                  </div>
                  <button
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    className="p-2 rounded-lg text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 rounded-lg text-[#888899] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
