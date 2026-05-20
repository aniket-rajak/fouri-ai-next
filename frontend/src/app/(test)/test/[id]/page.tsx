"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileText, Clock } from "lucide-react";

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

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tests/${params.id}`)
      .then((res) => setTest(res.data.test))
      .catch(() => router.push("/tests"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

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
        <div className="space-y-4">
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
          <div className="pt-4 border-t border-zinc-200">
            <p className="text-sm text-zinc-600 mb-4">
              This test will be in fullscreen mode. Do not switch tabs or the test will auto-submit.
            </p>
            <Button
              size="lg"
              onClick={() => router.push(`/test/${test.id}/attempt`)}
            >
              Start Test
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
