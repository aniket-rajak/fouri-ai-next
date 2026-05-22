"use client";

import { useEffect } from "react";

export function Analytics() {
  useEffect(() => {
    const init = async () => {
      try {
        const { isSupported } = await import("firebase/analytics");
        const supported = await isSupported();
        if (!supported) return;

        const { getApps, getApp } = await import("firebase/app");
        if (getApps().length === 0) return;

        const { getAnalytics, logEvent } = await import("firebase/analytics");
        const analytics = getAnalytics(getApp());
        logEvent(analytics, "page_view", {
          page_location: window.location.href,
          page_title: document.title,
        });
      } catch {
        // analytics unavailable
      }
    };
    init();
  }, []);

  return null;
}
