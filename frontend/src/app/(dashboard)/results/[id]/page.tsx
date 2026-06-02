"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  CheckCircle2, XCircle, Clock, Target, ArrowLeft,
  Loader2, AlertCircle,
} from "lucide-react";

interface Explanation {
  shortExplanation: string | null;
  detailedExplanation: string | null;
}

interface AnswerDetail {
  id: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  question: {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    type: string;
    explanations: Explanation[];
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

async function apiPostWithRetry(url: string, body: unknown, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await api.post(url, body);
    } catch (error: any) {
      if (error?.response?.status === 429 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw error;
    }
  }
}

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<Record<string, boolean>>({});
  const [evaluationErrors, setEvaluationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .get(`/results/${params.id}`)
      .then((res) => setAttempt(res.data.attempt))
      .catch(() => router.push("/results"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const needsAiReview = useCallback((ans: AnswerDetail) => {
    if (ans.question.type !== "SUBJECTIVE") return false;
    if (ans.selectedOption === null) return false;
    if (ans.isCorrect !== null && ans.question.explanations?.length > 0) return false;
    return true;
  }, []);

  const evaluateWithAi = useCallback(async (answerId: string, questionId: string) => {
    if (!attempt) return;
    if (evaluating[questionId]) return;
    setEvaluating((prev) => ({ ...prev, [questionId]: true }));
    setEvaluationErrors((prev) => ({ ...prev, [questionId]: "" }));

    try {
      const res = await apiPostWithRetry(`/attempts/${attempt.id}/evaluate-subjective-ai`, {
        questionId,
      });

      const { modelAnswer, feedback, isCorrect } = res.data;

      setAttempt((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: prev.answers.map((a) => {
            if (a.id !== answerId) return a;
            return {
              ...a,
              isCorrect,
              question: {
                ...a.question,
                explanations: [
                  {
                    shortExplanation: feedback,
                    detailedExplanation: modelAnswer,
                  },
                ],
              },
            };
          }),
        };
      });
    } catch {
      setEvaluationErrors((prev) => ({
        ...prev,
        [questionId]: "Evaluation failed. Tap to retry.",
      }));
    } finally {
      setEvaluating((prev) => ({ ...prev, [questionId]: false }));
    }
  }, [attempt]);

  useEffect(() => {
    if (!attempt || loading) return;
    const pending = attempt.answers.filter(needsAiReview);
    if (pending.length === 0) return;

    let cancelled = false;
    const run = async () => {
      for (const ans of pending) {
        if (cancelled) break;
        await evaluateWithAi(ans.id, ans.question.id);
      }
    };
    run();

    return () => { cancelled = true; };
  }, [attempt?.id, loading, needsAiReview, evaluateWithAi]);

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
    attempt.answers?.filter((a) => a.selectedOption !== null && a.isCorrect === false).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/results"
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
              {attempt.accuracy ? `${Math.round(attempt.accuracy)}%` : "-"}
            </p>
            <p className="text-xs text-zinc-500">Accuracy</p>
          </div>
        </Card>
      </div>

      {/* Answer Review */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900">Answer Review</h2>
        {attempt.answers.map((ans) => {
          const explanation = ans.question.explanations?.[0];
          const isEvaluating = evaluating[ans.question.id];
          const evalError = evaluationErrors[ans.question.id];

          return (
            <Card key={ans.id}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {ans.selectedOption === null ? (
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-300" />
                  ) : isEvaluating ? (
                    <Loader2 size={20} className="text-blue-500 animate-spin" />
                  ) : ans.isCorrect === true ? (
                    <CheckCircle2 size={20} className="text-green-600" />
                  ) : ans.isCorrect === false ? (
                    <XCircle size={20} className="text-red-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-amber-400 bg-amber-50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 mb-2">
                    {ans.question.questionText}
                  </p>

                  {ans.question.type === "SUBJECTIVE" ? (
                    <div className="space-y-2">
                      {/* User's answer */}
                      <div className="text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700">
                        <span className="font-medium shrink-0">Your answer:</span>
                        <span className="ml-1 whitespace-pre-wrap break-words">
                          {ans.selectedOption || <span className="italic text-zinc-400">Not answered</span>}
                        </span>
                      </div>

                      {/* Evaluating state */}
                      {isEvaluating && (
                        <div className="text-xs px-3 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin shrink-0" />
                          <span>AI is evaluating your answer...</span>
                        </div>
                      )}

                      {/* Error state */}
                      {evalError && !isEvaluating && (
                        <div className="text-xs px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 flex items-center gap-2">
                          <AlertCircle size={14} className="shrink-0" />
                          <span>{evalError}</span>
                          <button
                            onClick={() => evaluateWithAi(ans.id, ans.question.id)}
                            className="ml-auto font-medium underline cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {/* AI evaluation result */}
                      {!isEvaluating && !evalError && ans.isCorrect !== null && explanation && (
                        <>
                          {/* Assessment badge */}
                          <div className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-2 ${
                            ans.isCorrect === true
                              ? "border-green-200 bg-green-50 text-green-700"
                              : ans.isCorrect === false
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}>
                            {ans.isCorrect === true ? (
                              <CheckCircle2 size={14} />
                            ) : ans.isCorrect === false ? (
                              <XCircle size={14} />
                            ) : (
                              <AlertCircle size={14} />
                            )}
                            <span className="font-medium">
                              {ans.isCorrect === true ? "Correct" : ans.isCorrect === false ? "Incorrect" : "Partially correct"}
                            </span>
                          </div>

                          {/* Model answer */}
                          {explanation.detailedExplanation && (
                            <div className="text-xs px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800">
                              <span className="font-medium block mb-0.5">Model answer:</span>
                              <span className="whitespace-pre-wrap break-words">
                                {explanation.detailedExplanation}
                              </span>
                            </div>
                          )}

                          {/* Feedback */}
                          {explanation.shortExplanation && (
                            <div className="text-xs px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-800">
                              <span className="font-medium block mb-0.5">Feedback:</span>
                              <span className="whitespace-pre-wrap break-words">
                                {explanation.shortExplanation}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Already evaluated (old flow with correctAnswer) - no AI needed */}
                      {!isEvaluating && !evalError && !explanation && ans.isCorrect !== null && !needsAiReview(ans) && (
                        <div className={`text-xs px-3 py-2 rounded-lg border flex items-start gap-2 ${
                          ans.isCorrect === true
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}>
                          {ans.isCorrect === true ? (
                            <span className="font-medium shrink-0">✓ Correct</span>
                          ) : (
                            <>
                              <span className="font-medium shrink-0">✗ Correct answer:</span>
                              <span className="whitespace-pre-wrap break-words">
                                {ans.question.correctAnswer || "Not available"}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {ans.question.options.map((opt) => {
                        const isSelected = ans.selectedOption === opt;
                        const isCorrectOpt = ans.question.correctAnswer === opt;
                        return (
                          <div
                            key={opt}
                            className={`text-xs px-3 py-1.5 rounded-lg border ${
                              isCorrectOpt
                                ? "border-green-300 bg-green-50 text-green-700"
                                : isSelected
                                ? "border-red-300 bg-red-50 text-red-700"
                                : "border-zinc-200 text-zinc-600"
                            }`}
                          >
                            {opt}
                            {isCorrectOpt && (
                              <span className="ml-2 text-green-600 font-medium">
                                ✓ Correct answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

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
