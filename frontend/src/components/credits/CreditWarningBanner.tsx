"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Ban, Heart } from "lucide-react";
import { api } from "@/lib/api";

interface CreditData {
  dailyCredits: number;
  usedCredits: number;
  remaining: number;
  resetsAt: string;
}

export function CreditWarningBanner() {
  const [credits, setCredits] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/credits/me")
      .then((res) => setCredits(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !credits) return null;

  const usedPercent = Math.round((credits.usedCredits / credits.dailyCredits) * 100);

  if (usedPercent >= 100) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-100 shrink-0">
            <Ban size={22} className="text-red-600" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-red-900 text-sm">
              Daily AI Credits Exhausted
            </h3>
            <p className="text-sm text-red-700 leading-relaxed">
              FOUR I is currently operated as an unfunded project. Our mission is to help
              students achieve a smoother learning journey through AI-powered technologies.
            </p>
            <p className="text-sm text-red-700">
              To keep the platform free for students, we maintain daily AI usage limits.
              Your AI credits will automatically refresh tomorrow.
            </p>
            <p className="text-sm text-red-700 font-medium">
              Need more AI analysis today? Support FOUR I via UPI:{" "}
              <span className="font-mono font-bold">aniketrajak6291@oksbi</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <a
            href="upi://pay?pa=aniketrajak6291@oksbi&tn=Support%20FOURI"
            className="flex-1 h-10 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Heart size={16} />
            Donate Now
          </a>
        </div>
      </div>
    );
  }

  if (usedPercent >= 90) {
    return (
      <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
        <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-orange-900">
            Only a few AI credits remain for today.
          </p>
          <p className="text-sm text-orange-700">
            Your credits will automatically reset tomorrow.
          </p>
        </div>
      </div>
    );
  }

  if (usedPercent >= 80) {
    return (
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            You have used {usedPercent}% of your daily AI credits.
          </p>
          <p className="text-sm text-amber-700">
            Please use the remaining credits wisely.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
