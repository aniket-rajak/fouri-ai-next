"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { AiUsageByFeature } from "@/lib/analytics-types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

interface Props {
  data: AiUsageByFeature | null;
  loading?: boolean;
}

export default function AIAnalyticsPanel({ data, loading }: Props) {
  if (loading) return <div className="h-[300px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || data.totalRequests === 0) return <EmptyAnalyticsState message="No AI usage data yet." />;

  const featureData = data.byFeature.map((f) => ({ name: f.feature, value: f.requests }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-[#f5f5f7]">{data.totalRequests.toLocaleString()}</div>
          <div className="text-xs text-[#888899]">Total Requests</div>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-[#f5f5f7]">{(data.totalTokensIn / 1000).toFixed(1)}K</div>
          <div className="text-xs text-[#888899]">Tokens In</div>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-[#f5f5f7]">{(data.totalTokensOut / 1000).toFixed(1)}K</div>
          <div className="text-xs text-[#888899]">Tokens Out</div>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{data.byFeature.length}</div>
          <div className="text-xs text-[#888899]">Features Used</div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-[#888899] mb-2">Daily AI Request Trend</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.dailyTrend}>
            <defs>
              <linearGradient id="aiReqGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <YAxis tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="requests" stroke="#f59e0b" fill="url(#aiReqGradient)" strokeWidth={2} name="Requests" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-[#888899] mb-2">Feature Breakdown</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={featureData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                paddingAngle={2} dataKey="value" nameKey="name"
              >
                {featureData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "8px", color: "#888899" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-[#888899] mb-2">Token Consumption</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.byFeature} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
              <YAxis dataKey="feature" type="category" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} width={80} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="tokensIn" fill="#3b82f6" radius={[0, 3, 3, 0]} name="Tokens In" stackId="t" />
              <Bar dataKey="tokensOut" fill="#10b981" radius={[0, 3, 3, 0]} name="Tokens Out" stackId="t" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
