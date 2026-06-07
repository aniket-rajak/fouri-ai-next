"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { UserGrowth } from "@/lib/analytics-types";

interface Props {
  data: UserGrowth[] | null;
  loading?: boolean;
}

export default function UserGrowthChart({ data, loading }: Props) {
  if (loading) return <div className="h-[250px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || data.length === 0) return <EmptyAnalyticsState />;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
        <YAxis tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" fill="url(#growthGradient)" strokeWidth={2} name="Total Users" />
        <Area type="monotone" dataKey="signups" stroke="#10b981" fill="none" strokeWidth={1.5} name="New Signups" strokeDasharray="4 4" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
