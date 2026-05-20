"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TimerOptions {
  startTime: string; // ISO string from server
  duration: number; // in seconds
  onTimeUp: () => void;
  onTabSwitch?: () => void;
}

export function useTestTimer({
  startTime,
  duration,
  onTimeUp,
}: TimerOptions) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const submittedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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
          if (next >= 2 && !submittedRef.current) {
            submittedRef.current = true;
            clearTimer();
            onTimeUp();
          }
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [onTimeUp, clearTimer]);

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
