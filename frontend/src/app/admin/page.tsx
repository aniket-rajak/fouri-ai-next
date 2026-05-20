"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Users, Upload, FileText, BarChart3, Loader2 } from "lucide-react";

interface Stats {
  users: number;
  uploads: number;
  tests: number;
  attempts: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
        <p className="text-zinc-500 mt-1">Overview of your platform</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{stats?.users ?? 0}</p>
              <p className="text-sm text-zinc-500">Users</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Upload size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{stats?.uploads ?? 0}</p>
              <p className="text-sm text-zinc-500">Uploads</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{stats?.tests ?? 0}</p>
              <p className="text-sm text-zinc-500">Mock Tests</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{stats?.attempts ?? 0}</p>
              <p className="text-sm text-zinc-500">Attempts</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
