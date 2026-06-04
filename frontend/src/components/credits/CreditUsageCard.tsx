"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Zap } from "lucide-react";
import { api } from "@/lib/api";

interface CreditData {
  dailyCredits: number;
  usedCredits: number;
  remaining: number;
  resetsAt: string;
}

export function CreditUsageCard() {
  const [credits, setCredits] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/credits/me")
      .then((res) => setCredits(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (error || !credits) return null;

  const usedPercent = Math.round((credits.usedCredits / credits.dailyCredits) * 100);
  const resetsAtDate = new Date(credits.resetsAt);
  const resetTime = resetsAtDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
          <Zap size={18} />
        </div>
        <span className="text-sm font-semibold text-zinc-900">AI Credits Usage</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-zinc-900">{credits.usedCredits}</span>
        <span className="text-sm text-zinc-500">
          / {credits.dailyCredits} Credits Used
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usedPercent >= 90
                ? "bg-red-500"
                : usedPercent >= 80
                  ? "bg-orange-400"
                  : "bg-purple-500"
            }`}
            style={{ width: `${Math.min(usedPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">{usedPercent}% used</span>
          <span className="text-zinc-500">
            {credits.remaining} Credit{credits.remaining !== 1 ? "s" : ""} remaining
          </span>
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        Resets at {resetTime} daily
      </p>
    </Card>
  );
}
