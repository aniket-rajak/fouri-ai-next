"use client";

import { Zap } from "lucide-react";

interface CreditCostDisplayProps {
  estimatedCost: number;
  availableCredits: number;
  creditsAfterAnalysis: number;
  hasEnoughCredits: boolean;
}

export function CreditCostDisplay({
  estimatedCost,
  availableCredits,
  creditsAfterAnalysis,
  hasEnoughCredits,
}: CreditCostDisplayProps) {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-zinc-600" />
        <span className="text-sm font-semibold text-zinc-900">AI Credit Cost</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-zinc-500">Required</p>
          <p className="text-lg font-bold text-zinc-900">{estimatedCost}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Available</p>
          <p className="text-lg font-bold text-zinc-900">{availableCredits}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">After</p>
          <p
            className={`text-lg font-bold ${
              creditsAfterAnalysis < 0
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {creditsAfterAnalysis}
          </p>
        </div>
      </div>

      {!hasEnoughCredits && (
        <p className="text-xs text-red-600 text-center">
          You need {estimatedCost} credits but only have {availableCredits}.
        </p>
      )}
    </div>
  );
}
