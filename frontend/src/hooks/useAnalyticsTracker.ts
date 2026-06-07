"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Event {
  eventType: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

const BATCH_INTERVAL = 5000;
const BATCH_MAX = 20;

export function useAnalyticsTracker(userId?: string | null) {
  const pathname = usePathname();
  const queueRef = useRef<Event[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathRef = useRef<string>("");

  const flush = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const batch = queueRef.current.splice(0, BATCH_MAX);
    fetch(`${API}/owner/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
    }).catch(() => {});
  }, []);

  const track = useCallback(
    (eventType: string, metadata?: Record<string, unknown>) => {
      queueRef.current.push({ eventType, userId, metadata });
      if (queueRef.current.length >= BATCH_MAX) flush();
    },
    [userId, flush]
  );

  const trackFeature = useCallback(
    (feature: string, extra?: Record<string, unknown>) => {
      track("FEATURE_USAGE", { feature, ...extra });
    },
    [track]
  );

  const trackSearch = useCallback(
    (query: string, resultsCount: number) => {
      track("SEARCH", { query, resultsCount });
    },
    [track]
  );

  useEffect(() => {
    intervalRef.current = setInterval(flush, BATCH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      flush();
    };
  }, [flush]);

  useEffect(() => {
    if (prevPathRef.current !== pathname && pathname) {
      prevPathRef.current = pathname;
      const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : /Tablet|iPad/i.test(navigator.userAgent) ? "tablet" : "desktop";
      track("PAGE_VIEW", {
        path: pathname,
        referrer: document.referrer || "",
        deviceType,
        browser: navigator.userAgent,
        os: navigator.platform,
      });
    }
  }, [pathname, track]);

  useEffect(() => {
    heartbeatRef.current = setInterval(() => {
      fetch(`${API}/owner/analytics/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name: "", email: "", currentPage: pathname }),
      }).catch(() => {});
    }, 30000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [userId, pathname]);

  return { track, trackFeature, trackSearch, flush };
}
