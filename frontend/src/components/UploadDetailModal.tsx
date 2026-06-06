"use client";

import { useState } from "react";
import { X, BookOpen, Clock, CheckCircle2, AlertCircle, Zap, ChevronDown, ChevronRight, FileText } from "lucide-react";

interface PageBreakdownItem {
  pageIndex: number;
  imageSize?: number;
  textLength?: number;
  estimatedTokens: number;
  estimatedImageSize?: number;
}

interface UploadDetailData {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: string;
  totalPages: number | null;
  processingMeta: {
    creditsUsed: number;
    creditsPerPage: number | null;
    pagesProcessed: number | null;
    ocrCompletedAt: string;
    pageBreakdown?: PageBreakdownItem[];
  } | null;
  pageEstimates?: { pageIndex: number; estimatedImageSize: number; estimatedTokens: number }[] | null;
  failureReason: string | null;
  createdAt: string;
  mockTest: { id: string; totalQuestions: number; difficulty: string } | null;
}

interface UploadDetailModalProps {
  upload: UploadDetailData;
  onClose: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function PageBreakdownTable({ items, totalPages }: { items: PageBreakdownItem[]; totalPages: number | null }) {
  const [open, setOpen] = useState(false);

  if (!items || items.length === 0) return null;

  const showTextLength = items.some((p) => p.textLength !== undefined);
  const totalImageSize = items.reduce((s, p) => s + (p.imageSize ?? p.estimatedImageSize ?? 0), 0);
  const totalTokens = items.reduce((s, p) => s + p.estimatedTokens, 0);

  return (
    <div className="bg-zinc-50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-left cursor-pointer hover:bg-zinc-100/50 transition-colors"
      >
        <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
          <FileText size={14} />
          Page Breakdown
          <span className="text-zinc-400 font-normal">
            ({items.length} {totalPages ? `of ${totalPages}` : "pages"})
          </span>
        </span>
        {open ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-400" />}
      </button>

      {open && (
        <div className="px-3 pb-3 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-200">
                <th className="text-left py-1.5 pr-2 font-medium">Page</th>
                <th className="text-right py-1.5 px-2 font-medium">File Size</th>
                {showTextLength && <th className="text-right py-1.5 px-2 font-medium">Chars</th>}
                <th className="text-right py-1.5 pl-2 font-medium">Est. Tokens</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.pageIndex} className="border-b border-zinc-100 last:border-b-0">
                  <td className="py-1.5 pr-2 text-zinc-700">Page {p.pageIndex}</td>
                  <td className="text-right py-1.5 px-2 text-zinc-600">
                    {p.imageSize ? formatSize(p.imageSize) : p.estimatedImageSize ? formatSize(p.estimatedImageSize) : "-"}
                  </td>
                  {showTextLength && (
                    <td className="text-right py-1.5 px-2 text-zinc-600">
                      {p.textLength ? p.textLength.toLocaleString() : "-"}
                    </td>
                  )}
                  <td className="text-right py-1.5 pl-2 text-zinc-600">{p.estimatedTokens.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium text-zinc-800">
                <td className="py-2 pr-2">Total</td>
                <td className="text-right py-2 px-2">{formatSize(totalImageSize)}</td>
                {showTextLength && <td className="text-right py-2 px-2">-</td>}
                <td className="text-right py-2 pl-2">{totalTokens.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export function UploadDetailModal({ upload, onClose }: UploadDetailModalProps) {
  const statusColor = {
    PROCESSING: "text-blue-600 bg-blue-50",
    ANALYZING: "text-amber-600 bg-amber-50",
    COMPLETED: "text-green-600 bg-green-50",
    FAILED: "text-red-600 bg-red-50",
  }[upload.status] || "text-zinc-600 bg-zinc-50";

  const pageBreakdownItems: PageBreakdownItem[] | null =
    upload.processingMeta?.pageBreakdown ?? null;
  const showEstimates = !pageBreakdownItems && upload.pageEstimates && upload.pageEstimates.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h3 className="text-sm font-semibold text-zinc-900">Upload Details</h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 shrink-0">
              <BookOpen size={20} className="text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{upload.filename}</p>
              <p className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {upload.status === "COMPLETED" ? <CheckCircle2 size={12} /> : upload.status === "FAILED" ? <AlertCircle size={12} /> : <Clock size={12} />}
                {upload.status}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-50 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">File Type</p>
              <p className="text-sm font-medium text-zinc-800 mt-0.5">
                {upload.fileType === "application/pdf" ? "PDF Document" : upload.fileType.toUpperCase()}
              </p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">File Size</p>
              <p className="text-sm font-medium text-zinc-800 mt-0.5">{formatSize(upload.fileSize)}</p>
            </div>
            {upload.totalPages && (
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Total Pages</p>
                <p className="text-sm font-medium text-zinc-800 mt-0.5">{upload.totalPages} pages</p>
              </div>
            )}
            <div className="bg-zinc-50 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Upload Time</p>
              <p className="text-sm font-medium text-zinc-800 mt-0.5 truncate">{formatDate(upload.createdAt)}</p>
            </div>
          </div>

          {(pageBreakdownItems || showEstimates) && (
            <PageBreakdownTable
              items={pageBreakdownItems ?? upload.pageEstimates!.map((e) => ({ ...e, estimatedImageSize: e.estimatedImageSize }))}
              totalPages={upload.totalPages}
            />
          )}

          {upload.processingMeta && (
            <div>
              <p className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1.5">
                <Zap size={14} />
                AI Processing
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Credits Used</p>
                  <p className="text-sm font-medium text-zinc-800 mt-0.5">{upload.processingMeta.creditsUsed}</p>
                </div>
                {upload.processingMeta.creditsPerPage && (
                  <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Credits Per Page</p>
                    <p className="text-sm font-medium text-zinc-800 mt-0.5">{upload.processingMeta.creditsPerPage}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {upload.failureReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{upload.failureReason}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
