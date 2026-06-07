"use client";

interface TooltipPayloadItem {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

export default function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (active && payload?.length) {
    return (
      <div className="bg-[#111118] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-xs text-[#888899] mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold text-[#f5f5f7]">
            {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}
