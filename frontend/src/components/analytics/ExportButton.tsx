"use client";

import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const SECTIONS = [
  { value: "users", label: "Users" },
  { value: "traffic", label: "Traffic" },
  { value: "pages", label: "Pages" },
  { value: "blog", label: "Blog" },
  { value: "quiz", label: "Quiz" },
  { value: "ai", label: "AI Usage" },
];

interface Props {
  period: string;
}

export default function ExportButton({ period }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleExport = (section: string) => {
    setOpen(false);
    const token = localStorage.getItem("fouri_owner_token");
    const url = `${API}/owner/analytics/export?section=${section}&period=${period}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `analytics-${section}-${period}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(console.error);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
      >
        <Download size={12} />
        Export
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-[#111118] border border-white/10 rounded-xl shadow-xl z-50 py-1 min-w-[140px]">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleExport(s.value)}
              className="w-full text-left px-3 py-1.5 text-xs text-[#f5f5f7] hover:bg-white/5 transition-colors cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
