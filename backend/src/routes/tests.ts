import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { generateAnalysisReport } from "../services/openai.js";
import { getUserCredits, deductCredits, estimateAnalysisReportCost } from "../services/creditService.js";

const router = Router();

// ── Enhanced My Tests ──
router.get("/mine", authenticate, async (req, res) => {
  try {
    const uid = req.user!.uid;
    const q = (req.query.q as string || "").trim();
    const subject = req.query.subject as string || "";
    const difficulty = req.query.difficulty as string || "";
    const status = req.query.status as string || "";
    const sort = req.query.sort as string || "recent";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      sourceUpload: { userId: uid },
      status: "PUBLISHED",
    };
    if (q) where.title = { contains: q, mode: "insensitive" };
    if (subject) where.subject = subject;
    if (difficulty) where.difficulty = difficulty;

    const orderBy: any = {};
    if (sort === "alpha") orderBy.title = "asc";
    else if (sort === "newest") orderBy.createdAt = "desc";
    else orderBy.createdAt = "desc";

    const [tests, total] = await Promise.all([
      prisma.mockTest.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          sourceUpload: { select: { status: true, createdAt: true, filename: true } },
          attempts: {
            where: { userId: uid, status: "COMPLETED" },
            select: { score: true, totalMarks: true, accuracy: true, completedAt: true, id: true },
            orderBy: { completedAt: "desc" },
          },
        },
      }),
      prisma.mockTest.count({ where }),
    ]);

    const enriched = tests.map((t) => {
      const attempts = t.attempts;
      const scores = attempts.map((a) => a.accuracy).filter(Boolean) as number[];
      const bestScore = scores.length ? Math.max(...scores) : null;
      const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      const latestScore = scores.length ? scores[scores.length - 1] : null;
      const improvement = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : null;
      return {
        id: t.id,
        title: t.title,
        subject: t.subject,
        difficulty: t.difficulty,
        totalQuestions: t.totalQuestions,
        duration: t.duration,
        attemptCount: t.attemptCount,
        createdAt: t.createdAt,
        uploadStatus: t.sourceUpload?.status || null,
        uploadFilename: t.sourceUpload?.filename || null,
        uploadCreatedAt: t.sourceUpload?.createdAt || null,
        stats: {
          totalAttempts: attempts.length,
          bestScore,
          avgScore: avgScore ? Math.round(avgScore * 100) / 100 : null,
          latestScore,
          improvement: improvement ? Math.round(improvement * 100) / 100 : null,
          lastAttemptedAt: attempts[0]?.completedAt || null,
        },
      };
    });

    const totalPages = Math.ceil(total / limit);
    res.json({ tests: enriched, pagination: { page, limit, total, totalPages } });
  } catch (error) {
    console.error("[Tests] /mine error:", error);
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});

// ── Enhanced Discover ──
router.get("/discover", authenticate, async (req, res) => {
  try {
    const q = (req.query.q as string || "").trim();
    const subject = req.query.subject as string || "";
    const examType = req.query.examType as string || "";
    const difficulty = req.query.difficulty as string || "";
    const uploadDate = req.query.uploadDate as string || "all";
    const sort = req.query.sort as string || "newest";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = { status: "PUBLISHED" };
    if (q) where.title = { contains: q, mode: "insensitive" };
    if (subject) where.subject = subject;
    if (examType) where.examType = examType;
    if (difficulty) where.difficulty = difficulty;

    const now = new Date();
    if (uploadDate === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: start };
    } else if (uploadDate === "yesterday") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: start, lt: end };
    } else if (uploadDate === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: weekAgo };
    } else if (uploadDate === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: monthAgo };
    }

    const orderBy: any = {};
    if (sort === "popular") orderBy.attemptCount = "desc";
    else if (sort === "difficulty") orderBy.difficulty = "asc";
    else if (sort === "alpha") orderBy.title = "asc";
    else orderBy.createdAt = "desc";

    const [tests, total] = await Promise.all([
      prisma.mockTest.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          sourceUpload: {
            select: {
              userId: true,
              status: true,
              createdAt: true,
              filename: true,
              user: { select: { name: true } },
            },
          },
          attempts: {
            where: { status: "COMPLETED" },
            select: { accuracy: true, userId: true },
          },
        },
      }),
      prisma.mockTest.count({ where }),
    ]);

    const enriched = tests.map((t) => {
      const completedAttempts = t.attempts;
      const scores = completedAttempts.map((a) => a.accuracy).filter(Boolean) as number[];
      const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      const uniqueStudents = new Set(completedAttempts.map((a) => a.userId)).size;
      return {
        id: t.id,
        title: t.title,
        subject: t.subject,
        examType: t.examType,
        difficulty: t.difficulty,
        totalQuestions: t.totalQuestions,
        duration: t.duration,
        attemptCount: t.attemptCount,
        createdAt: t.createdAt,
        uploadStatus: t.sourceUpload?.status || null,
        uploadedBy: t.sourceUpload?.user?.name || "Anonymous",
        uploadedById: t.sourceUpload?.userId || null,
        totalStudents: uniqueStudents,
        avgScore: avgScore ? Math.round(avgScore * 100) / 100 : null,
        completionRate: t.attemptCount > 0 ? Math.round((completedAttempts.length / t.attemptCount) * 100) : null,
      };
    });

    const totalPages = Math.ceil(total / limit);
    const filters = await getDiscoverFilters();
    res.json({ tests: enriched, pagination: { page, limit, total, totalPages }, filters });
  } catch (error) {
    console.error("[Tests] /discover error:", error);
    res.status(500).json({ error: "Failed to fetch discover tests" });
  }
});

async function getDiscoverFilters() {
  const subjects = await prisma.mockTest.findMany({
    where: { status: "PUBLISHED" },
    distinct: ["subject"],
    select: { subject: true },
  });
  const examTypes = await prisma.mockTest.findMany({
    where: { status: "PUBLISHED" },
    distinct: ["examType"],
    select: { examType: true },
  });
  return {
    subjects: subjects.map((s) => s.subject).filter(Boolean) as string[],
    examTypes: examTypes.map((e) => e.examType).filter(Boolean) as string[],
  };
}

// ── Paper Analytics ──
router.get("/:id/analytics", authenticate, async (req, res) => {
  try {
    const testId = req.params.id as string;
    const uid = req.user!.uid;

    const test = await prisma.mockTest.findUnique({
      where: { id: testId },
      select: { id: true, title: true, subject: true, totalQuestions: true, duration: true },
    });
    if (!test) { res.status(404).json({ error: "Test not found" }); return; }

    const [myAttempts, allAttempts] = await Promise.all([
      prisma.testAttempt.findMany({
        where: { mockTestId: testId, userId: uid, status: "COMPLETED" },
        orderBy: { completedAt: "asc" },
        select: { id: true, score: true, totalMarks: true, accuracy: true, timeTaken: true, completedAt: true },
      }),
      prisma.testAttempt.findMany({
        where: { mockTestId: testId, status: "COMPLETED" },
        include: {
          answers: {
            where: { isCorrect: false },
            select: { questionId: true },
          },
        },
      }),
    ]);

    const myScores = myAttempts.map((a) => a.accuracy).filter(Boolean) as number[];
    const personal = {
      totalAttempts: myAttempts.length,
      bestScore: myScores.length ? Math.max(...myScores) : null,
      avgScore: myScores.length ? Math.round((myScores.reduce((a, b) => a + b, 0) / myScores.length) * 100) / 100 : null,
      latestScore: myScores.length ? myScores[myScores.length - 1] : null,
      improvement: myScores.length >= 2
        ? Math.round((myScores[myScores.length - 1] - myScores[0]) * 100) / 100
        : null,
      totalTimeSpent: myAttempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0),
      attempts: myAttempts,
    };

    const allScores = allAttempts.map((a) => a.accuracy).filter(Boolean) as number[];
    const uniqueStudents = new Set(allAttempts.map((a) => a.userId)).size;

    // Most frequently incorrect questions
    const incorrectCounts = new Map<string, number>();
    for (const attempt of allAttempts) {
      for (const ans of attempt.answers) {
        incorrectCounts.set(ans.questionId, (incorrectCounts.get(ans.questionId) || 0) + 1);
      }
    }
    const topIncorrect = [...incorrectCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([questionId, count]) => ({ questionId, count }));

    // Most difficult questions (by incorrect rate)
    const questionAttemptCount = new Map<string, number>();
    for (const attempt of allAttempts) {
      const seen = new Set<string>();
      for (const ans of attempt.answers) {
        if (!seen.has(ans.questionId)) {
          questionAttemptCount.set(ans.questionId, (questionAttemptCount.get(ans.questionId) || 0) + 1);
          seen.add(ans.questionId);
        }
      }
    }
    const difficultQuestions = topIncorrect.map(({ questionId, count }) => ({
      questionId,
      incorrectCount: count,
      totalAttempts: questionAttemptCount.get(questionId) || 0,
      failureRate: questionAttemptCount.get(questionId)
        ? Math.round((count / questionAttemptCount.get(questionId)!) * 100)
        : 0,
    }));

    const community = {
      totalStudents: uniqueStudents,
      totalAttempts: allAttempts.length,
      avgScore: allScores.length
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
        : null,
      topScore: allScores.length ? Math.max(...allScores) : null,
      mostDifficultQuestions: difficultQuestions,
    };

    res.json({ personal, community });
  } catch (error) {
    console.error("[Tests] analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ── Attempt History for a specific paper ──
router.get("/:id/attempts", authenticate, async (req, res) => {
  try {
    const testId = req.params.id as string;
    const uid = req.user!.uid;

    const attempts = await prisma.testAttempt.findMany({
      where: { mockTestId: testId, userId: uid, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      select: {
        id: true,
        score: true,
        totalMarks: true,
        accuracy: true,
        timeTaken: true,
        completedAt: true,
        mockTest: { select: { title: true } },
      },
    });

    res.json({ attempts });
  } catch (error) {
    console.error("[Tests] attempts error:", error);
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
});

// ── Leaderboard ──
router.get("/:id/leaderboard", authenticate, async (req, res) => {
  try {
    const testId = req.params.id as string;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const attempts = await prisma.testAttempt.findMany({
      where: { mockTestId: testId, status: "COMPLETED", accuracy: { not: null } },
      orderBy: { accuracy: "desc" },
      take: limit,
      select: {
        id: true,
        accuracy: true,
        score: true,
        totalMarks: true,
        timeTaken: true,
        completedAt: true,
        user: { select: { name: true } },
      },
    });

    const leaderboard = attempts.map((a, i) => ({
      rank: i + 1,
      name: a.user.name || "Anonymous",
      score: a.accuracy,
      correctAnswers: a.score,
      totalQuestions: a.totalMarks,
      timeTaken: a.timeTaken,
      completedAt: a.completedAt,
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error("[Tests] leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ── Similar Papers ──
router.get("/:id/similar", authenticate, async (req, res) => {
  try {
    const testId = req.params.id as string;

    const test = await prisma.mockTest.findUnique({
      where: { id: testId },
      select: { subject: true, examType: true, difficulty: true },
    });
    if (!test) { res.status(404).json({ error: "Test not found" }); return; }

    const similar = await prisma.mockTest.findMany({
      where: {
        id: { not: testId },
        status: "PUBLISHED",
        OR: [
          { subject: test.subject },
          { examType: test.examType },
          { difficulty: test.difficulty },
        ],
      },
      take: 6,
      orderBy: { attemptCount: "desc" },
      select: {
        id: true,
        title: true,
        subject: true,
        examType: true,
        difficulty: true,
        totalQuestions: true,
        attemptCount: true,
      },
    });

    res.json({ tests: similar });
  } catch (error) {
    console.error("[Tests] similar error:", error);
    res.status(500).json({ error: "Failed to fetch similar tests" });
  }
});

// ── Add Bookmark ──
router.post("/:id/bookmark", authenticate, async (req, res) => {
  try {
    const testId = req.params.id as string;
    const uid = req.user!.uid;

    const existing = await prisma.bookmark.findUnique({
      where: { userId_mockTestId: { userId: uid, mockTestId: testId } },
    });
    if (existing) {
      res.json({ bookmarked: true });
      return;
    }

    await prisma.bookmark.create({
      data: { userId: uid, mockTestId: testId },
    });
    res.status(201).json({ bookmarked: true });
  } catch (error) {
    console.error("[Tests] bookmark error:", error);
    res.status(500).json({ error: "Failed to bookmark test" });
  }
});

// ── Remove Bookmark ──
router.delete("/:id/bookmark", authenticate, async (req, res) => {
  try {
    const testId = req.params.id as string;
    const uid = req.user!.uid;

    await prisma.bookmark.deleteMany({
      where: { userId: uid, mockTestId: testId },
    });
    res.json({ bookmarked: false });
  } catch (error) {
    console.error("[Tests] unbookmark error:", error);
    res.status(500).json({ error: "Failed to remove bookmark" });
  }
});

// ── Lightweight List of Bookmarked IDs ──
router.get("/me/bookmarks", authenticate, async (req, res) => {
  try {
    const uid = req.user!.uid;
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: uid },
      select: { mockTestId: true },
    });
    res.json({ ids: bookmarks.map((b) => b.mockTestId) });
  } catch (error) {
    console.error("[Tests] /me/bookmarks error:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

// ── Enhanced List Bookmarked Tests ──
router.get("/bookmarked", authenticate, async (req, res) => {
  try {
    const uid = req.user!.uid;
    const q = (req.query.q as string || "").trim();
    const subject = req.query.subject as string || "";
    const difficulty = req.query.difficulty as string || "";
    const sort = req.query.sort as string || "recent";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const mockTestWhere: any = {};
    if (q) {
      mockTestWhere.title = { contains: q, mode: "insensitive" };
    }
    if (subject) mockTestWhere.subject = subject;
    if (difficulty) mockTestWhere.difficulty = difficulty;

    const orderBy: any = {};
    if (sort === "uploaded") orderBy.mockTest = { createdAt: "desc" };
    else if (sort === "popular") orderBy.mockTest = { attemptCount: "desc" };
    else if (sort === "alpha") orderBy.mockTest = { title: "asc" };
    else if (sort === "difficulty") orderBy.mockTest = { difficulty: "asc" };
    else orderBy.createdAt = "desc"; // recently bookmarked

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId: uid, mockTest: mockTestWhere },
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
              attemptCount: true,
              createdAt: true,
              sourceUpload: { select: { status: true } },
            },
          },
        },
      }),
      prisma.bookmark.count({ where: { userId: uid, mockTest: mockTestWhere } }),
    ]);

    // Check completion status for each bookmarked test
    const tests = await Promise.all(
      bookmarks.map(async (b) => {
        const attemptCount = await prisma.testAttempt.count({
          where: { userId: uid, mockTestId: b.mockTest.id, status: "COMPLETED" },
        });
        return {
          ...b.mockTest,
          bookmarkedAt: b.createdAt,
          aiStatus: b.mockTest.sourceUpload?.status || null,
          completionStatus: attemptCount > 0 ? "completed" : "not_attempted",
        };
      })
    );

    const totalPages = Math.ceil(total / limit);
    res.json({ tests, pagination: { page, limit, total, totalPages } });
  } catch (error) {
    console.error("[Tests] bookmarked error:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

// ── AI Analysis Report ──
router.get("/:id/analysis", authenticate, async (req, res) => {
  try {
    const testId = req.params.id as string;
    const uid = req.user!.uid;

    const report = await prisma.analysisReport.findUnique({
      where: { mockTestId_userId: { mockTestId: testId, userId: uid } },
    });

    // If completed, return the report
    if (report && report.status === "COMPLETED") {
      res.json(report);
      return;
    }

    // If generating, return generating status
    if (report && report.status === "GENERATING") {
      res.json({ status: "GENERATING", id: report.id });
      return;
    }

    // If failed, return failed status so frontend can show credit dialog for retry
    if (report && report.status === "FAILED") {
      const questions = await prisma.question.count({
        where: { mockTestId: testId },
      });
      const credits = await getUserCredits(uid);
      const requiredCredits = estimateAnalysisReportCost(questions);
      res.json({
        status: "NOT_GENERATED",
        creditEstimate: {
          requiredCredits,
          availableCredits: credits.remaining,
          dailyCredits: credits.dailyCredits,
          hasEnoughCredits: credits.remaining >= requiredCredits,
          resetsAt: credits.resetsAt,
        },
        reportId: report.id,
      });
      return;
    }

    // Otherwise, return credit cost estimate for generating
    const questions = await prisma.question.count({
      where: { mockTestId: testId },
    });
    const credits = await getUserCredits(uid);
    const requiredCredits = estimateAnalysisReportCost(questions);

    res.json({
      status: "NOT_GENERATED",
      creditEstimate: {
        requiredCredits,
        availableCredits: credits.remaining,
        dailyCredits: credits.dailyCredits,
        hasEnoughCredits: credits.remaining >= requiredCredits,
        resetsAt: credits.resetsAt,
      },
      reportId: report?.id || null,
    });
  } catch (error) {
    console.error("[Tests] analysis error:", error);
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
});

router.post("/:id/analysis/generate", authenticate, async (req, res) => {
  try {
    const testId = req.params.id as string;
    const uid = req.user!.uid;

    // Get question count for cost estimation
    const questions = await prisma.question.findMany({
      where: { mockTestId: testId },
      orderBy: { order: "asc" },
      select: { id: true, questionText: true, type: true, difficulty: true, correctAnswer: true },
    });

    if (!questions.length) {
      res.status(400).json({ error: "No questions found for this test" });
      return;
    }

    // Check and deduct credits
    const credits = await getUserCredits(uid);
    const requiredCredits = estimateAnalysisReportCost(questions.length);

    if (credits.remaining < requiredCredits) {
      res.status(403).json({
        error: "INSUFFICIENT_CREDITS",
        message: `AI Analysis requires ${requiredCredits} credits but you only have ${credits.remaining}.`,
        required: requiredCredits,
        available: credits.remaining,
      });
      return;
    }

    await deductCredits(uid, requiredCredits);

    // Create or reuse report record
    let report = await prisma.analysisReport.findUnique({
      where: { mockTestId_userId: { mockTestId: testId, userId: uid } },
    });

    if (!report) {
      report = await prisma.analysisReport.create({
        data: { mockTestId: testId, userId: uid, status: "GENERATING" },
      });
    } else {
      report = await prisma.analysisReport.update({
        where: { id: report.id },
        data: { status: "GENERATING" },
      });
    }

    // Background generation
    generateAnalysisInBackground(testId, uid, report.id, requiredCredits).catch((err) => {
      console.error("[Analysis] background gen error:", err);
    });

    res.json({ status: "GENERATING", id: report.id, creditsUsed: requiredCredits });
  } catch (error) {
    console.error("[Tests] analysis generate error:", error);
    res.status(500).json({ error: "Failed to start analysis generation" });
  }
});

async function generateAnalysisInBackground(testId: string, userId: string, reportId: string, creditsDeducted?: number) {
  try {
    const questions = await prisma.question.findMany({
      where: { mockTestId: testId },
      orderBy: { order: "asc" },
      select: { id: true, questionText: true, type: true, difficulty: true, correctAnswer: true },
    });

    if (!questions.length) throw new Error("No questions found");

    const userAttempt = await prisma.testAttempt.findFirst({
      where: { mockTestId: testId, userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: {
        answers: {
          select: { questionId: true, selectedOption: true, isCorrect: true, timeSpent: true },
        },
      },
    });

    // Community stats
    const allCompleted = await prisma.testAttempt.findMany({
      where: { mockTestId: testId, status: "COMPLETED" },
      select: { accuracy: true, userId: true },
    });
    const allScores = allCompleted.map((a) => a.accuracy).filter(Boolean) as number[];
    const uniqueStudents = new Set(allCompleted.map((a) => a.userId)).size;

    // Most incorrect questions
    const allAnswers = await prisma.answer.findMany({
      where: { testAttempt: { mockTestId: testId, status: "COMPLETED" } },
      select: { questionId: true, isCorrect: true },
    });
    const incorrectCounts = new Map<string, number>();
    const totalCounts = new Map<string, number>();
    for (const ans of allAnswers) {
      totalCounts.set(ans.questionId, (totalCounts.get(ans.questionId) || 0) + 1);
      if (ans.isCorrect === false) {
        incorrectCounts.set(ans.questionId, (incorrectCounts.get(ans.questionId) || 0) + 1);
      }
    }
    const mostIncorrect = [...incorrectCounts.entries()]
      .map(([qId, count]) => ({
        questionId: qId,
        failureRate: totalCounts.get(qId) ? Math.round((count / totalCounts.get(qId)!) * 100) : 0,
      }))
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 5);

    const analysisInput = {
      questions: questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        type: q.type,
        difficulty: q.difficulty,
        topic: null,
        correctAnswer: q.correctAnswer,
      })),
      userAnswers: userAttempt?.answers.map((a) => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        isCorrect: a.isCorrect,
        timeSpent: a.timeSpent,
      })),
      communityStats: {
        avgScore: allScores.length ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100 : null,
        totalStudents: uniqueStudents,
        mostIncorrectQuestions: mostIncorrect,
      },
    };

    const report = await generateAnalysisReport(analysisInput);

    await prisma.analysisReport.update({
      where: { id: reportId },
      data: {
        status: "COMPLETED",
        paperSummary: {
          difficultyBreakdown: report.difficultyBreakdown,
          topicCoverage: [],
          communityStats: {
            avgScore: analysisInput.communityStats.avgScore,
            totalStudents: analysisInput.communityStats.totalStudents,
            mostIncorrectQuestions: analysisInput.communityStats.mostIncorrectQuestions,
          },
          questionDistribution: {
            mcq: questions.filter((q) => q.type === "MCQ").length,
            subjective: questions.filter((q) => q.type === "SUBJECTIVE").length,
          },
        },
        personalSummary: {
          overallPerformance: report.overallSummary,
          strengths: report.strengths,
          weaknesses: report.weaknesses,
          recommendations: report.recommendations,
          studyStrategy: report.studyStrategy,
          questionInsights: report.questionInsights,
        },
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Analysis] generation error:", error);

    if (creditsDeducted) {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (user) {
          const refunded = Math.min(creditsDeducted, user.usedCredits);
          await prisma.user.update({
            where: { firebaseUid: userId },
            data: { usedCredits: { decrement: refunded } },
          });
          console.log(`[Analysis] Refunded ${refunded} credits to user ${userId} after generation failure`);
        }
      } catch (refundError) {
        console.error("[Analysis] Failed to refund credits:", refundError);
      }
    }

    await prisma.analysisReport.update({
      where: { id: reportId },
      data: { status: "FAILED" },
    });
  }
}

// ── Original routes (keep backward compat) ──
router.get("/", authenticate, async (req, res) => {
  try {
    const tests = await prisma.mockTest.findMany({
      where: {
        sourceUpload: { userId: req.user!.uid },
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        subject: true,
        difficulty: true,
        totalQuestions: true,
        duration: true,
        attemptCount: true,
        createdAt: true,
      },
    });
    res.json({ tests });
    console.log(`[Tests] Listing for user ${req.user!.uid}: ${tests.length} tests found`);
  } catch (error) {
    console.error("Fetch tests error:", error);
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const testId = req.params.id as string;
    const test = await prisma.mockTest.findUnique({
      where: { id: testId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            questionText: true,
            options: true,
            type: true,
            difficulty: true,
            order: true,
          },
        },
        sourceUpload: {
          select: { userId: true },
        },
      },
    });

    if (!test || test.status !== "PUBLISHED") {
      console.log(`[Tests] GET /tests/${testId} -> NOT FOUND (exists=${!!test}, status=${test?.status})`);
      res.status(404).json({ error: "Test not found" });
      return;
    }

    const { sourceUpload: _sourceUpload, ...testData } = test;
    const normalized = JSON.parse(JSON.stringify(testData));
    for (const q of normalized.questions) {
      if (!Array.isArray(q.options)) {
        if (typeof q.options === "string") {
          try { q.options = JSON.parse(q.options); }
          catch { q.options = []; }
        } else {
          q.options = [];
        }
      }
    }
    res.json({ test: { ...normalized, totalQuestions: normalized.questions.length } });
  } catch (error) {
    console.error("Fetch test error:", error);
    res.status(500).json({ error: "Failed to fetch test" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const testId = req.params.id as string;

    const test = await prisma.mockTest.findUnique({
      where: { id: testId },
      include: { sourceUpload: { select: { userId: true } } },
    });

    if (!test || test.sourceUpload?.userId !== req.user!.uid) {
      res.status(404).json({ error: "Test not found" });
      return;
    }

    await prisma.mockTest.delete({ where: { id: testId } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete test error:", error);
    res.status(500).json({ error: "Failed to delete test" });
  }
});

export default router;
