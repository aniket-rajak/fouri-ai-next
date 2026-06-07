"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { UserSegments } from "@/lib/analytics-types";

const COLORS = ["#3b82f6", "#888899"];

interface Props {
  data: UserSegments | null;
  loading?: boolean;
}

export default function UserSegmentsChart({ data, loading }: Props) {
  if (loading) return <div className="h-[200px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || data.total === 0) return <EmptyAnalyticsState />;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={[
            { name: "Logged In", value: data.totalLoggedIn },
            { name: "Guest", value: data.totalGuest },
          ]}
          cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
        >
          {[0, 1].map((i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: "10px", color: "#888899" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
