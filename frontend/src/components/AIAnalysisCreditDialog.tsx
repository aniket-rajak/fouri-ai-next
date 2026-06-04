"use client";

import { BrainCircuit, Loader2, Zap } from "lucide-react";

interface AIAnalysisCreditDialogProps {
  requiredCredits: number;
  availableCredits: number;
  dailyCredits: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AIAnalysisCreditDialog({
  requiredCredits,
  availableCredits,
  dailyCredits,
  loading,
  onConfirm,
  onCancel,
}: AIAnalysisCreditDialogProps) {
  const remainingAfter = availableCredits - requiredCredits;
  const hasEnough = availableCredits >= requiredCredits;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-lg space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-green-100 shrink-0">
            <BrainCircuit size={24} className="text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-zinc-900 text-base">
              AI Analysis
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              AI Analysis uses advanced AI to evaluate your performance, identify strengths and weaknesses, provide question-by-question explanations, and generate personalized study recommendations.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
            Credit Cost Summary
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-2.5">
              <span className="text-sm text-zinc-700">AI Analysis Cost</span>
              <span className="text-sm font-bold text-zinc-900">{requiredCredits} Credits</span>
            </div>
            <div className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-2.5">
              <span className="text-sm text-zinc-700">Available Credits</span>
              <span className="text-sm font-bold text-zinc-900">{availableCredits} / {dailyCredits} (Daily Limit)</span>
            </div>
            <div className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-2.5">
              <span className="text-sm text-zinc-700">Remaining After Analysis</span>
              <span className={`text-sm font-bold ${remainingAfter >= 0 ? "text-green-600" : "text-red-600"}`}>
                {Math.max(0, remainingAfter)} Credits
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-1.5">
            <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
              <Zap size={12} />
              How it works
            </p>
            <p className="text-xs text-blue-600/80 leading-relaxed">
              Credits are used because AI processing requires computing resources and API usage. Each user receives {dailyCredits} credits per day, and AI Analysis consumes credits based on the processing required. Your daily credits reset automatically every 24 hours.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:flex-1 h-10 rounded-xl border border-zinc-300 text-zinc-700 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !hasEnough}
            className="w-full sm:flex-1 h-10 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              "Generate AI Analysis"
            )}
          </button>
        </div>

        {!hasEnough && !loading && (
          <p className="text-xs text-red-600 text-center">
            You need {requiredCredits} credits but only have {availableCredits}. Please try again tomorrow or use fewer analyses.
          </p>
        )}
      </div>
    </div>
  );
}
