"use client";

import { useEffect, useState, useCallback } from "react";
import { useOwnerApi } from "@/lib/owner-auth";
import { motion } from "framer-motion";
import {
  Loader2, TrendingUp, Users, Upload, BarChart3, Activity, Search,
  Globe, Monitor, BookOpen, BrainCircuit, Zap,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

import type {
  OverviewStats, ActiveUserData, TrafficData, DailyActivity,
  PageAnalytics, FeatureRanking, BlogAnalytics, QuizDetailed,
  ContentPopularity, UserSegments, GeoData, DeviceData,
  SearchAnalytics, AiUsageByFeature, AiThreshold, UserGrowth,
} from "@/lib/analytics-types";

import DateRangeSelector from "@/components/analytics/DateRangeSelector";
import StatsCardGrid from "@/components/analytics/StatsCardGrid";
import SectionHeader from "@/components/analytics/SectionHeader";
import ChartTooltip from "@/components/analytics/ChartTooltip";
import ActiveUsersChart from "@/components/analytics/ActiveUsersChart";
import TrafficChart from "@/components/analytics/TrafficChart";
import DailyActivitiesChart from "@/components/analytics/DailyActivitiesChart";
import PageAnalyticsTable from "@/components/analytics/PageAnalyticsTable";
import FeatureUsageRanking from "@/components/analytics/FeatureUsageRanking";
import ContentPopularityView from "@/components/analytics/ContentPopularity";
import QuizAnalyticsPanel from "@/components/analytics/QuizAnalyticsPanel";
import BlogAnalyticsPanel from "@/components/analytics/BlogAnalyticsPanel";
import AIAnalyticsPanel from "@/components/analytics/AIAnalyticsPanel";
import UsageThresholdGauge from "@/components/analytics/UsageThresholdGauge";
import UserGrowthChart from "@/components/analytics/UserGrowthChart";
import UserSegmentsChart from "@/components/analytics/UserSegmentsChart";
import GeoMapChart from "@/components/analytics/GeoMapChart";
import DeviceAnalytics from "@/components/analytics/DeviceAnalytics";
import SearchAnalyticsView from "@/components/analytics/SearchAnalytics";
import RealTimeDashboard from "@/components/analytics/RealTimeDashboard";
import ExportButton from "@/components/analytics/ExportButton";

// ---- Types for existing charts ----
interface DailyStat { date: string; count: number }
interface UploadStat { fileType: string; count: number }
interface SubjectStat { subject: string; count: number }

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

export default function OwnerAnalyticsPage() {
  type Period = "daily" | "weekly" | "monthly";
  type NewPeriod = string;

  const api = useOwnerApi();

  // ---- Existing state ----
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("daily");
  const [signups, setSignups] = useState<DailyStat[]>([]);
  const [uploads, setUploads] = useState<DailyStat[]>([]);
  const [attempts, setAttempts] = useState<DailyStat[]>([]);
  const [uploadsByType, setUploadsByType] = useState<UploadStat[]>([]);
  const [subjectsWithCounts, setSubjectsWithCounts] = useState<SubjectStat[]>([]);

  // ---- New state ----
  const [newPeriod, setNewPeriod] = useState<NewPeriod>("30d");
  const [newLoading, setNewLoading] = useState(false);

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUserData | null>(null);
  const [traffic, setTraffic] = useState<TrafficData[] | null>(null);
  const [activities, setActivities] = useState<DailyActivity[] | null>(null);
  const [pages, setPages] = useState<PageAnalytics[] | null>(null);
  const [features, setFeatures] = useState<FeatureRanking[] | null>(null);
  const [blog, setBlog] = useState<BlogAnalytics | null>(null);
  const [quiz, setQuiz] = useState<QuizDetailed | null>(null);
  const [content, setContent] = useState<ContentPopularity | null>(null);
  const [segments, setSegments] = useState<UserSegments | null>(null);
  const [geo, setGeo] = useState<GeoData[] | null>(null);
  const [devices, setDevices] = useState<DeviceData | null>(null);
  const [search, setSearch] = useState<SearchAnalytics | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsageByFeature | null>(null);
  const [aiThreshold, setAiThreshold] = useState<AiThreshold | null>(null);
  const [growth, setGrowth] = useState<UserGrowth[] | null>(null);

  // ---- Existing fetch (UNCHANGED) ----
  useEffect(() => {
    queueMicrotask(() => setLoading(true));
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
        setSubjectsWithCounts(uploadStats.subjectsWithCounts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, period]);

  // ---- New fetch ----
  const fetchNewAnalytics = useCallback(async (p: NewPeriod) => {
    setNewLoading(true);
    try {
      const [
        overviewRes, activeRes, trafficRes, activitiesRes, pagesRes,
        featuresRes, blogRes, quizRes, contentRes, segmentsRes,
        geoRes, devicesRes, searchRes, aiUsageRes, thresholdRes, growthRes,
      ] = await Promise.allSettled([
        api(`/owner/analytics/overview?period=${p}`),
        api(`/owner/analytics/users/active?period=${p}`),
        api(`/owner/analytics/traffic?period=${p}`),
        api(`/owner/analytics/activities?period=${p}`),
        api(`/owner/analytics/pages?period=${p}&limit=20`),
        api(`/owner/analytics/features/ranking?period=${p}`),
        api(`/owner/analytics/blog?period=${p}`),
        api(`/owner/analytics/quiz/detailed?period=${p}`),
        api(`/owner/analytics/content/popularity?period=${p}`),
        api(`/owner/analytics/users/segments?period=${p}`),
        api(`/owner/analytics/geo?period=${p}`),
        api(`/owner/analytics/devices?period=${p}`),
        api(`/owner/analytics/search?period=${p}`),
        api(`/owner/analytics/ai/usage?period=${p}`),
        api(`/owner/analytics/ai/threshold`),
        api(`/owner/analytics/users/growth?period=${p}`),
      ]);

      if (overviewRes.status === "fulfilled") setOverview(overviewRes.value as OverviewStats);
      if (activeRes.status === "fulfilled") setActiveUsers(activeRes.value as ActiveUserData);
      if (trafficRes.status === "fulfilled") setTraffic(trafficRes.value as TrafficData[]);
      if (activitiesRes.status === "fulfilled") setActivities(activitiesRes.value as DailyActivity[]);
      if (pagesRes.status === "fulfilled") setPages(pagesRes.value as PageAnalytics[]);
      if (featuresRes.status === "fulfilled") setFeatures(featuresRes.value as FeatureRanking[]);
      if (blogRes.status === "fulfilled") setBlog(blogRes.value as BlogAnalytics);
      if (quizRes.status === "fulfilled") setQuiz(quizRes.value as QuizDetailed);
      if (contentRes.status === "fulfilled") setContent(contentRes.value as ContentPopularity);
      if (segmentsRes.status === "fulfilled") setSegments(segmentsRes.value as UserSegments);
      if (geoRes.status === "fulfilled") setGeo(geoRes.value as GeoData[]);
      if (devicesRes.status === "fulfilled") setDevices(devicesRes.value as DeviceData);
      if (searchRes.status === "fulfilled") setSearch(searchRes.value as SearchAnalytics);
      if (aiUsageRes.status === "fulfilled") setAiUsage(aiUsageRes.value as AiUsageByFeature);
      if (thresholdRes.status === "fulfilled") setAiThreshold(thresholdRes.value as AiThreshold);
      if (growthRes.status === "fulfilled") setGrowth(growthRes.value as UserGrowth[]);
    } catch (err) {
      console.error("[analytics] New analytics fetch error:", err);
    } finally {
      setNewLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchNewAnalytics(newPeriod);
  }, [newPeriod, fetchNewAnalytics]);

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-400" />
      </div>
    );
  }

  const overviewCards = overview
    ? [
        { label: "Total Users", value: overview.totalUsers.toLocaleString(), icon: <Users size={14} />, color: "bg-blue-500/10 text-blue-400" },
        { label: "Active", value: overview.activeUsers.toLocaleString(), icon: <Activity size={14} />, color: "bg-green-500/10 text-green-400" },
        { label: "Inactive", value: overview.inactiveUsers.toLocaleString(), icon: <Users size={14} />, color: "bg-red-500/10 text-red-400" },
        { label: "Total Uploads", value: overview.totalUploads.toLocaleString(), icon: <Upload size={14} />, color: "bg-yellow-500/10 text-yellow-400" },
        { label: "Test Attempts", value: overview.totalAttempts.toLocaleString(), icon: <BarChart3 size={14} />, color: "bg-purple-500/10 text-purple-400" },
        { label: "AI Calls", value: overview.aiCalls.toLocaleString(), icon: <BrainCircuit size={14} />, color: "bg-indigo-500/10 text-indigo-400" },
        { label: "Blog Views", value: overview.blogViews.toLocaleString(), icon: <BookOpen size={14} />, color: "bg-pink-500/10 text-pink-400" },
        { label: "Searches", value: (search?.totalSearches || 0).toLocaleString(), icon: <Search size={14} />, color: "bg-cyan-500/10 text-cyan-400" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* EXISTING CHARTS — UNCHANGED                                       */}
      {/* ================================================================ */}
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
              <Tooltip content={<ChartTooltip />} />
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
              <Tooltip content={<ChartTooltip />} />
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
              <Tooltip content={<ChartTooltip />} />
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
                cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value"
              >
                {uploadsByType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "10px", color: "#888899" }} />
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
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ================================================================ */}
      {/* NEW ADVANCED ANALYTICS SECTIONS (below existing)                   */}
      {/* ================================================================ */}

      <hr className="border-white/5 my-8" />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#f5f5f7]">Advanced Analytics</h2>
          <p className="text-xs text-[#888899] mt-0.5">Deep-dive insights into platform performance</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={newPeriod} onChange={setNewPeriod} />
          <ExportButton period={newPeriod} />
        </div>
      </div>

      {/* AI Threshold Gauge (sticky warning) */}
      <UsageThresholdGauge data={aiThreshold} loading={newLoading} />

      {/* Real-Time Dashboard */}
      <SectionHeader title="Real-Time Dashboard" description="Live platform activity (auto-refreshes every 10s)">
        <Zap size={14} className="text-yellow-400" />
      </SectionHeader>
      <RealTimeDashboard />

      {/* Overview Stats Cards */}
      <SectionHeader title="Overview Stats" description="Key platform metrics" />
      <StatsCardGrid cards={overviewCards} />

      {/* User Analytics */}
      <SectionHeader title="User Analytics" description="Active users, growth trends & segments" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
          <h3 className="text-xs font-semibold text-[#888899] mb-3">Active vs Inactive Users</h3>
          <ActiveUsersChart data={activeUsers} loading={newLoading} />
        </div>
        <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
          <h3 className="text-xs font-semibold text-[#888899] mb-3">Guest vs Logged-In</h3>
          <UserSegmentsChart data={segments} loading={newLoading} />
        </div>
      </div>
      <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
        <h3 className="text-xs font-semibold text-[#888899] mb-3">User Growth Trend</h3>
        <UserGrowthChart data={growth} loading={newLoading} />
      </div>

      {/* Traffic & Engagement */}
      <SectionHeader title="Traffic & Engagement" description="Daily visitors, page views & feature usage" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
          <h3 className="text-xs font-semibold text-[#888899] mb-3">Daily Visitors & Page Views</h3>
          <TrafficChart data={traffic} loading={newLoading} />
        </div>
        <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
          <h3 className="text-xs font-semibold text-[#888899] mb-3">Daily Activities</h3>
          <DailyActivitiesChart data={activities} loading={newLoading} />
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
          <SectionHeader title="Page Analytics">
            <Globe size={14} className="text-blue-400" />
          </SectionHeader>
          <PageAnalyticsTable data={pages} loading={newLoading} />
        </div>
        <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
          <SectionHeader title="Feature Usage Ranking">
            <Zap size={14} className="text-yellow-400" />
          </SectionHeader>
          <FeatureUsageRanking data={features} loading={newLoading} />
        </div>
      </div>

      {/* Search Analytics */}
      <SectionHeader title="Search Analytics" description="Top search queries & zero-result rates">
        <Search size={14} className="text-cyan-400" />
      </SectionHeader>
      <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
        <SearchAnalyticsView data={search} loading={newLoading} />
      </div>

      {/* Geo & Devices */}
      <SectionHeader title="Geo & Devices" description="Geographic distribution and device breakdown">
        <Monitor size={14} className="text-purple-400" />
      </SectionHeader>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
          <h3 className="text-xs font-semibold text-[#888899] mb-3">Top Countries</h3>
          <GeoMapChart data={geo} loading={newLoading} />
        </div>
        <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
          <h3 className="text-xs font-semibold text-[#888899] mb-3">Devices & Browsers</h3>
          <DeviceAnalytics data={devices} loading={newLoading} />
        </div>
      </div>

      {/* Content Performance */}
      <SectionHeader title="Content Performance" description="Subject popularity & difficulty distribution">
        <BookOpen size={14} className="text-pink-400" />
      </SectionHeader>
      <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
        <ContentPopularityView data={content} loading={newLoading} />
      </div>

      {/* Blog Analytics */}
      <SectionHeader title="Blog Analytics" description="Blog views, engagement & feedback">
        <BookOpen size={14} className="text-indigo-400" />
      </SectionHeader>
      <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
        <BlogAnalyticsPanel data={blog} loading={newLoading} />
      </div>

      {/* Quiz Analytics */}
      <SectionHeader title="Quiz Analytics" description="Quiz generation, attempts, completion & scores">
        <BrainCircuit size={14} className="text-orange-400" />
      </SectionHeader>
      <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
        <QuizAnalyticsPanel data={quiz} loading={newLoading} />
      </div>

      {/* AI Usage Analytics */}
      <SectionHeader title="AI Usage Analytics" description="AI API consumption by feature">
        <BrainCircuit size={14} className="text-purple-400" />
      </SectionHeader>
      <div className="bg-[#111118] rounded-2xl border border-white/5 p-5">
        <AIAnalyticsPanel data={aiUsage} loading={newLoading} />
      </div>
    </div>
  );
}
