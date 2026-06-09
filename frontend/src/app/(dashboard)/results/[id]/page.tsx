"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ContentRenderer } from "@/components/ui/ContentRenderer";
import {
  CheckCircle2, XCircle, Clock, Target, ArrowLeft,
  Bookmark, RefreshCw,
} from "lucide-react";

interface Explanation {
  shortExplanation: string | null;
  detailedExplanation: string | null;
}

interface AnswerDetail {
  id: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  isMarkedForReview: boolean;
  feedback: string | null;
  question: {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    type: string;
    order: number;
    explanations: Explanation | null;
  };
}

interface AttemptDetail {
  id: string;
  score: number | null;
  totalMarks: number | null;
  accuracy: number | null;
  timeTaken: number | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  mockTest: {
    title: string;
    subject: string | null;
    totalQuestions: number;
    duration: number;
  };
  answers: AnswerDetail[];
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
    </div>
  );
}

export default function ResultDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultDetailContent />
    </Suspense>
  );
}

function ResultDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "marked">("all");
  const [returnUrl, setReturnUrl] = useState("/results");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRefresh = useCallback(async () => {
    try {
      const res = await api.get(`/results/${params.id}?_t=${Date.now()}`);
      if (res.data?.attempt) {
        const data = res.data.attempt;
        if (data.answers) {
          data.answers.sort((a: AnswerDetail, b: AnswerDetail) =>
            (a.question?.order ?? 0) - (b.question?.order ?? 0)
          );
        }
        setAttempt(data);
      }
    } catch {
      // ignore
    }
  }, [params.id]);

  useEffect(() => {
    const stored = sessionStorage.getItem("resultsReturn");
    if (stored) {
      setReturnUrl(stored);
      sessionStorage.removeItem("resultsReturn");
    } else if (searchParams.get("from") === "history") {
      setReturnUrl("/history");
    }

    if (searchParams.get("tab") === "marked") {
      setFilter("marked");
    }

    api
      .get(`/results/${params.id}`)
      .then((res) => {
        if (res.data?.attempt) {
          const data = res.data.attempt;
          if (data.answers) {
            data.answers.sort((a: AnswerDetail, b: AnswerDetail) =>
              (a.question?.order ?? 0) - (b.question?.order ?? 0)
            );
          }
          setAttempt(data);

          // Fix 2: if ?tab=marked but no answers are marked, fall back to "all"
          if (searchParams.get("tab") === "marked") {
            const marked = data.answers?.filter((a: AnswerDetail) => a.isMarkedForReview) || [];
            if (marked.length === 0) {
              setFilter("all");
            }
          }
        } else {
          router.push("/results");
        }
      })
      .catch(() => router.push("/results"))
      .finally(() => setLoading(false));
  }, [params.id, router, searchParams]);

  // Fix 3: Poll for async AI data (explanations, feedback)
  useEffect(() => {
    if (!attempt || !attempt.answers) return;

    const allReady = attempt.answers.every((ans) => {
      return ans.feedback != null || ans.question?.explanations != null;
    });

    if (allReady) return;

    let count = 0;
    pollingRef.current = setInterval(async () => {
      count++;
      if (count > 12) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        return;
      }
      try {
        const res = await api.get(`/results/${params.id}`);
        if (res.data?.attempt) {
          const data = res.data.attempt;
          if (data.answers) {
            data.answers.sort((a: AnswerDetail, b: AnswerDetail) =>
              (a.question?.order ?? 0) - (b.question?.order ?? 0)
            );
          }
          setAttempt(data);
          const done = data.answers.every((ans: AnswerDetail) => {
            return ans.feedback != null || ans.question?.explanations != null;
          });
          if (done && pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [attempt, params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!attempt) return null;

  const correctCount =
    attempt.answers?.filter((a) => a.isCorrect).length || 0;
  const wrongCount =
    attempt.answers?.filter((a) => a.selectedOption !== null && a.isCorrect !== true).length || 0;

  const markedAnswers = attempt.answers?.filter((a) => a.isMarkedForReview) || [];
  const filteredAnswers = filter === "marked" ? markedAnswers : attempt.answers;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={returnUrl}
          className="p-2 text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {attempt.mockTest.title}
          </h1>
          <p className="text-zinc-500 text-sm">
            {attempt.mockTest.subject || "General"}
          </p>
        </div>
      </div>

      {/* Score Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <Target size={24} className="mx-auto text-zinc-900 mb-1" />
            <p className="text-2xl font-bold text-zinc-900">
              {attempt.score}/{attempt.totalMarks}
            </p>
            <p className="text-xs text-zinc-500">Score</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <CheckCircle2 size={24} className="mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold text-green-600">{correctCount}</p>
            <p className="text-xs text-zinc-500">Correct</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <XCircle size={24} className="mx-auto text-red-600 mb-1" />
            <p className="text-2xl font-bold text-red-600">{wrongCount}</p>
            <p className="text-xs text-zinc-500">Wrong</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Clock size={24} className="mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold text-blue-600">
              {attempt.accuracy != null ? `${Math.round(attempt.accuracy)}%` : "-"}
            </p>
            <p className="text-xs text-zinc-500">Accuracy</p>
          </div>
        </Card>
      </div>

      {/* Filter Toggle + Refresh */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Answer Review</h2>
        <button
          onClick={handleRefresh}
          className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          title="Refresh AI data"
        >
          <RefreshCw size={16} />
        </button>
        {markedAnswers.length > 0 && (
          <div className="flex bg-zinc-100 rounded-lg p-0.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filter === "all" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              All ({attempt.answers.length})
            </button>
            <button
              onClick={() => setFilter("marked")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filter === "marked" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <span className="flex items-center gap-1">
                <Bookmark size={12} />
                Marked ({markedAnswers.length})
              </span>
            </button>
          </div>
        )}
      </div>

      {filter === "marked" && markedAnswers.length === 0 ? (
        <Card>
          <div className="text-center py-6 text-sm text-zinc-500">
            <Bookmark size={24} className="mx-auto mb-2 text-zinc-300" />
            No questions were marked for review
          </div>
        </Card>
      ) : <div className="space-y-3">
        {filteredAnswers.map((ans) => {
          const explanation = ans.question.explanations;

          return (
            <Card key={ans.id}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {ans.selectedOption === null ? (
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-300" />
                  ) : ans.isCorrect === true ? (
                    <CheckCircle2 size={20} className="text-green-600" />
                  ) : (
                    <XCircle size={20} className="text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 mb-2">
                    {ans.isMarkedForReview && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5 mr-2">
                        <Bookmark size={10} />
                        Marked
                      </span>
                    )}
                    <ContentRenderer text={ans.question.questionText} />
                  </p>

                  <div className="space-y-2">
                    {(!ans.question.options || ans.question.options.length === 0) ? (
                      <>
                        <div className={`text-xs px-3 py-2 rounded-lg border ${
                          ans.isCorrect === true
                            ? "border-green-300 bg-green-50 text-green-700"
                            : ans.selectedOption
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-700"
                        }`}>
                          <span className="font-medium block mb-1">Your answer:</span>
                          <span className="whitespace-pre-wrap break-words">
                            {ans.selectedOption || <span className="italic text-zinc-400">No answer provided</span>}
                          </span>
                        </div>
                        {ans.question.correctAnswer && (
                          <div className="text-xs px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700">
                            <span className="font-medium block mb-1">Model answer:</span>
                            <span className="whitespace-pre-wrap break-words">
                              <ContentRenderer text={ans.question.correctAnswer} />
                            </span>
                          </div>
                        )}
                        {ans.isCorrect === true && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1">
                            ✓ Correct
                          </span>
                        )}
                        {ans.isCorrect !== true && ans.selectedOption && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1">
                            ✗ Incorrect
                          </span>
                        )}
                      </>
                    ) : (
                      ans.question.options.map((opt, idx) => {
                        const isSelected = ans.selectedOption === opt;
                        const isCorrectOpt = ans.question.correctAnswer === opt;
                        return (
                          <div
                            key={idx}
                            className={`text-xs px-3 py-1.5 rounded-lg border ${
                              isCorrectOpt
                                ? "border-green-300 bg-green-50 text-green-700"
                                : isSelected
                                ? "border-red-300 bg-red-50 text-red-700"
                                : "border-zinc-200 text-zinc-600"
                            }`}
                          >
                            <ContentRenderer text={opt} />
                            {isCorrectOpt && (
                              <span className="ml-2 text-green-600 font-medium">
                                ✓ Correct answer
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {ans.feedback ? (
                    <div className="mt-2">
                      <div className="text-xs px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800">
                        <span className="font-medium block mb-0.5">Feedback:</span>
                        <span className="whitespace-pre-wrap break-words">
                          <ContentRenderer text={ans.feedback} />
                        </span>
                      </div>
                    </div>
                  ) : explanation && (
                    <div className="mt-2 space-y-2">
                      {explanation.detailedExplanation && (
                        <div className="text-xs px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800">
                          <span className="font-medium block mb-0.5">Explanation:</span>
                          <span className="whitespace-pre-wrap break-words">
                            <ContentRenderer text={explanation.detailedExplanation} />
                          </span>
                        </div>
                      )}
                      {explanation.shortExplanation && (
                        <div className="text-xs px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-800">
                          <span className="font-medium block mb-0.5">Key takeaway:</span>
                          <span className="whitespace-pre-wrap break-words">
                            <ContentRenderer text={explanation.shortExplanation} />
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>}

      <div className="flex justify-center pb-8">
        <Link href="/tests">
          <Button variant="secondary">
            Back to Tests
          </Button>
        </Link>
      </div>
    </div>
  );
}
