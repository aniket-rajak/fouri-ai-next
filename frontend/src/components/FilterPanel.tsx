"use client";

import { X, ChevronDown } from "lucide-react";

interface FilterPanelProps {
  subjects: string[];
  examTypes: string[];
  selectedSubject: string;
  selectedExamType: string;
  selectedDifficulty: string;
  sort: string;
  onSubjectChange: (v: string) => void;
  onExamTypeChange: (v: string) => void;
  onDifficultyChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onClear: () => void;
}

export function FilterPanel({
  subjects,
  examTypes,
  selectedSubject,
  selectedExamType,
  selectedDifficulty,
  sort,
  onSubjectChange,
  onExamTypeChange,
  onDifficultyChange,
  onSortChange,
  onClear,
}: FilterPanelProps) {
  const hasFilters = selectedSubject || selectedExamType || selectedDifficulty || sort !== "newest";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-900">Filters</h3>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="relative">
          <select
            value={selectedSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="h-10 rounded-lg border border-zinc-300 px-3 pr-10 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 appearance-none cursor-pointer w-full"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={selectedExamType}
            onChange={(e) => onExamTypeChange(e.target.value)}
            className="h-10 rounded-lg border border-zinc-300 px-3 pr-10 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 appearance-none cursor-pointer w-full"
          >
            <option value="">All Exams</option>
            {examTypes.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="h-10 rounded-lg border border-zinc-300 px-3 pr-10 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 appearance-none cursor-pointer w-full"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-10 rounded-lg border border-zinc-300 px-3 pr-10 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 appearance-none cursor-pointer w-full"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
