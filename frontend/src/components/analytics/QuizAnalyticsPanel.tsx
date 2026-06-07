"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { QuizDetailed } from "@/lib/analytics-types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface Props {
  data: QuizDetailed | null;
  loading?: boolean;
}

export default function QuizAnalyticsPanel({ data, loading }: Props) {
  if (loading) return <div className="h-[300px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || data.total === 0) return <EmptyAnalyticsState message="No quiz data yet." />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-[#f5f5f7]">{data.total}</div>
          <div className="text-xs text-[#888899]">Total Attempts</div>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-400">{data.completionRate}%</div>
          <div className="text-xs text-[#888899]">Completion Rate</div>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-orange-400">{data.abandonmentRate}%</div>
          <div className="text-xs text-[#888899]">Abandonment Rate</div>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-[#f5f5f7]">{data.avgScore}%</div>
          <div className="text-xs text-[#888899]">Avg Score</div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-[#888899] mb-2">Daily Trend</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <YAxis tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: "9px", color: "#888899" }} />
            <Bar dataKey="attempts" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Attempts" />
            <Bar dataKey="completed" fill="#10b981" radius={[3, 3, 0, 0]} name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-[#888899] mb-2">Score Distribution</h4>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data.scoreDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="count" nameKey="range">
                {data.scoreDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "8px", color: "#888899" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-[#888899] mb-2">Subject Popularity</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.subjectPopularity.slice(0, 5)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
              <YAxis dataKey="subject" type="category" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
