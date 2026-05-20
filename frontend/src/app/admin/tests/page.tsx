"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Loader2, FileText, Users, BarChart3 } from "lucide-react";

interface AdminTest {
  id: string;
  title: string;
  subject: string | null;
  difficulty: string;
  status: string;
  createdAt: string;
  sourceUpload: { user: { email: string; name: string | null } } | null;
  _count: { questions: number; attempts: number };
}

export default function AdminTestsPage() {
  const [tests, setTests] = useState<AdminTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/tests")
      .then((res) => setTests(res.data.tests))
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
      <h1 className="text-2xl font-bold text-zinc-900">Mock Tests</h1>
      <div className="space-y-3">
        {tests.map((test) => (
          <Card key={test.id}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-zinc-900">{test.title}</p>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span className="capitalize">{test.subject || "General"}</span>
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                    {test._count.questions} Q
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {test._count.attempts} attempts
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    test.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                    test.difficulty === "HARD" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {test.difficulty.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
