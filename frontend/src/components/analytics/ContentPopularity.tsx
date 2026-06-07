"use client";

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { ContentPopularity } from "@/lib/analytics-types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface Props {
  data: ContentPopularity | null;
  loading?: boolean;
}

export default function ContentPopularityView({ data, loading }: Props) {
  if (loading) return <div className="h-[250px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || (data.subjectPopularity.length === 0 && data.difficultyDistribution.length === 0)) {
    return <EmptyAnalyticsState />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-[#888899] mb-2">Subject Popularity</h4>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data.subjectPopularity.map((s) => ({ name: s.subject, value: s.testCount }))}
              cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value"
            >
              {data.subjectPopularity.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: "9px", color: "#888899" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-[#888899] mb-2">Difficulty Distribution</h4>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data.difficultyDistribution.map((d) => ({ name: d.difficulty, value: d.count }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <YAxis tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Tests" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
