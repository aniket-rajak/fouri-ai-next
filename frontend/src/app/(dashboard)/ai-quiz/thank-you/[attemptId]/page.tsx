"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Award, CheckCircle2, XCircle, BarChart3, Loader2,
  Star, Send, ArrowLeft, Sparkles, Lightbulb,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { isAnswerCorrect } from "@/lib/quizScoring";
import { ContentRenderer } from "@/components/ui/ContentRenderer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface AttemptData {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  score: number | null;
  totalQuestions: number;
  questions: QuizQuestion[] | null;
  answers: Record<string, string> | null;
  createdAt: string;
  completedAt: string | null;
}

interface Explanation {
  isCorrect: boolean;
  explanation: string;
  improvementSuggestion: string;
}

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("quiz_guest_id");
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("quiz_guest_id", id);
  }
  return id;
}

export default function ThankYouPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Explanation[] | null>(null);
  const [explaining, setExplaining] = useState(false);

  // Feedback state
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState<string>("OVERALL_EXPERIENCE");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const feedbackCategories = [
    { value: "OVERALL_EXPERIENCE", label: "Overall Experience" },
    { value: "QUIZ_QUALITY", label: "Quiz Quality" },
    { value: "QUESTION_DIFFICULTY", label: "Question Difficulty" },
    { value: "EXPLANATION_QUALITY", label: "Explanation Quality" },
  ];

  useEffect(() => {
    if (!attemptId) return;
    fetch(`${API}/quiz/attempt/${attemptId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setAttempt(data.attempt))
      .catch((err) => setError(err.message || "Failed to load quiz results"))
      .finally(() => setLoading(false));
  }, [attemptId]);

  const fetchExplanations = async () => {
    const qs = attempt?.questions || [];
    const ans = attempt?.answers || {};
    if (qs.length === 0) return;

    setExplaining(true);
    try {
      const res = await fetch(`${API}/quiz/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: qs.map((q, i) => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: ans[i] || null,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to load explanations");
      const data = await res.json();
      setExplanations(data.explanations);
    } catch {
      toast.error("Could not load answer explanations");
    } finally {
      setExplaining(false);
    }
  };

  useEffect(() => {
    if (attempt?.questions?.length && !explanations && !explaining) {
      fetchExplanations();
    }
  }, [attempt]);

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("firebaseToken");
      const guestId = getGuestId();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/quiz/feedback`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          quizAttemptId: attemptId,
          rating,
          comment: comment.trim() || undefined,
          category,
          userId: token ? "authenticated" : undefined,
          guestId: token ? undefined : guestId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          toast.info("You already submitted feedback for this quiz");
          setSubmitted(true);
          return;
        }
        throw new Error(data.error || "Failed to submit feedback");
      }

      toast.success("Thank you for your feedback!");
      setSubmitted(true);
    } catch (err) {
      toast.error("Failed to submit feedback", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-zinc-500">{error || "Quiz not found"}</p>
        <Link href="/ai-quiz" className="inline-flex items-center gap-1.5 mt-4 text-sm text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-4 h-4" /> Back to AI Quiz
        </Link>
      </div>
    );
  }

  const qs = attempt.questions || [];
  const ans = attempt.answers || {};
  const total = qs.length;
  let correctCount = 0;
  qs.forEach((q, i) => {
    if (isAnswerCorrect(ans[i], q.correctAnswer, q.options)) correctCount++;
  });
  const scoreFromAttempt = attempt.score ?? correctCount;
  const accuracy = total > 0 ? Math.round((scoreFromAttempt / total) * 100) : 0;

  return (
    <LazyMotion features={domAnimation}>
      <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0">
        {/* Back link */}
        <Link
          href="/ai-quiz"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to AI Quiz
        </Link>

        {/* Score Summary */}
        <div className="rounded-2xl bg-white border border-zinc-200 p-5 sm:p-8 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Award className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Quiz Complete!</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
            {attempt.subject} &mdash; {attempt.topic} &mdash;{" "}
            <span className="capitalize">{attempt.difficulty.toLowerCase()}</span>
          </p>

          <div className="text-5xl sm:text-7xl font-bold text-zinc-900 mt-6">
            {scoreFromAttempt}
            <span className="text-2xl sm:text-3xl text-zinc-400">/{total}</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2">Correct Answers</p>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6 sm:mt-8 max-w-[280px] sm:max-w-xs mx-auto">
            <div className="p-3 sm:p-4 rounded-xl bg-green-50 border border-green-100 text-center">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mx-auto mb-1" />
              <div className="text-base sm:text-lg font-bold text-green-600">{scoreFromAttempt}</div>
              <div className="text-[10px] text-green-500">Correct</div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-100 text-center">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mx-auto mb-1" />
              <div className="text-base sm:text-lg font-bold text-red-600">{total - scoreFromAttempt}</div>
              <div className="text-[10px] text-red-500">Incorrect</div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-base sm:text-lg font-bold text-blue-600">{accuracy}%</div>
              <div className="text-[10px] text-blue-500">Accuracy</div>
            </div>
          </div>

          {/* Accuracy bar */}
          <div className="mt-6 max-w-[260px] sm:max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
              <span>Accuracy</span>
              <span>{accuracy}%</span>
            </div>
            <div className="h-2 sm:h-2.5 rounded-full bg-zinc-100 overflow-hidden">
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${accuracy}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  accuracy >= 70 ? "bg-green-500" : accuracy >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Answer Analysis with Explanations */}
        {qs.length > 0 && (
          <div className="rounded-2xl bg-white border border-zinc-200 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900">Detailed Answer Analysis</h2>
              {!explanations && !explaining && (
                <button
                  onClick={fetchExplanations}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Lightbulb className="w-3.5 h-3.5" /> Load Explanations
                </button>
              )}
              {explaining && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                </div>
              )}
            </div>
            <div className="space-y-3 sm:space-y-4">
              {qs.map((q, qi) => {
                const userAns = ans[qi];
                const status = !userAns?.trim() ? "unanswered" : isAnswerCorrect(userAns, q.correctAnswer, q.options) ? "correct" : "incorrect";
                const exp = explanations?.[qi];
                return (
                  <div
                    key={qi}
                    className={`p-3 sm:p-4 rounded-xl border ${
                      status === "correct"
                        ? "bg-green-50 border-green-100"
                        : status === "incorrect"
                        ? "bg-red-50 border-red-100"
                        : "bg-zinc-50 border-zinc-200"
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="mt-0.5 shrink-0">
                        {status === "correct" ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        ) : status === "incorrect" ? (
                          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Question */}
                        <div className="text-xs sm:text-sm font-medium text-zinc-900 mb-2 leading-relaxed">
                          <span className="text-[10px] sm:text-xs text-zinc-400 mr-1">Q{qi + 1}.</span>
                          <ContentRenderer text={q.questionText} />
                        </div>

                        {/* User's answer vs correct answer */}
                        <div className="space-y-1">
                          {status !== "unanswered" ? (
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                              <span className="text-zinc-400">Your answer:</span>
                              <span className={`font-medium ${status === "correct" ? "text-green-700" : "text-red-600"}`}>
                                <ContentRenderer text={userAns} />
                              </span>
                              <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                status === "correct"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {status === "correct" ? "Correct" : "Incorrect"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-500">
                              Not answered
                            </span>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                            <span className="text-zinc-400">Correct answer:</span>
                            <span className="font-medium text-green-700"><ContentRenderer text={q.correctAnswer} /></span>
                            <span className="text-green-500">✓</span>
                          </div>
                        </div>

                        {/* Explanation */}
                        {exp && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-zinc-200 space-y-1.5 sm:space-y-2">
                            <div className="text-[11px] sm:text-xs text-zinc-600 leading-relaxed">
                              <span className="font-medium text-zinc-700">Explanation:</span> <ContentRenderer text={exp.explanation} />
                            </div>
                            {exp.improvementSuggestion && (status === "incorrect" || status === "unanswered") && (
                              <p className="text-[11px] sm:text-xs text-blue-700 leading-relaxed bg-blue-50 px-2.5 sm:px-3 py-2 rounded-lg">
                                <span className="font-medium">Tip:</span> {exp.improvementSuggestion}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rating & Feedback */}
        {!submitted ? (
          <div className="rounded-2xl bg-white border border-zinc-200 p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 mb-1">Rate This Quiz</h2>
            <p className="text-xs sm:text-sm text-zinc-500 mb-4">Help us improve by sharing your experience.</p>

            {/* Star Rating */}
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-all cursor-pointer"
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-6 h-6 sm:w-7 sm:h-7 transition-all ${
                      star <= (hoveredStar || rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-zinc-200"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-zinc-500">
                  {rating === 5 ? "Excellent!" : rating === 4 ? "Great" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                </span>
              )}
            </div>

            {/* Category selector */}
            <div className="mb-4">
              <p className="text-[11px] sm:text-xs font-medium text-zinc-600 mb-2">Category</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {feedbackCategories.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
                      category === c.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts (optional)..."
              rows={3}
              maxLength={1000}
              className="w-full p-3 sm:p-4 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all"
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-3">
              <span className="text-xs text-zinc-400 text-center sm:text-left">{comment.length}/1000</span>
              <button
                onClick={handleSubmitFeedback}
                disabled={submitting || rating === 0}
                className="flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Submit Feedback</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-zinc-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Feedback Submitted</h3>
            <p className="text-xs text-zinc-500 mt-1">Thank you for your review!</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/ai-quiz"
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Take Another Quiz
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </LazyMotion>
  );
}
