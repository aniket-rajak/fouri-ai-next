"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { DailyActivity } from "@/lib/analytics-types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface Props {
  data: DailyActivity[] | null;
  loading?: boolean;
}

export default function DailyActivitiesChart({ data, loading }: Props) {
  if (loading) return <div className="h-[250px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || data.length === 0) return <EmptyAnalyticsState />;

  const keys = Object.keys(data[0] || {}).filter((k) => k !== "date");

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
        <YAxis tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: "10px", color: "#888899" }} />
        {keys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} stackId="a" radius={[0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
