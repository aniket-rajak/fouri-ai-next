"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, X } from "lucide-react";
import { api } from "@/lib/api";

interface UploadItem {
  id: string;
  filename: string;
  status: string;
  createdAt: string;
}

export function ActiveUploadCard() {
  const [active, setActive] = useState<UploadItem | null>(null);
  const [checking, setChecking] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkActive = () => {
    api
      .get("/upload")
      .then((res) => {
        const uploads: UploadItem[] = res.data.uploads || [];
        const found = uploads.find(
          (u) => u.status === "PROCESSING" || u.status === "ANALYZING"
        );
        setActive(found || null);
        setChecking(false);
      })
      .catch(() => {
        setActive(null);
        setChecking(false);
      });
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(null);
    api.delete(`/upload/${active!.id}`).catch(() => {});
  };

  useEffect(() => {
    checkActive();
    intervalRef.current = setInterval(checkActive, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (checking || !active) return null;

  const statusLabel = active.status === "ANALYZING" ? "AI Analysis in Progress" : "Processing";

  return (
    <Link
      href="/upload"
      className="group block relative rounded-xl border border-blue-200 bg-blue-50 p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-red-100 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
        title="Dismiss"
      >
        <X size={14} />
      </button>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-blue-100 shrink-0">
            <Loader2 size={18} className="text-blue-600 animate-spin" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-900 truncate">
              {statusLabel}
            </p>
            <p className="text-xs text-blue-600 mt-0.5 truncate">
              {active.filename}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-blue-600 font-medium">View</span>
          <ArrowRight
            size={16}
            className="text-blue-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300"
          />
        </div>
      </div>
    </Link>
  );
}
