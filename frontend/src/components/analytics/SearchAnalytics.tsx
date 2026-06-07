"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { SearchAnalytics } from "@/lib/analytics-types";

interface Props {
  data: SearchAnalytics | null;
  loading?: boolean;
}

export default function SearchAnalyticsView({ data, loading }: Props) {
  if (loading) return <div className="h-[250px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || data.totalSearches === 0) return <EmptyAnalyticsState message="No search data yet." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-[#f5f5f7]">{data.totalSearches}</div>
          <div className="text-xs text-[#888899]">Total Searches</div>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-red-400">{data.totalZeroResults}</div>
          <div className="text-xs text-[#888899]">No Results</div>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-orange-400">{data.zeroResultRate}%</div>
          <div className="text-xs text-[#888899]">Zero Result Rate</div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-[#888899] mb-2">Top Search Queries</h4>
        <div className="overflow-y-auto max-h-[150px] space-y-1">
          {data.topQueries.map((q) => (
            <div key={q.query} className="flex justify-between items-center py-1 px-2 rounded-lg hover:bg-white/5">
              <span className="text-xs text-[#f5f5f7] truncate max-w-[200px]">{q.query}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888899]">{q.count}</span>
                {q.zeroResultRate > 0 && (
                  <span className={`text-xs ${q.zeroResultRate > 50 ? "text-red-400" : "text-orange-400"}`}>
                    {q.zeroResultRate}% ZR
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
