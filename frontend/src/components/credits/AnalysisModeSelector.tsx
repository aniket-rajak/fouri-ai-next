"use client";

import { FileText, Layers, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export type AnalysisMode = "basic" | "standard" | "full";

interface AnalysisModeOption {
  id: AnalysisMode;
  label: string;
  description: string;
  icon: typeof FileText;
  creditMultiplier: string;
}

const modes: AnalysisModeOption[] = [
  {
    id: "basic",
    label: "Basic Analysis",
    description: "Summary, Important Topics, Key Concepts",
    icon: FileText,
    creditMultiplier: "40% cost",
  },
  {
    id: "standard",
    label: "Standard Analysis",
    description: "Topic Breakdown, Difficulty Analysis, Learning Recommendations",
    icon: Layers,
    creditMultiplier: "70% cost",
  },
  {
    id: "full",
    label: "Full AI Analysis",
    description: "Complete Paper Analysis, Question-by-Question Insights, Performance Recommendations, Study Strategy",
    icon: Compass,
    creditMultiplier: "100% cost",
  },
];

interface AnalysisModeSelectorProps {
  selected: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
  baseCreditCost: number;
}

export function AnalysisModeSelector({
  selected,
  onChange,
  baseCreditCost,
}: AnalysisModeSelectorProps) {
  const multipliers = { basic: 0.4, standard: 0.7, full: 1.0 };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-zinc-900">Analysis Mode</p>
      <div className="grid gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const cost = Math.max(1, Math.ceil(baseCreditCost * multipliers[mode.id]));
          const isSelected = selected === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                isSelected
                  ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                  : "border-zinc-200 hover:border-zinc-400"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg shrink-0",
                  isSelected ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                )}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-zinc-900" : "text-zinc-700"
                    )}
                  >
                    {mode.label}
                  </p>
                  <span className="text-xs text-zinc-500">{mode.creditMultiplier}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{mode.description}</p>
                <p className="text-xs font-semibold text-zinc-700 mt-1">
                  {cost} Credit{cost !== 1 ? "s" : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
