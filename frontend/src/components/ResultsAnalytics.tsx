"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import {
  BarChart3, TrendingUp, Clock, Target, Loader2,
  BookOpen
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

interface AnalyticsData {
  performanceTrend: { date: string; accuracy: number | null; testTitle: string }[];
  subjectWise: { subject: string; avgScore: number | null; totalAttempts: number; bestScore: number }[];
  accuracyTrend: { date: string; accuracy: number | null }[];
  dailyActivity: { date: string; count: number }[];
  weeklyActivity: { week: string; attempts: number; avgScore: number | null }[];
  overall: { totalAttempts: number; avgScore: number | null; bestScore: number | null; totalTimeSpent: number };
}

export function ResultsAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/results/analytics")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 animate-pulse">
            <div className="h-3 bg-zinc-200 rounded w-1/2 mb-2" />
            <div className="h-6 bg-zinc-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const trendData = data.performanceTrend.map((t) => ({
    ...t,
    accuracy: t.accuracy ?? 0,
  }));

  const subjectData = data.subjectWise.map((s) => ({
    subject: s.subject,
    avgScore: s.avgScore ?? 0,
  }));

  const activityData = data.dailyActivity.slice(-14);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <BookOpen size={12} /> Total Tests
          </p>
          <p className="text-2xl font-bold text-zinc-900">{data.overall.totalAttempts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <BarChart3 size={12} /> Avg Score
          </p>
          <p className="text-2xl font-bold text-zinc-900">
            {data.overall.avgScore != null ? `${Math.round(data.overall.avgScore)}%` : "-"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <Target size={12} /> Best Score
          </p>
          <p className="text-2xl font-bold text-green-600">
            {data.overall.bestScore != null ? `${Math.round(data.overall.bestScore)}%` : "-"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <Clock size={12} /> Total Time
          </p>
          <p className="text-2xl font-bold text-zinc-900">{formatTime(data.overall.totalTimeSpent)}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Performance Trend */}
        {trendData.length > 1 && (
          <Card className="p-4">
            <p className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
              <TrendingUp size={14} />
              Performance Trend
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#999" }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#999" }} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleDateString("en-IN")}
                    formatter={(value: any) => [`${Math.round(Number(value))}%`, "Accuracy"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#18181b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#18181b" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Subject-wise */}
        {subjectData.length > 0 && (
          <Card className="p-4">
            <p className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
              <BarChart3 size={14} />
              Subject-wise Avg Score
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "#999" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#999" }} />
                  <Tooltip formatter={(value: any) => [`${Math.round(Number(value))}%`, "Avg Score"]} />
                  <Bar dataKey="avgScore" fill="#18181b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Activity Heatmap-style */}
      {activityData.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
            <Clock size={14} />
            Daily Activity (Last 14 days)
          </p>
          <div className="flex items-end gap-1 h-20">
            {activityData.map((d) => {
              const maxCount = Math.max(...activityData.map((x) => x.count), 1);
              const height = `${Math.max(10, (d.count / maxCount) * 100)}%`;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-zinc-900 transition-all"
                    style={{ height }}
                    title={`${d.date}: ${d.count} attempt${d.count !== 1 ? "s" : ""}`}
                  />
                  <span className="text-[10px] text-zinc-400 truncate w-full text-center">
                    {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }).slice(0, 6)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
