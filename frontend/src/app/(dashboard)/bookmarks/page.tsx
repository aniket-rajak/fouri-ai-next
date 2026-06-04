"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { AdSlot } from "@/components/AdSlot";
import { BookmarkButton } from "@/components/BookmarkButton";
import { AIAnalysisBadge } from "@/components/AIAnalysisBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import Link from "next/link";
import {
  Bookmark, FileText, Clock, Play, Search, Loader2,
  BookmarkX, ChevronDown, ChevronLeft, ChevronRight,
  Trash2, CheckCircle2, XCircle
} from "lucide-react";

interface BookmarkedTest {
  id: string;
  title: string;
  subject: string | null;
  examType: string | null;
  difficulty: string;
  totalQuestions: number;
  duration: number;
  attemptCount: number;
  createdAt: string;
  bookmarkedAt: string;
  aiStatus: string | null;
  completionStatus: string | null;
}

const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(params: Record<string, string>): string {
  return `bookmarks_${JSON.stringify(params)}`;
}

function getCached<T>(key: string): { data: T; cachedAt: number } | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch { /* sessionStorage full */ }
}

export default function BookmarksPage() {
  const router = useRouter();
  const [tests, setTests] = useState<BookmarkedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("recent");
  const [activeTab, setActiveTab] = useState("all");
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const cacheKey = useRef(getCacheKey({ q: query, subject, difficulty, sort, page: String(page) }));
  const fetchId = useRef(0);

  const fetchBookmarks = useCallback(() => {
    const key = getCacheKey({ q: query, subject, difficulty, sort, page: String(page) });
    cacheKey.current = key;

    // Check cache
    const cached = getCached<{ tests: BookmarkedTest[]; pagination: any }>(key);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      setTests(cached.data.tests);
      setTotal(cached.data.pagination.total);
      setTotalPages(cached.data.pagination.totalPages);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++fetchId.current;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (subject) params.set("subject", subject);
    if (difficulty) params.set("difficulty", difficulty);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "20");

    api.get(`/tests/bookmarked?${params}`)
      .then((res) => {
        if (id !== fetchId.current) return;
        setTests(res.data.tests);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
        setCache(key, { tests: res.data.tests, pagination: res.data.pagination });
        const uniqueSubjects = [...new Set((res.data.tests as BookmarkedTest[]).map((t) => t.subject).filter(Boolean))] as string[];
        setSubjects(uniqueSubjects);
      })
      .catch(() => {})
      .finally(() => { if (id === fetchId.current) setLoading(false); });
  }, [query, subject, difficulty, sort, page]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);
  useEffect(() => { setPage(1); }, [query, subject, difficulty, sort]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "recent") setSort("recent");
    else if (tab === "popular") setSort("popular");
    else setSort("recent");
    setPage(1);
  };

  const handleRemove = async (testId: string) => {
    setRemoving(testId);
    try {
      await api.delete(`/tests/${testId}/bookmark`);
      setTests((prev) => prev.filter((t) => t.id !== testId));
      setTotal((prev) => prev - 1);
      sessionStorage.removeItem(cacheKey.current);
    } catch { /* ignore */ }
    finally { setRemoving(null); setConfirmRemove(null); }
  };

  const startRange = total === 0 ? 0 : (page - 1) * 20 + 1;
  const endRange = Math.min(page * 20, total);
  const hasFilters = !!(query || subject || difficulty);

  const clearFilters = () => {
    setQuery("");
    setSubject("");
    setDifficulty("");
    setSort("recent");
    setActiveTab("all");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <Bookmark size={22} />
          Bookmarks
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">Tests you have bookmarked for later practice</p>
      </div>

      {/* Tabs: All Bookmarks, Recently Bookmarked, Most Attempted */}
      <div className="flex gap-1 border-b border-zinc-200">
        {[
          { key: "all", label: "All Bookmarks" },
          { key: "recent", label: "Recently Bookmarked" },
          { key: "popular", label: "Most Attempted" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
              <option value="recent">Recently Bookmarked</option>
              <option value="uploaded">Recently Uploaded</option>
              <option value="popular">Most Attempted</option>
              <option value="alpha">Alphabetical</option>
              <option value="difficulty">Difficulty</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="h-9 px-3 rounded-lg border border-zinc-300 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer">
              Clear filters
            </button>
          )}
        </div>
      </div>

      <AdSlot slot="in-content-bookmarks" format="horizontal" className="mx-auto max-w-[728px]" />

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
      ) : tests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookmarkX size={40} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">
              {hasFilters ? "No bookmarks match your filters." : "No bookmarks yet. Browse the Discover page to find tests to bookmark."}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer">
                Clear filters
              </button>
            ) : (
              <Link href="/discover" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
                Browse Discover
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Showing {startRange}–{endRange} of {total} bookmarks
            </p>
          </div>

          <div className="grid gap-3">
            {tests.map((test) => (
              <Card key={test.id}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-zinc-900 text-sm sm:text-base leading-snug">{test.title}</h3>
                      {test.completionStatus === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          <CheckCircle2 size={10} />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          <XCircle size={10} />
                          Not Attempted
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-x-4 gap-y-1 text-sm text-zinc-500 flex-wrap">
                      <span className="capitalize whitespace-nowrap">{test.subject || "General"}</span>
                      {test.examType && <span className="whitespace-nowrap">{test.examType}</span>}
                      <span className="flex items-center gap-1 whitespace-nowrap"><FileText size={14} />{test.totalQuestions} Q</span>
                      <span className="flex items-center gap-1 whitespace-nowrap"><Clock size={14} />{Math.floor(test.duration / 60)} min</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${
                        test.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                        test.difficulty === "HARD" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{test.difficulty.toLowerCase()}</span>
                      <AIAnalysisBadge status={test.aiStatus} testId={test.id} size="sm" />
                    </div>

                    <div className="flex items-center gap-x-3 gap-y-1 text-xs text-zinc-400 flex-wrap">
                      <span className="whitespace-nowrap">{test.attemptCount} attempt{test.attemptCount !== 1 ? "s" : ""}</span>
                      <span className="whitespace-nowrap">
                        Bookmarked {new Date(test.bookmarkedAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-auto w-full sm:w-auto">
                    <button
                      onClick={() => setConfirmRemove(test.id)}
                      className="shrink-0 p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove bookmark"
                    >
                      {removing === test.id ? (
                        <span className="h-4 w-4 block animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                    <Link
                      href={`/test/${test.id}`}
                      className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 flex-1 sm:flex-none"
                    >
                      <Play size={14} />
                      Start
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
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

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remove Bookmark?"
        message="This will remove this test from your bookmarks. You can bookmark it again later."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => confirmRemove && handleRemove(confirmRemove)}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}
