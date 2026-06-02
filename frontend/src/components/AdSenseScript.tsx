"use client";

import { useEffect } from "react";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-2512689434819222";

export function AdSenseScript() {
  useEffect(() => {
    const injectScript = () => {
      if (document.querySelector('script[src*="adsbygoogle"]')) return;
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    };

    const checkConsent = () => {
      const stored = localStorage.getItem("fouri_cookie_consent");
      if (stored === "accepted") {
        injectScript();
        clearInterval(interval);
        clearTimeout(timeout);
      }
    };

    const interval = setInterval(checkConsent, 500);
    const timeout = setTimeout(() => clearInterval(interval), 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return null;
}
