"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OwnerProvider, useOwner } from "@/lib/owner-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Users, Upload, BarChart3, Image as ImageIcon,
  LogOut, Menu, X, Sparkles, ChevronRight, FileText, Send, Images, BookOpen,
} from "lucide-react";

const navItems = [
  { href: "/fouri-root-console/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fouri-root-console/users", label: "Users", icon: Users },
  { href: "/fouri-root-console/uploads", label: "Uploads", icon: Upload },
  { href: "/fouri-root-console/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/fouri-root-console/ads", label: "Ad Manager", icon: ImageIcon },
  { href: "/fouri-root-console/email-broadcast", label: "Email Broadcast", icon: Send },
  { href: "/fouri-root-console/email-templates", label: "Email Templates", icon: FileText },
  { href: "/fouri-root-console/media", label: "Media Library", icon: Images },
  { href: "/fouri-root-console/blog", label: "Blog", icon: BookOpen },
];

function ConsoleShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, email, logout } = useOwner();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/fouri-root-console";

  useEffect(() => {
    if (!loading && !isAuthenticated && !isLoginPage) {
      router.replace("/fouri-root-console");
    }
  }, [loading, isAuthenticated, isLoginPage, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Login page gets a clean render (no sidebar/nav)
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#08080f]">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#08080f]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center px-4 lg:px-6">
        <button
          className="lg:hidden mr-3 w-9 h-9 rounded-lg flex items-center justify-center text-[#888899] hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <Link href="/fouri-root-console/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold font-heading text-[#f5f5f7] hidden sm:block">FOURI Root Console</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden md:block text-xs text-[#888899]">{email}</span>
          <button
            onClick={() => { logout(); }}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </nav>

      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-[#08080f] border-r border-white/5 z-40 transform transition-transform duration-300 lg:translate-x-0 overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-600/10 text-blue-300 border border-blue-500/10"
                    : "text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-[#888899] hover:text-[#f5f5f7] hover:bg-white/5 transition-all"
          >
            <ChevronRight size={12} />
            Back to App
          </Link>
        </div>
      </aside>

      <main className="pt-16 lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 min — images rarely change
      gcTime: 1000 * 60 * 30,          // keep in cache 30 min
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <OwnerProvider>
        <ConsoleShell>{children}</ConsoleShell>
      </OwnerProvider>
    </QueryClientProvider>
  );
}
