"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File as FileIcon, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface UploadedFile {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string | null;
  status: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

interface FileUploadProps {
  onUploadComplete?: (uploadId: string, fileSize: number) => void;
  onFilesChange?: (files: File[]) => void;
  disabled?: boolean;
  creditInfo?: {
    estimatedCost: number;
    availableCredits: number;
    hasEnoughCredits: boolean;
  } | null;
}

export function FileUpload({ onUploadComplete, onFilesChange, disabled, creditInfo }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: FileWithPreview[]) => {
    setError(null);
    const next = [...files, ...accepted];
    setFiles(next);
    onFilesChange?.(next);
  }, [onFilesChange, files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
      const uploads = res.data.uploads;
      setUploadedFiles(uploads);
      setFiles([]);
      setProgress(100);
      if (onUploadComplete && uploads?.[0]?.id) {
        onUploadComplete(uploads[0].id, uploads[0].fileSize);
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error;
      setError(serverMsg || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
                JPG, PNG, JPEG, PDF · Max 20MB each
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
                <div className="p-1.5 rounded bg-zinc-100">
                  <FileIcon size={16} className="text-zinc-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatSize(file.size)}
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
                  ? ` → ${Math.max(0, creditInfo.availableCredits - creditInfo.estimatedCost)} after analysis`
                  : " — Insufficient"}
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

      {uploadedFiles.length > 0 && (
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
                <div className="p-1.5 rounded bg-green-100">
                  <CheckCircle2 size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {f.filename}
                  </p>
                  <p className="text-xs text-zinc-500 capitalize">
                    {f.status.toLowerCase()}
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
