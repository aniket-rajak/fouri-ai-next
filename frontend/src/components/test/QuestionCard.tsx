"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

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
    setTextValue(selectedOption || "");
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400 font-medium">
            Question {question.order}
          </span>
          <h2 className="text-lg font-medium text-zinc-900 leading-relaxed">
            {question.questionText}
          </h2>
        </div>
        <button
          onClick={() => onToggleMark(question.id)}
          className={cn(
            "shrink-0 p-2 rounded-lg transition-colors cursor-pointer",
            isMarked
              ? "bg-amber-100 text-amber-600"
              : "text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100"
          )}
        >
          <Bookmark size={18} fill={isMarked ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="space-y-3">
        {options.length === 0 && question.type !== "SUBJECTIVE" && (
          <div className="p-4 rounded-xl border-2 border-dashed border-zinc-300 text-center text-sm text-zinc-500">
            No options available for this question
          </div>
        )}
        {options.length === 0 && question.type === "SUBJECTIVE" && (
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={() => onSelect(question.id, textValue)}
            placeholder="Type your answer here..."
            rows={6}
            className="w-full p-4 rounded-xl border-2 border-zinc-200 focus:border-zinc-900 focus:outline-none resize-y text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors"
          />
        )}
        {options.length > 0 && options.map((option, i) => {
          const label = String.fromCharCode(65 + i);
          const isSelected = selectedOption === option;
          return (
            <button
              key={option}
              onClick={() => onSelect(question.id, option)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all cursor-pointer",
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
              <span className="text-sm text-zinc-900">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
