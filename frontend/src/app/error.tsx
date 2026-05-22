"use client";

import { useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
          <Sparkles className="w-8 h-8 text-rose-400" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-[#f5f5f7] mb-3">
          Something went wrong
        </h1>
        <p className="text-sm text-[#888899] mb-8 leading-relaxed">
          An unexpected error occurred. Please try again or contact support if the
          problem persists.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all cursor-pointer"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
}
