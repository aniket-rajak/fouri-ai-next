"use client";

import { useState, useMemo } from "react";
import EmptyAnalyticsState from "./EmptyAnalyticsState";
import type { PageAnalytics } from "@/lib/analytics-types";

type SortKey = "views" | "uniqueUsers" | "percentage";

interface Props {
  data: PageAnalytics[] | null;
  loading?: boolean;
}

export default function PageAnalyticsTable({ data, loading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === "desc" ? -diff : diff;
    });
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  if (loading) return <div className="h-[250px] bg-[#0d0d14] rounded-xl animate-pulse" />;
  if (!data || data.length === 0) return <EmptyAnalyticsState message="No page view data yet." />;

  const SortIcon = ({ active }: { active: boolean }) => (
    <span className={`ml-1 ${active ? "text-blue-400" : "text-[#555]"}`}>⇅</span>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-xs text-[#888899]">
            <th className="text-left py-2 pr-2">Page</th>
            <th className="text-right py-2 px-2 cursor-pointer" onClick={() => toggleSort("views")}>
              Views <SortIcon active={sortKey === "views"} />
            </th>
            <th className="text-right py-2 px-2 cursor-pointer" onClick={() => toggleSort("uniqueUsers")}>
              Unique <SortIcon active={sortKey === "uniqueUsers"} />
            </th>
            <th className="text-right py-2 pl-2 cursor-pointer" onClick={() => toggleSort("percentage")}>
              % <SortIcon active={sortKey === "percentage"} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.path} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-2 pr-2 text-[#f5f5f7] truncate max-w-[200px]">{row.path}</td>
              <td className="py-2 px-2 text-right text-[#f5f5f7]">{row.views.toLocaleString()}</td>
              <td className="py-2 px-2 text-right text-[#f5f5f7]">{row.uniqueUsers.toLocaleString()}</td>
              <td className="py-2 pl-2 text-right text-[#888899]">{row.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
