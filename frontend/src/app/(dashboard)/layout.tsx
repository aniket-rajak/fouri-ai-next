"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { logout } from "@/lib/firebase";
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  Search,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  active: boolean;
  clicks: number;
  impressions: number;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload Paper", icon: Upload },
  { href: "/discover", label: "Discover", icon: Search },
  { href: "/tests", label: "My Tests", icon: FileText },
  { href: "/results", label: "Results", icon: BarChart3 },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const impressionTracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API}/ads/active`)
      .then((r) => r.json())
      .then((data: { ads: Ad[] }) => setAds(data.ads || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (ads.length > 0) {
      ads.forEach((ad) => {
        if (!impressionTracked.current.has(ad.id)) {
          impressionTracked.current.add(ad.id);
          fetch(`${API}/ads/${ad.id}/impression`, { method: "POST" }).catch(() => {});
        }
      });
    }
  }, [ads]);

  const handleAdClick = (ad: Ad) => {
    fetch(`${API}/ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
    window.open(ad.ctaLink, "_blank", "noopener noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 z-40 flex items-center gap-3 px-4 lg:px-6">
        <button
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/dashboard" className="flex items-center h-9 px-3 rounded-lg text-base font-bold tracking-tight text-zinc-900 hover:bg-zinc-100 transition-colors">
          FOURI.IN
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:block text-sm text-zinc-500 truncate max-w-[200px]">
            {user.email}
          </span>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-zinc-200 z-30 transform transition-transform lg:translate-x-0 ${
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      <main className="pt-16 lg:pl-64">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">{children}</div>
            {ads.length > 0 && (
              <aside className="hidden xl:block w-72 shrink-0 space-y-4 sticky top-24 self-start">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    onClick={() => handleAdClick(ad)}
                    className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                  >
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-zinc-900">{ad.title}</p>
                      {ad.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{ad.description}</p>
                      )}
                      <span className="inline-block mt-2 text-xs font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                        {ad.ctaText} →
                      </span>
                    </div>
                  </div>
                ))}
              </aside>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
