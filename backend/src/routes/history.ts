import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

// ── User attempt history (all tests, with origin indicator) ──
router.get("/", authenticate, async (req, res) => {
  try {
    const uid = req.user!.uid;
    const q = (req.query.q as string || "").trim();
    const sort = req.query.sort as string || "date";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId: uid, status: "COMPLETED" };

    const [attempts, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where,
        orderBy: { completedAt: sort === "score" ? "desc" : "desc" },
        skip,
        take: limit,
        include: {
          mockTest: {
            select: {
              id: true,
              title: true,
              subject: true,
              totalQuestions: true,
              duration: true,
              sourceUpload: { select: { userId: true } },
            },
          },
        },
      }),
      prisma.testAttempt.count({ where }),
    ]);

    const items = attempts.map((a) => {
      const isOwnTest = a.mockTest.sourceUpload?.userId === uid;
      return {
        attemptId: a.id,
        testId: a.mockTest.id,
        testTitle: a.mockTest.title,
        subject: a.mockTest.subject,
        totalQuestions: a.mockTest.totalQuestions,
        duration: a.mockTest.duration,
        score: a.score,
        totalMarks: a.totalMarks,
        accuracy: a.accuracy,
        timeTaken: a.timeTaken,
        completedAt: a.completedAt,
        source: isOwnTest ? "my_test" : "discover",
      };
    });

    if (sort === "score") {
      items.sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
    }

    const totalPages = Math.ceil(total / limit);
    res.json({ attempts: items, pagination: { page, limit, total, totalPages } });
  } catch (error) {
    console.error("[History] error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ── User progress stats ──
router.get("/progress", authenticate, async (req, res) => {
  try {
    const uid = req.user!.uid;

    const allAttempts = await prisma.testAttempt.findMany({
      where: { userId: uid, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      select: {
        id: true,
        accuracy: true,
        score: true,
        totalMarks: true,
        timeTaken: true,
        completedAt: true,
        mockTest: { select: { id: true } },
      },
    });

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const weeklyAttempts = allAttempts.filter((a) => a.completedAt && a.completedAt >= startOfWeek);
    const monthlyAttempts = allAttempts.filter((a) => a.completedAt && a.completedAt >= startOfMonth);

    const allScores = allAttempts.map((a) => a.accuracy).filter(Boolean) as number[];
    const uniqueTests = new Set(allAttempts.map((a) => a.mockTest.id)).size;

    // Improvement trend (last 10 attempts)
    const trend = allAttempts.slice(0, 10).reverse().map((a) => ({
      score: a.accuracy,
      date: a.completedAt,
    }));

    res.json({
      totalTests: uniqueTests,
      totalAttempts: allAttempts.length,
      totalScore: allAttempts.reduce((sum, a) => sum + (a.score || 0), 0),
      avgScore: allScores.length
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
        : null,
      bestScore: allScores.length ? Math.max(...allScores) : null,
      totalTimeSpent: allAttempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0),
      weekly: {
        attempts: weeklyAttempts.length,
        avgScore: weeklyAttempts.length
          ? Math.round(weeklyAttempts.reduce((s, a) => s + (a.accuracy || 0), 0) / weeklyAttempts.length * 100) / 100
          : null,
      },
      monthly: {
        attempts: monthlyAttempts.length,
        avgScore: monthlyAttempts.length
          ? Math.round(monthlyAttempts.reduce((s, a) => s + (a.accuracy || 0), 0) / monthlyAttempts.length * 100) / 100
          : null,
      },
      trend,
    });
  } catch (error) {
    console.error("[History] progress error:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// ── User achievements ──
router.get("/achievements", authenticate, async (req, res) => {
  try {
    const uid = req.user!.uid;

    const [earnedBadges, allAttempts, allAnswers] = await Promise.all([
      prisma.achievement.findMany({
        where: { userId: uid },
        select: { badge: true, earnedAt: true },
      }),
      prisma.testAttempt.count({ where: { userId: uid, status: "COMPLETED" } }),
      prisma.answer.count({
        where: {
          testAttempt: { userId: uid, status: "COMPLETED" },
          selectedOption: { not: null },
        },
      }),
    ]);

    const earnedSet = new Set(earnedBadges.map((b) => b.badge));

    // Define all badges and check if earned
    const badges = [
      { id: "FIRST_TEST", label: "First Mock Test", description: "Complete your first mock test", icon: "🎯",
        earned: earnedSet.has("FIRST_TEST"), earnedAt: earnedBadges.find((b) => b.badge === "FIRST_TEST")?.earnedAt,
        unlocked: allAttempts >= 1 },
      { id: "TEN_TESTS", label: "10 Tests Completed", description: "Complete 10 mock tests", icon: "🏆",
        earned: earnedSet.has("TEN_TESTS"), earnedAt: earnedBadges.find((b) => b.badge === "TEN_TESTS")?.earnedAt,
        unlocked: allAttempts >= 10 },
      { id: "HUNDRED_QUESTIONS", label: "100 Questions Solved", description: "Answer 100 questions", icon: "📝",
        earned: earnedSet.has("HUNDRED_QUESTIONS"), earnedAt: earnedBadges.find((b) => b.badge === "HUNDRED_QUESTIONS")?.earnedAt,
        unlocked: allAnswers >= 100 },
      { id: "STREAK_7", label: "7-Day Streak", description: "Practice for 7 consecutive days", icon: "🔥",
        earned: earnedSet.has("STREAK_7"), earnedAt: earnedBadges.find((b) => b.badge === "STREAK_7")?.earnedAt,
        unlocked: false }, // Streak tracking would need a separate mechanism
    ];

    // Auto-award newly unlocked badges
    for (const badge of badges) {
      if (badge.unlocked && !badge.earned) {
        try {
          await prisma.achievement.create({
            data: { userId: uid, badge: badge.id },
          });
          badge.earned = true;
          badge.earnedAt = new Date();
        } catch { /* already exists */ }
      }
    }

    res.json({ badges, totalEarned: earnedBadges.length });
  } catch (error) {
    console.error("[History] achievements error:", error);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

export default router;
