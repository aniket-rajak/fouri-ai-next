"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FilterPanel } from "@/components/FilterPanel";
import { SearchBar } from "@/components/SearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalyticsTracker } from "@/hooks/useAnalyticsTracker";
import {
  BookOpen, Clock, ChevronLeft, ChevronRight,
  FileText, Play, TrendingUp, Users, CheckCircle2,
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { BookmarkButton } from "@/components/BookmarkButton";
import { AIAnalysisBadge } from "@/components/AIAnalysisBadge";

interface TestItem {
  id: string;
  title: string;
  subject: string | null;
  examType: string | null;
  difficulty: string;
  totalQuestions: number;
  duration: number;
  attemptCount: number;
  createdAt: string;
  uploadStatus: string | null;
  avgScore: number | null;
  totalStudents: number;
  completionRate: number | null;
}

interface TrendingTest {
  id: string;
  title: string;
  subject: string | null;
  difficulty: string;
  totalQuestions: number;
  attemptCount: number;
}

const UPLOAD_DATE_TABS = [
  { value: "", label: "All" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
] as const;

export function DiscoverClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { trackSearch } = useAnalyticsTracker(user?.uid);

  const [tests, setTests] = useState<TestItem[]>([]);
  const [trending, setTrending] = useState<TrendingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTests, setTotalTests] = useState(0);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedSubject) params.set("subject", selectedSubject);
    if (selectedExamType) params.set("examType", selectedExamType);
    if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
    if (uploadDate) params.set("uploadDate", uploadDate);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "20");

    api
      .get(`/tests/discover?${params}`)
      .then((res) => {
        setTests(res.data.tests);
        setSubjects(res.data.filters?.subjects || []);
        setExamTypes(res.data.filters?.examTypes || []);
        setTotalPages(res.data.pagination.totalPages);
        setTotalTests(res.data.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, selectedSubject, selectedExamType, selectedDifficulty, uploadDate, sort, page]);

  useEffect(() => {
    api
      .get("/search/trending")
      .then((res) => setTrending(res.data.tests))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/tests/me/bookmarks")
      .then((res) => setBookmarkedIds(new Set(res.data.ids)))
      .catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [query, selectedSubject, selectedExamType, selectedDifficulty, uploadDate, sort]);

  const clearFilters = () => {
    setSelectedSubject("");
    setSelectedExamType("");
    setSelectedDifficulty("");
    setUploadDate("");
    setSort("newest");
  };

  const handleSearch = (q: string) => {
    setQuery(q);
    trackSearch(q, totalTests);
    router.replace(`/discover?q=${encodeURIComponent(q)}`);
  };

  const startRange = totalTests === 0 ? 0 : (page - 1) * 20 + 1;
  const endRange = Math.min(page * 20, totalTests);
  const hasFilters = selectedSubject || selectedExamType || selectedDifficulty || uploadDate || sort !== "newest";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Discover Tests</h1>
        <p className="text-zinc-500 mt-1">
          Browse, search, and find mock tests to practice
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <SearchBar initialQuery={query} onSearch={handleSearch} />
        <Link
          href="/upload"
          className="shrink-0 h-10 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 inline-flex items-center justify-center sm:w-auto w-full"
        >
          Upload Paper
        </Link>
      </div>

      <FilterPanel
        subjects={subjects}
        examTypes={examTypes}
        selectedSubject={selectedSubject}
        selectedExamType={selectedExamType}
        selectedDifficulty={selectedDifficulty}
        sort={sort}
        onSubjectChange={setSelectedSubject}
        onExamTypeChange={setSelectedExamType}
        onDifficultyChange={setSelectedDifficulty}
        onSortChange={setSort}
        onClear={clearFilters}
      />

      {/* Upload Date Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {UPLOAD_DATE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setUploadDate(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              uploadDate === tab.value
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline cursor-pointer whitespace-nowrap">
            Clear filters
          </button>
        )}
      </div>

      {query && !loading && tests.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-zinc-500">No tests found for &ldquo;{query}&rdquo;</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        </Card>
      )}

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
      ) : tests.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Showing {startRange}–{endRange} of {totalTests} tests
            </p>
          </div>
          <div className="grid gap-4">
            {tests.map((test) => (
              <Card key={test.id}>
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-0 sm:items-start sm:justify-between">
                  <div className="space-y-2 min-w-0 w-full sm:flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 text-sm sm:text-base leading-snug">{test.title}</h3>
                      <BookmarkButton
                        testId={test.id}
                        isBookmarked={bookmarkedIds.has(test.id)}
                        onToggle={(newState) => {
                          setBookmarkedIds((prev) => {
                            const next = new Set(prev);
                            if (newState) next.add(test.id);
                            else next.delete(test.id);
                            return next;
                          });
                        }}
                        size="sm"
                      />
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
                    </div>

                    {/* Community Stats */}
                    <div className="flex items-center gap-x-4 gap-y-1 text-xs text-zinc-500 flex-wrap">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Users size={12} />
                        {test.totalStudents} student{test.totalStudents !== 1 ? "s" : ""}
                      </span>
                      {test.avgScore != null && (
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <TrendingUp size={12} />
                          Avg: {Math.round(test.avgScore)}%
                        </span>
                      )}
                      {test.completionRate != null && (
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle2 size={12} />
                          {Math.round(test.completionRate)}% completion
                        </span>
                      )}
                      <span className="text-zinc-400 whitespace-nowrap">
                        {test.attemptCount} attempt{test.attemptCount !== 1 ? "s" : ""}
                      </span>
                      <AIAnalysisBadge status={test.uploadStatus} testId={test.id} size="sm" />
                    </div>
                  </div>
                  <Link
                    href={`/test/${test.id}`}
                    className="shrink-0 flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 w-full sm:w-auto"
                  >
                    <Play size={14} />
                    Start
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-4 flex-wrap">
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
                className="flex items-center gap-1 h-9 px-2.5 sm:px-3 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : null}

      <div className="hidden sm:block my-6">
        <AdSlot slot="in-content-discover" format="horizontal" className="mx-auto max-w-[728px]" />
      </div>

      {!query && trending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-500" />
            Trending Tests
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.map((test) => (
              <Link key={test.id} href={`/test/${test.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-zinc-900 truncate">{test.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="capitalize">{test.subject || "General"}</span>
                      <span>{test.totalQuestions} Q</span>
                      <span>{test.attemptCount} attempts</span>
                    </div>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full capitalize ${
                      test.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                      test.difficulty === "HARD" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{test.difficulty.toLowerCase()}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
