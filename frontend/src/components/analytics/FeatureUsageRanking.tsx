"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { FeatureRanking } from "@/lib/analytics-types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

interface Props {
  data: FeatureRanking[] | null;
  loading?: boolean;
}

export default function FeatureUsageRanking({ data, loading }: Props) {
  if (loading) return <div className="h-[250px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || data.length === 0) return <EmptyAnalyticsState message="No feature usage data yet." />;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis type="number" tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} />
        <YAxis dataKey="feature" type="category" tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} width={100} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="usageCount" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Usage Count" />
      </BarChart>
    </ResponsiveContainer>
  );
}
