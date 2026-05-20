"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Upload Question Paper</h1>
        <p className="text-zinc-500 mt-1">
          Upload your question papers and we'll analyze them with AI to create mock tests.
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
    </div>
  );
}
