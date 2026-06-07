"use client";

interface Props {
  value: string;
  onChange: (period: string) => void;
}

const OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "1y", label: "Last 1 Year" },
];

export default function DateRangeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-[#111118] rounded-xl border border-white/5 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            value === opt.value
              ? "bg-blue-600 text-white"
              : "text-[#888899] hover:text-[#f5f5f7]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
