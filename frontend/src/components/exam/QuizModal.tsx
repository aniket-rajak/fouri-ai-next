"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Loader2,
  Brain,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Award,
  Clock,
  Target,
  BookOpen,
  AlertCircle,
  BarChart3,
  Send,
  Coins,
  UserPlus,
  LogIn,
  ChevronDown,
  Lightbulb,
  Star,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { isAnswerCorrect } from "@/lib/quizScoring";
import { ContentRenderer } from "@/components/ui/ContentRenderer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const PROGRESS_STAGES = [
  { threshold: 0, label: "Initializing quiz generator..." },
  { threshold: 10, label: "Analyzing topic context..." },
  { threshold: 25, label: "Generating questions..." },
  { threshold: 50, label: "Verifying question quality..." },
  { threshold: 65, label: "Creating answer keys..." },
  { threshold: 75, label: "Reviewing explanations..." },
  { threshold: 85, label: "Formatting quiz content..." },
  { threshold: 95, label: "Finalizing quiz..." },
];

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface Results {
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
}

type QuizState =
  | "idle"
  | "estimating"
  | "confirm"
  | "generating"
  | "failed"
  | "quiz_active"
  | "submitting"
  | "results";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("quiz_guest_id");
  if (!id) {
    id =
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("quiz_guest_id", id);
  }
  return id;
}

function getFirebaseToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("firebaseToken");
}

const difficultyLevels = [
  { value: "EASY", label: "Easy", desc: "Basic recall & fundamentals" },
  { value: "MEDIUM", label: "Medium", desc: "Application & analysis" },
  { value: "HARD", label: "Hard", desc: "Multi-step & advanced" },
] as const;

export default function QuizModal({ isOpen, onClose }: QuizModalProps) {
  const [state, setState] = useState<QuizState>("idle");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "MEDIUM",
  );
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitEnabled, setSubmitEnabled] = useState(false);
  const [answerAnalysisOpen, setAnswerAnalysisOpen] = useState(false);
  const [savingAnswers, setSavingAnswers] = useState(false);

  // Progress state
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const progressAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Feedback state
  const [fbRating, setFbRating] = useState(0);
  const [fbComment, setFbComment] = useState("");
  const [fbCategory, setFbCategory] = useState("OVERALL_EXPERIENCE");
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbSubmitted, setFbSubmitted] = useState(false);
  const [fbHoveredStar, setFbHoveredStar] = useState(0);

  const feedbackCategories = [
    { value: "OVERALL_EXPERIENCE", label: "Overall Experience" },
    { value: "QUIZ_QUALITY", label: "Quiz Quality" },
    { value: "QUESTION_DIFFICULTY", label: "Question Difficulty" },
    { value: "EXPLANATION_QUALITY", label: "Explanation Quality" },
  ];

  // Generation error state
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [longWait, setLongWait] = useState(false);
  const generateAbortRef = useRef<AbortController | null>(null);
  const longWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Credit estimation state
  const [estimatedCredits, setEstimatedCredits] = useState<number>(0);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [guestQuotaRemaining, setGuestQuotaRemaining] = useState<number | null>(
    null,
  );
  const [isGuest, setIsGuest] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setState("idle");
      setSubject("");
      setTopic("");
      setDifficulty("MEDIUM");
      setQuestions([]);
      setCurrentIndex(0);
      setAnswers({});
      setResults(null);
      setTimeLeft(600);
      setAttemptId(null);
      setSubmitEnabled(false);
      setAnswerAnalysisOpen(false);
      setEstimatedCredits(0);
      setUserCredits(null);
      setGuestQuotaRemaining(null);
      setIsGuest(false);
      setFbRating(0);
      setFbComment("");
      setFbCategory("OVERALL_EXPERIENCE");
      setFbSubmitted(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Submit enable timer — allows submit after 2 min even if not all answered
  useEffect(() => {
    if (state === "quiz_active") {
      const enableTimer = setTimeout(() => setSubmitEnabled(true), 120000);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setSubmitEnabled(true);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        clearTimeout(enableTimer);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (progressAnimRef.current) clearInterval(progressAnimRef.current);
    };
  }, []);

  const handleEstimate = async () => {
    if (!subject.trim() || !topic.trim()) {
      toast.error("Please enter both a subject and a topic.");
      return;
    }
    setState("estimating");
    try {
      const token = getFirebaseToken();
      const guestId = getGuestId();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/quiz/estimate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          subject: subject.trim(),
          topic: topic.trim(),
          difficulty,
          guestId: token ? undefined : guestId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to estimate cost");

      setEstimatedCredits(data.estimatedCredits);
      setUserCredits(data.userCredits);
      setGuestQuotaRemaining(data.guestQuotaRemaining);
      setIsGuest(data.isGuest);
      setState("confirm");
    } catch (err) {
      toast.error("Estimation failed", {
        description:
          err instanceof Error ? err.message : "Something went wrong",
      });
      setState("idle");
    }
  };

  const handleGenerate = async () => {
    setState("generating");
    setGenerationError(null);
    setLongWait(false);
    setProgress(0);
    progressRef.current = 0;
    setGenerationMessage("Initializing quiz generator...");

    if (longWaitTimerRef.current) clearTimeout(longWaitTimerRef.current);
    longWaitTimerRef.current = setTimeout(() => setLongWait(true), 15000);

    // Start smooth progress animation
    progressAnimRef.current = setInterval(() => {
      const current = progressRef.current;
      if (current < 95) {
        const increment = Math.random() * 2 + 0.5;
        const next = Math.min(95, current + increment);
        progressRef.current = next;
        setProgress(next);

        // Update status message at thresholds
        const stage = [...PROGRESS_STAGES]
          .reverse()
          .find((s) => next >= s.threshold);
        if (stage) setGenerationMessage(stage.label);
      }
    }, 350);

    if (generateAbortRef.current) generateAbortRef.current.abort();
    const abortController = new AbortController();
    generateAbortRef.current = abortController;

    // Client-side timeout: 35 seconds
    const timeoutId = setTimeout(() => abortController.abort(), 120000);

    try {
      const token = getFirebaseToken();
      const guestId = getGuestId();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/quiz/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          subject: subject.trim(),
          topic: topic.trim(),
          difficulty,
          guestId: token ? undefined : guestId,
        }),
        signal: abortController.signal,
      });
      const data = await res.json();

      clearTimeout(timeoutId);
      if (longWaitTimerRef.current) clearTimeout(longWaitTimerRef.current);
      if (progressAnimRef.current) clearInterval(progressAnimRef.current);

      if (res.status === 402) {
        toast.error("Insufficient credits", {
          description: `You need ${data.required} credits but have ${data.available}.`,
        });
        setState("idle");
        return;
      }

      if (res.status === 429) {
        toast.error("Daily limit reached", {
          description: data.error,
        });
        setState("idle");
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions were generated. Please try again.");
      }

      // Snap to 100%
      progressRef.current = 100;
      setProgress(100);
      setGenerationMessage("Quiz ready!");

      // Brief pause at 100% then transition
      await new Promise((r) => setTimeout(r, 600));

      setQuestions(data.questions.slice(0, 10));
      setAttemptId(data.attemptId);
      setCurrentIndex(0);
      setAnswers({});
      setResults(null);
      setTimeLeft(600);
      setState("quiz_active");
    } catch (err) {
      clearTimeout(timeoutId);
      if (longWaitTimerRef.current) clearTimeout(longWaitTimerRef.current);
      if (progressAnimRef.current) clearInterval(progressAnimRef.current);

      let message = "Quiz generation failed. Please try again.";
      if ((err as any)?.name === "AbortError") {
        message = "Quiz generation took too long. Please try again.";
      } else if (err instanceof Error) {
        message = err.message;
      }
      setGenerationError(message);
      setState("failed");
    }
  };

  const handleAnswer = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const saveAnswersToServer = useCallback(async () => {
    if (!attemptId || Object.keys(answers).length === 0) return;
    setSavingAnswers(true);
    try {
      const token = getFirebaseToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(`${API}/quiz/attempt/${attemptId}/answers`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ answers }),
      });
    } catch {
      // Silent — will retry on View Full Results if needed
    } finally {
      setSavingAnswers(false);
    }
  }, [attemptId, answers]);

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState("submitting");
    let correct = 0;
    questions.forEach((q, i) => {
      if (isAnswerCorrect(answers[i], q.correctAnswer, q.options)) correct++;
    });
    const total = questions.length;
    const incorrect = total - correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    setResults({ correct, incorrect, total, accuracy });
    // Save answers to server in background
    saveAnswersToServer();
    setTimeout(() => setState("results"), 400);
  }, [questions, answers, saveAnswersToServer]);

  const handleSubmitFeedback = async () => {
    if (fbRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setFbSubmitting(true);
    try {
      const token = getFirebaseToken();
      const guestId = getGuestId();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/quiz/feedback`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          quizAttemptId: attemptId,
          rating: fbRating,
          comment: fbComment.trim() || undefined,
          category: fbCategory,
          userId: undefined,
          guestId: token ? undefined : guestId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          toast.info("You already submitted feedback for this quiz");
          setFbSubmitted(true);
          return;
        }
        throw new Error(data.error || "Failed to submit feedback");
      }

      toast.success("Thank you for your feedback!");
      setFbSubmitted(true);
    } catch (err) {
      toast.error("Failed to submit feedback", {
        description:
          err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setFbSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getFeedback = () => {
    if (!results) return "";
    const p = results.accuracy;
    const t = topic;
    if (p >= 90)
      return `Excellent work on "${t}"! You have a strong understanding of the topic. Keep it up.`;
    if (p >= 70)
      return `Good effort on "${t}"! Review the questions you missed to strengthen your understanding.`;
    if (p >= 50)
      return `Fair attempt on "${t}". Focus on the core concepts to improve your score.`;
    return `Keep practicing "${t}". We recommend revisiting the fundamentals and trying again.`;
  };

  if (!isOpen) return null;

  const answeredCount = Object.keys(answers).length;
  const allAnswered =
    answeredCount === questions.length && questions.length > 0;

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              if (
                e.target === e.currentTarget &&
                (state === "idle" || state === "results")
              )
                onClose();
            }}
          >
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111118] border border-white/[0.06] rounded-2xl shadow-2xl"
            >
              {/* Close button — only visible in idle/results */}
              {(state === "idle" ||
                state === "results" ||
                state === "confirm") && (
                <button
                  onClick={() => {
                    if (state === "confirm") setState("idle");
                    else onClose();
                  }}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-[#888899]" />
                </button>
              )}

              {/* ═══ IDLE STATE ═══ */}
              {state === "idle" && (
                <div className="p-6 sm:p-8">
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3D81E3] to-[#00D2FF] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                      <Brain className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold font-heading text-[#f5f5f7]">
                      AI Quiz Generator
                    </h2>
                    <p className="mt-2 text-sm text-[#888899]">
                      Generate a 10-question MCQ quiz with a 10-minute timer.
                      Credit cost varies by difficulty and topic length.
                    </p>
                  </div>

                  <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm leading-relaxed text-blue-200">
                      FOURI AI creates a mock test based on your selected Subject, Topic, and Difficulty Level.
                      Please enter accurate Subject and Topic names with correct spelling to ensure the most
                      relevant and high-quality quiz.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[#888899] mb-1.5 font-medium">
                        Subject <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Physics, Chemistry, Mathematics"
                        className="w-full h-11 px-4 rounded-xl bg-[#08080f] border border-white/[0.05] text-sm text-[#f5f5f7] placeholder-[#555566] focus:outline-none focus:border-[#3D81E3]/50 focus:ring-1 focus:ring-[#3D81E3]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#888899] mb-1.5 font-medium">
                        Topic <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Thermodynamics, Organic Chemistry, Calculus"
                        className="w-full h-11 px-4 rounded-xl bg-[#08080f] border border-white/[0.05] text-sm text-[#f5f5f7] placeholder-[#555566] focus:outline-none focus:border-[#3D81E3]/50 focus:ring-1 focus:ring-[#3D81E3]/20 transition-all"
                      />
                    </div>

                    {/* Difficulty selector */}
                    <div>
                      <label className="block text-xs text-[#888899] mb-1.5 font-medium">
                        Difficulty Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {difficultyLevels.map((d) => (
                          <button
                            key={d.value}
                            onClick={() =>
                              setDifficulty(
                                d.value as "EASY" | "MEDIUM" | "HARD",
                              )
                            }
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              difficulty === d.value
                                ? "border-[#3D81E3]/50 bg-[#3D81E3]/10"
                                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                            }`}
                          >
                            <div className="text-sm font-semibold text-[#f5f5f7]">
                              {d.label}
                            </div>
                            <div className="text-[10px] text-[#888899] mt-0.5">
                              {d.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleEstimate}
                      className="group relative flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-semibold text-white overflow-hidden cursor-pointer"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] transition-transform duration-300 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                      <span className="relative flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Continue
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ ESTIMATING STATE ═══ */}
              {state === "estimating" && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3D81E3] to-[#00D2FF] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#f5f5f7] mb-2">
                    Estimating Credit Cost
                  </h3>
                  <p className="text-sm text-[#888899]">
                    Calculating AI resource requirements...
                  </p>
                </div>
              )}

              {/* ═══ CONFIRM STATE ═══ */}
              {state === "confirm" && (
                <div className="p-6 sm:p-8">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                      <Coins className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-xl font-bold font-heading text-[#f5f5f7]">
                      Quiz Generation Summary
                    </h2>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888899]">Subject</span>
                      <span className="text-[#f5f5f7] font-medium">
                        {subject}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888899]">Topic</span>
                      <span className="text-[#f5f5f7] font-medium">
                        {topic}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888899]">Difficulty</span>
                      <span className="text-[#f5f5f7] font-medium capitalize">
                        {difficulty.toLowerCase()}
                      </span>
                    </div>
                    <div className="border-t border-white/[0.06] my-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888899]">
                        Estimated Credit Cost
                      </span>
                      <span className="text-amber-400 font-bold">
                        {estimatedCredits} credit
                        {estimatedCredits !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {userCredits !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#888899]">
                          Available Credits
                        </span>
                        <span className="text-[#f5f5f7] font-medium">
                          {userCredits}
                        </span>
                      </div>
                    )}
                    {userCredits !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#888899]">Balance After</span>
                        <span
                          className={`font-medium ${userCredits - estimatedCredits >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {userCredits - estimatedCredits}
                        </span>
                      </div>
                    )}
                    {guestQuotaRemaining !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#888899]">Daily Free Quota</span>
                        <span className="text-[#f5f5f7] font-medium">
                          {guestQuotaRemaining} remaining
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-[#555566] mb-6 text-center">
                    Final cost deducted will be based on actual AI usage, which
                    may be lower than the estimate.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setState("idle")}
                      className="flex-1 h-11 rounded-xl text-sm font-medium text-[#888899] border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={
                        (userCredits !== null &&
                          userCredits - estimatedCredits < 0) ||
                        (guestQuotaRemaining !== null &&
                          guestQuotaRemaining <= 0)
                      }
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Quiz
                    </button>
                  </div>

                  {/* Guest limit reached message */}
                  {guestQuotaRemaining !== null && guestQuotaRemaining <= 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <p className="text-sm text-amber-300 font-medium mb-3">
                        Daily free quiz limit reached
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Link
                          href="/register"
                          onClick={onClose}
                          className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] hover:opacity-90 transition-all"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Sign Up
                        </Link>
                        <Link
                          href="/login"
                          onClick={onClose}
                          className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-medium text-[#f5f5f7] border border-white/[0.1] hover:bg-white/[0.05] transition-all"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Log In
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ GENERATING STATE ═══ */}
              {state === "generating" && (
                <div className="p-10 sm:p-14 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3D81E3] to-[#00D2FF] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                    {progress < 100 ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[#f5f5f7] mb-1">
                    {progress < 100 ? "Generating Your Quiz" : "Quiz Ready!"}
                  </h3>
                  <p className="text-sm text-[#888899] mb-6">
                    {generationMessage}
                  </p>
                  <div className="max-w-xs mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#555566]">Progress</span>
                      <span className="text-sm font-bold text-[#3D81E3]">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <m.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] rounded-full"
                      />
                    </div>
                    {longWait && progress < 95 ? (
                      <p className="text-xs text-amber-400 mt-4">
                        This is taking longer than usual. Please wait &mdash; we&rsquo;re still working on it.
                      </p>
                    ) : (
                      <p className="text-xs text-[#555566] mt-4">
                        {progress < 100
                          ? "Please wait while AI generates your quiz..."
                          : "Opening your quiz..."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ FAILED STATE ═══ */}
              {state === "failed" && (
                <div className="p-10 sm:p-14 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#f5f5f7] mb-2">Generation Failed</h3>
                  <p className="text-sm text-[#888899] mb-6 max-w-sm mx-auto">
                    {generationError || "Failed to generate quiz. Please try again."}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setState("idle")}
                      className="px-6 h-11 rounded-xl text-sm font-medium text-[#888899] border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="px-6 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] hover:opacity-90 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" /> Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ QUIZ ACTIVE STATE ═══ */}
              {state === "quiz_active" && questions.length > 0 && (
                <div>
                  <div className="sticky top-0 z-10 bg-[#111118] border-b border-white/[0.04] px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#3D81E3]" />
                      <span className="text-xs text-[#888899]">Quiz</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[#555566]">
                        {answeredCount}/{questions.length} answered
                      </span>
                      <div
                        className={`flex items-center gap-1.5 font-mono text-sm font-bold ${
                          timeLeft < 30
                            ? "text-red-400"
                            : timeLeft < 60
                              ? "text-amber-400"
                              : "text-[#f5f5f7]"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-semibold text-[#00D2FF] bg-[#00D2FF]/10 px-2.5 py-1 rounded-full">
                        Question {currentIndex + 1} of {questions.length}
                      </span>
                      {answers[currentIndex] && (
                        <span className="text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
                          Answered
                        </span>
                      )}
                    </div>

                    <div className="text-base sm:text-lg text-[#f5f5f7] leading-relaxed mb-6 font-medium">
                      <ContentRenderer text={questions[currentIndex].questionText} />
                    </div>

                    <div className="space-y-3">
                      {questions[currentIndex].options.map((option, oi) => {
                        const isSelected = answers[currentIndex] === option;
                        return (
                          <button
                            key={oi}
                            onClick={() => handleAnswer(option)}
                            className={`w-full text-left p-4 rounded-xl border text-sm transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "border-[#3D81E3]/50 bg-[#3D81E3]/10 text-[#f5f5f7]"
                                : "border-white/[0.06] bg-white/[0.02] text-[#c0c0c0] hover:border-white/[0.12] hover:bg-white/[0.04]"
                            }`}
                          >
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            <ContentRenderer text={option} />
                          </button>
                        );
                      })}
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-8 pt-4 border-t border-white/[0.04] gap-3 sm:gap-0">
                      {/* Mobile row: Previous + Next side-by-side (Q1-Q9) / Previous alone (Q10) */}
                      <div className="flex sm:hidden items-stretch gap-2">
                        <button
                          onClick={() =>
                            setCurrentIndex((i) => Math.max(0, i - 1))
                          }
                          disabled={currentIndex === 0}
                          className="flex-1 flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium text-[#888899] hover:text-[#f5f5f7] hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        {currentIndex < questions.length - 1 && (
                          <button
                            onClick={() =>
                              setCurrentIndex((i) =>
                                Math.min(questions.length - 1, i + 1),
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium text-[#f5f5f7] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all cursor-pointer"
                          >
                            Next <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Desktop: Previous + dots */}
                      <div className="hidden sm:flex items-center gap-2 flex-1">
                        <button
                          onClick={() =>
                            setCurrentIndex((i) => Math.max(0, i - 1))
                          }
                          disabled={currentIndex === 0}
                          className="flex-none flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium text-[#888899] hover:text-[#f5f5f7] hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                                  ? "bg-[#3D81E3] text-white scale-110"
                                  : answers[qi]
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-white/[0.04] text-[#555566] border border-white/[0.06] hover:bg-white/[0.08]"
                              }`}
                            >
                              {qi + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {currentIndex < questions.length - 1 ? (
                        <button
                          onClick={() =>
                            setCurrentIndex((i) =>
                              Math.min(questions.length - 1, i + 1),
                            )
                          }
                          className="hidden sm:flex flex-none items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium text-[#f5f5f7] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all cursor-pointer"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmit}
                          disabled={!submitEnabled}
                          className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {submitEnabled
                            ? allAnswered
                              ? "Submit Quiz"
                              : `Submit (${answeredCount}/${questions.length})`
                            : `Submit ${Math.ceil((120 - (600 - timeLeft)) / 60)}:${String((120 - (600 - timeLeft)) % 60).padStart(2, "0")}`}
                        </button>
                      )}
                    </div>

                    {/* Mobile dot pagination */}
                    <div className="flex sm:hidden items-center justify-center gap-1.5 mt-3">
                      {questions.map((_, qi) => (
                        <button
                          key={qi}
                          onClick={() => setCurrentIndex(qi)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            qi === currentIndex
                              ? "bg-[#3D81E3] w-4"
                              : answers[qi]
                                ? "bg-green-400"
                                : "bg-white/[0.12]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ SUBMITTING STATE ═══ */}
              {state === "submitting" && (
                <div className="p-12 text-center">
                  <Loader2 className="w-10 h-10 text-[#3D81E3] animate-spin mx-auto mb-4" />
                  <p className="text-sm text-[#888899]">
                    Evaluating your answers...
                  </p>
                </div>
              )}

              {/* ═══ RESULTS STATE ═══ */}
              {state === "results" && results && (
                <div className="p-6 sm:p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3D81E3] to-[#00D2FF] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold font-heading text-[#f5f5f7]">
                      Quiz Complete!
                    </h2>
                    <p className="mt-1 text-sm text-[#888899]">
                      Thank you for taking the quiz.
                    </p>
                  </div>

                  <div className="text-center mb-8">
                    <div className="text-5xl sm:text-6xl font-bold font-heading text-gradient">
                      {results.correct}/{results.total}
                    </div>
                    <p className="mt-2 text-sm text-[#888899]">
                      Correct Answers
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 text-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-green-400">
                        {results.correct}
                      </div>
                      <div className="text-[10px] text-[#888899]">Correct</div>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
                      <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-red-400">
                        {results.incorrect}
                      </div>
                      <div className="text-[10px] text-[#888899]">
                        Incorrect
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
                      <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-blue-400">
                        {results.accuracy}%
                      </div>
                      <div className="text-[10px] text-[#888899]">Accuracy</div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-center justify-between text-xs text-[#888899] mb-2">
                      <span>Accuracy</span>
                      <span>{results.accuracy}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${results.accuracy}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          results.accuracy >= 70
                            ? "bg-green-500"
                            : results.accuracy >= 50
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#3D81E3]/5 border border-[#3D81E3]/10 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#3D81E3]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Target className="w-4 h-4 text-[#3D81E3]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#f5f5f7] mb-1">
                          Personalized Feedback
                        </h4>
                        <p className="text-sm text-[#c0c0c0] leading-relaxed">
                          {getFeedback()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ═══ ANSWER ANALYSIS ═══ */}
                  {questions.length > 0 && (
                    <div className="mb-8">
                      <button
                        onClick={() =>
                          setAnswerAnalysisOpen(!answerAnalysisOpen)
                        }
                        className="flex items-center justify-between w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer"
                      >
                        <span className="text-sm font-semibold text-[#f5f5f7]">
                          Detailed Answer Analysis
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#888899] transition-transform ${answerAnalysisOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence>
                        {answerAnalysisOpen && (
                          <m.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 mt-3">
                              {questions.map((q, qi) => {
                                const userAns = answers[qi];
                                const correct = isAnswerCorrect(
                                  userAns,
                                  q.correctAnswer,
                                  q.options,
                                );
                                const status = !userAns?.trim()
                                  ? "unanswered"
                                  : correct
                                    ? "correct"
                                    : "incorrect";
                                return (
                                  <div
                                    key={qi}
                                    className={`p-4 rounded-xl border ${
                                      status === "correct"
                                        ? "bg-green-500/5 border-green-500/15"
                                        : status === "incorrect"
                                          ? "bg-red-500/5 border-red-500/15"
                                          : "bg-white/[0.02] border-white/[0.06]"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="mt-0.5 shrink-0">
                                        {status === "correct" ? (
                                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                                        ) : status === "incorrect" ? (
                                          <XCircle className="w-4 h-4 text-red-400" />
                                        ) : (
                                          <AlertCircle className="w-4 h-4 text-[#888899]" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm text-[#f5f5f7] mb-2 font-medium">
                                          <span className="text-xs text-[#555566] mr-1.5">
                                            Q{qi + 1}.
                                          </span>
                                          <ContentRenderer text={q.questionText} />
                                        </div>
                                        <div className="space-y-2">
                                          {status !== "unanswered" && (
                                            <div className="flex items-center gap-2 text-xs">
                                              <span className="text-[#888899]">
                                                Your answer:
                                              </span>
                                              <span
                                                className={`font-medium ${status === "correct" ? "text-green-400" : "text-red-400"}`}
                                              >
                                                <ContentRenderer text={userAns} />
                                              </span>
                                              <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                  status === "correct"
                                                    ? "bg-green-500/10 text-green-400"
                                                    : "bg-red-500/10 text-red-400"
                                                }`}
                                              >
                                                {status === "correct"
                                                  ? "Correct"
                                                  : "Incorrect"}
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2 text-xs">
                                            <span className="text-[#888899]">
                                              Correct answer:
                                            </span>
                                            <span className="font-medium text-green-400">
                                              <ContentRenderer text={q.correctAnswer} />
                                            </span>
                                            <span className="text-green-500">
                                              ✓
                                            </span>
                                          </div>
                                          {status === "unanswered" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.04] text-[#888899]">
                                              Not answered
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </m.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* ═══ RATING & REVIEW ═══ */}
                  {attemptId && (
                    <div className="mb-8">
                      {!fbSubmitted ? (
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <h4 className="text-sm font-semibold text-[#f5f5f7] mb-1">
                            Rate Your Experience
                          </h4>
                          <p className="text-xs text-[#888899] mb-4">
                            Help us improve by sharing your feedback.
                          </p>

                          {/* Stars */}
                          <div className="flex items-center gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setFbRating(star)}
                                onMouseEnter={() => setFbHoveredStar(star)}
                                onMouseLeave={() => setFbHoveredStar(0)}
                                className="p-1 transition-all cursor-pointer"
                                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                              >
                                <Star
                                  className={`w-6 h-6 transition-all ${
                                    star <= (fbHoveredStar || fbRating)
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-white/[0.1]"
                                  }`}
                                />
                              </button>
                            ))}
                            {fbRating > 0 && (
                              <span className="ml-1 text-xs text-[#888899]">
                                {fbRating === 5
                                  ? "Excellent!"
                                  : fbRating === 4
                                    ? "Great"
                                    : fbRating === 3
                                      ? "Good"
                                      : fbRating === 2
                                        ? "Fair"
                                        : "Poor"}
                              </span>
                            )}
                          </div>

                          {/* Category */}
                          <div className="mb-3">
                            <p className="text-[11px] font-medium text-[#888899] mb-1.5">
                              Category
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {feedbackCategories.map((c) => (
                                <button
                                  key={c.value}
                                  onClick={() => setFbCategory(c.value)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                                    fbCategory === c.value
                                      ? "border-[#3D81E3]/50 bg-[#3D81E3]/10 text-[#3D81E3]"
                                      : "border-white/[0.06] text-[#888899] hover:border-white/[0.12]"
                                  }`}
                                >
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Comment */}
                          <textarea
                            value={fbComment}
                            onChange={(e) => setFbComment(e.target.value)}
                            placeholder="Share your thoughts (optional)..."
                            rows={2}
                            maxLength={1000}
                            className="w-full p-3 rounded-xl bg-[#08080f] border border-white/[0.06] text-sm text-[#f5f5f7] placeholder-[#555566] focus:outline-none focus:border-[#3D81E3]/50 focus:ring-1 focus:ring-[#3D81E3]/20 resize-none transition-all mb-3"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#555566]">
                              {fbComment.length}/1000
                            </span>
                            <button
                              onClick={handleSubmitFeedback}
                              disabled={fbSubmitting || fbRating === 0}
                              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                              {fbSubmitting ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" /> Submit
                                  Feedback
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/10 text-center">
                          <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-green-400">
                            Thank You!
                          </p>
                          <p className="text-xs text-[#888899] mt-1">
                            Your feedback has been submitted.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    {attemptId && (
                      <button
                        onClick={async () => {
                          await saveAnswersToServer();
                          onClose();
                          window.location.href = `/ai-quiz/thank-you/${attemptId}`;
                        }}
                        disabled={savingAnswers}
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                      >
                        {savingAnswers ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Saving...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 h-4" /> View Full Results
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setState("idle");
                        setQuestions([]);
                        setAnswers({});
                        setResults(null);
                        setTimeLeft(600);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#3D81E3] to-[#00D2FF] hover:opacity-90 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Try Another Quiz
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-[#f5f5f7] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      Back to Page
                    </button>
                  </div>
                </div>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
