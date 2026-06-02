"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import {
  RotateCcw, Search, Clock, FileText, Trash2, Play,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";

interface PausedAttempt {
  id: string;
  remainingTime: number | null;
  currentQuestionIndex: number | null;
  startedAt: string;
  mockTest: {
    id: string;
    title: string;
    subject: string | null;
    totalQuestions: number;
    duration: number;
  };
  answers: { id: string }[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(dateStr));
}

const PER_PAGE = 12;

export default function ResumeTestsPage() {
  const [attempts, setAttempts] = useState<PausedAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get("/attempts?status=PAUSED")
      .then((res) => setAttempts(res.data.attempts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 when search/sort changes
  useEffect(() => { setPage(1); }, [searchQuery, sortOrder]);

  const filtered = useMemo(() => {
    let list = [...attempts];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.mockTest.title.toLowerCase().includes(q) ||
          (a.mockTest.subject || "").toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      const diff = new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });

    return list;
  }, [attempts, searchQuery, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await api.delete(`/attempts/${id}`);
      setAttempts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // handle error
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Resume Tests</h1>
        <p className="text-zinc-500 mt-1">
          Continue where you left off — your paused tests are saved here.
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search paused tests..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-300 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <button
          onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
          className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-zinc-300 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer shrink-0"
        >
          <Clock size={15} />
          {sortOrder === "newest" ? "Newest First" : "Oldest First"}
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <RotateCcw size={40} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500 font-medium">
              {searchQuery ? "No paused tests match your search" : "No paused tests"}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              {searchQuery
                ? "Try a different search term."
                : "When you pause a mock test, it will appear here."}
            </p>
            {!searchQuery && (
              <Link
                href="/discover"
                className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                <Play size={14} />
                Discover Tests
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Results count */}
      {filtered.length > 0 && (
        <p className="text-sm text-zinc-500">
          Showing {paginated.length} of {filtered.length} paused test{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Card Grid */}
      {paginated.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((attempt) => {
            const answeredCount = attempt.answers?.length || 0;
            const totalQ = attempt.mockTest.totalQuestions;
            const progress = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;
            const remainingQ = totalQ - answeredCount;
            const resumeLink = `/test/${attempt.mockTest.id}/attempt?resume=${attempt.id}&resumeRemaining=${attempt.remainingTime ?? attempt.mockTest.duration}`;

            return (
              <Card key={attempt.id}>
                <div className="space-y-3 h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-zinc-900 truncate">
                        {attempt.mockTest.title}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5 capitalize">
                        {attempt.mockTest.subject || "General"}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmDeleteId(attempt.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title="Delete paused test"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                      <span>{progress}% answered</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <FileText size={13} />
                      {totalQ} total
                    </span>
                    <span className="text-zinc-400">{answeredCount} answered</span>
                    <span className="text-zinc-400">{remainingQ} left</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    {attempt.remainingTime != null && (
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {formatTime(attempt.remainingTime)} left
                      </span>
                    )}
                    <span>Paused: {formatDate(attempt.startedAt)}</span>
                  </div>

                  {/* Spacer + Resume button */}
                  <div className="flex-1" />
                  <Link
                    href={resumeLink}
                    className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors w-full"
                  >
                    <Play size={15} />
                    Resume
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
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
                    p === page
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
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

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900">Delete Paused Test?</h3>
            <p className="text-sm text-zinc-600">
              All progress for this test will be permanently removed. You will need to restart the test from the beginning.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 h-10 rounded-lg border-2 border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
