"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { GeoData } from "@/lib/analytics-types";

interface Props {
  data: GeoData[] | null;
  loading?: boolean;
}

export default function GeoMapChart({ data, loading }: Props) {
  if (loading) return <div className="h-[200px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || data.length === 0) return <EmptyAnalyticsState message="No geographic data yet." />;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data.slice(0, 10)} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis type="number" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
        <YAxis dataKey="country" type="category" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} width={80} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} name="Visitors" />
      </BarChart>
    </ResponsiveContainer>
  );
}
