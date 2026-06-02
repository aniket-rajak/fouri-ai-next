"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";

interface TimerOptions {
  startTime: string;
  duration: number;
  onTimeUp: () => void;
  onTabSwitch?: () => void;
  attemptId?: string | null;
}

export function useTestTimer({
  startTime,
  duration,
  onTimeUp,
  onTabSwitch,
  attemptId,
}: TimerOptions) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const submittedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLogRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const logSuspiciousActivity = useCallback(
    async (activityType: string, metadata?: Record<string, unknown>) => {
      if (!attemptId) return;
      const now = Date.now();
      if (now - lastLogRef.current < 2000) return;
      lastLogRef.current = now;
      try {
        await api.post(`/attempts/${attemptId}/suspicious-activity`, {
          activityType,
          metadata: metadata || {},
        });
      } catch {
        // silent fail
      }
    },
    [attemptId]
  );

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const end = start + duration * 1000;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));

      setTimeLeft(remaining);

      if (remaining <= 300) setIsWarning(true);
      if (remaining <= 0 && !submittedRef.current) {
        submittedRef.current = true;
        clearTimer();
        onTimeUp();
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return clearTimer;
  }, [startTime, duration, onTimeUp, clearTimer]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitches((prev) => {
          const next = prev + 1;
          logSuspiciousActivity("TAB_SWITCH", { count: next });
          onTabSwitch?.();
          if (next >= 2 && !submittedRef.current) {
            submittedRef.current = true;
            clearTimer();
            onTimeUp();
          }
          return next;
        });
      }
    };

    const handleBlur = () => {
      logSuspiciousActivity("WINDOW_BLUR");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [onTimeUp, clearTimer, logSuspiciousActivity, onTabSwitch]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return {
    timeLeft,
    formatted: formatTime(timeLeft),
    isWarning,
    tabSwitches,
  };
}
