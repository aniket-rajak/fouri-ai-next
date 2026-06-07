"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion } from "framer-motion";
import {
  Users, Upload, FileText, BarChart3, Activity, Brain,
  CheckCircle2, Loader2, TrendingUp, RefreshCw,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  newUsers30d: number;
  totalUploads: number;
  uploads30d: number;
  totalTests: number;
  totalAttempts: number;
  attempts30d: number;
  completedUploads: number;
  failedUploads: number;
  processingUploads: number;
  analyzingUploads: number;
  aiCalls: number;
  ocrSuccessRate: number;
}

const statCards = [
  { key: "totalUsers", icon: Users, label: "Total Users", color: "blue" },
  { key: "newUsers30d", icon: TrendingUp, label: "New Users (30d)", color: "emerald" },
  { key: "totalUploads", icon: Upload, label: "Total Uploads", color: "violet" },
  { key: "uploads30d", icon: Upload, label: "Uploads (30d)", color: "cyan" },
  { key: "totalTests", icon: FileText, label: "Published Tests", color: "amber" },
  { key: "totalAttempts", icon: BarChart3, label: "Total Attempts", color: "rose" },
  { key: "aiCalls", icon: Brain, label: "AI Calls", color: "indigo" },
  { key: "ocrSuccessRate", icon: CheckCircle2, label: "OCR Success Rate", color: "emerald", suffix: "%" },
];

const colorMap: Record<string, string> = {
  blue: "from-blue-600 to-blue-500",
  emerald: "from-emerald-600 to-emerald-500",
  violet: "from-violet-600 to-violet-500",
  cyan: "from-cyan-600 to-cyan-500",
  amber: "from-amber-600 to-amber-500",
  rose: "from-rose-600 to-rose-500",
  indigo: "from-indigo-600 to-indigo-500",
};

export default function RootDashboard() {
  const api = useOwnerApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchStats = useCallback(async (isInitial = false) => {
    if (!isInitial) setRefreshing(true);
    try {
      const data = await api("/owner/dashboard/stats") as Stats;
      setStats(data);
    } catch (err) {
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    fetchStats(true);
    intervalRef.current = setInterval(() => fetchStats(), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchStats]);

  const handleManualRefresh = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    fetchStats();
    intervalRef.current = setInterval(() => fetchStats(), 30000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#f5f5f7]">
              Root Dashboard
            </h1>
            <p className="text-sm text-[#888899] mt-1">Platform overview & real-time analytics</p>
          </div>
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#111118] border border-white/5 text-xs text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5 transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Auto-refresh (30s)
          </button>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const value = stats ? (stats as any)[card.key] : 0;
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative group bg-[#111118] rounded-2xl border border-white/5 p-5 hover:border-blue-500/20 transition-all duration-500"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold font-heading text-[#f5f5f7]">
                    {typeof value === "number" ? value.toLocaleString() : value}
                    {card.suffix || ""}
                  </p>
                  <p className="text-xs text-[#888899] mt-1">{card.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[card.color]} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111118] rounded-2xl border border-white/5 p-6"
        >
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4 flex items-center gap-2">
            <Activity size={14} className="text-blue-400" />
            Upload Processing Status
          </h3>
          <div className="space-y-3">
            {[
              { label: "Completed", value: stats?.completedUploads || 0, color: "bg-emerald-500" },
              { label: "Processing", value: stats?.processingUploads || 0, color: "bg-amber-500" },
              { label: "Analyzing", value: stats?.analyzingUploads || 0, color: "bg-blue-500" },
              { label: "Failed", value: stats?.failedUploads || 0, color: "bg-rose-500" },
            ].map((item) => {
              const total = (stats?.completedUploads || 0) + (stats?.processingUploads || 0) +
                (stats?.analyzingUploads || 0) + (stats?.failedUploads || 0);
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-[#888899] w-20">{item.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#888899] w-12 text-right">{item.value}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111118] rounded-2xl border border-white/5 p-6"
        >
          <h3 className="text-sm font-semibold text-[#f5f5f7] mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            {[
              { label: "View All Users", href: "/fouri-root-console/users" },
              { label: "Recent Uploads", href: "/fouri-root-console/uploads" },
              { label: "Analytics Dashboard", href: "/fouri-root-console/analytics" },
              { label: "Manage Ads", href: "/fouri-root-console/ads" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="block px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-[#888899] hover:text-[#f5f5f7] transition-all border border-white/5 hover:border-blue-500/20"
              >
                {action.label}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
