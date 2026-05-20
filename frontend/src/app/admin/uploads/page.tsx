"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Loader2, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";

interface AdminUpload {
  id: string;
  filename: string;
  fileType: string;
  status: string;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  mockTests: { id: string; title: string }[];
}

const statusConfig: Record<string, { icon: typeof Clock; color: string }> = {
  PROCESSING: { icon: Clock, color: "text-amber-600 bg-amber-50" },
  ANALYZING: { icon: Clock, color: "text-blue-600 bg-blue-50" },
  COMPLETED: { icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  FAILED: { icon: XCircle, color: "text-red-600 bg-red-50" },
};

export default function AdminUploadsPage() {
  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/uploads")
      .then((res) => setUploads(res.data.uploads))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Uploads</h1>
      <div className="space-y-3">
        {uploads.map((upload) => {
          const config = statusConfig[upload.status] || statusConfig.PROCESSING;
          const StatusIcon = config.icon;
          return (
            <Card key={upload.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-zinc-100 shrink-0">
                    <FileText size={18} className="text-zinc-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 truncate">
                      {upload.filename}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {upload.user.name || upload.user.email}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {upload.fileType} · {new Date(upload.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.color}`}>
                    <StatusIcon size={12} />
                    {upload.status.toLowerCase()}
                  </span>
                  {upload.mockTests?.length > 0 && (
                    <span className="text-xs text-zinc-500">
                      {upload.mockTests.length} test(s)
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
