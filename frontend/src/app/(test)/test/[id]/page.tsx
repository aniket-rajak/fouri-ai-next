"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileText, Clock, Timer, Pencil } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  type: string;
  difficulty: string;
  order: number;
}

interface TestData {
  id: string;
  title: string;
  subject: string | null;
  difficulty: string;
  totalQuestions: number;
  duration: number;
  questions: Question[];
}

function formatDuration(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
  }
  return `${mins} minutes`;
}

function parseMinutes(value: string, fallback: number): number {
  const n = parseInt(value, 10);
  return !isNaN(n) && n > 0 ? n : fallback;
}

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("30");

  useEffect(() => {
    api.get(`/tests/${params.id}`)
      .then((res) => setTest(res.data.test))
      .catch(() => router.push("/tests"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const startWithDefault = () => {
    router.push(`/test/${test!.id}/attempt`);
  };

  const startEditing = () => {
    setEditValue(String(Math.floor(test!.duration / 60)));
    setEditing(true);
  };

  const startWithCustom = () => {
    const mins = parseMinutes(editValue, Math.floor(test!.duration / 60));
    router.push(`/test/${test!.id}/attempt?duration=${mins * 60}`);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Card className="text-center">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-zinc-900">{test.title}</h1>
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <FileText size={16} />
              {test.totalQuestions} Questions
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={16} />
              {Math.floor(test.duration / 60)} Minutes
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
              test.difficulty === "EASY" ? "bg-green-100 text-green-700" :
              test.difficulty === "HARD" ? "bg-red-100 text-red-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {test.difficulty.toLowerCase()}
            </span>
          </div>
          <div className="pt-4 border-t border-zinc-200 space-y-4">
            <p className="text-sm text-zinc-600">
              This test will be in fullscreen mode. Do not switch tabs or the test will auto-submit.
            </p>

            {editing ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-500">
                  Set custom duration in minutes:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 px-3 py-2 border-2 border-zinc-900 rounded-lg text-center text-sm font-medium !text-black"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") startWithCustom();
                      if (e.key === "Escape") cancelEditing();
                    }}
                  />
                  <span className="text-sm text-zinc-500">minutes</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="secondary" size="md" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button size="md" onClick={startWithCustom}>
                    <Timer size={16} className="mr-2" />
                    Start Test ({formatDuration(parseMinutes(editValue, Math.floor(test!.duration / 60)))})
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Button size="lg" onClick={startWithDefault}>
                  <Timer size={16} className="mr-2" />
                  Start Test ({formatDuration(Math.floor(test.duration / 60))})
                </Button>
                <Button variant="secondary" size="md" onClick={startEditing}>
                  <Pencil size={14} className="mr-1.5" />
                  Edit Time
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
