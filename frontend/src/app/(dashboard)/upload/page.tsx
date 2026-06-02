"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";

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

  const handleUploadComplete = async (uploadId: string) => {
    setAnalyzingId(uploadId);
    try {
      await api.post(`/analyze/${uploadId}`);
    } catch {
      // error handled by ProcessingStatus polling
    }
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
