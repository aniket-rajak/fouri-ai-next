"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Loader2, TrendingUp, Upload, Users, Brain, BarChart3 } from "lucide-react";

interface Analytics {
  recentSignups: number;
  recentUploads: number;
  recentAttempts: number;
  totalAiCalls: number;
  uploadsByStatus: { status: string; count: number }[];
  testsByDifficulty: { difficulty: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/analytics")
      .then((res) => setData(res.data.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!data) return null;

  const totalUploads = data.uploadsByStatus.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Analytics</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-zinc-900">{data.recentSignups}</p>
              <p className="text-sm text-zinc-500">Signups (30d)</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Upload size={20} className="text-green-600" />
            <div>
              <p className="text-2xl font-bold text-zinc-900">{data.recentUploads}</p>
              <p className="text-sm text-zinc-500">Uploads (30d)</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-zinc-900">{data.recentAttempts}</p>
              <p className="text-sm text-zinc-500">Attempts (30d)</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Brain size={20} className="text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-zinc-900">{data.totalAiCalls}</p>
              <p className="text-sm text-zinc-500">Total AI Calls</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-zinc-900 mb-3">Upload Status</h3>
          <div className="space-y-2">
            {data.uploadsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 capitalize">{item.status.toLowerCase()}</span>
                <span className="font-medium text-zinc-900">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-zinc-900 mb-3">Tests by Difficulty</h3>
          <div className="space-y-2">
            {data.testsByDifficulty.map((item) => (
              <div key={item.difficulty} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 capitalize">{item.difficulty.toLowerCase()}</span>
                <span className="font-medium text-zinc-900">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
