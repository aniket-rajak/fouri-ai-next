"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

interface Answer {
  questionId: string;
  selectedOption: string | null;
}

const STORAGE_KEY_PREFIX = "fouri_attempt_";

export function useAutoSave(
  attemptId: string | null,
  answers: Answer[],
  isActive: boolean
) {
  const savedRef = useRef(false);

  const saveToLocal = () => {
    if (!attemptId) return;
    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${attemptId}`,
        JSON.stringify({ answers, savedAt: Date.now() })
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
    if (!savedRef.current && answers.length > 0) {
      save();
      savedRef.current = true;
    }

    const interval = setInterval(save, 30000);
    return () => {
      clearInterval(interval);
      save(); // flush on unmount
    };
  }, [attemptId, answers, isActive]);

  const restoreFromLocal = (): Answer[] | null => {
    if (!attemptId) return null;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.answers;
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
