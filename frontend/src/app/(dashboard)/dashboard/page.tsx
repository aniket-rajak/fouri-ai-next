"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Upload, FileText, BarChart3, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";

interface PausedAttempt {
  id: string;
  remainingTime: number | null;
  currentQuestionIndex: number | null;
  mockTest: {
    id: string;
    title: string;
    totalQuestions: number;
    duration: number;
  };
}

export default function DashboardPage() {
  const [pausedAttempts, setPausedAttempts] = useState<PausedAttempt[]>([]);
  const [loadingPaused, setLoadingPaused] = useState(true);

  useEffect(() => {
    api.get("/attempts?status=PAUSED")
      .then((res) => setPausedAttempts(res.data.attempts || []))
      .catch(() => {})
      .finally(() => setLoadingPaused(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Welcome back! Ready to practice?</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/upload">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Upload size={20} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Upload Paper</p>
                <p className="text-sm text-zinc-500">Create a new mock test</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/tests">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">My Tests</p>
                <p className="text-sm text-zinc-500">View your mock tests</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/results">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Results</p>
                <p className="text-sm text-zinc-500">Check past performance</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Paused Tests Summary */}
      {!loadingPaused && pausedAttempts.length > 0 && (
        <Card>
          <Link href="/resume-tests" className="block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Paused Tests</p>
                  <p className="text-sm text-zinc-500">{pausedAttempts.length} test(s) paused</p>
                </div>
              </div>
              <span className="h-9 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 inline-flex items-center">
                View All
              </span>
            </div>
          </Link>
        </Card>
      )}
    </div>
  );
}
