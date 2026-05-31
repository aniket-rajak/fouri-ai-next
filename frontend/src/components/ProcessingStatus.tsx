"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface UploadStatus {
  status: string;
  uploadId: string;
  mockTest: { id: string; title: string; totalQuestions: number } | null;
  failureReason?: string;
}

export function ProcessingStatus({ uploadId }: { uploadId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await api.get(`/analyze/${uploadId}/status`);
        if (cancelled) return;
        setStatus(res.data);

        if (res.data.status === "PROCESSING" || res.data.status === "ANALYZING") {
          setTimeout(poll, 2000);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [uploadId]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
        <XCircle size={16} />
        Failed to check processing status
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 size={16} className="animate-spin" />
        Starting analysis...
      </div>
    );
  }

  if (status.status === "PROCESSING" || status.status === "ANALYZING") {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
        <Loader2 size={16} className="animate-spin" />
        AI is analyzing your question paper...
      </div>
    );
  }

  if (status.status === "COMPLETED" && status.mockTest) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
          <CheckCircle2 size={16} />
          Mock test ready: {status.mockTest.title} ({status.mockTest.totalQuestions} questions)
        </div>
        <button
          onClick={() => router.push(`/test/${status.mockTest!.id}`)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition-all cursor-pointer"
        >
          Start Mock Test <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  if (status.status === "FAILED") {
    return (
      <div className="space-y-2 p-3 rounded-lg bg-red-50 border border-red-200">
        <div className="flex items-center gap-2 text-sm text-red-700">
          <XCircle size={16} className="shrink-0 mt-0.5" />
          <span className="font-medium">Analysis failed</span>
        </div>
        <p className="text-sm text-red-600 ml-7">
          {status.failureReason || "Something went wrong. Please try uploading again."}
        </p>
      </div>
    );
  }

  return null;
}
