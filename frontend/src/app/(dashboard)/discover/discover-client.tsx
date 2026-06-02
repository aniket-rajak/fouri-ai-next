"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { SearchBar } from "@/components/SearchBar";
import { FilterPanel } from "@/components/FilterPanel";
import Link from "next/link";
import { FileText, Clock, Play, TrendingUp, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

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
}

interface TrendingTest {
  id: string;
  title: string;
  subject: string | null;
  difficulty: string;
  totalQuestions: number;
  attemptCount: number;
}

export function DiscoverClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tests, setTests] = useState<TestItem[]>([]);
  const [trending, setTrending] = useState<TrendingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [examTypes, setExamTypes] = useState<string[]>([]);

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTests, setTotalTests] = useState(0);

  useEffect(() => {
    queueMicrotask(() => setLoading(true));

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedSubject) params.set("subject", selectedSubject);
    if (selectedExamType) params.set("examType", selectedExamType);
    if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "20");

    api
      .get(`/search?${params}`)
      .then((res) => {
        setTests(res.data.tests);
        setSubjects(res.data.filters.subjects || []);
        setExamTypes(res.data.filters.examTypes || []);
        setTotalPages(res.data.pagination.totalPages);
        setTotalTests(res.data.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, selectedSubject, selectedExamType, selectedDifficulty, sort, page]);

  useEffect(() => {
    api
      .get("/search/trending")
      .then((res) => setTrending(res.data.tests))
      .catch(() => {});
  }, []);

  useEffect(() => {
    queueMicrotask(() => setPage(1));
  }, [query, selectedSubject, selectedExamType, selectedDifficulty, sort]);

  const clearFilters = () => {
    setSelectedSubject("");
    setSelectedExamType("");
    setSelectedDifficulty("");
    setSort("newest");
  };

  const _handleSearch = (q: string) => {
    setQuery(q);
    router.replace(`/discover?q=${encodeURIComponent(q)}`);
  };

  const startRange = totalTests === 0 ? 0 : (page - 1) * 20 + 1;
  const endRange = Math.min(page * 20, totalTests);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Discover Tests</h1>
        <p className="text-zinc-500 mt-1">
          Browse, search, and find mock tests to practice
        </p>
      </div>

      <div className="flex items-center gap-4">
        <SearchBar initialQuery={query} />
        <Link
          href="/upload"
          className="shrink-0 h-10 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 inline-flex items-center"
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
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-zinc-400" />
        </div>
      ) : tests.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Showing {startRange}–{endRange} of {totalTests} tests
            </p>
          </div>
          <div className="grid gap-4">
            {tests.map((test) => (
              <Card key={test.id}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-zinc-900">{test.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 flex-wrap">
                      <span className="capitalize">{test.subject || "General"}</span>
                      {test.examType && <span>{test.examType}</span>}
                      <span className="flex items-center gap-1"><FileText size={14} />{test.totalQuestions} Q</span>
                      <span className="flex items-center gap-1"><Clock size={14} />{Math.floor(test.duration / 60)} min</span>
                      <span className="flex items-center gap-1"><TrendingUp size={14} />{test.attemptCount} attempts</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        test.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                        test.difficulty === "HARD" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{test.difficulty.toLowerCase()}</span>
                    </div>
                  </div>
                  <Link
                    href={`/test/${test.id}`}
                    className="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
                  >
                    <Play size={14} />
                    Start
                  </Link>
                </div>
              </Card>
            ))}
          </div>

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
        </>
      )}

      {/* In-content Ad */}
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
