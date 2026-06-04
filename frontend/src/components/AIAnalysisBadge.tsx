"use client";

import Link from "next/link";
import { BrainCircuit, Loader2 } from "lucide-react";

interface AIAnalysisBadgeProps {
  status: string | null | undefined;
  testId: string;
  size?: "sm" | "md";
}

export function AIAnalysisBadge({ status, testId, size = "sm" }: AIAnalysisBadgeProps) {
  const iconSize = size === "sm" ? 14 : 18;
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  if (status === "COMPLETED") {
    return (
      <Link
        href={`/analysis/${testId}`}
        className={`inline-flex items-center gap-1 ${textSize} text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 px-1.5 py-0.5 rounded-full transition-colors`}
        title="AI Analysis uses advanced AI to evaluate your performance, identify strengths and weaknesses, provide question-by-question explanations, and generate personalized study recommendations. Credits are consumed when generating a new analysis report."
        onClick={(e) => e.stopPropagation()}
      >
        <BrainCircuit size={iconSize} />
        <span className="font-medium">AI</span>
      </Link>
    );
  }

  if (status === "ANALYZING" || status === "PROCESSING") {
    return (
      <span
        className={`inline-flex items-center gap-1 ${textSize} text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full`}
        title="AI Analysis is being generated. This typically takes 10-30 seconds and consumes AI credits from your daily limit."
      >
        <Loader2 size={iconSize} className="animate-spin" />
        <span className="font-medium">AI</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${textSize} text-zinc-300 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded-full`}
      title="Complete a mock test to unlock AI Analysis — personalized performance breakdown with strengths, weaknesses, and study recommendations. AI credits are required to generate a new analysis."
    >
      <BrainCircuit size={iconSize} />
      <span className="font-medium">AI</span>
    </span>
  );
}
