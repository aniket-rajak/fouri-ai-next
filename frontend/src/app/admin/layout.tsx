"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, Users, Upload, FileText, BarChart3, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/lib/firebase";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/uploads", label: "Uploads", icon: Upload },
  { href: "/admin/tests", label: "Tests", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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
      <nav className="fixed top-0 left-0 right-0 h-16 bg-zinc-900 text-white z-40 flex items-center px-4 lg:px-6">
        <button className="lg:hidden mr-3 cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/admin" className="text-lg font-bold tracking-tight">
          FOURI.IN Admin
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
            Back to App
          </Link>
          <button onClick={() => logout()} className="p-2 text-zinc-400 hover:text-white cursor-pointer">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-zinc-900 z-30 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
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
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
