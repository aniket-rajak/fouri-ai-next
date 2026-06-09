import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma, withRetry } from "../lib/prisma.js";

const router = Router();

// ── Enhanced Results Listing ──
router.get("/", authenticate, async (req, res) => {
  try {
    const uid = req.user!.uid;
    const q = (req.query.q as string || "").trim();
    const subject = req.query.subject as string || "";
    const examType = req.query.examType as string || "";
    const scoreMin = parseInt(req.query.scoreMin as string) || 0;
    const scoreMax = parseInt(req.query.scoreMax as string) || 100;
    const dateFrom = req.query.dateFrom as string || "";
    const dateTo = req.query.dateTo as string || "";
    const sort = req.query.sort as string || "newest";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId: uid, status: "COMPLETED" };

    if (q) {
      where.OR = [
        { mockTest: { title: { contains: q, mode: "insensitive" } } },
        { mockTest: { subject: { contains: q, mode: "insensitive" } } },
      ];
    }
    if (subject) where.mockTest = { ...(where.mockTest || {}), subject };
    if (examType) where.mockTest = { ...(where.mockTest || {}), examType };
    if (scoreMin > 0 || scoreMax < 100) {
      where.accuracy = { gte: scoreMin, lte: scoreMax };
    }
    if (dateFrom) where.completedAt = { ...(where.completedAt || {}), gte: new Date(dateFrom) };
    if (dateTo) where.completedAt = { ...(where.completedAt || {}), lte: new Date(dateTo) };

    const orderBy: any = {};
    if (sort === "highest") orderBy.accuracy = "desc";
    else if (sort === "lowest") orderBy.accuracy = "asc";
    else if (sort === "improved") orderBy.accuracy = "desc"; // We'll sort by improvement client-side if needed
    else orderBy.completedAt = "desc";

    const [attempts, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          mockTest: {
            select: {
              id: true,
              title: true,
              subject: true,
              examType: true,
              difficulty: true,
              totalQuestions: true,
              duration: true,
              sourceUpload: { select: { status: true } },
            },
          },
          answers: {
            select: { isCorrect: true, selectedOption: true },
          },
        },
      }),
      prisma.testAttempt.count({ where }),
    ]);

    // Batch compute community stats per mockTestId
    const mockTestIds = [...new Set(attempts.map((a) => a.mockTestId))];
    const communityStatsMap = new Map<string, { avgScore: number; topScore: number; totalStudents: number }>();

    if (mockTestIds.length > 0) {
      const aggregates = await Promise.all(
        mockTestIds.map((id) =>
          prisma.testAttempt.aggregate({
            where: { mockTestId: id, status: "COMPLETED" },
            _avg: { accuracy: true },
            _max: { accuracy: true },
            _count: true,
          }).then((result) => ({
            mockTestId: id,
            avgScore: result._avg.accuracy,
            topScore: result._max.accuracy,
            totalStudents: result._count,
          }))
        )
      );
      for (const agg of aggregates) {
        communityStatsMap.set(agg.mockTestId, {
          avgScore: agg.avgScore ?? 0,
          topScore: agg.topScore ?? 0,
          totalStudents: agg.totalStudents,
        });
      }
    }

    // Compute rank for each attempt
    const enriched = await Promise.all(
      attempts.map(async (a) => {
        const community = communityStatsMap.get(a.mockTestId);
        let rank = 1;
        if (community && a.accuracy != null) {
          const higherCount = await prisma.testAttempt.count({
            where: {
              mockTestId: a.mockTestId,
              status: "COMPLETED",
              accuracy: { gt: a.accuracy },
            },
          });
          rank = higherCount + 1;
        }

        const correctCount = a.answers.filter((ans) => ans.isCorrect === true).length;
        const wrongCount = a.answers.filter((ans) => ans.selectedOption !== null && ans.isCorrect !== true).length;
        const unansweredCount = a.answers.filter((ans) => ans.selectedOption === null).length;

        return {
          id: a.id,
          mockTestId: a.mockTestId,
          score: a.score,
          totalMarks: a.totalMarks,
          accuracy: a.accuracy,
          timeTaken: a.timeTaken,
          completedAt: a.completedAt,
          status: a.status,
          mockTest: a.mockTest,
          correctCount,
          wrongCount,
          unansweredCount,
          aiStatus: a.mockTest.sourceUpload?.status || null,
          communityAvg: community ? Math.round(community.avgScore * 100) / 100 : null,
          communityTop: community ? Math.round(community.topScore * 100) / 100 : null,
          rank,
          totalStudents: community?.totalStudents || 0,
        };
      })
    );

    const totalPages = Math.ceil(total / limit);
    res.json({ attempts: enriched, pagination: { page, limit, total, totalPages } });
  } catch (error) {
    console.error("[Results] list error:", error);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// ── Delete Result ──
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const attemptId = req.params.id as string;
    const uid = req.user!.uid;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: { userId: true },
    });

    if (!attempt || attempt.userId !== uid) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }

    await prisma.testAttempt.delete({ where: { id: attemptId } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("[Results] delete error:", error);
    res.status(500).json({ error: "Failed to delete result" });
  }
});

// ── Activity Analytics ──
router.get("/analytics", authenticate, async (req, res) => {
  try {
    const uid = req.user!.uid;

    const allAttempts = await prisma.testAttempt.findMany({
      where: { userId: uid, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: {
        mockTest: { select: { subject: true, title: true } },
      },
    });

    const scores = allAttempts.map((a) => a.accuracy).filter(Boolean) as number[];

    // Performance trend (last 20)
    const performanceTrend = allAttempts.slice(0, 20).reverse().map((a) => ({
      date: a.completedAt?.toISOString().split("T")[0] || "",
      accuracy: a.accuracy,
      testTitle: a.mockTest.title,
    }));

    // Subject-wise performance
    const subjectMap = new Map<string, { scores: number[]; attempts: number; bestScore: number }>();
    for (const a of allAttempts) {
      const subj = a.mockTest.subject || "General";
      const existing = subjectMap.get(subj) || { scores: [], attempts: 0, bestScore: 0 };
      if (a.accuracy != null) existing.scores.push(a.accuracy);
      existing.attempts++;
      if (a.accuracy != null && a.accuracy > existing.bestScore) existing.bestScore = a.accuracy;
      subjectMap.set(subj, existing);
    }
    const subjectWise = [...subjectMap.entries()].map(([subject, data]) => ({
      subject,
      avgScore: data.scores.length
        ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 100) / 100
        : null,
      totalAttempts: data.attempts,
      bestScore: data.bestScore,
    }));

    // Daily activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAttempts = allAttempts.filter((a) => a.completedAt && a.completedAt >= thirtyDaysAgo);
    const dayMap = new Map<string, number>();
    for (const a of recentAttempts) {
      if (a.completedAt) {
        const day = a.completedAt.toISOString().split("T")[0];
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      }
    }
    const dailyActivity = [...dayMap.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Weekly activity
    const weekMap = new Map<string, { count: number; scores: number[] }>();
    for (const a of allAttempts) {
      if (a.completedAt) {
        const d = new Date(a.completedAt);
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
        const weekKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
        const existing = weekMap.get(weekKey) || { count: 0, scores: [] };
        existing.count++;
        if (a.accuracy != null) existing.scores.push(a.accuracy);
        weekMap.set(weekKey, existing);
      }
    }
    const weeklyActivity = [...weekMap.entries()]
      .map(([week, data]) => ({
        week,
        attempts: data.count,
        avgScore: data.scores.length
          ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 100) / 100
          : null,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Accuracy trend (same as performance trend for simplicity)
    const accuracyTrend = allAttempts.slice(0, 20).reverse().map((a) => ({
      date: a.completedAt?.toISOString().split("T")[0] || "",
      accuracy: a.accuracy,
    }));

    const overall = {
      totalAttempts: allAttempts.length,
      avgScore: scores.length
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : null,
      bestScore: scores.length ? Math.max(...scores) : null,
      totalTimeSpent: allAttempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0),
    };

    res.json({
      performanceTrend,
      subjectWise,
      accuracyTrend,
      dailyActivity,
      weeklyActivity,
      overall,
    });
  } catch (error) {
    console.error("[Results] analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ── Result Detail (unchanged) ──
router.get("/:id", authenticate, async (req, res) => {
  try {
    const attemptId = req.params.id as string;
    const attempt = await withRetry(() =>
      prisma.testAttempt.findUnique({
        where: { id: attemptId },
        include: {
          mockTest: {
            select: { title: true, subject: true, totalQuestions: true, duration: true },
          },
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  questionText: true,
                  options: true,
                  correctAnswer: true,
                  type: true,
                  order: true,
                  explanations: {
                    select: {
                      shortExplanation: true,
                      detailedExplanation: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    );

    if (!attempt || attempt.userId !== req.user!.uid) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }

    const normalized = JSON.parse(JSON.stringify(attempt));
    if (normalized.answers) {
      for (const ans of normalized.answers) {
        if (ans.question?.options && !Array.isArray(ans.question.options)) {
          if (typeof ans.question.options === "string") {
            try { ans.question.options = JSON.parse(ans.question.options); }
            catch { ans.question.options = []; }
          } else {
            ans.question.options = [];
          }
        }
      }
    }

    res.json({ attempt: normalized });
  } catch (error) {
    console.error("Fetch result error:", error);
    res.status(500).json({ error: "Failed to fetch result" });
  }
});

export default router;
