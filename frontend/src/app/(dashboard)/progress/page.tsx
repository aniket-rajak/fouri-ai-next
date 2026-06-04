"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { AdSlot } from "@/components/AdSlot";
import {
  TrendingUp, BarChart3, Target, Clock, Loader2,
  Trophy, Award, Zap, BookOpen, CheckCircle2, Calendar
} from "lucide-react";

interface ProgressData {
  totalTests: number;
  totalAttempts: number;
  totalScore: number;
  avgScore: number | null;
  bestScore: number | null;
  totalTimeSpent: number;
  weekly: { attempts: number; avgScore: number | null };
  monthly: { attempts: number; avgScore: number | null };
  trend: { score: number | null; date: string | null }[];
}

interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
  unlocked: boolean;
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/users/history/progress"),
      api.get("/users/history/achievements"),
    ])
      .then(([pRes, aRes]) => {
        setProgress(pRes.data);
        setBadges(aRes.data.badges);
        setTotalEarned(aRes.data.totalEarned);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <TrendingUp size={22} />
          Progress
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">Your learning journey and achievements</p>
      </div>

      <AdSlot slot="in-content-progress" format="horizontal" className="mx-auto max-w-[728px]" />

      {/* Overall Stats */}
      {progress && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">Overall Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Tests Taken</p>
              <p className="text-2xl font-bold text-zinc-900">{progress.totalTests}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Total Attempts</p>
              <p className="text-2xl font-bold text-zinc-900">{progress.totalAttempts}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Best Score</p>
              <p className="text-2xl font-bold text-green-600">
                {progress.bestScore != null ? `${Math.round(progress.bestScore)}%` : "-"}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Avg Score</p>
              <p className="text-2xl font-bold text-zinc-900">
                {progress.avgScore != null ? `${Math.round(progress.avgScore)}%` : "-"}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">Total Time Spent</p>
              <p className="text-2xl font-bold text-zinc-900">{formatTime(progress.totalTimeSpent)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">This Week</p>
              <p className="text-2xl font-bold text-zinc-900">
                {progress.weekly.avgScore != null ? `${Math.round(progress.weekly.avgScore)}%` : "-"}
                <span className="text-xs text-zinc-500 font-normal ml-1">avg</span>
              </p>
              <p className="text-xs text-zinc-400 mt-1">{progress.weekly.attempts} attempt{progress.weekly.attempts !== 1 ? "s" : ""}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-zinc-500 mb-1">This Month</p>
              <p className="text-2xl font-bold text-zinc-900">
                {progress.monthly.avgScore != null ? `${Math.round(progress.monthly.avgScore)}%` : "-"}
                <span className="text-xs text-zinc-500 font-normal ml-1">avg</span>
              </p>
              <p className="text-xs text-zinc-400 mt-1">{progress.monthly.attempts} attempt{progress.monthly.attempts !== 1 ? "s" : ""}</p>
            </Card>
          </div>

          {/* Score Trend */}
          {progress.trend.length > 1 && (
            <Card className="p-4 mt-3">
              <p className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
                <BarChart3 size={14} />
                Score Trend (Last {progress.trend.length} attempts)
              </p>
              <div className="flex items-end gap-2 h-28 overflow-x-auto pb-2">
                {progress.trend.map((t, i) => {
                  const height = t.score != null ? `${Math.max(5, Math.round(t.score))}%` : "5%";
                  return (
                    <div key={i} className="flex-1 min-w-[32px] flex flex-col items-center gap-1">
                      <span className="text-xs text-zinc-500">{t.score != null ? `${Math.round(t.score)}%` : "-"}</span>
                      <div
                        className="w-full rounded-t bg-zinc-900 transition-all"
                        style={{ height }}
                        title={`Attempt ${i + 1}: ${t.score != null ? Math.round(t.score) + "%" : "N/A"}`}
                      />
                      <span className="text-xs text-zinc-400 truncate w-full text-center">
                        {t.date ? new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </section>
      )}

      {/* Achievements */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-900 mb-3 flex items-center gap-2">
          <Award size={18} />
          Achievements
          <span className="text-sm font-normal text-zinc-500 ml-1">
            ({totalEarned} earned)
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((badge) => (
            <Card key={badge.id} className={`p-4 ${badge.earned ? "" : "opacity-50"}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900 text-sm">{badge.label}</h3>
                    {badge.earned && <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
                    {!badge.unlocked && !badge.earned && (
                      <span className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">Locked</span>
                    )}
                    {badge.unlocked && !badge.earned && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Available to claim</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{badge.description}</p>
                  {badge.earned && badge.earnedAt && (
                    <p className="text-xs text-zinc-400 mt-1">
                      Earned {new Date(badge.earnedAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
