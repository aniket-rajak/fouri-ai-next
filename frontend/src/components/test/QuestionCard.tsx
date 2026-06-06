"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { MathContent } from "@/components/ui/MathContent";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  type: string;
  difficulty: string;
  order: number;
}

interface QuestionCardProps {
  question: Question;
  selectedOption: string | null;
  onSelect: (questionId: string, option: string) => void;
  isMarked: boolean;
  onToggleMark: (questionId: string) => void;
}

function normalizeOptions(options: unknown): string[] {
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try { return JSON.parse(options); } catch { return []; }
  }
  if (options && typeof options === "object") {
    const vals = Object.values(options as Record<string, unknown>);
    if (vals.every((v) => typeof v === "string")) return vals as string[];
  }
  return [];
}

export function QuestionCard({
  question,
  selectedOption,
  onSelect,
  isMarked,
  onToggleMark,
}: QuestionCardProps) {
  const options = normalizeOptions(question.options);
  const [textValue, setTextValue] = useState(selectedOption || "");

  // Sync local state when question changes or selectedOption updates from outside
  useEffect(() => {
    queueMicrotask(() => setTextValue(selectedOption || ""));
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="space-y-1 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
        <span className="text-xs text-zinc-400 font-medium">
          Question {question.order}
        </span>
        <h2 className="text-lg font-medium text-zinc-900 leading-relaxed break-words">
          <MathContent text={question.questionText} />
        </h2>
      </div>

      <div className="space-y-4">
        {options.length === 0 ? (
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={() => onSelect(question.id, textValue)}
            placeholder="Type your answer here..."
            rows={6}
            className="w-full p-4 rounded-xl border-2 border-zinc-200 focus:border-zinc-900 focus:outline-none resize-y text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors"
          />
        ) : (
          options.map((option, i) => {
            const label = String.fromCharCode(65 + i);
            const isSelected = selectedOption === option;
            return (
              <button
                key={option}
                onClick={() => onSelect(question.id, option)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0",
                    isSelected
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600"
                  )}
                >
                  {label}
                </span>
                <span className="text-sm text-zinc-900 leading-relaxed whitespace-normal break-words"><MathContent text={option} /></span>
              </button>
            );
          })
        )}
      </div>

      {/* Mark for Review — full width bottom bar */}
      <button
        onClick={() => onToggleMark(question.id)}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 sm:py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer",
          isMarked
            ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
            : "border-zinc-200 text-zinc-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50"
        )}
      >
        <Bookmark size={16} fill={isMarked ? "currentColor" : "none"} />
        {isMarked ? "Marked for Review" : "Mark for Review"}
      </button>
    </div>
  );
}
