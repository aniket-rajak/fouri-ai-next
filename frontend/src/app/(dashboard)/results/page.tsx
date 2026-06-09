"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { AdSlot } from "@/components/AdSlot";
import { AIAnalysisBadge } from "@/components/AIAnalysisBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ReAttemptModal } from "@/components/ReAttemptModal";
import { ResultsAnalytics } from "@/components/ResultsAnalytics";
import {
  BarChart3, Clock, Target, Search,
  ChevronDown, ChevronLeft, ChevronRight, Trash2, RotateCcw,
  CheckCircle2, XCircle, MinusCircle, Trophy
} from "lucide-react";

interface ResultAttempt {
  id: string;
  mockTestId: string;
  mockTest: {
    id: string;
    title: string;
    subject: string | null;
    examType: string | null;
    difficulty: string;
    totalQuestions: number;
    duration: number;
    sourceUpload: { status: string | null } | null;
  };
  score: number | null;
  totalMarks: number | null;
  accuracy: number | null;
  timeTaken: number | null;
  completedAt: string | null;
  status: string;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  aiStatus: string | null;
  communityAvg: number | null;
  communityTop: number | null;
  rank: number;
  totalStudents: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<ResultAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Search & filters
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("newest");

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reattempt, setReattempt] = useState<{ testId: string; title: string; duration: number } | null>(null);

  const fetchResults = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (subject) params.set("subject", subject);
    if (scoreMin) params.set("scoreMin", scoreMin);
    if (scoreMax) params.set("scoreMax", scoreMax);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "20");

    api.get(`/results?${params}`)
      .then((res) => {
        setAttempts(res.data.attempts);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, subject, scoreMin, scoreMax, dateFrom, dateTo, sort, page]);

  useEffect(() => { fetchResults(); }, [fetchResults]);
  useEffect(() => { setPage(1); }, [query, subject, scoreMin, scoreMax, dateFrom, dateTo, sort]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/results/${deleteTarget}`);
      setAttempts((prev) => prev.filter((a) => a.id !== deleteTarget));
      setTotal((prev) => prev - 1);
    } catch { /* ignore */ }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const hasFilters = query || subject || scoreMin || scoreMax || dateFrom || dateTo || sort !== "newest";
  const clearFilters = () => {
    setQuery(""); setSubject(""); setScoreMin(""); setScoreMax("");
    setDateFrom(""); setDateTo(""); setSort("newest");
  };

  const startRange = total === 0 ? 0 : (page - 1) * 20 + 1;
  const endRange = Math.min(page * 20, total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Results</h1>
        <p className="text-zinc-500 mt-1 text-sm">Your test performance history and analytics</p>
      </div>

      {/* Analytics Dashboard */}
      <ResultsAnalytics />

      <AdSlot slot="in-content-results" format="horizontal" className="mx-auto max-w-[728px]" />

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by paper name or subject..."
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select value={subject} onChange={(e) => setSubject(e.target.value)}
              className="h-9 rounded-lg border border-zinc-300 px-3 pr-8 text-xs text-zinc-700 appearance-none cursor-pointer bg-white focus:border-zinc-900 focus:outline-none">
              <option value="">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="English">English</option>
              <option value="History">History</option>
              <option value="General">General</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          <input
            type="number"
            value={scoreMin}
            onChange={(e) => setScoreMin(e.target.value)}
            placeholder="Min"
            className="w-16 sm:w-20 h-9 rounded-lg border border-zinc-300 px-2 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
          <span className="text-xs text-zinc-400">-</span>
          <input
            type="number"
            value={scoreMax}
            onChange={(e) => setScoreMax(e.target.value)}
            placeholder="Max"
            className="w-16 sm:w-20 h-9 rounded-lg border border-zinc-300 px-2 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-zinc-300 px-2 text-xs text-zinc-700 focus:border-zinc-900 focus:outline-none w-[120px] sm:w-auto"
            title="From date"
          />
          <span className="text-xs text-zinc-400">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-zinc-300 px-2 text-xs text-zinc-700 focus:border-zinc-900 focus:outline-none w-[120px] sm:w-auto"
            title="To date"
          />

          <div className="relative">
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-lg border border-zinc-300 px-3 pr-8 text-xs text-zinc-700 appearance-none cursor-pointer bg-white focus:border-zinc-900 focus:outline-none">
              <option value="newest">Latest Results</option>
              <option value="highest">Highest Score</option>
              <option value="lowest">Lowest Score</option>
              <option value="improved">Most Improved</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline cursor-pointer">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results List */}
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
            <BarChart3 size={40} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">
              {hasFilters ? "No results match your filters." : "No results yet. Complete a mock test to see your performance."}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer">
                Clear filters
              </button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Showing {startRange}–{endRange} of {total} results
            </p>
          </div>

          <div className="grid gap-3">
            {attempts.map((a) => {
              const accuracyColor = a.accuracy != null
                ? a.accuracy >= 60 ? "text-green-600"
                  : a.accuracy >= 40 ? "text-amber-600"
                  : "text-red-600"
                : "text-zinc-900";

              return (
                <div
                  key={a.id}
                  onClick={() => {
                    sessionStorage.setItem("resultsReturn", window.location.pathname + window.location.search);
                    router.push(`/results/${a.id}`);
                  }}
                  className="cursor-pointer"
                >
                  <Card>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-zinc-900 text-sm sm:text-base leading-snug">{a.mockTest.title}</h3>
                          <AIAnalysisBadge status={a.aiStatus} testId={a.mockTestId} size="sm" />
                        </div>

                        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap">
                          <span className={`text-xl font-bold ${accuracyColor}`}>
                            {a.accuracy != null ? `${Math.round(a.accuracy)}%` : "-"}
                          </span>
                          <span className="text-sm text-zinc-500 whitespace-nowrap">
                            Score: {a.score ?? "-"}/{a.totalMarks ?? "-"}
                          </span>
                        </div>

                        <div className="flex items-center gap-x-3 gap-y-1 text-xs flex-wrap">
                          <span className="flex items-center gap-1 text-green-600 whitespace-nowrap">
                            <CheckCircle2 size={12} />
                            {a.correctCount} Correct
                          </span>
                          <span className="flex items-center gap-1 text-red-500 whitespace-nowrap">
                            <XCircle size={12} />
                            {a.wrongCount} Wrong
                          </span>
                          <span className="flex items-center gap-1 text-zinc-400 whitespace-nowrap">
                            <MinusCircle size={12} />
                            {a.unansweredCount} Unanswered
                          </span>
                        </div>

                        <div className="flex items-center gap-x-4 gap-y-1 text-xs text-zinc-500 flex-wrap">
                          {a.totalStudents > 0 && (
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Trophy size={12} />
                              Rank #{a.rank} of {a.totalStudents}
                            </span>
                          )}
                          <span className="flex items-center gap-1 whitespace-nowrap"><Clock size={12} />{formatTime(a.timeTaken)}</span>
                          <span className="flex items-center gap-1 whitespace-nowrap"><Target size={12} />Community Avg: {a.communityAvg != null ? `${Math.round(a.communityAvg)}%` : "-"}</span>
                        </div>

                        <div className="flex items-center gap-x-3 gap-y-1 text-xs text-zinc-400 flex-wrap">
                          {a.mockTest.subject && <span className="whitespace-nowrap">{a.mockTest.subject}</span>}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize whitespace-nowrap ${
                            a.mockTest.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                            a.mockTest.difficulty === "HARD" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>{a.mockTest.difficulty.toLowerCase()}</span>
                          {a.completedAt && (
                            <span className="whitespace-nowrap">
                              {new Date(a.completedAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto sm:self-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setReattempt({ testId: a.mockTestId, title: a.mockTest.title, duration: a.mockTest.duration })}
                          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer flex-1 sm:flex-none"
                          title="Re-attempt this test"
                        >
                          <RotateCcw size={14} />
                          <span className="hidden sm:inline">Re-Attempt</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a.id)}
                          className="shrink-0 p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete result"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-2 flex-wrap">
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
      
      {/* Re-Attempt Modal */}
      <ReAttemptModal
        open={!!reattempt}
        testId={reattempt?.testId ?? ""}
        defaultDuration={reattempt?.duration ?? 1800}
        title={reattempt?.title ?? ""}
        onClose={() => setReattempt(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Result?"
        message="This will permanently remove this result and all associated answers. This action cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
