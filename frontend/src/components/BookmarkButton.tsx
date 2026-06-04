"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Bookmark, Loader2 } from "lucide-react";

interface BookmarkButtonProps {
  testId: string;
  isBookmarked: boolean;
  onToggle?: (newState: boolean) => void;
  size?: "sm" | "md";
}

export function BookmarkButton({ testId, isBookmarked, onToggle, size = "md" }: BookmarkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [localState, setLocalState] = useState(isBookmarked);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const newState = !localState;
    setLocalState(newState);
    setLoading(true);

    try {
      if (newState) {
        await api.post(`/tests/${testId}/bookmark`);
      } else {
        await api.delete(`/tests/${testId}/bookmark`);
      }
      onToggle?.(newState);
    } catch {
      setLocalState(!newState);
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === "sm" ? 14 : 18;

  return (
    <button
      onClick={handleToggle}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        localState
          ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
          : "text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100"
      }`}
      title={localState ? "Remove bookmark" : "Bookmark this test"}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        <Bookmark
          size={iconSize}
          fill={localState ? "currentColor" : "none"}
        />
      )}
    </button>
  );
}
