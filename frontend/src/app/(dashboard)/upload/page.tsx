"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { AnalysisModeSelector } from "@/components/credits/AnalysisModeSelector";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import type { AnalysisMode } from "@/components/credits/AnalysisModeSelector";
import { api } from "@/lib/api";
import { AlertTriangle, Clock, Zap, X } from "lucide-react";

const MAX_CHUNK_CHARS = 3000;
const AI_TIME_PER_CHUNK_MS = 5000;
const CHUNK_DELAY_MS = 60000;

function estimateAnalysisTime(fileSizeBytes: number): { minutes: number; chunks: number } {
  const estimatedChars = Math.round(fileSizeBytes * 0.1);
  const chunks = Math.max(1, Math.ceil(estimatedChars / MAX_CHUNK_CHARS));
  const timeMs = chunks * AI_TIME_PER_CHUNK_MS + Math.max(0, chunks - 1) * CHUNK_DELAY_MS;
  return { minutes: Math.ceil(timeMs / 60000), chunks };
}

const guidelines = [
  {
    title: "Supported Languages",
    items: ["English", "Bengali (বাংলা)", "Hindi (हिन्दी)"],
    note: "For the highest accuracy and best AI-generated answers, English question papers are recommended.",
  },
  {
    title: "Recommended File Quality",
    items: [
      "Upload clear, high-resolution PDF files.",
      "Ensure all text is readable and not blurry.",
      "Avoid tilted, rotated, or cropped pages.",
      "Use scanned documents with good lighting and contrast.",
      "Make sure all questions are fully visible.",
    ],
  },
  {
    title: "Supported File Formats",
    items: ["PDF (.pdf)", "JPG (.jpg)", "JPEG (.jpeg)", "PNG (.png)"],
  },
  {
    title: "File Size Limit",
    items: ["Up to 20 MB for optimal performance."],
    note: "Larger files may take longer to process and analyze.",
  },
  {
    title: "Question Limits",
    items: ["Up to 200 questions per upload for the best experience."],
    note: "The system can process larger question papers, but analysis time may increase depending on number of pages, number of questions, question complexity, and subjective answer generation requirements.",
  },
  {
    title: "Tips for Better Results",
    items: [
      "Use English question papers whenever possible.",
      "Upload the original PDF instead of screenshots.",
      "Ensure page numbers and question numbers are clearly visible.",
      "Avoid handwritten documents.",
      "Verify that questions are properly aligned and not overlapping.",
    ],
  },
  {
    title: "Processing Time",
    items: [],
    note: "Processing time depends on file size, number of pages, number of questions, and language used. Larger files may require additional time for AI analysis and answer generation.",
  },
];

export default function UploadPage() {
  const [selectedFileSize, setSelectedFileSize] = useState<number>(0);
  const [creditEstimate, setCreditEstimate] = useState<{
    requiredCredits: number;
    availableCredits: number;
    hasEnoughCredits: boolean;
  } | null>(null);
  const [creditCheckLoading, setCreditCheckLoading] = useState(false);
  const [insufficientModal, setInsufficientModal] = useState<{
    required: number;
    available: number;
  } | null>(null);

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("full");
  const [pendingUploadId, setPendingUploadId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<{ minutes: number; chunks: number } | null>(null);

  const handleFilesChange = useCallback(async (files: File[]) => {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    setSelectedFileSize(totalSize);

    if (totalSize === 0) {
      setCreditEstimate(null);
      return;
    }

    setCreditCheckLoading(true);
    try {
      const res = await api.post("/credits/estimate", {
        fileSize: totalSize,
        analysisType: "full",
      });
      setCreditEstimate(res.data);
    } catch {
      setCreditEstimate(null);
    } finally {
      setCreditCheckLoading(false);
    }
  }, []);

  const handleUploadComplete = (uploadId: string, fileSize: number) => {
    setPendingUploadId(uploadId);
    setAnalysisMode("full");
  };

  const handleStartAnalysis = () => {
    if (!pendingUploadId) return;
    const id = pendingUploadId;
    const estimate = estimateAnalysisTime(selectedFileSize || 1);

    setPendingUploadId(null);
    setEstimatedTime(null);

    if (estimate.minutes > 2) {
      setEstimatedTime(estimate);
      setPendingUploadId(id);
    } else {
      setAnalyzingId(id);
      api.post(`/analyze/${id}?mode=${analysisMode}`).catch(() => {});
    }
  };

  const handleProceedAnalysis = () => {
    if (!pendingUploadId) return;
    const id = pendingUploadId;
    setEstimatedTime(null);
    setPendingUploadId(null);
    setAnalyzingId(id);
    api.post(`/analyze/${id}?mode=${analysisMode}`).catch(() => {});
  };

  const handleCancelAnalysis = () => {
    setEstimatedTime(null);
    setPendingUploadId(null);
  };

  const handleDismissStatus = () => {
    if (!analyzingId) return;
    api.delete(`/upload/${analyzingId}`).catch(() => {});
    setAnalyzingId(null);
  };

  const handleInsufficientDonate = () => {
    window.open("upi://pay?pa=aniketrajak6291@oksbi&tn=Support%20FOURI", "_blank");
    setInsufficientModal(null);
  };

  const handleInsufficientBasic = () => {
    if (!creditEstimate) return;
    setInsufficientModal(null);
    setCreditEstimate({
      ...creditEstimate,
      requiredCredits: Math.max(1, Math.ceil(creditEstimate.requiredCredits * 0.4)),
      hasEnoughCredits: creditEstimate.availableCredits >= Math.max(1, Math.ceil(creditEstimate.requiredCredits * 0.4)),
    });
    setAnalysisMode("basic");
  };

  const handleInsufficientTryTomorrow = () => {
    setInsufficientModal(null);
    modalShownForRef.current = null;
  };

  const modalShownForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!creditEstimate || creditEstimate.hasEnoughCredits) {
      return;
    }
    const key = `${creditEstimate.requiredCredits}-${creditEstimate.availableCredits}`;
    if (modalShownForRef.current === key) return;
    modalShownForRef.current = key;
    setInsufficientModal({
      required: creditEstimate.requiredCredits,
      available: creditEstimate.availableCredits,
    });
  }, [creditEstimate]);

  useEffect(() => {
    api
      .get("/upload")
      .then((res) => {
        const uploads = res.data.uploads || [];
        const active = uploads.find(
          (u: { status: string }) =>
            u.status === "PROCESSING" || u.status === "ANALYZING"
        );
        if (active) {
          setAnalyzingId(active.id);
        }
      })
      .catch(() => {});
  }, []);

  const needsCreditCheck = !creditCheckLoading && creditEstimate && selectedFileSize > 0;
  const hasEnoughCredits = needsCreditCheck ? creditEstimate.hasEnoughCredits : true;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Upload Question Paper</h1>
        <p className="text-zinc-500 mt-1">
          Upload your question papers and we&apos;ll analyze them with AI to create mock tests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <FileUpload
          onUploadComplete={handleUploadComplete}
          onFilesChange={handleFilesChange}
          disabled={!hasEnoughCredits && selectedFileSize > 0}
          creditInfo={
            creditCheckLoading
              ? null
              : creditEstimate
                ? {
                    estimatedCost: creditEstimate.requiredCredits,
                    availableCredits: creditEstimate.availableCredits,
                    hasEnoughCredits: creditEstimate.hasEnoughCredits,
                  }
                : null
          }
        />

        {insufficientModal && (
          <div className="px-6 pb-6">
            <InsufficientCreditsModal
              required={insufficientModal.required}
              available={insufficientModal.available}
              onDonate={handleInsufficientDonate}
              onBasicAnalysis={handleInsufficientBasic}
              onTryTomorrow={handleInsufficientTryTomorrow}
            />
          </div>
        )}

        {pendingUploadId && !estimatedTime && (
          <div className="px-6 pb-6 space-y-4">
            <AnalysisModeSelector
              selected={analysisMode}
              onChange={setAnalysisMode}
              baseCreditCost={creditEstimate?.requiredCredits ?? 10}
            />

            {(() => {
              const modeCost = {
                basic: 0.4,
                standard: 0.7,
                full: 1.0,
              }[analysisMode];
              const cost = Math.max(1, Math.ceil((creditEstimate?.requiredCredits ?? 10) * modeCost));
              return (
                <div className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-zinc-600" />
                    <span className="text-sm text-zinc-700">
                      Cost: <strong>{cost}</strong> Credit{cost !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-zinc-400">
                      (Available: {creditEstimate?.availableCredits ?? "?"})
                    </span>
                  </div>
                  <button
                    onClick={handleStartAnalysis}
                    className="h-9 px-5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 cursor-pointer"
                  >
                    Start Analysis
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {estimatedTime && (
          <div className="px-6 pb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-900">
                    Estimated Analysis Time: <strong>{estimatedTime.minutes} minutes</strong>
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    This file is large and may take longer to analyze. FOURI is completely free for students and operates within AI API, database, server, and infrastructure limits. Thank you for your patience and understanding.
                  </p>
                  <p className="text-sm text-amber-800">
                    If you&apos;d like to support the platform, you can donate any amount via UPI: <span className="font-mono font-semibold">aniketrajak6291@oksbi</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-amber-700">
                    <Clock size={14} />
                    {estimatedTime.chunks} chunk{estimatedTime.chunks > 1 ? "s" : ""} &bull; ~{estimatedTime.minutes} minute{estimatedTime.minutes > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleProceedAnalysis}
                  className="flex-1 h-9 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 cursor-pointer"
                >
                  Proceed Anyway
                </button>
                <button
                  onClick={handleCancelAnalysis}
                  className="flex-1 h-9 rounded-lg border border-amber-300 text-amber-800 text-sm font-medium hover:bg-amber-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {analyzingId && (
          <div className="px-6 pb-6">
            <div className="relative">
              <button
                onClick={handleDismissStatus}
                className="absolute -top-2 -right-2 z-10 p-1.5 rounded-full bg-white border border-zinc-200 shadow-sm hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Cancel analysis"
              >
                <X size={14} />
              </button>
              <ProcessingStatus uploadId={analyzingId} />
            </div>
          </div>
        )}
      </Card>

      <details className="group">
        <summary className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 cursor-pointer select-none py-2">
          <span className="transition-transform group-open:rotate-90">›</span>
          Upload Guidelines
        </summary>
        <div className="mt-4 space-y-6">
          {guidelines.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-zinc-900 rounded-full" />
                {section.title}
              </h3>
              {section.items.length > 0 && (
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="text-sm text-zinc-600 flex items-start gap-2"
                    >
                      <span className="text-zinc-300 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.note && (
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{section.note}</p>
              )}
            </div>
          ))}
          <p className="text-xs text-zinc-400 border-t border-zinc-100 pt-4">
            FOURI will automatically extract questions, identify question types, and generate mock tests from your uploaded document.
          </p>
        </div>
      </details>
    </div>
  );
}
