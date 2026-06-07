import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ownerAuth } from "../middleware/ownerAuth.js";
import { standardLimiter } from "../middleware/rateLimiter.js";

const router = Router();

const feedbackSchema = z.object({
  quizAttemptId: z.string().uuid(),
  userId: z.string().optional(),
  guestId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  category: z.enum(["QUIZ_QUALITY", "QUESTION_DIFFICULTY", "EXPLANATION_QUALITY", "OVERALL_EXPERIENCE"]).optional(),
});

const answersSchema = z.object({
  answers: z.record(z.string()),
  score: z.number().int().min(0).optional(),
});

// ─── Public: get visible feedback for carousel ───
router.get("/feedback", standardLimiter, async (_req, res) => {
  try {
    const feedbacks = await prisma.quizFeedback.findMany({
      where: { visible: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        quizAttempt: {
          select: { subject: true, topic: true, difficulty: true },
        },
      },
    });

    res.json({
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        rating: f.rating,
        comment: f.comment ? f.comment.slice(0, 200) : null,
        category: f.category,
        subject: f.quizAttempt.subject,
        topic: f.quizAttempt.topic,
        difficulty: f.quizAttempt.difficulty,
        createdAt: f.createdAt,
        reviewerName: f.reviewerName || "Anonymous",
        reviewerAvatar: f.reviewerAvatar || null,
      })),
    });
  } catch (error: any) {
    console.error("[quizFeedback] Fetch error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// ─── Submit feedback (auth optional) ───
router.post("/feedback", standardLimiter, async (req, res) => {
  try {
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid input",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const data = parsed.data;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: data.quizAttemptId },
    });
    if (!attempt) {
      res.status(404).json({ error: "Quiz attempt not found" });
      return;
    }

    const existing = await prisma.quizFeedback.findUnique({
      where: { quizAttemptId: data.quizAttemptId },
    });
    if (existing) {
      res.status(409).json({ error: "Feedback already submitted for this quiz" });
      return;
    }

    // Extract Firebase user info from auth header if present
    let firebaseUid: string | null = null;
    let reviewerName: string | null = null;
    let reviewerAvatar: string | null = null;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { auth } = await import("../services/firebaseAdmin.js");
        const token = authHeader.split("Bearer ")[1];
        const decoded = await auth.verifyIdToken(token);
        firebaseUid = decoded.uid;

        // Extract name from JWT claims or fall back to local DB
        reviewerName = decoded.name || null;
        reviewerAvatar = decoded.picture || null;

        if (!reviewerName) {
          const localUser = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
          if (localUser) {
            if (!reviewerName) reviewerName = localUser.name || null;
            if (!reviewerAvatar) reviewerAvatar = localUser.avatarUrl || null;
          }
        }
      } catch {
        // Token invalid — treat as guest
      }
    }

    const feedback = await prisma.quizFeedback.create({
      data: {
        quizAttemptId: data.quizAttemptId,
        userId: firebaseUid || data.userId || null,
        guestId: data.guestId || null,
        reviewerName,
        reviewerAvatar,
        rating: data.rating,
        comment: data.comment || null,
        category: data.category || null,
        visible: true,
      },
    });

    res.status(201).json({ feedback });
  } catch (error: any) {
    console.error("[quizFeedback] Create error:", error?.message || error);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

// ─── Get a single attempt by ID ───
router.get("/attempt/:attemptId", standardLimiter, async (req, res) => {
  try {
    const attemptId = req.params.attemptId as string;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        subject: true,
        topic: true,
        difficulty: true,
        score: true,
        totalQuestions: true,
        questions: true,
        answers: true,
        progress: true,
        pinned: true,
        status: true,
        createdAt: true,
        completedAt: true,
        feedback: {
          select: { id: true, rating: true, comment: true, category: true },
        },
      },
    });

    if (!attempt) {
      res.status(404).json({ error: "Quiz attempt not found" });
      return;
    }

    res.json({ attempt });
  } catch (error: any) {
    console.error("[quizFeedback] Attempt fetch error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch quiz attempt" });
  }
});

function isAnswerCorrectBackend(userAnswer: string, correctAnswer: string, options: string[]): boolean {
  const ua = String(userAnswer).trim();
  const ca = String(correctAnswer).trim();
  if (!ua || !ca) return false;

  // 1. Exact match (trimmed)
  if (ua === ca) return true;

  // 2. correctAnswer is a letter A-D → compare with options[index]
  const letterIndex = "ABCD".indexOf(ca.toUpperCase());
  if (letterIndex >= 0 && letterIndex < options.length) {
    if (ua === options[letterIndex].trim()) return true;
  }

  // 3. correctAnswer is "Option A" format → extract letter and compare
  const optionMatch = ca.match(/^option\s+([A-D])$/i);
  if (optionMatch) {
    const idx = "ABCD".indexOf(optionMatch[1].toUpperCase());
    if (idx >= 0 && idx < options.length) {
      if (ua === options[idx].trim()) return true;
    }
  }

  // 4. Normalized comparison (lowercase, no punctuation, no extra spaces)
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  if (normalize(ua) === normalize(ca)) return true;

  // 5. Check if options array contains the correctAnswer text
  for (const opt of options) {
    if (normalize(opt) === normalize(ca)) {
      return ua === opt.trim();
    }
  }

  return false;
}

function computeVerifiedScore(
  answers: Record<string, string>,
  questions: Array<{ options: string[]; correctAnswer: string }>
): { score: number; total: number } {
  let correct = 0;
  const total = questions.length;

  questions.forEach((q, i) => {
    const userAns = String(answers[i] || answers[String(i)] || "");
    if (userAns && isAnswerCorrectBackend(userAns, q.correctAnswer, q.options)) {
      correct++;
    }
  });

  return { score: correct, total };
}

// ─── Save user answers after quiz completion (with server-side re-validation) ───
router.patch("/attempt/:attemptId/answers", standardLimiter, async (req, res) => {
  try {
    const attemptId = req.params.attemptId as string;
    const parsed = answersSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid input",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const { answers } = parsed.data;

    const existing = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!existing) {
      res.status(404).json({ error: "Quiz attempt not found" });
      return;
    }

    // Re-validate score server-side from stored questions
    const questions: Array<{ options: string[]; correctAnswer: string }> =
      (existing.questions as any) || [];
    const { score: verifiedScore, total } = computeVerifiedScore(answers, questions);

    const updated = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        answers: answers as any,
        score: verifiedScore,
        totalQuestions: total,
        completedAt: existing.completedAt || new Date(),
        progress: JSON.parse(JSON.stringify({ cleared: true })),
      },
    });

    res.json({ attempt: updated, verified: { score: verifiedScore, total } });
  } catch (error: any) {
    console.error("[quizFeedback] Save answers error:", error?.message || error);
    res.status(500).json({ error: "Failed to save answers" });
  }
});

// ─── Save mid-quiz progress (auto-save answers + currentIndex + timeLeft) ───
const progressSchema = z.object({
  answers: z.record(z.string()).optional(),
  currentIndex: z.number().int().min(0).optional(),
  timeLeft: z.number().int().min(0).optional(),
});

router.patch("/attempt/:attemptId/progress", standardLimiter, async (req, res) => {
  try {
    const attemptId = req.params.attemptId as string;
    const parsed = progressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid input",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const existing = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!existing) {
      res.status(404).json({ error: "Quiz attempt not found" });
      return;
    }

    if (existing.status !== "IN_PROGRESS") {
      res.status(400).json({ error: "Quiz is not in progress" });
      return;
    }

    const { answers, currentIndex, timeLeft } = parsed.data;
    const updateData: any = {};

    if (answers) {
      updateData.answers = answers as any;
    }

    if (currentIndex !== undefined || timeLeft !== undefined) {
      const currentProgress = (existing.progress as any) || {};
      updateData.progress = {
        currentIndex: currentIndex ?? currentProgress.currentIndex ?? 0,
        timeLeft: timeLeft ?? currentProgress.timeLeft ?? 600,
        lastSavedAt: new Date().toISOString(),
      };
    }

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: updateData,
    });

    res.json({ saved: true });
  } catch (error: any) {
    console.error("[quizFeedback] Progress save error:", error?.message || error);
    res.status(500).json({ error: "Failed to save progress" });
  }
});

// ─── Re-compute and return verified score for an attempt ───
router.get("/attempt/:attemptId/score", standardLimiter, async (req, res) => {
  try {
    const attemptId = req.params.attemptId as string;
    const existing = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!existing) {
      res.status(404).json({ error: "Quiz attempt not found" });
      return;
    }

    const answers = (existing.answers as Record<string, string>) || {};
    const questions: Array<{ options: string[]; correctAnswer: string }> =
      (existing.questions as any) || [];

    const { score, total } = computeVerifiedScore(answers, questions);

    res.json({ score, total, storedScore: existing.score });
  } catch (error: any) {
    console.error("[quizFeedback] Score re-compute error:", error?.message || error);
    res.status(500).json({ error: "Failed to re-compute score" });
  }
});

// ─── Toggle pin ───
router.patch("/attempt/:attemptId/pin", standardLimiter, async (req, res) => {
  try {
    const attemptId = req.params.attemptId as string;

    const existing = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!existing) {
      res.status(404).json({ error: "Quiz attempt not found" });
      return;
    }

    const updated = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { pinned: !existing.pinned },
    });

    res.json({ pinned: updated.pinned });
  } catch (error: any) {
    console.error("[quizFeedback] Pin error:", error?.message || error);
    res.status(500).json({ error: "Failed to toggle pin" });
  }
});

// ─── Delete quiz attempt ───
router.delete("/attempt/:attemptId", standardLimiter, async (req, res) => {
  try {
    const attemptId = req.params.attemptId as string;

    const existing = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!existing) {
      res.status(404).json({ error: "Quiz attempt not found" });
      return;
    }

    await prisma.quizAttempt.delete({ where: { id: attemptId } });
    res.json({ success: true });
  } catch (error: any) {
    console.error("[quizFeedback] Delete error:", error?.message || error);
    res.status(500).json({ error: "Failed to delete quiz attempt" });
  }
});

// ─── Feedback stats (public) ───
router.get("/feedback/stats", standardLimiter, async (_req, res) => {
  try {
    const [feedbacks, totalCount] = await Promise.all([
      prisma.quizFeedback.findMany({
        where: { visible: true },
        select: { rating: true },
      }),
      prisma.quizFeedback.count({ where: { visible: true } }),
    ]);

    const totalRatings = feedbacks.length;
    const sumRatings = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    const averageRating = totalRatings > 0 ? Math.round((sumRatings / totalRatings) * 10) / 10 : 0;

    const distribution = [0, 0, 0, 0, 0];
    feedbacks.forEach((f) => { distribution[f.rating - 1]++; });

    const reviewsCount = await prisma.quizFeedback.count({
      where: { visible: true, comment: { not: null } },
    });

    res.json({
      averageRating,
      totalRatings,
      reviewsCount,
      distribution,
    });
  } catch (error: any) {
    console.error("[quizFeedback] Stats error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch feedback stats" });
  }
});

// ─── Feedback list with search, sort, pagination (public, visible only) ───
router.get("/feedback/list", standardLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const sort = (req.query.sort as string) || "newest";
    const search = (req.query.search as string) || "";
    const minRating = parseInt(req.query.minRating as string) || 0;
    const category = req.query.category as string || "";

    const where: any = { visible: true };

    if (search) {
      where.quizAttempt = {
        OR: [
          { subject: { contains: search, mode: "insensitive" } },
          { topic: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (minRating > 0) {
      where.rating = { gte: minRating };
    }

    if (category && ["QUIZ_QUALITY", "QUESTION_DIFFICULTY", "EXPLANATION_QUALITY", "OVERALL_EXPERIENCE"].includes(category)) {
      where.category = category;
    }

    let orderBy: any = { createdAt: "desc" as const };
    if (sort === "oldest") orderBy = { createdAt: "asc" };
    else if (sort === "highest") orderBy = { rating: "desc" };
    else if (sort === "lowest") orderBy = { rating: "asc" };

    const [feedbacks, total] = await Promise.all([
      prisma.quizFeedback.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          quizAttempt: {
            select: { subject: true, topic: true, difficulty: true },
          },
        },
      }),
      prisma.quizFeedback.count({ where }),
    ]);

    res.json({
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        rating: f.rating,
        comment: f.comment ? f.comment.slice(0, 200) : null,
        category: f.category,
        subject: f.quizAttempt.subject,
        topic: f.quizAttempt.topic,
        difficulty: f.quizAttempt.difficulty,
        createdAt: f.createdAt,
        reviewerName: f.reviewerName || "Anonymous",
        reviewerAvatar: f.reviewerAvatar || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[quizFeedback] List error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch feedback list" });
  }
});

// ─── Admin: get ALL feedback ───
router.get("/feedback/admin", ownerAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || "";
    const category = req.query.category as string || "";
    const visibility = req.query.visibility as string || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { quizAttempt: { subject: { contains: search, mode: "insensitive" } } },
        { quizAttempt: { topic: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (category && ["QUIZ_QUALITY", "QUESTION_DIFFICULTY", "EXPLANATION_QUALITY", "OVERALL_EXPERIENCE"].includes(category)) {
      where.category = category;
    }

    if (visibility === "visible") where.visible = true;
    else if (visibility === "hidden") where.visible = false;

    const [feedbacks, total] = await Promise.all([
      prisma.quizFeedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          quizAttempt: {
            select: { subject: true, topic: true, difficulty: true },
          },
        },
      }),
      prisma.quizFeedback.count({ where }),
    ]);

    res.json({
      feedbacks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("[quizFeedback] Admin fetch error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// ─── Admin: toggle visibility ───
router.patch("/feedback/:id/toggle", ownerAuth, async (req, res) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.quizFeedback.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Feedback not found" });
      return;
    }

    const updated = await prisma.quizFeedback.update({
      where: { id },
      data: { visible: !existing.visible },
    });

    res.json({ feedback: updated });
  } catch (error: any) {
    console.error("[quizFeedback] Toggle error:", error?.message || error);
    res.status(500).json({ error: "Failed to toggle feedback visibility" });
  }
});

// ─── Admin: delete feedback ───
router.delete("/feedback/:id", ownerAuth, async (req, res) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.quizFeedback.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Feedback not found" });
      return;
    }

    await prisma.quizFeedback.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error("[quizFeedback] Delete error:", error?.message || error);
    res.status(500).json({ error: "Failed to delete feedback" });
  }
});

// ─── Get quiz history with search, sort, pagination, pinned filter ───
router.get("/history", standardLimiter, async (req, res) => {
  try {
    const { guestId } = req.query;
    const authHeader = req.headers.authorization;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const sort = (req.query.sort as string) || "newest";
    const search = (req.query.search as string) || "";
    const pinned = req.query.pinned as string;

    let where: any = {};
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { auth } = await import("../services/firebaseAdmin.js");
        const token = authHeader.split("Bearer ")[1];
        const decoded = await auth.verifyIdToken(token);
        userId = decoded.uid;
        where.userId = userId;
      } catch {
        // fall through
      }
    }

    if (!userId && guestId) {
      where.guestId = guestId as string;
    }

    if (Object.keys(where).length === 0) {
      res.json({ attempts: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      return;
    }

    where.status = { notIn: ["GENERATING", "IN_PROGRESS"] };

    if (pinned === "true") where.pinned = true;
    else if (pinned === "false") where.pinned = false;

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { topic: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: any = { createdAt: "desc" as const };
    if (sort === "oldest") orderBy = { createdAt: "asc" };
    else if (sort === "score_desc") orderBy = { score: "desc" };
    else if (sort === "score_asc") orderBy = { score: "asc" };
    else if (sort === "difficulty") orderBy = { difficulty: "asc" };
    else if (sort === "subject_asc") orderBy = { subject: "asc" };
    else if (sort === "subject_desc") orderBy = { subject: "desc" };
    else if (sort === "topic_asc") orderBy = { topic: "asc" };
    else if (sort === "topic_desc") orderBy = { topic: "desc" };

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          subject: true,
          topic: true,
          difficulty: true,
          score: true,
          totalQuestions: true,
          creditsCost: true,
          status: true,
          pinned: true,
          createdAt: true,
        },
      }),
      prisma.quizAttempt.count({ where }),
    ]);

    res.json({
      attempts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("[quiz] History error:", error?.message || error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
