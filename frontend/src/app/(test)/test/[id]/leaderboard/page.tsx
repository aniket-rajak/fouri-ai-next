"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Trophy, Medal, Loader2, Clock, ArrowLeft, TrendingUp } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number | null;
  correctAnswers: number | null;
  totalQuestions: number | null;
  timeTaken: number | null;
  completedAt: string | null;
}

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tests/${testId}/leaderboard`)
      .then((res) => setEntries(res.data.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [testId]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} className="text-amber-500" />;
    if (rank === 2) return <Medal size={18} className="text-zinc-400" />;
    if (rank === 3) return <Medal size={18} className="text-amber-700" />;
    return <span className="w-[18px] text-center text-sm font-medium text-zinc-400">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Trophy size={22} className="text-amber-500" />
            Leaderboard
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Top scores for this test</p>
        </div>

        {entries.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <TrendingUp size={40} className="mx-auto text-zinc-300 mb-3" />
              <p className="text-zinc-500">No scores yet. Be the first to attempt this test!</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <Card key={`${entry.rank}-${entry.name}`}>
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 truncate">{entry.name}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} />
                        {entry.score != null ? `${Math.round(entry.score)}%` : "-"}
                      </span>
                      <span>
                        {entry.correctAnswers != null ? entry.correctAnswers : "-"}/
                        {entry.totalQuestions ?? "-"} correct
                      </span>
                      {entry.timeTaken != null && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {Math.floor(entry.timeTaken / 60)}m {entry.timeTaken % 60}s
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-zinc-900">
                      {entry.score != null ? `${Math.round(entry.score)}%` : "-"}
                    </p>
                    {entry.completedAt && (
                      <p className="text-xs text-zinc-400">
                        {new Date(entry.completedAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
