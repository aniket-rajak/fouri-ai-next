"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

interface TestAttempt {
  id: string;
  mockTestId: string;
  mockTest: { title: string };
  score: number | null;
  totalMarks: number | null;
  accuracy: number | null;
  timeTaken: number | null;
  status: string;
  completedAt: string | null;
}

export default function ResultsPage() {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/results")
      .then((res) => setAttempts(res.data.attempts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Results</h1>
        <Card>
          <div className="text-center py-12">
            <BarChart3 size={40} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">No results yet. Complete a mock test to see your performance.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Results</h1>
      <div className="grid gap-4">
        {attempts.map((attempt) => (
          <Link key={attempt.id} href={`/results/${attempt.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900">
                    {attempt.mockTest.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
                    <span>Score: {attempt.score ?? "-"}/{attempt.totalMarks ?? "-"}</span>
                    <span>Accuracy: {attempt.accuracy ? `${attempt.accuracy}%` : "-"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    attempt.score && attempt.totalMarks && attempt.score / attempt.totalMarks >= 0.6
                      ? "text-green-600" : "text-zinc-900"
                  }`}>
                    {attempt.accuracy ? `${Math.round(attempt.accuracy)}%` : "-"}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
