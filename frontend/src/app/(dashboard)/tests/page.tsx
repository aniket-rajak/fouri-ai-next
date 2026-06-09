"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import {
  FileText, Clock, Play, Trash2, Search, ChevronDown, ChevronLeft, ChevronRight,
  TrendingUp, BarChart3, History, Loader2, BookOpen, CheckCircle2, XCircle, AlertCircle, ChevronUp, RotateCcw
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { useAnalyticsTracker } from "@/hooks/useAnalyticsTracker";
import { useAuth } from "@/contexts/AuthContext";

interface TestStats {
  totalAttempts: number;
  bestScore: number | null;
  avgScore: number | null;
  latestScore: number | null;
  improvement: number | null;
  lastAttemptedAt: string | null;
}

interface TestItem {
  id: string;
  title: string;
  subject: string | null;
  difficulty: string;
  totalQuestions: number;
  duration: number;
  attemptCount: number;
  createdAt: string;
  uploadStatus: string | null;
  uploadFilename: string | null;
  uploadCreatedAt: string | null;
  stats: TestStats;
}

interface AttemptItem {
  id: string;
  score: number | null;
  totalMarks: number | null;
  accuracy: number | null;
  timeTaken: number | null;
  completedAt: string | null;
  mockTest: { title: string };
}

function getPaperStatus(test: TestItem): { label: string; color: string; icon: React.ReactNode } {
  if (test.stats.totalAttempts > 0) {
    return { label: "Mock Test Completed", color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 size={12} /> };
  }
  if (test.uploadStatus === "COMPLETED") {
    return { label: "Mock Test Available", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <BookOpen size={12} /> };
  }
  if (test.uploadStatus === "ANALYZING" || test.uploadStatus === "PROCESSING") {
    return { label: "AI Analysis In Progress", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Loader2 size={12} className="animate-spin" /> };
  }
  if (test.uploadStatus === "FAILED") {
    return { label: "Analysis Failed", color: "bg-red-100 text-red-700 border-red-200", icon: <AlertCircle size={12} /> };
  }
  return { label: "Uploaded", color: "bg-zinc-100 text-zinc-700 border-zinc-200", icon: <FileText size={12} /> };
}

function AttemptHistory({ testId, open }: { testId: string; open: boolean }) {
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || attempts.length > 0) return;
    setLoading(true);
    api.get(`/tests/${testId}/attempts`)
      .then((res) => setAttempts(res.data.attempts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, testId, attempts.length]);

  if (!open) return null;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-100">
      <p className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1">
        <History size={12} />
        Attempt History
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
          <Loader2 size={12} className="animate-spin" />
          Loading attempts...
        </div>
      ) : attempts.length === 0 ? (
        <p className="text-xs text-zinc-400 py-1">No attempts yet</p>
      ) : (
        <div className="space-y-1">
          {attempts.map((a, i) => (
            <Link
              key={a.id}
              href={`/results/${a.id}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs"
            >
              <span className="text-zinc-500">Attempt #{attempts.length - i}</span>
              <span className="font-medium text-zinc-700">{a.accuracy != null ? `${Math.round(a.accuracy)}%` : "-"}</span>
              <span className="text-zinc-400">
                {a.completedAt ? new Date(a.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "-"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TestsPage() {
  const { user } = useAuth();
  const { trackFeature } = useAnalyticsTracker(user?.uid);
  useEffect(() => { trackFeature("tests"); }, [trackFeature]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search & filters
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [subjects, setSubjects] = useState<string[]>([]);

  const fetchTests = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (subject) params.set("subject", subject);
    if (difficulty) params.set("difficulty", difficulty);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "20");

    api.get(`/tests/mine?${params}`)
      .then((res) => {
        setTests(res.data.tests);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
        const uniqueSubjects = [...new Set((res.data.tests as TestItem[]).map((t) => t.subject).filter(Boolean))] as string[];
        setSubjects(uniqueSubjects);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, subject, difficulty, sort, page]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  useEffect(() => { setPage(1); }, [query, subject, difficulty, sort]);

  const handleDelete = async (testId: string) => {
    setDeleting(testId);
    try {
      await api.delete(`/tests/${testId}`);
      setTests((prev) => prev.filter((t) => t.id !== testId));
    } catch { /* ignore */ }
    finally { setDeleting(null); setConfirmDelete(null); }
  };

  const clearFilters = () => {
    setQuery("");
    setSubject("");
    setDifficulty("");
    setSort("recent");
  };

  const hasFilters = query || subject || difficulty || sort !== "recent";

  const startRange = total === 0 ? 0 : (page - 1) * 20 + 1;
  const endRange = Math.min(page * 20, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Tests</h1>
          <p className="text-zinc-500 mt-1 text-sm">Manage your uploaded and created tests</p>
        </div>
        <Link
          href="/upload"
          className="shrink-0 h-10 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 inline-flex items-center gap-2"
        >
          <FileText size={14} />
          Upload Paper
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tests by name or subject..."
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select value={subject} onChange={(e) => setSubject(e.target.value)}
                className="h-9 rounded-lg border border-zinc-300 px-3 pr-8 text-xs text-zinc-700 appearance-none cursor-pointer bg-white focus:border-zinc-900 focus:outline-none">
                <option value="">All Subjects</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                className="h-9 rounded-lg border border-zinc-300 px-3 pr-8 text-xs text-zinc-700 appearance-none cursor-pointer bg-white focus:border-zinc-900 focus:outline-none">
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="h-9 rounded-lg border border-zinc-300 px-3 pr-8 text-xs text-zinc-700 appearance-none cursor-pointer bg-white focus:border-zinc-900 focus:outline-none">
                <option value="recent">Most Recent</option>
                <option value="best">Best Score</option>
                <option value="newest">Recently Uploaded</option>
                <option value="alpha">Alphabetical</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline cursor-pointer">
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="hidden sm:block">
        <AdSlot slot="in-content-tests" format="horizontal" className="mx-auto max-w-[728px]" />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-6 animate-pulse">
              <div className="h-5 bg-zinc-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-zinc-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-zinc-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">
              {hasFilters ? "No tests match your filters." : "No tests yet. Upload a question paper to get started."}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer">
                Clear filters
              </button>
            ) : (
              <Link href="/upload" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
                Upload a paper
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Showing {startRange}–{endRange} of {total} tests
            </p>
          </div>

          <div className="grid gap-3">
            {tests.map((test) => {
              const status = getPaperStatus(test);
              const isExpanded = expandedId === test.id;
              return (
                <Card key={test.id}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-zinc-900">{test.title}</h3>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-zinc-500 flex-wrap">
                        <span className="capitalize">{test.subject || "General"}</span>
                        <span className="flex items-center gap-1"><FileText size={14} />{test.totalQuestions} Q</span>
                        <span className="flex items-center gap-1"><Clock size={14} />{Math.floor(test.duration / 60)} min</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          test.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                          test.difficulty === "HARD" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{test.difficulty.toLowerCase()}</span>
                      </div>

                      {/* Attempt Stats */}
                      {test.stats.totalAttempts > 0 && (
                        <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                          <span className="flex items-center gap-1"><BarChart3 size={12} />{test.stats.totalAttempts} attempt{test.stats.totalAttempts !== 1 ? "s" : ""}</span>
                          {test.stats.bestScore != null && <span>Best: <strong className="text-green-600">{Math.round(test.stats.bestScore)}%</strong></span>}
                          {test.stats.avgScore != null && <span>Avg: <strong className="text-zinc-700">{Math.round(test.stats.avgScore)}%</strong></span>}
                          {test.stats.improvement != null && (
                            <span className={`flex items-center gap-0.5 ${test.stats.improvement >= 0 ? "text-green-600" : "text-red-500"}`}>
                              <TrendingUp size={12} />
                              {test.stats.improvement >= 0 ? "+" : ""}{Math.round(test.stats.improvement)}%
                            </span>
                          )}
                          {test.stats.lastAttemptedAt && (
                            <span className="text-zinc-400">
                              Last: {new Date(test.stats.lastAttemptedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : test.id)}
                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        title="Attempt history"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <History size={16} />}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(test.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete test"
                      >
                        <Trash2 size={16} />
                      </button>
                      <Link
                        href={`/test/${test.id}`}
                        className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
                      >
                        <Play size={14} />
                        Start
                      </Link>
                    </div>
                  </div>

                  {/* Attempt History */}
                  <AttemptHistory testId={test.id} open={isExpanded} />
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 h-9 px-3 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                Previous
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
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
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
                className="flex items-center gap-1 h-9 px-3 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900">Delete Test?</h3>
            <p className="text-sm text-zinc-600">
              This will permanently delete this test and all associated data (questions, attempts, and explanations). This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-10 rounded-lg border-2 border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >Cancel</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {deleting === confirmDelete ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
