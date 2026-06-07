"use client";

import type { AiThreshold } from "@/lib/analytics-types";

interface Props {
  data: AiThreshold | null;
  loading?: boolean;
}

function getColor(level: string): string {
  switch (level) {
    case "red": return "bg-red-500";
    case "orange": return "bg-orange-500";
    case "yellow": return "bg-yellow-500";
    default: return "bg-green-500";
  }
}

function getTextColor(level: string): string {
  switch (level) {
    case "red": return "text-red-400";
    case "orange": return "text-orange-400";
    case "yellow": return "text-yellow-400";
    default: return "text-green-400";
  }
}

function getLabel(level: string): string {
  switch (level) {
    case "red": return "Critical — Approaching Limit";
    case "orange": return "Warning — High Usage";
    case "yellow": return "Caution — Moderate Usage";
    default: return "Healthy";
  }
}

export default function UsageThresholdGauge({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-[#111118] rounded-2xl border border-white/5 p-4 animate-pulse">
        <div className="h-6 bg-[#0d0d14] rounded w-1/3 mb-3" />
        <div className="h-4 bg-[#0d0d14] rounded w-full mb-2" />
        <div className="h-2 bg-[#0d0d14] rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  const pct = data.percentage;
  const remaining = data.remaining;
  const exhaustionStr = data.estimatedExhaustion
    ? new Date(data.estimatedExhaustion).toLocaleTimeString()
    : "N/A (within limits)";

  return (
    <div className={`bg-[#111118] rounded-2xl border ${pct >= 90 ? "border-red-500/30" : pct >= 75 ? "border-orange-500/30" : pct >= 50 ? "border-yellow-500/30" : "border-green-500/30"} p-4`}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getColor(data.warningLevel)}`} />
          <span className="text-sm font-semibold text-[#f5f5f7]">AI Free-Tier Usage</span>
        </div>
        <span className={`text-xs font-medium ${getTextColor(data.warningLevel)}`}>
          {getLabel(data.warningLevel)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-[#888899] mb-1.5">
        <span>{data.totalUsage.toLocaleString()} / {data.totalLimit.toLocaleString()} requests</span>
        <span>{pct}% consumed</span>
      </div>

      <div className="w-full h-2.5 bg-[#0d0d14] rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor(data.warningLevel)}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-[#666677]">Remaining</span>
          <div className="text-[#f5f5f7] font-medium">{remaining.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-[#666677]">Est. Exhaustion</span>
          <div className="text-[#f5f5f7] font-medium">{exhaustionStr}</div>
        </div>
        <div>
          <span className="text-[#666677]">Llama 3.1 8B</span>
          <div className="text-[#f5f5f7] font-medium">
            {data.limits.llama3_8b.used.toLocaleString()} / {data.limits.llama3_8b.limit.toLocaleString()}
          </div>
        </div>
        <div>
          <span className="text-[#666677]">Llama 3.3 70B</span>
          <div className="text-[#f5f5f7] font-medium">
            {data.limits.llama3_70b.used.toLocaleString()} / {data.limits.llama3_70b.limit.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
