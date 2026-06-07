"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Loader2, Brain, ChevronLeft, ChevronRight, Clock, Send, AlertCircle,
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

interface SavedProgress {
  currentIndex: number;
  timeLeft: number;
  lastSavedAt: string;
  cleared?: boolean;
}

function getFirebaseToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("firebaseToken");
}

const SAVE_DEBOUNCE_MS = 2000;

export default function TakeQuizPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [submitEnabled, setSubmitEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef<Record<number, string>>({});
  const currentIndexRef = useRef(0);
  const timeLeftRef = useRef(600);
  const submitEnabledRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  const saveProgress = useCallback(async (
    ans: Record<number, string>,
    idx: number,
    tl: number,
  ) => {
    if (!attemptId) return;
    try {
      const token = getFirebaseToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${API}/quiz/attempt/${attemptId}/progress`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          answers: ans,
          currentIndex: idx,
          timeLeft: tl,
        }),
      });
    } catch {
      // silent fail — auto-save should never interrupt the user
    }
  }, [attemptId]);

  const debouncedSave = useCallback((
    ans: Record<number, string>,
    idx: number,
    tl: number,
  ) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProgress(ans, idx, tl);
    }, SAVE_DEBOUNCE_MS);
  }, [saveProgress]);

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const ans = answersRef.current;
    const idx = currentIndexRef.current;
    const tl = timeLeftRef.current;
    if (Object.keys(ans).length > 0) {
      saveProgress(ans, idx, tl);
    }
  }, [saveProgress]);

  // Load quiz + restore progress
  useEffect(() => {
    if (!attemptId || initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    fetch(`${API}/quiz/attempt/${attemptId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Quiz not found");
        return r.json();
      })
      .then((data) => {
        const qs = data.attempt?.questions;
        if (!qs || qs.length === 0) throw new Error("No questions found");
        setQuestions(qs);

        const savedAnswers: Record<number, string> = data.attempt?.answers || {};
        const savedProgress: SavedProgress | null = data.attempt?.progress;

        if (savedProgress && savedProgress.lastSavedAt && !savedProgress.cleared) {
          const elapsed = Math.floor(
            (Date.now() - new Date(savedProgress.lastSavedAt).getTime()) / 1000
          );
          const restoredTimeLeft = Math.max(0, savedProgress.timeLeft - elapsed);
          const restoredIndex = savedProgress.currentIndex ?? 0;
          const restoredAnswers: Record<number, string> = {};
          if (savedAnswers && typeof savedAnswers === "object") {
            for (const [k, v] of Object.entries(savedAnswers)) {
              const n = Number(k);
              if (!isNaN(n) && typeof v === "string") {
                restoredAnswers[n] = v;
              }
            }
          }

          setAnswers(restoredAnswers);
          answersRef.current = restoredAnswers;
          setCurrentIndex(restoredIndex);
          currentIndexRef.current = restoredIndex;
          setTimeLeft(restoredTimeLeft);
          timeLeftRef.current = restoredTimeLeft;
          setSubmitEnabled(restoredTimeLeft <= 480);
          submitEnabledRef.current = restoredTimeLeft <= 480;

          if (restoredTimeLeft <= 0) {
            handleSubmitImmediate(restoredAnswers);
            return;
          }
        } else {
          setProgressRefs(0, 600, false);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [attemptId]);

  // Keep refs in sync + debounced auto-save on state change
  useEffect(() => {
    answersRef.current = answers;
    currentIndexRef.current = currentIndex;
    timeLeftRef.current = timeLeft;
    submitEnabledRef.current = submitEnabled;

    if (questions.length > 0 && Object.keys(answers).length > 0) {
      debouncedSave(answers, currentIndex, timeLeft);
    }
  }, [answers, currentIndex, timeLeft, submitEnabled, questions.length, debouncedSave]);

  function setProgressRefs(
    idx: number,
    tl: number,
    enabled: boolean,
  ) {
    currentIndexRef.current = idx;
    timeLeftRef.current = tl;
    submitEnabledRef.current = enabled;
  }

  // Timer
  useEffect(() => {
    if (questions.length === 0) return;
    const enableTimer = setTimeout(
      () => {
        setSubmitEnabled(true);
        submitEnabledRef.current = true;
      },
      Math.max(0, timeLeftRef.current - 480) * 1000,
    );

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        timeLeftRef.current = next;
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setSubmitEnabled(true);
          submitEnabledRef.current = true;
          handleSubmitImmediate(answersRef.current);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      clearTimeout(enableTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions.length]);

  // Save on tab switch (visibilitychange)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        flushSave();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [flushSave]);

  // Save on beforeunload (close/refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const ans = answersRef.current;
      const idx = currentIndexRef.current;
      const tl = timeLeftRef.current;
      if (Object.keys(ans).length > 0) {
        navigator.sendBeacon(
          `${API}/quiz/attempt/${attemptId}/progress`,
          new Blob(
            [JSON.stringify({ answers: ans, currentIndex: idx, timeLeft: tl })],
            { type: "application/json" },
          ),
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [attemptId]);

  // Save on unmount (client-side navigation)
  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [flushSave]);

  const handleSubmitImmediate = useCallback(async (finalAnswers: Record<number, string>) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const token = getFirebaseToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${API}/quiz/attempt/${attemptId}/answers`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ answers: finalAnswers }),
      });
    } catch {
      // silent — quiz was auto-submitted on expiry
    }

    router.push(`/ai-quiz/thank-you/${attemptId}`);
  }, [attemptId, router]);

  const handleSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const token = getFirebaseToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/quiz/attempt/${attemptId}/answers`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save answers");
      }
    } catch (err) {
      toast.error("Failed to save answers", {
        description: err instanceof Error ? err.message : "Please try again",
      });
      setSubmitting(false);
      return;
    }

    router.push(`/ai-quiz/thank-you/${attemptId}`);
  }, [answers, attemptId, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <AlertCircle className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">{error || "Quiz not found"}</p>
        <Link href="/ai-quiz" className="inline-flex items-center gap-1.5 mt-4 text-sm text-blue-600 hover:text-blue-700">
          <ChevronLeft className="w-4 h-4" /> Back to AI Quiz
        </Link>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <LazyMotion features={domAnimation}>
      <div className="max-w-3xl mx-auto px-0 sm:px-4">
        {/* Timer bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 rounded-t-2xl px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Brain className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs text-zinc-500 hidden sm:inline">Quiz</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-[11px] sm:text-xs text-zinc-400 whitespace-nowrap">
              {answeredCount}/{questions.length}
            </span>
            {!submitEnabled && (
              <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                {Math.ceil(timeLeft > 480 ? (timeLeft - 480) / 60 : 0)} Min
              </span>
            )}
            <div className={`flex items-center gap-1 font-mono text-xs sm:text-sm font-bold ${
              timeLeft < 30 ? "text-red-500" : timeLeft < 60 ? "text-amber-500" : "text-zinc-700"
            }`}>
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white border-x border-zinc-200 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              Q{currentIndex + 1}/{questions.length}
            </span>
            {answers[currentIndex] && (
              <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                Answered
              </span>
            )}
          </div>

          <div className="text-sm sm:text-base lg:text-lg text-zinc-900 leading-relaxed mb-6 font-medium">
            <ContentRenderer text={questions[currentIndex].questionText} />
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {questions[currentIndex].options.map((option, oi) => {
              const isSelected = answers[currentIndex] === option;
              return (
                <button
                  key={oi}
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentIndex]: option }))}
                  className={`w-full text-left p-3 sm:p-4 rounded-xl border text-sm transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-blue-500/50 bg-blue-50 text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                  <span className="text-xs sm:text-sm leading-snug"><ContentRenderer text={option} /></span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-6 sm:mt-8 pt-4 border-t border-zinc-100 gap-3 sm:gap-0">
            {/* Mobile row: Previous + Next side-by-side (Q1-Q9) / Previous alone (Q10) */}
            <div className="flex sm:hidden items-stretch gap-2">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {currentIndex < questions.length - 1 && (
                <button
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Desktop: Previous + dots */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex-none flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="hidden sm:flex items-center gap-1.5">
                {questions.map((_, qi) => (
                  <button
                    key={qi}
                    onClick={() => setCurrentIndex(qi)}
                    className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      qi === currentIndex
                        ? "bg-zinc-900 text-white scale-110"
                        : answers[qi]
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-zinc-100 text-zinc-400 border border-zinc-200 hover:bg-zinc-200"
                    }`}
                  >
                    {qi + 1}
                  </button>
                ))}
              </div>
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="hidden sm:flex flex-none items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!submitEnabled || submitting}
                className="flex items-center justify-center gap-2 h-10 min-w-[160px] px-5 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" />
                  {submitEnabled
                    ? (allAnswered ? "Submit Quiz" : `Submit (${answeredCount}/${questions.length})`)
                    : `${Math.ceil(timeLeft > 480 ? (timeLeft - 480) / 60 : 0)} Min`}</>
                )}
              </button>
            )}
          </div>

          {/* Mobile question dots */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 mt-4">
            {questions.map((_, qi) => (
              <button
                key={qi}
                onClick={() => setCurrentIndex(qi)}
                className={`w-2 h-2 rounded-full transition-all ${
                  qi === currentIndex
                    ? "bg-zinc-900 w-4"
                    : answers[qi]
                    ? "bg-green-400"
                    : "bg-zinc-200"
                }`}
              />
            ))}
          </div>

          {/* Mobile submit */}
          {currentIndex < questions.length - 1 && submitEnabled && (
            <div className="mt-4 sm:hidden">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 transition-all cursor-pointer"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Submit ({answeredCount}/{questions.length})</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </LazyMotion>
  );
}
