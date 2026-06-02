"use client";

import { useEffect, useState } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion } from "framer-motion";
import {
  Search, Download, Loader2, ChevronLeft, ChevronRight,
  Mail,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count: { uploads: number; testAttempts: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OwnerUsersPage() {
  const api = useOwnerApi();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    queueMicrotask(() => setLoading(true));
    const params = new URLSearchParams({ page: String(page), limit: "20", sort });
    if (search) params.set("search", search);
    api(`/owner/users?${params}`)
      .then((data) => {
        const d = data as { users: User[]; pagination: Pagination };
        setUsers(d.users);
        setPagination(d.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, page, sort, search]);

  const exportCSV = (type: "all" | "emails" = "all") => {
    const headers = type === "emails"
      ? ["Email"]
      : ["Name", "Email", "Registration Date", "Upload Count"];
    const rows = users.map((u) => {
      if (type === "emails") return [u.email];
      return [
        u.name || "N/A",
        u.email,
        new Date(u.createdAt).toLocaleDateString("en-IN"),
        String(u._count.uploads),
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fouri-users-${type}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-heading text-[#f5f5f7]">User Management</h1>
        <p className="text-sm text-[#888899] mt-1">
          {pagination.total} total users
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888899]" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users by name or email..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#111118] border border-white/5 text-xs text-[#f5f5f7] placeholder-[#888899]/50 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 px-3 rounded-xl bg-[#111118] border border-white/5 text-xs text-[#f5f5f7] focus:outline-none focus:border-blue-500/50"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <button
            onClick={() => exportCSV("all")}
            className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-[#111118] border border-white/5 text-xs text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5 transition-all cursor-pointer"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => exportCSV("emails")}
            className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-[#111118] border border-white/5 text-xs text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5 transition-all cursor-pointer"
          >
            <Mail size={14} /> Emails
          </button>
        </div>
      </div>

      <div className="bg-[#111118] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888899]">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888899]">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888899]">Joined</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[#888899]">Uploads</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[#888899]">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Loader2 size={20} className="animate-spin text-blue-400 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-xs text-[#888899]">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-[#f5f5f7]">
                          {user.name || "Unnamed"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#888899]">{user.email}</td>
                    <td className="px-4 py-3 text-xs text-[#888899]">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-[#888899]">{user._count.uploads}</td>
                    <td className="px-4 py-3 text-center text-xs text-[#888899]">{user._count.testAttempts}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="w-9 h-9 rounded-xl bg-[#111118] border border-white/5 flex items-center justify-center text-[#888899] hover:text-[#f5f5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-[#888899] px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="w-9 h-9 rounded-xl bg-[#111118] border border-white/5 flex items-center justify-center text-[#888899] hover:text-[#f5f5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
