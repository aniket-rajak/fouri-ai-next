"use client";

import Link from "next/link";
import { Upload, FileText, BarChart3, Search, ArrowRight } from "lucide-react";

const actions = [
  {
    href: "/upload",
    label: "Upload Paper",
    description: "Create a new mock test from your question paper",
    icon: Upload,
    gradient: "from-blue-500 to-blue-700",
    bgGlow: "bg-blue-500/10",
    iconBg: "bg-blue-500/20",
  },
  {
    href: "/tests",
    label: "My Tests",
    description: "View and take your available mock tests",
    icon: FileText,
    gradient: "from-emerald-500 to-emerald-700",
    bgGlow: "bg-emerald-500/10",
    iconBg: "bg-emerald-500/20",
  },
  {
    href: "/results",
    label: "Results",
    description: "Check your past performance and analytics",
    icon: BarChart3,
    gradient: "from-violet-500 to-violet-700",
    bgGlow: "bg-violet-500/10",
    iconBg: "bg-violet-500/20",
  },
  {
    href: "/discover",
    label: "Discover",
    description: "Browse community-created mock tests and exams",
    icon: Search,
    gradient: "from-amber-500 to-amber-700",
    bgGlow: "bg-amber-500/10",
    iconBg: "bg-amber-500/20",
  },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-zinc-900/5"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${action.bgGlow}`}
              />
              <div className="relative flex items-start gap-4">
                <div
                  className={`p-2.5 rounded-xl ${action.iconBg} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-900 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                    {action.description}
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-1 transition-all duration-300 shrink-0 mt-1"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
