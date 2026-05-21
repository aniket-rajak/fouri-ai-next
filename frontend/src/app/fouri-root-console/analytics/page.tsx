"use client";

import { useEffect, useState } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Users, Upload, BarChart3 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DailyStat {
  date: string;
  count: number;
}

interface UploadStat {
  fileType: string;
  count: number;
}

interface SubjectStat {
  subject: string;
  count: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

export default function OwnerAnalyticsPage() {
  type Period = "daily" | "weekly" | "monthly";

  const api = useOwnerApi();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("daily");
  const [signups, setSignups] = useState<DailyStat[]>([]);
  const [uploads, setUploads] = useState<DailyStat[]>([]);
  const [attempts, setAttempts] = useState<DailyStat[]>([]);
  const [uploadsByType, setUploadsByType] = useState<UploadStat[]>([]);
  const [subjectsWithCounts, setSubjectsWithCounts] = useState<SubjectStat[]>([]);
  const [uploadsByStatus, setUploadsByStatus] = useState<UploadStat[]>([]);

  useEffect(() => {
    setLoading(true);
    const timeEndpoint = period === "daily" ? "daily-stats" : period === "weekly" ? "weekly-stats" : "monthly-stats";
    const key = period === "daily" ? "daily" : period === "weekly" ? "weekly" : "monthly";

    Promise.all([
      api(`/owner/${timeEndpoint}`) as Promise<any>,
      api("/owner/upload-stats") as Promise<{ uploadsByType: UploadStat[]; uploadsByStatus: UploadStat[]; subjectsWithCounts: SubjectStat[] }>,
    ])
      .then(([timeData, uploadStats]) => {
        setSignups(timeData[`${key}Signups`] || []);
        setUploads(timeData[`${key}Uploads`] || []);
        setAttempts(timeData[`${key}Attempts`] || []);
        setUploadsByType(uploadStats.uploadsByType);
        setUploadsByStatus(uploadStats.uploadsByStatus);
        setSubjectsWithCounts(uploadStats.subjectsWithCounts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, period]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-[#111118] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
          <p className="text-xs text-[#888899]">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-sm font-semibold text-[#f5f5f7]">
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[#f5f5f7]">AI Analytics Dashboard</h1>
            <p className="text-sm text-[#888899] mt-1">Platform analytics & intelligence</p>
          </div>
          <div className="flex gap-1 bg-[#111118] rounded-xl border border-white/5 p-1">
            {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  period === p
                    ? "bg-blue-600 text-white"
                    : "text-[#888899] hover:text-[#f5f5f7]"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#111118] rounded-2xl border border-white/5 p-5"
        >
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400" />
            Daily Signups
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={signups}>
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#signupGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111118] rounded-2xl border border-white/5 p-5"
        >
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4 flex items-center gap-2">
            <Upload size={14} className="text-blue-400" />
            Daily Uploads
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={uploads}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#111118] rounded-2xl border border-white/5 p-5"
        >
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-400" />
            Daily Test Attempts
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={attempts}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111118] rounded-2xl border border-white/5 p-5"
        >
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4 flex items-center gap-2">
            <Users size={14} className="text-blue-400" />
            Uploads by File Type
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={uploadsByType.map((u) => ({ name: u.fileType?.split("/").pop() || u.fileType, value: u.count }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {uploadsByType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "10px", color: "#888899" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#111118] rounded-2xl border border-white/5 p-5 lg:col-span-2"
        >
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-400" />
            Top Subjects by Test Count
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectsWithCounts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} />
              <YAxis dataKey="subject" type="category" tick={{ fill: "#888899", fontSize: 10 }} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
