"use client";

import { useEffect, useState } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion } from "framer-motion";
import {
  Plus, Loader2, Trash2, Hash, AlertCircle,
} from "lucide-react";

export default function BlogTagsPage() {
  const api = useOwnerApi();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res: any = await api("/blog/tags/list");
      setTags(res.tags || []);
    } catch {
      setTags([]);
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
      await api("/owner/blog/tags", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    try {
      await api(`/owner/blog/tags/${id}`, { method: "DELETE" });
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to delete tag");
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
      <div>
        <h1 className="text-xl font-bold text-[#f5f5f7]">Blog Tags</h1>
        <p className="text-sm text-[#888899] mt-1">Manage blog post tags.</p>
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
            placeholder="New tag name..."
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

      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <div className="w-full bg-[#111118] border border-white/5 rounded-2xl p-8 text-center">
            <Hash size={32} className="mx-auto text-[#555566] mb-2" />
            <p className="text-sm text-[#888899]">No tags yet.</p>
          </div>
        ) : (
          tags.map((tag: any) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-[#111118] border border-white/5 rounded-xl px-3 py-2 group hover:border-white/10 transition-all"
            >
              <Hash size={12} className="text-[#555566]" />
              <span className="text-sm text-[#f5f5f7]">{tag.name}</span>
              <button
                onClick={() => handleDelete(tag.id)}
                className="p-1 rounded text-[#555566] opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
