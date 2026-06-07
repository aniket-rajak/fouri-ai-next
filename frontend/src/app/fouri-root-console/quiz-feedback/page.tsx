"use client";

import { useEffect, useState } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion } from "framer-motion";
import {
  Star, MessageSquare, Eye, EyeOff, Trash2, Loader2, AlertCircle,
  CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  category: string | null;
  visible: boolean;
  userId: string | null;
  guestId: string | null;
  createdAt: string;
  quizAttempt: {
    subject: string;
    topic: string;
    difficulty: string;
  };
}

const categoryLabels: Record<string, string> = {
  QUIZ_QUALITY: "Quiz Quality",
  QUESTION_DIFFICULTY: "Question Difficulty",
  EXPLANATION_QUALITY: "Explanation Quality",
  OVERALL_EXPERIENCE: "Overall Experience",
};

const categoryColors: Record<string, string> = {
  QUIZ_QUALITY: "bg-blue-500/10 text-blue-400",
  QUESTION_DIFFICULTY: "bg-purple-500/10 text-purple-400",
  EXPLANATION_QUALITY: "bg-green-500/10 text-green-400",
  OVERALL_EXPERIENCE: "bg-amber-500/10 text-amber-400",
};

export default function QuizFeedbackAdmin() {
  const api = useOwnerApi();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const fetchFeedbacks = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api("/quiz/feedback/admin") as { feedbacks: FeedbackItem[] };
      setFeedbacks(data.feedbacks || []);
      setError(null);
    } catch (err) {
      setError("Failed to load feedback");
      console.error(err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [api]);

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      await api(`/quiz/feedback/${id}/toggle`, { method: "PATCH" });
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f))
      );
    } catch {
      setError("Failed to toggle visibility");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api(`/quiz/feedback/${id}`, { method: "DELETE" });
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      setDeleteConfirm(null);
    } catch {
      setError("Failed to delete feedback");
    } finally {
      setDeleting(null);
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filter === "visible" && !f.visible) return false;
    if (filter === "hidden" && f.visible) return false;
    if (categoryFilter && f.category !== categoryFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl font-bold font-heading text-[#f5f5f7]">Quiz Feedback</h1>
          <p className="text-sm text-[#888899] mt-1">
            Manage student reviews and ratings for AI-generated quizzes
          </p>
        </div>
        <button
          onClick={() => fetchFeedbacks(true)}
          disabled={refreshing}
          className="self-end sm:self-auto inline-flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium text-[#888899] border border-white/10 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1 min-w-0">{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 hover:text-red-300 cursor-pointer">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto flex-nowrap pb-1">
        <div className="flex items-center gap-2 shrink-0">
          {(["all", "visible", "hidden"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-9 px-4 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                filter === f
                  ? "bg-blue-600/10 text-blue-300 border border-blue-500/10"
                  : "text-[#888899] border border-white/10 hover:bg-white/5"
              }`}
            >
              {f === "all" ? "All" : f === "visible" ? "Visible" : "Hidden"}
              {f === "all" && (
                <span className="ml-1.5 text-[#555566]">({feedbacks.length})</span>
              )}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-white/10 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCategoryFilter("")}
            className={`shrink-0 h-9 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              !categoryFilter
                ? "bg-blue-600/10 text-blue-300 border border-blue-500/10"
                : "text-[#888899] border border-white/10 hover:bg-white/5"
            }`}
          >
            All Categories
          </button>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setCategoryFilter(categoryFilter === value ? "" : value)}
              className={`shrink-0 h-9 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                categoryFilter === value
                  ? "bg-blue-600/10 text-blue-300 border border-blue-500/10"
                  : "text-[#888899] border border-white/10 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback list */}
      {filteredFeedbacks.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-10 h-10 text-[#555566] mx-auto mb-3" />
          <p className="text-sm text-[#888899]">No feedback found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFeedbacks.map((fb) => (
            <motion.div
              key={fb.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= fb.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-white/[0.06]"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs text-[#888899]">
                      {fb.rating}/5
                    </span>
                  </div>

                  {/* Comment */}
                  {fb.comment && (
                    <p className="text-sm text-[#c0c0c0] mb-2">{fb.comment}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-2 text-xs text-[#555566] flex-wrap">
                    <span className="text-blue-400">{fb.quizAttempt.subject}</span>
                    <span>&middot;</span>
                    <span>{fb.quizAttempt.topic}</span>
                    <span>&middot;</span>
                    <span className="capitalize">{fb.quizAttempt.difficulty.toLowerCase()}</span>
                    {fb.category && (
                      <>
                        <span>&middot;</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${categoryColors[fb.category] || "bg-white/5 text-[#888899]"}`}>
                          {categoryLabels[fb.category] || fb.category}
                        </span>
                      </>
                    )}
                    <span>&middot;</span>
                    <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                    {fb.userId && <span>&middot; Registered</span>}
                    {fb.guestId && !fb.userId && <span>&middot; Guest</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                    fb.visible
                      ? "bg-green-500/10 text-green-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {fb.visible ? "Visible" : "Hidden"}
                  </span>
                  <button
                    onClick={() => handleToggle(fb.id)}
                    disabled={toggling === fb.id}
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                    title={fb.visible ? "Hide" : "Show"}
                  >
                    {toggling === fb.id ? (
                      <Loader2 size={14} className="animate-spin text-[#888899]" />
                    ) : fb.visible ? (
                      <EyeOff size={14} className="text-[#888899]" />
                    ) : (
                      <Eye size={14} className="text-[#888899]" />
                    )}
                  </button>
                  {deleteConfirm === fb.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(fb.id)}
                        disabled={deleting === fb.id}
                        className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-all cursor-pointer"
                        title="Confirm delete"
                      >
                        {deleting === fb.id ? (
                          <Loader2 size={14} className="animate-spin text-red-400" />
                        ) : (
                          <CheckCircle2 size={14} className="text-red-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <XCircle size={14} className="text-[#888899]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(fb.id)}
                      className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-[#888899] hover:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
