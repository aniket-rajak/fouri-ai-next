"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

interface Answer {
  questionId: string;
  selectedOption: string | null;
}

interface StoredData {
  answers: Answer[];
  markedIds: string[];
  savedAt: number;
}

const STORAGE_KEY_PREFIX = "fouri_attempt_";

export function useAutoSave(
  attemptId: string | null,
  answers: Answer[],
  markedIds: Set<string>,
  isActive: boolean
) {
  const savedRef = useRef(false);

  const saveToLocal = () => {
    if (!attemptId) return;
    try {
      const data: StoredData = {
        answers,
        markedIds: Array.from(markedIds),
        savedAt: Date.now(),
      };
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${attemptId}`,
        JSON.stringify(data)
      );
    } catch {
      // storage full
    }
  };

  const saveToServer = async () => {
    if (!attemptId) return;
    try {
      await api.put(`/attempts/${attemptId}/save`, { answers });
    } catch {
      // will retry on next interval or final submit
    }
  };

  useEffect(() => {
    if (!isActive || !attemptId) return;

    const save = () => {
      saveToLocal();
      saveToServer();
    };

    // Save immediately on first render with data
    if (!savedRef.current && (answers.length > 0 || markedIds.size > 0)) {
      save();
      savedRef.current = true;
    }

    const interval = setInterval(save, 30000);
    return () => {
      clearInterval(interval);
      save(); // flush on unmount
    };
  }, [attemptId, answers, markedIds, isActive]);

  const restoreFromLocal = (): StoredData | null => {
    if (!attemptId) return null;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
      if (stored) {
        return JSON.parse(stored) as StoredData;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const clearLocal = () => {
    if (!attemptId) return;
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
  };

  return { restoreFromLocal, clearLocal };
}
