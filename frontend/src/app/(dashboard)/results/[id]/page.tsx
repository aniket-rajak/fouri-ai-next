"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Target, ArrowLeft } from "lucide-react";

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

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/results/${params.id}`)
      .then((res) => setAttempt(res.data.attempt))
      .catch(() => router.push("/results"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

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
    attempt.answers?.filter((a => a.selectedOption !== null && !a.isCorrect)).length || 0;
  const unansweredCount =
    attempt.answers?.filter((a) => a.selectedOption === null).length || 0;

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        {attempt.answers.map((ans) => (
          <Card key={ans.id}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {ans.selectedOption === null ? (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-300" />
                ) : ans.isCorrect ? (
                  <CheckCircle2 size={20} className="text-green-600" />
                ) : (
                  <XCircle size={20} className="text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 mb-2">
                  {ans.question.questionText}
                </p>
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
              </div>
            </div>
          </Card>
        ))}
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
