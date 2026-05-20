"use client";

import { cn } from "@/lib/utils";

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
  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-900 mb-3">Questions</h3>
      <div className="grid grid-cols-5 gap-2">
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
