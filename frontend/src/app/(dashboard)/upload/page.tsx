"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { AlertTriangle, Clock } from "lucide-react";

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
    items: [
      "English",
      "Bengali (বাংলা)",
      "Hindi (हिन्दी)",
    ],
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
    items: [
      "PDF (.pdf)",
      "JPG (.jpg)",
      "JPEG (.jpeg)",
      "PNG (.png)",
    ],
  },
  {
    title: "File Size Limit",
    items: [
      "Up to 20 MB for optimal performance.",
    ],
    note: "Larger files may take longer to process and analyze.",
  },
  {
    title: "Question Limits",
    items: [
      "Up to 200 questions per upload for the best experience.",
    ],
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
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<{ minutes: number; chunks: number } | null>(null);
  const [pendingUploadId, setPendingUploadId] = useState<string | null>(null);

  const handleUploadComplete = (uploadId: string, fileSize: number) => {
    const estimate = estimateAnalysisTime(fileSize);

    if (estimate.minutes > 2) {
      setEstimatedTime(estimate);
      setPendingUploadId(uploadId);
    } else {
      setAnalyzingId(uploadId);
      api.post(`/analyze/${uploadId}`).catch(() => {});
    }
  };

  const handleProceedAnalysis = () => {
    if (!pendingUploadId) return;
    const id = pendingUploadId;
    setEstimatedTime(null);
    setPendingUploadId(null);
    setAnalyzingId(id);
    api.post(`/analyze/${id}`).catch(() => {});
  };

  const handleCancelAnalysis = () => {
    setEstimatedTime(null);
    setPendingUploadId(null);
  };

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
        <FileUpload onUploadComplete={handleUploadComplete} />

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
                    {estimatedTime.chunks} chunk{estimatedTime.chunks > 1 ? 's' : ''} &bull; ~{estimatedTime.minutes} minute{estimatedTime.minutes > 1 ? 's' : ''}
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
            <ProcessingStatus uploadId={analyzingId} />
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
