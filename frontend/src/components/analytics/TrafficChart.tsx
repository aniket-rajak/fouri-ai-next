"use client";

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { TrafficData } from "@/lib/analytics-types";

interface Props {
  data: TrafficData[] | null;
  loading?: boolean;
}

export default function TrafficChart({ data, loading }: Props) {
  if (loading) {
    return <div className="h-[250px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  }
  if (!data || data.length === 0) {
    return <EmptyAnalyticsState />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-[#888899] mb-2">Daily Visitors</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <YAxis tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="visitors" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Visitors" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-[#888899] mb-2">Page Views</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <YAxis tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="pageViews" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Page Views" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
