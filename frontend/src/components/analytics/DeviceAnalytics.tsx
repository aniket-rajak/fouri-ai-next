"use client";

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { DeviceData } from "@/lib/analytics-types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface Props {
  data: DeviceData | null;
  loading?: boolean;
}

export default function DeviceAnalytics({ data, loading }: Props) {
  if (loading) return <div className="h-[250px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || (data.deviceTypes.length === 0 && data.browsers.length === 0)) {
    return <EmptyAnalyticsState message="No device data yet." />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-[#888899] mb-2">Device Types</h4>
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie
              data={data.deviceTypes.map((d) => ({ name: d.device, value: d.count }))}
              cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value"
            >
              {data.deviceTypes.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: "8px", color: "#888899" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-[#888899] mb-2">Browsers</h4>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={data.browsers.slice(0, 5)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#888899", fontSize: 8 }} tickLine={false} />
              <YAxis dataKey="browser" type="category" tick={{ fill: "#888899", fontSize: 8 }} tickLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-[#888899] mb-2">Operating Systems</h4>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={data.oss.slice(0, 5)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#888899", fontSize: 8 }} tickLine={false} />
              <YAxis dataKey="os" type="category" tick={{ fill: "#888899", fontSize: 8 }} tickLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
