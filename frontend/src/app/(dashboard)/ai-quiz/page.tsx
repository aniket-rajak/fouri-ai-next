"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Brain, Sparkles, Coins, Clock, BarChart3, Loader2,
  ChevronRight, Target, Zap, UserPlus, Search, ArrowUpDown,
  Trash2, Pin, PinOff, RotateCcw, Star, ChevronLeft, ChevronRight as ChevronRightIcon,
  AlertCircle, CheckCircle2, XCircle, Filter, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface QuizAttempt {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  score: number | null;
  totalQuestions: number;
  creditsCost: number | null;
  status: string;
  pinned: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

const difficultyLevels = [
  { value: "EASY", label: "Easy", desc: "Basic recall" },
  { value: "MEDIUM", label: "Medium", desc: "Application" },
  { value: "HARD", label: "Hard", desc: "Advanced" },
] as const;

function QuizForm({ onGenerated }: { onGenerated: (attemptId: string) => void }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [estimating, setEstimating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [estimate, setEstimate] = useState<{
    estimatedCredits: number;
    userCredits: number | null;
    guestQuotaRemaining: number | null;
    isGuest: boolean;
  } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Progress animation
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const progressAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setEstimating(true);
    try {
      const token = user ? localStorage.getItem("firebaseToken") : null;
      const guestId = getGuestId();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
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
      if (!res.ok) throw new Error(data.error || "Failed to estimate");

      setEstimate(data);
      setShowConfirm(true);
    } catch (err) {
      toast.error("Estimation failed", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setEstimating(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setShowConfirm(false);
    setProgress(0);
    progressRef.current = 0;

    // Start smooth progress animation
    progressAnimRef.current = setInterval(() => {
      const current = progressRef.current;
      if (current < 95) {
        const increment = Math.random() * 2 + 0.5;
        const next = Math.min(95, current + increment);
        progressRef.current = next;
        setProgress(next);
      }
    }, 350);

    try {
      const token = user ? localStorage.getItem("firebaseToken") : null;
      const guestId = getGuestId();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
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
      });
      const data = await res.json();

      if (progressAnimRef.current) clearInterval(progressAnimRef.current);

      if (res.status === 402) {
        toast.error("Insufficient credits", { description: `Need ${data.required} credits, have ${data.available}.` });
        setGenerating(false);
        return;
      }
      if (res.status === 429) {
        toast.error("Daily limit reached", { description: data.error });
        setGenerating(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      // Snap to 100%
      progressRef.current = 100;
      setProgress(100);

      // Brief pause then redirect
      await new Promise(r => setTimeout(r, 600));
      onGenerated(data.attemptId);
    } catch (err) {
      if (progressAnimRef.current) clearInterval(progressAnimRef.current);
      toast.error("Generation failed", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
      setGenerating(false);
    }
  };

  const statusLabel =
    progress < 25 ? "Generating questions..." :
    progress < 50 ? "Creating answer keys..." :
    progress < 75 ? "Reviewing explanations..." :
    progress < 95 ? "Finalizing quiz..." :
    progress < 100 ? "Almost done..." : "Quiz ready!";

  return (
    <>
      {generating ? (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl bg-white border border-zinc-200 p-10 sm:p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
            {progress < 100 ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-white" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-1">
            {progress < 100 ? "Generating Your Quiz" : "Quiz Ready!"}
          </h3>
          <p className="text-sm text-zinc-500 mb-6">{statusLabel}</p>
          <div className="max-w-xs mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">Progress</span>
              <span className="text-sm font-bold text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <m.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
              />
            </div>
            <p className="text-xs text-zinc-400 mt-4">
              {progress < 100
                ? "Please wait while AI generates your quiz..."
                : "Redirecting to your quiz..."}
            </p>
          </div>
        </m.div>
      ) : (
        <>
          <div className="rounded-2xl bg-white border border-zinc-200 p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Physics, Chemistry"
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Topic</label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Thermodynamics"
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {difficultyLevels.map((d) => (
                  <button key={d.value} onClick={() => setDifficulty(d.value as "EASY" | "MEDIUM" | "HARD")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${difficulty === d.value ? "border-blue-500/50 bg-blue-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                    <div className="text-sm font-semibold text-zinc-900">{d.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleEstimate} disabled={estimating}
              className="mt-6 flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
              {estimating ? <><Loader2 className="w-4 h-4 animate-spin" /> Estimating...</>
                : <><Sparkles className="w-4 h-4" /> Generate Quiz</>}
            </button>
          </div>

          {/* Confirmation dialog */}
          {showConfirm && estimate && (
            <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white border border-zinc-200 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Quiz Summary</h3>
                  <p className="text-xs text-zinc-500">{subject} &middot; {topic} &middot; {difficulty.toLowerCase()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-zinc-50">
                  <span className="text-zinc-500">Est. Cost</span>
                  <p className="font-bold text-amber-600">{estimate.estimatedCredits} credit{estimate.estimatedCredits !== 1 ? "s" : ""}</p>
                </div>
                {estimate.userCredits !== null && (
                  <div className="p-3 rounded-xl bg-zinc-50">
                    <span className="text-zinc-500">Balance After</span>
                    <p className="font-bold text-zinc-900">{estimate.userCredits - estimate.estimatedCredits}</p>
                  </div>
                )}
                {estimate.guestQuotaRemaining !== null && (
                  <div className="p-3 rounded-xl bg-zinc-50">
                    <span className="text-zinc-500">Free Quota Left</span>
                    <p className="font-bold text-zinc-900">{estimate.guestQuotaRemaining} / 1</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-400">Final cost based on actual AI usage. May be lower.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 h-11 rounded-xl text-sm font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-all cursor-pointer">Cancel</button>
                <button onClick={handleGenerate}
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                  <Sparkles className="w-4 h-4" /> Generate Quiz
                </button>
              </div>
              {estimate.guestQuotaRemaining !== null && estimate.guestQuotaRemaining <= 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-sm text-amber-800 font-medium mb-2">Daily free quiz limit reached</p>
                  <div className="flex gap-2 justify-center">
                      <Link href="/register"
                      className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all">
                      <UserPlus className="w-3.5 h-3.5" /> Sign Up</Link>
                    <Link href="/login"
                      className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-all">
                      Log In</Link>
                  </div>
                </div>
              )}
            </m.div>
          )}
        </>
      )}
    </>
  );
}

function HistorySection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 10;
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when search changes
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["quiz-history", user?.uid, page, sort, debouncedSearch],
    queryFn: async () => {
      const token = localStorage.getItem("firebaseToken");
      const guestId = getGuestId();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (!token) params.set("guestId", guestId);
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sort", sort);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`${API}/quiz/history?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 30000,
    placeholderData: (prev: any) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("firebaseToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/quiz/attempt/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quiz-history"] }),
    onError: () => toast.error("Failed to delete quiz"),
  });

  const pinMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("firebaseToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/quiz/attempt/${id}/pin`, { method: "PATCH", headers });
      if (!res.ok) throw new Error("Failed to pin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-history"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-pinned"] });
    },
    onError: () => toast.error("Failed to update pin"),
  });

  const attempts: QuizAttempt[] = data?.attempts || [];
  const pagination: Pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const handleReAttempt = (item: QuizAttempt) => {
    toast.info("Generating a new quiz on the same topic...");
    // This will redirect to the form — user can reuse same subject/topic
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">Recent Quizzes</h2>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject or topic..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" />
        </div>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-xl border border-zinc-200 text-sm text-zinc-600 bg-white focus:outline-none focus:border-blue-500 cursor-pointer w-full sm:w-auto">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="score_desc">Score ↓</option>
          <option value="score_asc">Score ↑</option>
          <option value="difficulty">Difficulty</option>
          <option value="subject_asc">Subject A-Z</option>
          <option value="subject_desc">Subject Z-A</option>
          <option value="topic_asc">Topic A-Z</option>
          <option value="topic_desc">Topic Z-A</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border border-zinc-200">
          <Brain className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            {debouncedSearch ? "No quizzes match your search." : "No quizzes yet. Generate your first quiz above!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attempts.map((item) => (
            <div key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all group">
              <Link href={`/ai-quiz/thank-you/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{item.subject} &mdash; {item.topic}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-zinc-500 capitalize">{item.difficulty.toLowerCase()}</span>
                    {item.score !== null && (
                      <span className="text-xs text-zinc-500">Score: {item.score}/{item.totalQuestions}</span>
                    )}
                    <span className="text-xs text-zinc-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto ml-auto sm:ml-0">
                <button onClick={() => pinMutation.mutate(item.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 transition-all cursor-pointer"
                  title={item.pinned ? "Unpin" : "Pin"}>
                  {item.pinned ? <PinOff className="w-4 h-4 text-amber-500" /> : <Pin className="w-4 h-4 text-zinc-400" />}
                </button>
                <Link href={`/ai-quiz?subject=${item.subject}&topic=${item.topic}&difficulty=${item.difficulty}`}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 transition-all"
                  title="Re-attempt">
                  <RotateCcw className="w-4 h-4 text-zinc-400" />
                </Link>
                {deleteConfirm === item.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { deleteMutation.mutate(item.id); setDeleteConfirm(null); }}
                      className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-all cursor-pointer" title="Confirm">
                      <CheckCircle2 className="w-4 h-4 text-red-500" />
                    </button>
                    <button onClick={() => setDeleteConfirm(null)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 transition-all cursor-pointer">
                      <XCircle className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-all cursor-pointer" title="Delete">
                    <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-500" />
                  </button>
                )}
                <ChevronRightIcon className="w-4 h-4 text-zinc-300 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-zinc-600" />
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, pagination.totalPages - 4));
            const p = start + i;
            if (p > pagination.totalPages) return null;
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  p === page ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}>{p}</button>
            );
          })}
          <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
            className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
          </button>
        </div>
      )}
    </div>
  );
}

function PinnedSection() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const limit = 5;

  const { data, isLoading } = useQuery({
    queryKey: ["quiz-pinned", user?.uid, page, search],
    queryFn: async () => {
      const token = localStorage.getItem("firebaseToken");
      const guestId = getGuestId();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (!token) params.set("guestId", guestId);
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("pinned", "true");
      if (search) params.set("search", search);

      const res = await fetch(`${API}/quiz/history?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 30000,
    placeholderData: (prev: any) => prev,
  });

  const pinMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("firebaseToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/quiz/attempt/${id}/pin`, { method: "PATCH", headers });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-pinned"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-history"] });
    },
  });

  const attempts: QuizAttempt[] = data?.attempts || [];
  const pagination: Pagination = data?.pagination || { page: 1, limit, total: 0, totalPages: 0 };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">
        Pinned Quizzes
        {!isLoading && pagination.total > 0 && (
          <span className="ml-2 text-sm font-normal text-zinc-400">({pagination.total})</span>
        )}
      </h2>

      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search pinned quizzes..."
        className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all mb-4"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "12px center", paddingLeft: "36px" }}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-white border border-zinc-200">
          <Pin className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Pin quizzes for quick access</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attempts.map((item) => (
            <div key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-white border border-zinc-200 hover:border-amber-200 transition-all group">
              <Link href={`/ai-quiz/thank-you/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                  <Pin className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{item.subject} &mdash; {item.topic}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-zinc-500 capitalize">{item.difficulty.toLowerCase()}</span>
                    {item.score !== null && (
                      <span className="text-xs text-zinc-500">Score: {item.score}/{item.totalQuestions}</span>
                    )}
                  </div>
                </div>
              </Link>
              <button onClick={() => pinMutation.mutate(item.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-amber-50 transition-all cursor-pointer self-end sm:self-auto ml-auto sm:ml-0" title="Unpin">
                <PinOff className="w-4 h-4 text-amber-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
          </button>
          <span className="text-xs text-zinc-500">Page {page} of {pagination.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
            className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            <ChevronRightIcon className="w-3.5 h-3.5 text-zinc-600" />
          </button>
        </div>
      )}
    </div>
  );
}

function RatingsTab() {
  const [stats, setStats] = useState<{
    averageRating: number;
    totalRatings: number;
    reviewsCount: number;
    distribution: number[];
  } | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch(`${API}/quiz/feedback/stats`),
        fetch(`${API}/quiz/feedback/list?page=${page}&limit=10&sort=${sort}&search=${encodeURIComponent(search)}&minRating=${minRating}`),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (listRes.ok) {
        const data = await listRes.json();
        setFeedbacks(data.feedbacks || []);
        setPagination(data.pagination);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, minRating]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">AI Quiz Ratings & Reviews</h2>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white border border-zinc-200 text-center">
            <div className="text-2xl font-bold text-amber-500">{stats.averageRating}</div>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-3 h-3 ${s <= Math.round(stats.averageRating) ? "text-amber-400 fill-amber-400" : "text-zinc-200"}`} />
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Average Rating</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-zinc-200 text-center">
            <div className="text-2xl font-bold text-zinc-900">{stats.totalRatings}</div>
            <p className="text-[10px] text-zinc-500 mt-2">Total Ratings</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-zinc-200 text-center">
            <div className="text-2xl font-bold text-zinc-900">{stats.reviewsCount}</div>
            <p className="text-[10px] text-zinc-500 mt-2">Reviews</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-zinc-200">
            <p className="text-[10px] text-zinc-500 mb-1">Distribution</p>
            {stats.distribution.map((count, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px]">
                <span className="text-zinc-400 w-3">{i + 1}</span>
                <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{
                    width: stats.totalRatings > 0 ? `${(count / stats.totalRatings) * 100}%` : "0%"
                  }} />
                </div>
                <span className="text-zinc-500 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search reviews..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" />
        </div>
        <div className="relative">
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="h-10 px-3 pr-10 rounded-xl border border-zinc-200 text-sm text-zinc-600 bg-white focus:outline-none focus:border-blue-500 cursor-pointer appearance-none">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={minRating} onChange={(e) => { setMinRating(Number(e.target.value)); setPage(1); }}
            className="h-10 px-3 pr-10 rounded-xl border border-zinc-200 text-sm text-zinc-600 bg-white focus:outline-none focus:border-blue-500 cursor-pointer appearance-none">
            <option value={0}>All Ratings</option>
            <option value={5}>5 Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={3}>3+ Stars</option>
            <option value={2}>2+ Stars</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border border-zinc-200">
          <Star className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No reviews yet. Be the first to rate a quiz!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb: any) => (
            <div key={fb.id} className="p-4 rounded-xl bg-white border border-zinc-200">
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= fb.rating ? "text-amber-400 fill-amber-400" : "text-zinc-200"}`} />
                ))}
                <span className="ml-2 text-xs text-zinc-400">{fb.rating}/5</span>
              </div>
              {fb.comment && (
                <p className="text-sm text-zinc-600 mb-2">&ldquo;{fb.comment}&rdquo;</p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap gap-y-1">
                {fb.reviewerAvatar ? (
                  <img src={fb.reviewerAvatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-zinc-500">
                      {fb.reviewerName === "Anonymous" ? "A" : fb.reviewerName?.charAt(0).toUpperCase() || "A"}
                    </span>
                  </div>
                )}
                <span className="font-medium text-zinc-700">{fb.reviewerName}</span>
                <span>&middot;</span>
                <span className="text-blue-500">{fb.subject}</span>
                <span>&middot;</span>
                <span className="capitalize">{fb.difficulty?.toLowerCase()}</span>
                <span>&middot;</span>
                <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 disabled:opacity-30 cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-zinc-600" />
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, pagination.totalPages - 4));
            const p = start + i;
            if (p > pagination.totalPages) return null;
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  p === page ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}>{p}</button>
            );
          })}
          <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
            className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 disabled:opacity-30 cursor-pointer">
            <ChevronRightIcon className="w-4 h-4 text-zinc-600" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AIQuizPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"generate" | "ratings">("generate");

  const handleGenerated = (attemptId: string) => {
    router.push(`/ai-quiz/take/${attemptId}`);
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">AI Quiz Generator</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Generate AI-powered mock tests on any subject and topic
          </p>
        </div>

        {/* Credit/Guest info banner */}
        {user && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-zinc-200">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Coins className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Credits Available</p>
              <p className="text-xs text-zinc-500">Credit cost varies by difficulty (2&ndash;4 credits per quiz)</p>
            </div>
          </div>
        )}

        {!user && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Guest Mode &mdash; 1 Free Quiz Per Day</p>
              <p className="text-xs text-amber-700">
                <Link href="/register" className="underline font-medium">Sign up</Link> or <Link href="/login" className="underline font-medium">log in</Link> for unlimited quizzes.
              </p>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex items-center gap-1 border-b border-zinc-200 pb-1">
          <button onClick={() => setActiveTab("generate")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all cursor-pointer ${
              activeTab === "generate" ? "text-zinc-900 bg-white border border-b-white border-zinc-200 -mb-[1.5px]" : "text-zinc-500 hover:text-zinc-700"
            }`}>
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />Generate
          </button>
          <button onClick={() => setActiveTab("ratings")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all cursor-pointer ${
              activeTab === "ratings" ? "text-zinc-900 bg-white border border-b-white border-zinc-200 -mb-[1.5px]" : "text-zinc-500 hover:text-zinc-700"
            }`}>
            <Star className="w-3.5 h-3.5 inline mr-1.5" />Ratings
          </button>
        </div>

        {activeTab === "generate" ? (
          <>
            <QuizForm onGenerated={handleGenerated} />
            <HistorySection />
            <PinnedSection />
          </>
        ) : (
          <RatingsTab />
        )}
      </div>
    </LazyMotion>
  );
}
