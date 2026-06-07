"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Zap, Activity, Globe } from "lucide-react";
import type { RealtimeMetrics } from "@/lib/analytics-types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("fouri_owner_token");
  }
  return null;
}

const TYPES: Record<string, string> = {
  quiz: "text-blue-400",
  test: "text-green-400",
  upload: "text-yellow-400",
  ai: "text-purple-400",
  info: "text-[#888899]",
};

export default function RealTimeDashboard() {
  const [data, setData] = useState<RealtimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const token = getToken();

    const fetchData = () => {
      fetch(`${API}/owner/analytics/realtime`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (mounted) {
            setData(d as RealtimeMetrics);
            setLoading(false);
          }
        })
        .catch(() => {});
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#111118] rounded-xl p-3 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ scale: 0.95 }} animate={{ scale: 1 }}
          className="bg-[#111118] rounded-xl border border-green-500/20 p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-green-400" />
            <span className="text-xs text-[#888899]">Online Users</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{data?.onlineCount || 0}</div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95 }} animate={{ scale: 1 }}
          className="bg-[#111118] rounded-xl border border-blue-500/20 p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-blue-400" />
            <span className="text-xs text-[#888899]">Active Quizzes</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{data?.activeQuizCount || 0}</div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95 }} animate={{ scale: 1 }}
          className="bg-[#111118] rounded-xl border border-purple-500/20 p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-purple-400" />
            <span className="text-xs text-[#888899]">AI Requests</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{data?.activeAiRequestCount || 0}</div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95 }} animate={{ scale: 1 }}
          className="bg-[#111118] rounded-xl border border-yellow-500/20 p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Globe size={14} className="text-yellow-400" />
            <span className="text-xs text-[#888899]">Active Sessions</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {(data?.onlineCount || 0) + (data?.activeQuizCount || 0)}
          </div>
        </motion.div>
      </div>

      <div className="bg-[#111118] rounded-xl border border-white/5 p-3">
        <h4 className="text-xs font-semibold text-[#888899] mb-2">Live Activity Feed</h4>
        <div className="space-y-1 max-h-[120px] overflow-y-auto">
          {data?.liveEvents.map((ev, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-[#555] shrink-0">
                {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
              <span className={TYPES[ev.type] || "text-[#888899]"}>
                {ev.message}
              </span>
            </div>
          ))}
          {(!data?.liveEvents || data.liveEvents.length === 0) && (
            <p className="text-xs text-[#555]">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
