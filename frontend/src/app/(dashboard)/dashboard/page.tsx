"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { RotateCcw, Clock, ArrowRight } from "lucide-react";
import { CreditUsageCard } from "@/components/credits/CreditUsageCard";
import { CreditWarningBanner } from "@/components/credits/CreditWarningBanner";
import { GreetingSection } from "@/components/dashboard/GreetingSection";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActiveUploadCard } from "@/components/dashboard/ActiveUploadCard";

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

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function DashboardPage() {
  const [pausedAttempts, setPausedAttempts] = useState<PausedAttempt[]>([]);
  const [loadingPaused, setLoadingPaused] = useState(true);

  useEffect(() => {
    api
      .get("/attempts?status=PAUSED")
      .then((res) => setPausedAttempts(res.data.attempts || []))
      .catch(() => {})
      .finally(() => setLoadingPaused(false));
  }, []);

  const totalQuestions = pausedAttempts.reduce(
    (sum, a) => sum + a.mockTest.totalQuestions,
    0
  );

  return (
    <div className="space-y-6">
      <GreetingSection
        stats={[
          { label: "Active Tests", value: pausedAttempts.length },
          { label: "Questions", value: totalQuestions || pausedAttempts.length * 10 },
          {
            label: "AI Credits",
            value: 100,
            suffix: "/day",
          },
          { label: "Practice Streak", value: 1, suffix: " day" },
        ]}
      />

      <CreditWarningBanner />

      <ActiveUploadCard />

      <QuickActions />

      <CreditUsageCard />

      {!loadingPaused && pausedAttempts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">
            Paused Tests
          </h2>
          <div className="space-y-3">
            {pausedAttempts.map((attempt) => {
              const progress = attempt.currentQuestionIndex
                ? Math.round(
                    (attempt.currentQuestionIndex /
                      attempt.mockTest.totalQuestions) *
                      100
                  )
                : 0;
              return (
                <Link
                  key={attempt.id}
                  href="/resume-tests"
                  className="group block rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-300 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-100 shrink-0">
                        <RotateCcw size={18} className="text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {attempt.mockTest.title}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {attempt.mockTest.totalQuestions} questions &bull;{" "}
                          {attempt.remainingTime != null
                            ? `${formatTime(attempt.remainingTime)} left`
                            : `${formatTime(attempt.mockTest.duration)} total`}
                        </p>
                        <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden max-w-[200px]">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-amber-600 font-medium">
                        {progress}%
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-zinc-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all duration-300"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!loadingPaused && pausedAttempts.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <div className="p-2 rounded-xl bg-zinc-100 inline-flex mb-3">
            <RotateCcw size={18} className="text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-500">No paused tests</p>
          <p className="text-xs text-zinc-400 mt-1">
            Upload a question paper to get started
          </p>
        </div>
      )}
    </div>
  );
}
