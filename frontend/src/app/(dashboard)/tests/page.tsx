"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { FileText, Clock, Play, Trash2 } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

interface MockTest {
  id: string;
  title: string;
  subject: string | null;
  difficulty: string;
  totalQuestions: number;
  duration: number;
  attemptCount: number;
  createdAt: string;
}

export default function TestsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    api.get("/tests")
      .then((res) => setTests(res.data.tests))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (testId: string) => {
    setDeleting(testId);
    try {
      await api.delete(`/tests/${testId}`);
      setTests((prev) => prev.filter((t) => t.id !== testId));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">My Tests</h1>
        <Card>
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500">No tests yet. Upload a question paper to get started.</p>
            <Link
              href="/upload"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Upload a paper
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">My Tests</h1>

      {/* In-content Ad */}
      <div className="hidden sm:block my-4">
        <AdSlot slot="in-content-tests" format="horizontal" className="mx-auto max-w-[728px]" />
      </div>

      <div className="grid gap-4">
        {tests.map((test) => (
          <Card key={test.id}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="space-y-2 min-w-0 flex-1">
                <h3 className="font-semibold text-zinc-900">{test.title}</h3>
                <div className="flex items-center gap-3 text-sm text-zinc-500 flex-wrap">
                  <span className="capitalize">{test.subject || "General"}</span>
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                    {test.totalQuestions} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {Math.floor(test.duration / 60)} min
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
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setConfirmDelete(test.id)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete test"
                >
                  <Trash2 size={16} />
                </button>
                <Link
                  href={`/test/${test.id}`}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
                >
                  <Play size={14} />
                  Start
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900">Delete Test?</h3>
            <p className="text-sm text-zinc-600">
              This will permanently delete this test and all associated data (questions, attempts, and explanations). This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-10 rounded-lg border-2 border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {deleting === confirmDelete ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
