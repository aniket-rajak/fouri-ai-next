"use client";

import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";

interface PaletteQuestion {
  id: string;
  order: number;
}

interface QuestionPaletteProps {
  questions: PaletteQuestion[];
  currentIndex: number;
  answeredIds: Set<string>;
  markedIds: Set<string>;
  onSelect: (index: number) => void;
}

export function QuestionPalette({
  questions,
  currentIndex,
  answeredIds,
  markedIds,
  onSelect,
}: QuestionPaletteProps) {
  const markedQuestions = questions.filter((q) => markedIds.has(q.id));

  return (
    <div>
      {/* Marked Questions Section */}
      {markedQuestions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1.5">
            <Bookmark size={14} fill="currentColor" />
            Marked for Review ({markedQuestions.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {markedQuestions.map((q) => {
              const idx = questions.findIndex((x) => x.id === q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => onSelect(idx)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                    idx === currentIndex
                      ? "ring-2 ring-zinc-900 ring-offset-1 bg-amber-400 text-white"
                      : "bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200"
                  )}
                >
                  {q.order}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All Questions Grid */}
      <h3 className="text-sm font-medium text-zinc-900 mb-3">All Questions</h3>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
        {questions.map((q, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answeredIds.has(q.id);
          const isMarked = markedIds.has(q.id);

          return (
            <button
              key={q.id}
              onClick={() => onSelect(i)}
              className={cn(
                "w-full aspect-square rounded-lg text-xs font-medium transition-colors cursor-pointer",
                isCurrent && "ring-2 ring-zinc-900 ring-offset-1",
                isAnswered && !isMarked && "bg-zinc-900 text-white",
                isMarked && !isAnswered && "bg-amber-100 text-amber-700 border border-amber-300",
                isMarked && isAnswered && "bg-amber-400 text-white",
                !isAnswered && !isMarked && "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              )}
            >
              {q.order}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-zinc-900" />
          Answered
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          Marked for review
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-zinc-100" />
          Not answered
        </div>
      </div>
    </div>
  );
}
