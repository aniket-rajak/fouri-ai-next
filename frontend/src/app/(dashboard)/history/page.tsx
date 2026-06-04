"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import {
  FileText, Clock, TrendingUp, Search,
  ChevronLeft, ChevronRight, ChevronDown,
  Loader2, BookOpen, ExternalLink, Timer, RotateCcw
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { ReAttemptModal } from "@/components/ReAttemptModal";
import { AIAnalysisBadge } from "@/components/AIAnalysisBadge";

interface HistoryAttempt {
  attemptId: string;
  testId: string;
  testTitle: string;
  subject: string | null;
  totalQuestions: number;
  duration: number;
  score: number | null;
  totalMarks: number | null;
  accuracy: number | null;
  timeTaken: number | null;
  completedAt: string | null;
  source: "my_test" | "discover";
}

interface ReattemptTarget {
  testId: string;
  title: string;
  defaultDuration: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<HistoryAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [reattempt, setReattempt] = useState<ReattemptTarget | null>(null);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "20");

    api.get(`/users/history?${params}`)
      .then((res) => {
        setAttempts(res.data.attempts);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, sort, page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { setPage(1); }, [query, sort]);

  const storeReturnAndNavigate = (href: string) => {
    sessionStorage.setItem("resultsReturn", window.location.href);
    router.push(href);
  };

  const openReattempt = (a: HistoryAttempt) => {
    setReattempt({ testId: a.testId, title: a.testTitle, defaultDuration: a.duration });
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const startRange = total === 0 ? 0 : (page - 1) * 20 + 1;
  const endRange = Math.min(page * 20, total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">History</h1>
        <p className="text-zinc-500 mt-1 text-sm">All your past mock test attempts</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by test name or subject..."
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div className="relative">
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-lg border border-zinc-300 px-3 pr-8 text-sm text-zinc-700 appearance-none cursor-pointer bg-white focus:border-zinc-900 focus:outline-none">
            <option value="date">Most Recent</option>
            <option value="score">Best Score</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      <div className="hidden sm:block">
        <AdSlot slot="in-content-history" format="horizontal" className="mx-auto max-w-[728px]" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-6 animate-pulse">
              <div className="h-5 bg-zinc-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-zinc-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-zinc-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen size={40} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">
              {query ? "No attempts match your search." : "No attempted tests yet. Start a mock test to see history here."}
            </p>
            {query && (
              <button onClick={() => setQuery("")} className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer">
                Clear search
              </button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Showing {startRange}–{endRange} of {total} attempts
            </p>
          </div>

          <div className="grid gap-3">
            {attempts.map((a) => (
              <Card key={a.attemptId}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-zinc-900">{a.testTitle}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                        a.source === "my_test"
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}>
                        {a.source === "my_test" ? "My Test" : "Discover"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-zinc-500 flex-wrap">
                      <span className="capitalize">{a.subject || "General"}</span>
                      <span className="flex items-center gap-1"><FileText size={14} />{a.totalQuestions} Q</span>
                      <span className="flex items-center gap-1"><Clock size={14} />{Math.floor(a.duration / 60)} min</span>
                      <AIAnalysisBadge status="COMPLETED" testId={a.testId} size="sm" />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className={`font-medium ${a.accuracy != null && a.accuracy >= 60 ? "text-green-600" : "text-zinc-700"}`}>
                        Score: {a.score != null ? a.score : "-"}/{a.totalMarks ?? "-"}
                        {a.accuracy != null && <> ({Math.round(a.accuracy)}%)</>}
                      </span>
                      <span className="flex items-center gap-1"><Timer size={12} />{formatTime(a.timeTaken)}</span>
                      {a.completedAt && (
                        <span className="text-zinc-400">
                          {new Date(a.completedAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); openReattempt(a); }}
                      className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                      title="Re-attempt this test"
                    >
                      <RotateCcw size={14} />
                      <span className="sm:hidden">Re-Attempt</span>
                      <span className="hidden sm:inline">Re-Attempt</span>
                    </button>
                    <button
                      onClick={() => storeReturnAndNavigate(`/results/${a.attemptId}`)}
                      className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <span>View Results</span>
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 pt-2 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 h-9 px-2.5 sm:px-3 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-zinc-300">...</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                        p === page ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 h-9 px-2.5 sm:px-3 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      <ReAttemptModal
        open={!!reattempt}
        testId={reattempt?.testId ?? ""}
        defaultDuration={reattempt?.defaultDuration ?? 1800}
        title={reattempt?.title ?? ""}
        onClose={() => setReattempt(null)}
      />
    </div>
  );
}
