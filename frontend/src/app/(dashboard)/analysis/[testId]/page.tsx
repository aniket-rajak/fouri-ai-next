"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { AdSlot } from "@/components/AdSlot";
import { AIAnalysisCreditDialog } from "@/components/AIAnalysisCreditDialog";
import {
  BrainCircuit, Loader2, ArrowLeft, CheckCircle2, XCircle,
  BookOpen, TrendingUp, Target, AlertCircle, RefreshCw,
  ThumbsUp, Lightbulb, GraduationCap, FileText,
  ChevronLeft
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

interface AnalysisReport {
  id: string;
  status: string;
  paperSummary?: {
    difficultyBreakdown: {
      easy: { correct: number; total: number; accuracy: number };
      medium: { correct: number; total: number; accuracy: number };
      hard: { correct: number; total: number; accuracy: number };
    };
    topicCoverage: string[];
    communityStats: {
      avgScore: number | null;
      totalStudents: number;
      mostIncorrectQuestions: { questionId: string; failureRate: number }[];
    };
    questionDistribution: { mcq: number; subjective: number };
  };
  personalSummary?: {
    overallPerformance: string;
    strengths: { topic: string; accuracy: number; comment: string }[];
    weaknesses: { topic: string; accuracy: number; comment: string }[];
    recommendations: string[];
    studyStrategy: string;
    questionInsights: { questionId: string; insight: string }[];
  };
}

const DIFFICULTY_COLORS = ["#22c55e", "#eab308", "#ef4444"];

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(false);
  const [creditEstimate, setCreditEstimate] = useState<{
    requiredCredits: number;
    availableCredits: number;
    dailyCredits: number;
    hasEnoughCredits: boolean;
  } | null>(null);
  const [generatingCredit, setGeneratingCredit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  const fetchReport = useCallback(() => {
    setLoading(true);
    setError(false);
    api.get(`/tests/${testId}/analysis`)
      .then((res) => {
        if (res.data.status === "COMPLETED") {
          setReport(res.data);
          setLoading(false);
          setGenerating(false);
        } else if (res.data.status === "GENERATING") {
          setGenerating(true);
          setLoading(false);
          setTimeout(fetchReport, 3000);
        } else if (res.data.status === "NOT_GENERATED") {
          setCreditEstimate(res.data.creditEstimate);
          setFailureReason(res.data.failureReason || null);
          setLoading(false);
        } else {
          setError(true);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
        const msg = axiosErr?.response?.data?.error || axiosErr?.message || "Failed to load analysis";
        console.error("[Analysis] fetch error:", msg);
        setErrorMessage(msg);
        setError(true);
        setLoading(false);
      });
  }, [testId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleGenerateAnalysis = async () => {
    setGeneratingCredit(true);
    try {
      await api.post(`/tests/${testId}/analysis/generate`);
      setCreditEstimate(null);
      setGenerating(true);
      setGeneratingCredit(false);
      // Poll for completion
      const poll = () => {
        api.get(`/tests/${testId}/analysis`)
          .then((res) => {
            if (res.data.status === "COMPLETED") {
              setReport(res.data);
              setGenerating(false);
            } else if (res.data.status === "GENERATING") {
              setTimeout(poll, 5000);
            } else if (res.data.status === "NOT_GENERATED") {
              setCreditEstimate(res.data.creditEstimate);
              setFailureReason(res.data.failureReason || null);
              setGenerating(false);
            } else {
              setError(true);
              setGenerating(false);
            }
          })
          .catch((pollErr: unknown) => {
            const axiosErr = pollErr as { response?: { data?: { error?: string } }; message?: string };
            const msg = axiosErr?.response?.data?.error || axiosErr?.message || "Failed to check analysis status";
            console.error("[Analysis] poll error:", msg);
            setErrorMessage(msg);
            setError(true);
            setGenerating(false);
          });
      };
      setTimeout(poll, 5000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      const msg = axiosErr?.response?.data?.error || axiosErr?.response?.data?.message || axiosErr?.message || "Failed to generate analysis";
      console.error("[Analysis] generate error:", msg);
      setErrorMessage(msg);
      setGeneratingCredit(false);
      setError(true);
    }
  };

  const handleCancelGenerate = () => {
    setCreditEstimate(null);
    setFailureReason(null);
    setError(true);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/discover");
    }
  };

  const backButton = (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
    >
      <ChevronLeft size={16} />
      <span className="hidden sm:inline">Back</span>
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">{backButton}</div>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
        </div>
      </div>
    );
  }

  if (creditEstimate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">{backButton}</div>
        <div className="py-12">
          <AIAnalysisCreditDialog
            requiredCredits={creditEstimate.requiredCredits}
            availableCredits={creditEstimate.availableCredits}
            dailyCredits={creditEstimate.dailyCredits}
            loading={generatingCredit}
            onConfirm={handleGenerateAnalysis}
            onCancel={handleCancelGenerate}
          />
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">{backButton}</div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4 px-4">
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-zinc-900" />
              <p className="text-lg font-semibold text-zinc-900">Generating AI Analysis...</p>
            </div>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              Our AI is analyzing the paper content and performance data. This typically takes 10-30 seconds.
            </p>
            <div className="w-48 sm:w-56 h-1.5 bg-zinc-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-zinc-900 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">{backButton}</div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4 px-4">
            <AlertCircle size={40} className="mx-auto text-zinc-300" />
            <p className="text-zinc-500">{failureReason || errorMessage || "Failed to load analysis. Please try again."}</p>
            <button
              onClick={fetchReport}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 cursor-pointer"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const paper = report.paperSummary;
  const personal = report.personalSummary;

  const difficultyData = paper
    ? [
        { name: "Easy", value: paper.difficultyBreakdown.easy.total },
        { name: "Medium", value: paper.difficultyBreakdown.medium.total },
        { name: "Hard", value: paper.difficultyBreakdown.hard.total },
      ]
    : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {backButton}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-2 break-words">
            <BrainCircuit size={22} className="text-green-600 shrink-0" />
            AI Analysis Report
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">Comprehensive analysis of the test paper and your performance</p>
        </div>
      </div>

      <AdSlot slot="in-content-analysis" format="horizontal" className="mx-auto max-w-[728px]" />

      {/* Paper Analysis Section */}
      {paper && (
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <FileText size={16} className="shrink-0" />
            Paper Analysis
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Difficulty Distribution */}
            <Card className="p-3 sm:p-4">
              <p className="text-sm font-medium text-zinc-700 mb-3">Difficulty Distribution</p>
              <div className="h-40 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {difficultyData.map((_, i) => (
                        <Cell key={i} fill={DIFFICULTY_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Question Distribution */}
            <Card className="p-3 sm:p-4">
              <p className="text-sm font-medium text-zinc-700 mb-3">Question Types</p>
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">MCQ Questions</span>
                  <span className="text-lg font-bold text-zinc-900">{paper.questionDistribution.mcq}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Subjective Questions</span>
                  <span className="text-lg font-bold text-zinc-900">{paper.questionDistribution.subjective}</span>
                </div>
                <div className="pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-700">Total Questions</span>
                    <span className="text-lg font-bold text-zinc-900">
                      {paper.questionDistribution.mcq + paper.questionDistribution.subjective}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Community Stats */}
          <Card className="p-3 sm:p-4">
            <p className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
              <TrendingUp size={14} />
              Community Statistics
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Avg Score</p>
                <p className="text-lg sm:text-xl font-bold text-zinc-900">
                  {paper.communityStats.avgScore != null ? `${Math.round(paper.communityStats.avgScore)}%` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Students</p>
                <p className="text-lg sm:text-xl font-bold text-zinc-900">{paper.communityStats.totalStudents}</p>
              </div>
            </div>

            {paper.communityStats.mostIncorrectQuestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-100">
                <p className="text-xs font-medium text-zinc-500 mb-2">Most Incorrect Questions</p>
                <div className="space-y-1">
                  {paper.communityStats.mostIncorrectQuestions.map((q, i) => (
                    <div key={q.questionId} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600">Question #{i + 1}</span>
                      <span className="text-red-600 font-medium">{q.failureRate}% incorrect</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* Personalized Analysis */}
      {personal && (
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <GraduationCap size={16} className="shrink-0" />
            Your Performance Analysis
          </h2>

          {/* Overall Summary */}
          <Card className="p-3 sm:p-4">
            <p className="text-sm font-medium text-zinc-700 mb-2">Overall Performance</p>
            <p className="text-sm text-zinc-600 leading-relaxed">{personal.overallPerformance}</p>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {personal.strengths.length > 0 && (
              <Card className="p-3 sm:p-4">
                <p className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                  <ThumbsUp size={14} />
                  Strengths
                </p>
                <div className="space-y-2">
                  {personal.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 break-words">{s.topic} — {Math.round(s.accuracy)}%</p>
                        <p className="text-xs text-zinc-500">{s.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {personal.weaknesses.length > 0 && (
              <Card className="p-3 sm:p-4">
                <p className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                  <AlertCircle size={14} />
                  Areas to Improve
                </p>
                <div className="space-y-2">
                  {personal.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 break-words">{w.topic} — {Math.round(w.accuracy)}%</p>
                        <p className="text-xs text-zinc-500">{w.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Difficulty Performance */}
          {paper && (
            <Card className="p-3 sm:p-4">
              <p className="text-sm font-medium text-zinc-700 mb-3">Accuracy by Difficulty</p>
              <div className="h-40 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Easy", accuracy: paper.difficultyBreakdown.easy.accuracy },
                      { name: "Medium", accuracy: paper.difficultyBreakdown.medium.accuracy },
                      { name: "Hard", accuracy: paper.difficultyBreakdown.hard.accuracy },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#999" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#999" }} />
                    <Tooltip formatter={(value: any) => [`${Math.round(Number(value))}%`, "Accuracy"]} />
                    <Bar dataKey="accuracy" fill="#18181b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {personal.recommendations.length > 0 && (
            <Card className="p-3 sm:p-4">
              <p className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
                <Lightbulb size={14} />
                AI Recommendations
              </p>
              <ul className="space-y-2">
                {personal.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                    <span className="text-zinc-900 font-medium shrink-0">{i + 1}.</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Study Strategy */}
          {personal.studyStrategy && (
            <Card className="p-3 sm:p-4">
              <p className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                <Target size={14} />
                Study Strategy
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">{personal.studyStrategy}</p>
            </Card>
          )}

          {/* Question Insights */}
          {personal.questionInsights.length > 0 && (
            <Card className="p-3 sm:p-4">
              <p className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
                <BookOpen size={14} />
                Question Insights
              </p>
              <div className="space-y-2">
                {personal.questionInsights.map((q, i) => (
                  <div key={q.questionId} className="p-3 rounded-lg bg-zinc-50 text-sm">
                    <p className="text-xs text-zinc-400 mb-1">Question #{i + 1}</p>
                    <p className="text-zinc-600">{q.insight}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      )}

      {!personal && paper && (
        <Card className="p-3 sm:p-4">
          <div className="text-center py-4 sm:py-6">
            <BrainCircuit size={28} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-zinc-500 text-sm px-4">
              Attempt this test to get a personalized performance analysis with strengths, weaknesses, and AI recommendations.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
