"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  AlertCircle,
  PanelRightOpen,
  PanelRightClose,
  PauseCircle,
  CheckCircle2,
  Bookmark,
  List,
  X,
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
  const searchParams = useSearchParams();
  const [test, setTest] = useState<TestData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showRapidWarning, setShowRapidWarning] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [pausing, setPausing] = useState(false);
  const fullscreenRef = useRef(false);
  const answerTimestampsRef = useRef<number[]>([]);
  const handleSubmitRef = useRef<((isTimeout?: boolean) => Promise<void>) | null>(null);
  const submittingRef = useRef(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [thankYouCountdown, setThankYouCountdown] = useState(6);
  const [markedFilter, setMarkedFilter] = useState(false);

  // Load test and create/resume attempt
  useEffect(() => {
    const init = async () => {
      try {
        const resumeId = searchParams.get("resume");

        // If resuming, fetch the existing paused attempt
        if (resumeId) {
          const [testRes, attemptRes] = await Promise.all([
            api.get(`/tests/${params.id}`),
            api.get(`/attempts/${resumeId}`),
          ]);

          setTest(testRes.data.test);
          const att = attemptRes.data.attempt;

          if (att.status !== "PAUSED") {
            router.push(`/test/${params.id}`);
            return;
          }

          setAttemptId(att.id);
          setStartTime(new Date().toISOString());

          // Restore answers from the server
          if (att.answers?.length) {
            setAnswers(
              att.answers.map((a: { questionId: string; selectedOption: string | null }) => ({
                questionId: a.questionId,
                selectedOption: a.selectedOption,
              }))
            );
          }

          // Restore markedIds from localStorage
          const stored = localStorage.getItem(`fouri_attempt_${att.id}`);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.markedIds?.length) {
                setMarkedIds(new Set(parsed.markedIds));
              }
            } catch { /* ignore corrupt data */ }
          }

          // Restore current index and remaining time
          if (typeof att.currentQuestionIndex === "number") {
            setCurrentIndex(att.currentQuestionIndex);
          }

          // Mark as IN_PROGRESS again
          await api.put(`/attempts/${att.id}/resume`);

          // Request fullscreen
          if (document.documentElement.requestFullscreen && !fullscreenRef.current) {
            try {
              await document.documentElement.requestFullscreen();
              fullscreenRef.current = true;
            } catch { /* fullscreen blocked */ }
          }

          setLoading(false);
          return;
        }

        // Normal flow: create new attempt
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

  const handleSubmit = async (_isTimeout = false) => {
    if (!attemptId || submitting || submitCooldown || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      await api.put(`/attempts/${attemptId}/save`, { answers });
    } catch {
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await api.post(`/attempts/${attemptId}/submit`, {
          timeTaken: test ? test.duration - timer.timeLeft : null,
          markedIds: Array.from(markedIds),
        });

        // If the backend says it was already submitted, treat as success
        if (res.data?.alreadySubmitted) {
          localStorage.removeItem(`fouri_attempt_${attemptId}`);
          submittingRef.current = false;
          setSubmitting(false);
          setShowThankYou(true);
          setThankYouCountdown(6);
          return;
        }

        localStorage.removeItem(`fouri_attempt_${attemptId}`);
        submittingRef.current = false;
        setSubmitting(false);
        setShowThankYou(true);
        setThankYouCountdown(6);
        return;
      } catch (error: any) {
        const is429 = error?.response?.status === 429;
        if (is429 && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        submittingRef.current = false;
        setSubmitting(false);
        if (is429) {
          setSubmitCooldown(true);
          setTimeout(() => setSubmitCooldown(false), 5000);
          setSubmitError("Too many requests. Please wait a few seconds and try again.");
        } else {
          setSubmitError("Failed to submit. Please try again.");
        }
        return;
      }
    }
    submittingRef.current = false;
  };

  handleSubmitRef.current = handleSubmit;

  const handleTimeUp = useCallback(() => {
    handleSubmitRef.current?.(true);
  }, []);

  const handleTabSwitch = useCallback(() => {
    setShowTabWarning(true);
  }, []);

  // Clear tab warning when user returns to the tab
  useEffect(() => {
    const onShow = () => {
      if (!document.hidden) setShowTabWarning(false);
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, []);

  // Thank You countdown — redirect to results after 6s
  useEffect(() => {
    if (!showThankYou) return;
    if (thankYouCountdown <= 0) {
      router.push(`/results/${attemptId}?tab=marked`);
      return;
    }
    const id = setTimeout(() => setThankYouCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [showThankYou, thankYouCountdown, attemptId, router]);

  const handlePause = async () => {
    if (!attemptId || pausing) return;
    setPausing(true);
    try {
      await api.put(`/attempts/${attemptId}/save`, { answers });
      await api.put(`/attempts/${attemptId}/pause`, {
        remainingTime: timer.timeLeft,
        currentQuestionIndex: currentIndex,
      });
      localStorage.setItem(`fouri_attempt_${attemptId}`, JSON.stringify({
        answers,
        markedIds: Array.from(markedIds),
        savedAt: Date.now(),
      }));
      router.push("/dashboard");
    } catch {
      // pause failed — stay on page
    } finally {
      setPausing(false);
      setShowPauseConfirm(false);
    }
  };

  const durationParam = searchParams.get("duration");
  const resumeRemaining = searchParams.get("resumeRemaining");
  const resumeDuration = resumeRemaining ? Number(resumeRemaining) : null;

  const timer = useTestTimer({
    startTime: startTime || new Date().toISOString(),
    duration: resumeDuration ?? (durationParam ? Number(durationParam) : test?.duration || 1800),
    onTimeUp: handleTimeUp,
    onTabSwitch: handleTabSwitch,
    attemptId,
  });

  useAutoSave(
    attemptId,
    answers,
    markedIds,
    !loading && !!attemptId,
    submitting
  );

  const currentQuestion = test?.questions[currentIndex];
  const answeredIds = new Set(
    answers.filter((a) => a.selectedOption !== null).map((a) => a.questionId)
  );

  const getSelected = (questionId: string) =>
    answers.find((a) => a.questionId === questionId)?.selectedOption || null;

  const handleSelect = (questionId: string, option: string) => {
    // Track answer change timestamps for rapid-activity detection
    const now = Date.now();
    answerTimestampsRef.current.push(now);
    // Keep only timestamps from the last 10s
    answerTimestampsRef.current = answerTimestampsRef.current.filter(
      (t) => now - t < 10000
    );
    if (answerTimestampsRef.current.length > 10) {
      setShowRapidWarning(true);
      setTimeout(() => setShowRapidWarning(false), 4000);
    }

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
  }, [currentIndex, currentQuestion, showConfirm, test]);

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
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowPauseConfirm(true)}>
                <PauseCircle size={16} className="mr-1" />
                <span className="hidden sm:inline">Pause</span>
              </Button>
              <Button size="sm" variant="danger" onClick={() => setShowConfirm(true)}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Switch Warning */}
      {showTabWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 text-center">
          Do not switch tabs. A second switch will automatically submit the test.
        </div>
      )}

      {/* Rapid Answering Warning */}
      {showRapidWarning && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 text-sm text-orange-700 text-center">
          You are answering questions too quickly. Please review each question carefully before proceeding.
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Question Area */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full pb-24 lg:pb-8 overflow-y-auto">
          {/* Marked Filter Toggle */}
          {markedIds.size > 0 && (
            <button
              onClick={() => setMarkedFilter((p) => !p)}
              className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                markedFilter
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "border-zinc-200 text-zinc-600 hover:border-amber-200 hover:text-amber-600"
              }`}
            >
              <Bookmark size={15} fill={markedFilter ? "currentColor" : "none"} />
              {markedFilter ? "Showing Marked Questions" : `Show Marked (${markedIds.size})`}
              {markedFilter && <X size={15} className="ml-1" onClick={(e) => { e.stopPropagation(); setMarkedFilter(false); }} />}
            </button>
          )}

          {/* Filtered marked questions */}
          {markedFilter ? (
            <div className="space-y-4">
              {test.questions
                .filter((q) => markedIds.has(q.id))
                .map((q, idx) => (
                  <div key={q.id} className="border border-amber-200 rounded-xl p-1">
                    <QuestionCard
                      question={q}
                      selectedOption={getSelected(q.id)}
                      onSelect={handleSelect}
                      isMarked={true}
                      onToggleMark={handleToggleMark}
                    />
                  </div>
                ))}
            </div>
          ) : (
            currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                selectedOption={getSelected(currentQuestion.id)}
                onSelect={handleSelect}
                isMarked={markedIds.has(currentQuestion.id)}
                onToggleMark={handleToggleMark}
              />
            )
          )}

          {/* Navigation (hidden when marked filter is on) */}
          {!markedFilter && (
            <div className="mt-6 sm:mt-8 flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setCurrentIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentIndex === 0}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft size={16} className="mr-1" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>

              <span className="text-sm text-zinc-500 shrink-0">
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
                  className="flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              ) : (
                <Button className="flex-1 sm:flex-none" onClick={() => setShowConfirm(true)}>
                  <Flag size={16} className="mr-1" />
                  <span className="hidden sm:inline">Finish Test</span>
                  <span className="sm:hidden">Finish</span>
                </Button>
              )}
            </div>
          )}
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

      {/* Mobile palette - slide-over drawer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <button
          onClick={() => setShowMobilePalette(!showMobilePalette)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border-t border-zinc-200 text-sm font-medium text-zinc-700 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <List size={16} />
            Palette ({currentIndex + 1}/{test.questions.length})
            {markedIds.size > 0 && (
              <span className="text-amber-600 text-xs font-semibold">● {markedIds.size}</span>
            )}
          </span>
          {showMobilePalette ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </button>
        {showMobilePalette && (
          <div className="max-h-[50vh] overflow-y-auto bg-white border-t border-zinc-100 px-4 py-3 shadow-lg">
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

      {/* Pause Confirmation Modal */}
      {showPauseConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900">Pause Test?</h3>
            <p className="text-sm text-zinc-600">
              Your progress will be saved. You can resume from exactly where you left off.
            </p>
            <div className="text-sm text-zinc-500 space-y-1">
              <p>Questions answered: {answeredIds.size}/{test.questions.length}</p>
              <p>Time remaining: {timer.formatted}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowPauseConfirm(false)}
                disabled={pausing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={pausing}
                onClick={handlePause}
              >
                Pause
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900">Submit Test?</h3>
            {submitError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{submitError}</span>
                <button
                  onClick={() => setSubmitError(null)}
                  className="ml-auto font-medium underline cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
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

      {/* Thank You Overlay */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">Test Submitted!</h2>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Thank you for completing the test. Your responses have been recorded successfully.
            </p>
            <div className="bg-zinc-50 rounded-xl p-4 space-y-2 text-sm text-zinc-600">
              <p>Questions answered: <span className="font-semibold text-zinc-900">{answeredIds.size}/{test.questions.length}</span></p>
              <p>Time taken: <span className="font-semibold text-zinc-900">{timer.formatted}</span></p>
            </div>
            <p className="text-xs text-zinc-400">
              Redirecting to answer analysis in <span className="font-semibold text-zinc-700">{thankYouCountdown}</span> seconds...
            </p>
            <Button
              className="w-full"
              onClick={() => router.push(`/results/${attemptId}?tab=marked`)}
            >
              View Results Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
