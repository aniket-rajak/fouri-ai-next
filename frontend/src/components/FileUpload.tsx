"use client";

import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File as FileIcon, X, CheckCircle2, AlertCircle, Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface UploadedFile {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: string;
  totalPages?: number | null;
}

interface FileWithPreview extends File {
  pageCount?: number;
}

interface FileUploadProps {
  onUploadComplete?: (uploadId: string, fileSize: number, totalPages?: number | null) => void;
  onFilesChange?: (files: File[]) => void;
  onUploadsChange?: (uploads: UploadedFile[]) => void;
  disabled?: boolean;
  creditInfo?: {
    estimatedCost: number;
    availableCredits: number;
    hasEnoughCredits: boolean;
  } | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function countPdfPages(file: File): Promise<number> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const warn = console.warn;
  console.warn = () => {};
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  } finally {
    console.warn = warn;
  }
}

const dedupeFiles = (prev: FileWithPreview[], incoming: FileWithPreview[]) => {
  const seen = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`));
  const unique = incoming.filter(f => !seen.has(`${f.name}-${f.size}-${f.lastModified}`));
  if (unique.length === 0) return prev;
  return [...prev, ...unique];
};

export function FileUpload({ onUploadComplete, onFilesChange, onUploadsChange, disabled, creditInfo }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const filesRef = useRef(files);
  filesRef.current = files;

  const onDrop = useCallback(async (accepted: FileWithPreview[]) => {
    setError(null);
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const enriched: FileWithPreview[] = [];
      for (const file of accepted) {
        if (file.type === "application/pdf") {
          let pages = 0;
          try {
            pages = await countPdfPages(file);
          } catch {
            pages = 0;
          }
          (file as FileWithPreview).pageCount = pages;
        }
        enriched.push(file);
      }

      const next = dedupeFiles(filesRef.current, enriched);
      setFiles(next);
      onFilesChange?.(next);
    } finally {
      processingRef.current = false;
    }
  }, [onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noDragEventsBubbling: true,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
    maxSize: 20 * 1024 * 1024,
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors[0]?.message || "File not accepted";
      setError(msg);
    },
  });

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesChange?.(next);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await api.post("/upload", formData, {
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });
      const uploads = res.data.uploads as UploadedFile[];
      setUploadedFiles(uploads);
      setFiles([]);
      setProgress(100);
      onUploadsChange?.(uploads);
      if (onUploadComplete && uploads?.[0]?.id) {
        onUploadComplete(uploads[0].id, uploads[0].fileSize, uploads[0].totalPages);
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error;
      setError(serverMsg || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const hasPdf = files.some((f) => f.type === "application/pdf");

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-300 hover:border-zinc-400"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-zinc-100">
            <Upload size={24} className="text-zinc-600" />
          </div>
          {isDragActive ? (
            <p className="text-sm font-medium text-zinc-900">
              Drop files here
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-900">
                Drag & drop files or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-zinc-500">
                PDF, JPG, PNG · Max 20MB each
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-900">
            {files.length} file(s) selected
          </h3>
          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-zinc-200"
              >
                <div className={cn(
                  "p-1.5 rounded shrink-0",
                  file.type === "application/pdf" ? "bg-amber-100" : "bg-zinc-100"
                )}>
                  {file.type === "application/pdf"
                    ? <BookOpen size={16} className="text-amber-700" />
                    : <FileIcon size={16} className="text-zinc-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {file.type === "application/pdf"
                      ? `PDF${(file as FileWithPreview).pageCount ? ` \u00b7 ${(file as FileWithPreview).pageCount} pages` : ""} \u00b7 ${formatSize(file.size)}`
                      : formatSize(file.size)
                    }
                  </p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {creditInfo && files.length > 0 && !uploading && uploadedFiles.length === 0 && (
            <div className={`p-3 rounded-lg border text-sm ${
              creditInfo.hasEnoughCredits
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              <p className="font-medium">
                Estimated AI Cost: {creditInfo.estimatedCost} Credits
              </p>
              <p className="text-xs mt-0.5">
                Available: {creditInfo.availableCredits} Credits
                {creditInfo.hasEnoughCredits
                  ? ` \u2192 ${Math.max(0, creditInfo.availableCredits - creditInfo.estimatedCost)} after analysis`
                  : " \u2014 Insufficient"}
              </p>
            </div>
          )}

          {uploading && (
            <div className="space-y-1">
              <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 text-right">{progress}%</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || disabled}
            className="w-full h-10 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      )}

      {uploadedFiles.length > 0 && uploadedFiles.some(f => f.status === "PROCESSING" || f.status === "COMPLETED") && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-green-700 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Uploaded successfully
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className={cn(
                  "p-1.5 rounded shrink-0",
                  f.fileType === "application/pdf" ? "bg-green-100" : "bg-green-100"
                )}>
                  {f.fileType === "application/pdf"
                    ? <BookOpen size={16} className="text-green-600" />
                    : <CheckCircle2 size={16} className="text-green-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {f.filename}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {f.fileType === "application/pdf"
                      ? `PDF${f.totalPages ? ` \u00b7 ${f.totalPages} pages` : ""} \u00b7 ${formatSize(f.fileSize)}`
                      : formatSize(f.fileSize)
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
