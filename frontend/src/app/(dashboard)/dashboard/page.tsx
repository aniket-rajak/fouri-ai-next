"use client";

import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Upload, FileText, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Welcome back! Ready to practice?</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/upload">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Upload size={20} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Upload Paper</p>
                <p className="text-sm text-zinc-500">Create a new mock test</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/tests">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">My Tests</p>
                <p className="text-sm text-zinc-500">View your mock tests</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/results">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Results</p>
                <p className="text-sm text-zinc-500">Check past performance</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
