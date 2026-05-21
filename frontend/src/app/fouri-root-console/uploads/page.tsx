"use client";

import { useEffect, useState, useCallback } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion } from "framer-motion";
import {
  Upload, Search, Loader2, FileText, CheckCircle2, XCircle, Clock,
  Download, Trash2, RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

interface UploadRecord {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number | null;
  cloudinaryUrl: string | null;
  status: string;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  mockTests: { id: string; title: string }[];
}

const statusConfig: Record<string, { icon: any; color: string }> = {
  PROCESSING: { icon: Clock, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  ANALYZING: { icon: RefreshCw, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  COMPLETED: { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  FAILED: { icon: XCircle, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
};

export default function OwnerUploadsPage() {
  const ownerApi = useOwnerApi();
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (subjectFilter !== "all") params.set("subject", subjectFilter);
      const data = await ownerApi(`/owner/uploads?${params}`) as { uploads: UploadRecord[]; subjects: string[] };
      setUploads(data.uploads);
      setSubjects(data.subjects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [ownerApi, search, typeFilter, statusFilter, subjectFilter]);

  useEffect(() => { fetchUploads(); }, [fetchUploads]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this upload?")) return;
    try {
      await api.delete(`/upload/${id}`);
      setUploads((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert("Failed to delete");
    }
  };

  const types = [...new Set(uploads.map((u) => u.fileType).filter(Boolean))];
  const statuses = [...new Set(uploads.map((u) => u.status))];

  const filtered = uploads.filter((u) => {
    if (search && !u.filename.toLowerCase().includes(search.toLowerCase()) &&
        !u.user.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && u.fileType !== typeFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  const stats = [
    { label: "Total", value: uploads.length, icon: Upload, color: "from-blue-600 to-blue-500" },
    { label: "Completed", value: uploads.filter((u) => u.status === "COMPLETED").length, icon: CheckCircle2, color: "from-emerald-600 to-emerald-500" },
    { label: "Processing", value: uploads.filter((u) => u.status === "PROCESSING" || u.status === "ANALYZING").length, icon: Clock, color: "from-amber-600 to-amber-500" },
    { label: "Failed", value: uploads.filter((u) => u.status === "FAILED").length, icon: XCircle, color: "from-rose-600 to-rose-500" },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-heading text-[#f5f5f7]">Question Paper Intelligence</h1>
        <p className="text-sm text-[#888899] mt-1">Monitor uploads, OCR, and AI analysis status</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#111118] rounded-xl border border-white/5 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#888899]">{s.label}</span>
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold font-heading text-[#f5f5f7]">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888899]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files or students..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#111118] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#111118] border border-white/5 text-xs text-[#f5f5f7] focus:outline-none focus:border-blue-500/50"
        >
          <option value="all">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t.split("/").pop()}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#111118] border border-white/5 text-xs text-[#f5f5f7] focus:outline-none focus:border-blue-500/50"
        >
          <option value="all">All Status</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#111118] border border-white/5 text-xs text-[#f5f5f7] focus:outline-none focus:border-blue-500/50"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-blue-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((upload, i) => {
            const config = statusConfig[upload.status] || statusConfig.PROCESSING;
            const StatusIcon = config.icon;
            return (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-[#111118] rounded-xl border border-white/5 p-4 hover:border-blue-500/20 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-[#888899]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#f5f5f7] truncate">{upload.filename}</p>
                      <p className="text-xs text-[#888899]">
                        {upload.user.name || upload.user.email}
                        <span className="mx-1.5">·</span>
                        {upload.fileType.split("/").pop()?.toUpperCase()}
                        <span className="mx-1.5">·</span>
                        {new Date(upload.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border ${config.color}`}>
                      <StatusIcon size={12} />
                      {upload.status.toLowerCase()}
                    </span>
                    {upload.cloudinaryUrl && (
                      <a
                        href={upload.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#888899] hover:text-[#f5f5f7] hover:bg-white/10 transition-all"
                      >
                        <Download size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(upload.id)}
                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#888899] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {upload.mockTests?.length > 0 && (
                  <div className="mt-2 ml-12 flex flex-wrap gap-1.5">
                    {upload.mockTests.map((mt) => (
                      <span key={mt.id} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/10">
                        {mt.title}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-[#888899] py-12">No uploads found</p>
          )}
        </div>
      )}
    </div>
  );
}
