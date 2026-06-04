"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { AdSlot } from "@/components/AdSlot";
import Link from "next/link";
import {
  TrendingUp, BarChart3, Users, Target, Clock, ArrowLeft,
  Loader2, Trophy, AlertCircle, ChevronRight
} from "lucide-react";

interface AttemptData {
  id: string;
  score: number | null;
  totalMarks: number | null;
  accuracy: number | null;
  timeTaken: number | null;
  completedAt: string | null;
}

interface PersonalAnalytics {
  totalAttempts: number;
  bestScore: number | null;
  avgScore: number | null;
  latestScore: number | null;
  improvement: number | null;
  totalTimeSpent: number;
  attempts: AttemptData[];
}

interface DifficultQuestion {
  questionId: string;
  incorrectCount: number;
  totalAttempts: number;
  failureRate: number;
}

interface CommunityAnalytics {
  totalStudents: number;
  totalAttempts: number;
  avgScore: number | null;
  topScore: number | null;
  mostDifficultQuestions: DifficultQuestion[];
}

export default function TestAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [personal, setPersonal] = useState<PersonalAnalytics | null>(null);
  const [community, setCommunity] = useState<CommunityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tests/${testId}/analytics`)
      .then((res) => {
        setPersonal(res.data.personal);
        setCommunity(res.data.community);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [testId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Paper Analytics</h1>
        <p className="text-zinc-500 mt-1 text-sm">View your performance and community statistics</p>
      </div>

      {/* Personal Stats */}
      {personal && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <BarChart3 size={18} />
            Your Performance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Attempts</p>
              <p className="text-2xl font-bold text-zinc-900">{personal.totalAttempts}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Best Score</p>
              <p className="text-2xl font-bold text-green-600">
                {personal.bestScore != null ? `${Math.round(personal.bestScore)}%` : "-"}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Average</p>
              <p className="text-2xl font-bold text-zinc-900">
                {personal.avgScore != null ? `${Math.round(personal.avgScore)}%` : "-"}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Total Time</p>
              <p className="text-2xl font-bold text-zinc-900">{formatTime(personal.totalTimeSpent)}</p>
            </Card>
          </div>

          {personal.improvement != null && (
            <Card className="p-4 mt-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className={personal.improvement >= 0 ? "text-green-500" : "text-red-500"} />
                <span className="text-sm text-zinc-600">
                  {personal.improvement >= 0 ? "Improved" : "Declined"} by{" "}
                  <strong className={personal.improvement >= 0 ? "text-green-600" : "text-red-500"}>
                    {Math.abs(Math.round(personal.improvement))}%
                  </strong>{" "}
                  from first to latest attempt
                </span>
              </div>
            </Card>
          )}

          {/* Attempt History */}
          {personal.attempts.length > 1 && (
            <Card className="p-4 mt-3">
              <p className="text-sm font-medium text-zinc-700 mb-3">Score Trend</p>
              <div className="flex items-end gap-2 h-24">
                {personal.attempts.map((a, i) => {
                  const height = a.accuracy != null ? `${Math.round(a.accuracy)}%` : "0%";
                  return (
                    <div key={a.id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-zinc-500">{a.accuracy != null ? `${Math.round(a.accuracy)}%` : "-"}</span>
                      <div
                        className="w-full rounded-t bg-zinc-900"
                        style={{ height }}
                        title={`Attempt ${i + 1}: ${a.accuracy != null ? Math.round(a.accuracy) + "%" : "N/A"}`}
                      />
                      <span className="text-xs text-zinc-400">
                        {a.completedAt ? new Date(a.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </section>
      )}

      <AdSlot slot="in-content-analytics" format="horizontal" className="mx-auto max-w-[728px]" />

      {/* Community Stats */}
      {community && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <Users size={18} />
            Community Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Students</p>
              <p className="text-2xl font-bold text-zinc-900">{community.totalStudents}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Community Avg</p>
              <p className="text-2xl font-bold text-zinc-900">
                {community.avgScore != null ? `${Math.round(community.avgScore)}%` : "-"}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Top Score</p>
              <p className="text-2xl font-bold text-amber-600">
                {community.topScore != null ? `${Math.round(community.topScore)}%` : "-"}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Total Attempts</p>
              <p className="text-2xl font-bold text-zinc-900">{community.totalAttempts}</p>
            </Card>
          </div>

          {/* Most Difficult Questions */}
          {community.mostDifficultQuestions.length > 0 && (
            <Card className="p-4 mt-3">
              <p className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
                <AlertCircle size={14} />
                Most Difficult Questions
              </p>
              <div className="space-y-2">
                {community.mostDifficultQuestions.map((q, i) => (
                  <div key={q.questionId} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">#{i + 1} - Question {q.questionId.slice(0, 8)}...</span>
                    <span className="text-red-600 font-medium">{q.failureRate}% incorrect</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Link
          href={`/test/${testId}/leaderboard`}
          className="flex items-center gap-1.5 h-10 px-4 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Trophy size={14} />
          Leaderboard
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
