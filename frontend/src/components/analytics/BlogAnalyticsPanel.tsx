"use client";

import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { BlogAnalytics } from "@/lib/analytics-types";

const COLORS = ["#10b981", "#ef4444"];

interface Props {
  data: BlogAnalytics | null;
  loading?: boolean;
}

export default function BlogAnalyticsPanel({ data, loading }: Props) {
  if (loading) return <div className="h-[300px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || data.totalViews === 0) return <EmptyAnalyticsState message="No blog data yet." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-[#f5f5f7]">{data.totalViews}</div>
          <div className="text-xs text-[#888899]">Total Views</div>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-400">{data.totalPositiveFeedback}</div>
          <div className="text-xs text-[#888899]">Likes</div>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-red-400">{data.totalNegativeFeedback}</div>
          <div className="text-xs text-[#888899]">Dislikes</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-[#888899] mb-2">Feedback</h4>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={[
                  { name: "Positive", value: data.totalPositiveFeedback },
                  { name: "Negative", value: data.totalNegativeFeedback },
                ]}
                cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value"
              >
                {[0, 1].map((i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "9px", color: "#888899" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-[#888899] mb-2">Top Blogs</h4>
          <div className="overflow-y-auto max-h-[150px] space-y-1">
            {data.topBlogs.slice(0, 5).map((blog) => (
              <div key={blog.id} className="flex justify-between items-center py-1 px-2 rounded-lg hover:bg-white/5">
                <span className="text-xs text-[#f5f5f7] truncate max-w-[120px]">{blog.title}</span>
                <span className="text-xs text-[#888899]">{blog.viewCount} views</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-[#888899] mb-2">View Trend</h4>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={data.viewTrend}>
            <defs>
              <linearGradient id="blogViewGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <YAxis tick={{ fill: "#888899", fontSize: 9 }} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="views" stroke="#8b5cf6" fill="url(#blogViewGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
