"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { ActiveUserData } from "@/lib/analytics-types";

interface Props {
  data: ActiveUserData | null;
  loading?: boolean;
}

export default function ActiveUsersChart({ data, loading }: Props) {
  if (loading) {
    return <div className="h-[250px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  }
  if (!data || data.days.length === 0) {
    return <EmptyAnalyticsState message="No user activity data yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data.days}>
        <defs>
          <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="inactiveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} />
        <YAxis tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: "10px", color: "#888899" }} />
        <Area type="monotone" dataKey="active" stroke="#10b981" fill="url(#activeGradient)" strokeWidth={2} name="Active" />
        <Area type="monotone" dataKey="inactive" stroke="#ef4444" fill="url(#inactiveGradient)" strokeWidth={2} name="Inactive" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
