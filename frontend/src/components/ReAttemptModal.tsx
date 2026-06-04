"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

interface ReAttemptModalProps {
  open: boolean;
  testId: string;
  defaultDuration: number;
  title: string;
  onClose: () => void;
}

export function ReAttemptModal({ open, testId, defaultDuration, title, onClose }: ReAttemptModalProps) {
  const router = useRouter();
  const [customMinutes, setCustomMinutes] = useState(String(Math.round(defaultDuration / 60)));

  if (!open) return null;

  const startReattempt = () => {
    const seconds = Math.max(60, parseInt(customMinutes) || 30) * 60;
    sessionStorage.setItem("resultsReturn", window.location.href);
    router.push(`/test/${testId}/attempt?duration=${seconds}`);
  };

  const presets = [
    { label: "30 min", value: 30 },
    { label: "60 min", value: 60 },
    { label: "90 min", value: 90 },
    { label: "Test Default", value: Math.round(defaultDuration / 60) },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <RotateCcw size={18} className="text-zinc-700" />
          <h3 className="text-lg font-semibold text-zinc-900">Re-Attempt</h3>
        </div>
        <p className="text-sm text-zinc-600">{title}</p>

        <div className="space-y-3">
          <p className="text-xs font-medium text-zinc-500">Duration</p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setCustomMinutes(String(opt.value))}
                className={`h-10 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                  parseInt(customMinutes) === opt.value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">Custom (minutes)</label>
            <input
              type="number"
              min={1}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border-2 border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={startReattempt}
            className="flex-1 h-10 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Start Re-Attempt
          </button>
        </div>
      </div>
    </div>
  );
}
