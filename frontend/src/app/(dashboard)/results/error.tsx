"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Results page error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">
          Failed to load results
        </h2>
        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
          Something went wrong while loading this page. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    </div>
  );
}
