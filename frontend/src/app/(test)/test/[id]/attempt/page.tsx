"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useTestTimer } from "@/hooks/useTestTimer";
import { useAutoSave } from "@/hooks/useAutoSave";
import { QuestionCard } from "@/components/test/QuestionCard";
import { QuestionPalette } from "@/components/test/QuestionPalette";
import { Button } from "@/components/ui/Button";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  type: string;
  difficulty: string;
  order: number;
}

interface TestData {
  id: string;
  title: string;
  duration: number;
  questions: Question[];
}

interface Answer {
  questionId: string;
  selectedOption: string | null;
}

export default function TestAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState<TestData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const fullscreenRef = useRef(false);

  // Load test and create attempt
  useEffect(() => {
    const init = async () => {
      try {
        const [testRes, attemptRes] = await Promise.all([
          api.get(`/tests/${params.id}`),
          api.post("/attempts", { mockTestId: params.id }),
        ]);

        setTest(testRes.data.test);
        const att = attemptRes.data.attempt;
        setAttemptId(att.id);
        setStartTime(att.startedAt || new Date().toISOString());

        // Restore from localStorage
        const stored = localStorage.getItem(`fouri_attempt_${att.id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.answers?.length) {
              setAnswers(parsed.answers);
            }
            if (parsed.markedIds?.length) {
              setMarkedIds(new Set(parsed.markedIds));
            }
          } catch {
            // ignore corrupt data
          }
        }

        // Request fullscreen
        if (document.documentElement.requestFullscreen && !fullscreenRef.current) {
          try {
            await document.documentElement.requestFullscreen();
            fullscreenRef.current = true;
          } catch {
            // fullscreen blocked by browser
          }
        }
      } catch {
        router.push("/tests");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [params.id, router]);

  const handleTimeUp = useCallback(() => {
    handleSubmit(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabSwitch = useCallback(() => {
    setShowTabWarning(true);
    setTimeout(() => setShowTabWarning(false), 3000);
  }, []);

  const timer = useTestTimer({
    startTime: startTime || new Date().toISOString(),
    duration: test?.duration || 1800,
    onTimeUp: handleTimeUp,
    onTabSwitch: handleTabSwitch,
  });

  const { restoreFromLocal } = useAutoSave(
    attemptId,
    answers,
    markedIds,
    !loading && !!attemptId
  );

  const currentQuestion = test?.questions[currentIndex];
  const answeredIds = new Set(
    answers.filter((a) => a.selectedOption !== null).map((a) => a.questionId)
  );

  const getSelected = (questionId: string) =>
    answers.find((a) => a.questionId === questionId)?.selectedOption || null;

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) =>
          a.questionId === questionId ? { ...a, selectedOption: option } : a
        );
      }
      return [...prev, { questionId, selectedOption: option }];
    });
  };

  const handleToggleMark = (questionId: string) => {
    setMarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleSubmit = async (isTimeout = false) => {
    if (!attemptId || submitting) return;
    setSubmitting(true);

    // Flush answers first
    try {
      await api.put(`/attempts/${attemptId}/save`, { answers });
    } catch {
      // continue with submit
    }

    try {
      await api.post(`/attempts/${attemptId}/submit`, {
        timeTaken: test ? test.duration - timer.timeLeft : null,
      });
      localStorage.removeItem(`fouri_attempt_${attemptId}`);
      router.push(`/results/${attemptId}`);
    } catch {
      setSubmitting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showConfirm) return;

      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) =>
          test ? Math.min(test.questions.length - 1, prev + 1) : prev
        );
      } else if (["1", "2", "3", "4"].includes(e.key) && currentQuestion) {
        const idx = parseInt(e.key) - 1;
        if (currentQuestion.options[idx]) {
          handleSelect(currentQuestion.id, currentQuestion.options[idx]);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, currentQuestion, showConfirm, test]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !test || !attemptId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Sticky Timer Bar */}
      <header
        className={`sticky top-0 z-50 border-b transition-colors ${
          timer.isWarning ? "bg-red-50 border-red-200" : "bg-white border-zinc-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-zinc-700 truncate hidden sm:block">
            {test.title}
          </span>
          <span className="text-sm font-medium text-zinc-700 truncate sm:hidden">
            {test.title.length > 20 ? test.title.slice(0, 20) + "..." : test.title}
          </span>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {timer.isWarning && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertTriangle size={14} />
                Time running out
              </span>
            )}
            <span
              className={`text-base sm:text-lg font-mono font-bold ${
                timer.isWarning ? "text-red-600" : "text-zinc-900"
              }`}
            >
              {timer.formatted}
            </span>
            <Button size="sm" variant="danger" onClick={() => setShowConfirm(true)}>
              Submit
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Switch Warning */}
      {showTabWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 text-center">
          Do not switch tabs. A second switch will auto-submit the test.
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Question Area */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-3xl mx-auto w-full pb-24 lg:pb-8">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              selectedOption={getSelected(currentQuestion.id)}
              onSelect={handleSelect}
              isMarked={markedIds.has(currentQuestion.id)}
              onToggleMark={handleToggleMark}
            />
          )}

          {/* Navigation */}
          <div className="mt-6 sm:mt-8 flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() =>
                setCurrentIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentIndex === 0}
              size="sm"
            >
              <ChevronLeft size={16} className="mr-1" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>

            <span className="text-sm text-zinc-500">
              {currentIndex + 1} / {test.questions.length}
            </span>

            {currentIndex < test.questions.length - 1 ? (
              <Button
                variant="secondary"
                onClick={() =>
                  setCurrentIndex((prev) =>
                    Math.min(test.questions.length - 1, prev + 1)
                  )
                }
                size="sm"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowConfirm(true)}>
                <Flag size={16} className="mr-1" />
                <span className="hidden sm:inline">Finish Test</span>
                <span className="sm:hidden">Finish</span>
              </Button>
            )}
          </div>
        </main>

        {/* Sidebar — Question Palette (desktop) */}
        <aside className="hidden lg:block w-64 border-l border-zinc-200 p-4 overflow-y-auto">
          <QuestionPalette
            questions={test.questions}
            currentIndex={currentIndex}
            answeredIds={answeredIds}
            markedIds={markedIds}
            onSelect={setCurrentIndex}
          />
        </aside>
      </div>

      {/* Mobile palette toggle */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <button
          onClick={() => setShowMobilePalette(!showMobilePalette)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border-t border-zinc-200 text-sm font-medium text-zinc-700 cursor-pointer"
        >
          <span>Question Palette ({currentIndex + 1}/{test.questions.length})</span>
          {showMobilePalette ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </button>
        {showMobilePalette && (
          <div className="max-h-[40vh] overflow-y-auto bg-white border-t border-zinc-100 px-4 py-3 shadow-lg">
            <QuestionPalette
              questions={test.questions}
              currentIndex={currentIndex}
              answeredIds={answeredIds}
              markedIds={markedIds}
              onSelect={(i) => { setCurrentIndex(i); setShowMobilePalette(false); }}
            />
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 mx-4">
            <h3 className="text-lg font-semibold text-zinc-900">Submit Test?</h3>
            <div className="text-sm text-zinc-600 space-y-1">
              <p>Questions answered: {answeredIds.size}/{test.questions.length}</p>
              <p>Marked for review: {markedIds.size}</p>
              <p>Time remaining: {timer.formatted}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Go Back
              </Button>
              <Button
                className="flex-1"
                loading={submitting}
                onClick={() => handleSubmit()}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
