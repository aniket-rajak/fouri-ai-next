"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "fouri_cookie_consent";

type ConsentChoice = "accepted" | "rejected" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentChoice>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentChoice;
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    setConsent(stored);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setConsent("rejected");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[200] p-4 sm:p-6"
        >
          <div className="max-w-3xl mx-auto bg-[#111118] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f5f5f7] mb-1">
                  We use cookies
                </p>
                <p className="text-xs text-[#888899] leading-relaxed">
                  We use essential cookies for authentication and platform functionality.
                  For personalized ads via Google AdSense, we need your consent to use
                  non-essential cookies. You can accept or reject. See our{" "}
                  <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                    Terms of Service
                  </a>
                  .
                </p>
              </div>
              <button
                onClick={() => setVisible(false)}
                className="shrink-0 p-1 rounded-lg text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5 transition-all cursor-pointer"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleAccept}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all cursor-pointer"
              >
                Accept All
              </button>
              <button
                onClick={handleReject}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 text-[#888899] text-xs font-medium hover:text-[#f5f5f7] hover:bg-white/10 transition-all cursor-pointer"
              >
                Reject Non-Essential
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
