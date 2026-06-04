"use client";

import { Heart, Sun, Moon } from "lucide-react";

interface InsufficientCreditsModalProps {
  required: number;
  available: number;
  onDonate: () => void;
  onBasicAnalysis: () => void;
  onTryTomorrow: () => void;
}

export function InsufficientCreditsModal({
  required,
  available,
  onDonate,
  onBasicAnalysis,
  onTryTomorrow,
}: InsufficientCreditsModalProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-amber-100 shrink-0">
          <Sun size={22} className="text-amber-600" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-semibold text-amber-900 text-sm">
            Insufficient AI Credits
          </h3>
          <p className="text-sm text-amber-700">
            This analysis requires <strong>{required} AI Credits</strong>.
          </p>
          <p className="text-sm text-amber-700">
            You currently have <strong>{available} AI Credits</strong> remaining.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={onDonate}
          className="w-full h-10 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <Heart size={16} />
          Donate & Support
        </button>
        <button
          onClick={onBasicAnalysis}
          className="w-full h-10 rounded-xl border border-amber-300 text-amber-800 text-sm font-medium hover:bg-amber-100 inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sun size={16} />
          Use Basic Analysis (Lower Cost)
        </button>
        <button
          onClick={onTryTomorrow}
          className="w-full h-10 rounded-xl border border-amber-300 text-amber-800 text-sm font-medium hover:bg-amber-100 inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <Moon size={16} />
          Try Tomorrow
        </button>
      </div>

      <p className="text-xs text-amber-600 text-center">
        Support FOUR I via UPI:{" "}
        <span className="font-mono font-bold">aniketrajak6291@oksbi</span>
      </p>
    </div>
  );
}
