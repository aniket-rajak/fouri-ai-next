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
  isActive: boolean,
  isSubmitting?: boolean
) {
  const savedRef = useRef(false);
  const submittingRef = useRef(false);
  submittingRef.current = isSubmitting ?? false;

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const markedRef = useRef(markedIds);
  markedRef.current = markedIds;

  useEffect(() => {
    if (!isActive || !attemptId) return;

    const saveToLocal = () => {
      try {
        const data: StoredData = {
          answers: answersRef.current,
          markedIds: Array.from(markedRef.current),
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
      if (submittingRef.current) return;
      try {
        await api.put(`/attempts/${attemptId}/save`, {
          answers: answersRef.current,
          markedIds: Array.from(markedRef.current),
        });
      } catch {
        // will retry on next interval or final submit
      }
    };

    // Initial save
    if (
      !savedRef.current &&
      (answersRef.current.length > 0 || markedRef.current.size > 0)
    ) {
      saveToLocal();
      saveToServer();
      savedRef.current = true;
    }

    // Periodic save every 30s
    const interval = setInterval(() => {
      saveToLocal();
      saveToServer();
    }, 30000);

    return () => {
      clearInterval(interval);
      saveToLocal(); // cleanup: local backup only
    };
  }, [attemptId, isActive]);

  // Debounced server save: fires 3s after the last answer change
  useEffect(() => {
    if (!isActive || !attemptId) return;
    if (submittingRef.current) return;

    // Skip if no real answers yet — avoids unnecessary save on initial mount
    const hasRealAnswers = answersRef.current.some(a => a.selectedOption !== null);
    const hasMarked = markedRef.current.size > 0;
    if (!hasRealAnswers && !hasMarked) return;

    const timer = setTimeout(async () => {
      try {
        await api.put(`/attempts/${attemptId}/save`, {
          answers: answersRef.current,
          markedIds: Array.from(markedRef.current),
        });
      } catch {
        // will retry on next interval or final submit
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [answers, attemptId, isActive]);

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
