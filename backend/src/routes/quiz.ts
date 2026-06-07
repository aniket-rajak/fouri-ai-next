import { Router } from "express";
import { z } from "zod";
import { generateQuiz } from "../services/openai.js";
import { estimateQuizCredits, calculateActualCredits, getUserCredits, deductCredits } from "../services/creditService.js";
import { quizLimiter } from "../middleware/rateLimiter.js";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = Router();

const estimateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many estimate requests. Try again later." },
});

const quizSchema = z.object({
  subject: z.string().min(2, "Subject must be at least 2 characters").max(200),
  topic: z.string().min(2, "Topic must be at least 2 characters").max(200),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  guestId: z.string().optional(),
});

// POST /api/quiz/estimate — returns estimated credit cost without consuming any credits
router.post("/estimate", estimateLimiter, async (req, res) => {
  try {
    const parsed = quizSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid input",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const { subject, topic, difficulty, guestId } = parsed.data;
    const estimate = estimateQuizCredits(subject, topic, difficulty);

    // Get user credits if authenticated
    let userCredits = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { auth } = await import("../services/firebaseAdmin.js");
        const token = authHeader.split("Bearer ")[1];
        const decoded = await auth.verifyIdToken(token);
        const credits = await getUserCredits(decoded.uid);
        userCredits = credits.remaining;
      } catch {
        // Token invalid — treat as guest
      }
    }

    // Check guest daily quota if guestId provided
    let guestQuotaRemaining = null;
    if (guestId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const guestCount = await prisma.quizAttempt.count({
        where: {
          guestId,
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      // Also check IP-based count
      const ip = req.ip || req.socket.remoteAddress || "";
      const ipCount = await prisma.quizAttempt.count({
        where: {
          guestIp: ip,
          guestId: null, // only count IP-only attempts (no guestId)
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      const totalGuestUsage = guestCount + ipCount;
      guestQuotaRemaining = Math.max(0, 1 - totalGuestUsage);
    }

    res.json({
      estimatedCredits: estimate.estimatedCredits,
      breakdown: estimate.breakdown,
      userCredits,
      guestQuotaRemaining,
      isGuest: !!guestId && !authHeader,
    });
  } catch (error: any) {
    console.error("[quiz] Estimate error:", error?.message || error);
    res.status(500).json({ error: "Failed to estimate quiz cost" });
  }
});

// POST /api/quiz/generate — generate quiz with credit deduction
router.post("/generate", quizLimiter, async (req, res) => {
  try {
    const parsed = quizSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid input",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const { subject, topic, difficulty, guestId } = parsed.data;
    const authHeader = req.headers.authorization;
    let uid: string | null = null;

    // Attempt to authenticate
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { auth } = await import("../services/firebaseAdmin.js");
        const token = authHeader.split("Bearer ")[1];
        const decoded = await auth.verifyIdToken(token);
        uid = decoded.uid;
      } catch {
        // Invalid token — continue as guest
      }
    }

    const estimate = estimateQuizCredits(subject, topic, difficulty);

    // Create attempt record (status: GENERATING)
    const ip = req.ip || req.socket.remoteAddress || "";
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: uid,
        guestId: uid ? null : (guestId || null),
        guestIp: uid ? null : ip,
        subject,
        topic,
        difficulty,
        totalQuestions: 10,
        status: "GENERATING",
        recognizedGuest: !!guestId || !!uid,
      },
    });

    // Handle guest quota check
    if (!uid) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const guestIdCount = guestId ? await prisma.quizAttempt.count({
        where: {
          guestId,
          createdAt: { gte: today, lt: tomorrow },
          status: { not: "FAILED" },
        },
      }) : 0;

      const ipCount = await prisma.quizAttempt.count({
        where: {
          guestIp: ip,
          guestId: null,
          createdAt: { gte: today, lt: tomorrow },
          status: { not: "FAILED" },
        },
      });

      // Subtract the current attempt (already counted above if guestId matches)
      const totalGuestUsage = guestId
        ? Math.max(guestIdCount, ipCount)
        : ipCount;

      if (totalGuestUsage > 1) {
        await prisma.quizAttempt.update({
          where: { id: attempt.id },
          data: { status: "FAILED", failureReason: "Daily guest limit reached" },
        });
        res.status(429).json({
          error: "Daily free quiz limit reached. Please sign up or log in to generate more quizzes.",
          requiresAuth: true,
        });
        return;
      }
    }

    // Handle credit check for logged-in users
    if (uid) {
      const credits = await getUserCredits(uid);
      if (credits.remaining < estimate.estimatedCredits) {
        await prisma.quizAttempt.update({
          where: { id: attempt.id },
          data: { status: "FAILED", failureReason: "INSUFFICIENT_CREDITS" },
        });
        res.status(402).json({
          error: `Insufficient credits. You need at least ${estimate.estimatedCredits} credits but have ${credits.remaining}.`,
          required: estimate.estimatedCredits,
          available: credits.remaining,
        });
        return;
      }
    }

    // Generate the quiz
    let quizResult;
    try {
      quizResult = await generateQuiz(subject, topic, difficulty);
    } catch (genError: any) {
      await prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: { status: "FAILED", failureReason: genError?.message || "Generation failed" },
      });
      res.status(500).json({ error: genError?.message || "Failed to generate quiz" });
      return;
    }

    const { questions, totalTokens } = quizResult;

    // Calculate actual credits
    const actualCredits = calculateActualCredits(totalTokens);

    // Deduct actual credits for logged-in users
    let remainingCredits = null;
    if (uid) {
      try {
        const creditResult = await deductCredits(uid, actualCredits);
        remainingCredits = creditResult.remaining;
      } catch (creditError: any) {
        // If deduction fails, still return the quiz but log the error
        console.error("[quiz] Credit deduction error:", creditError?.message || creditError);
      }
    }

    // Update attempt record
    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "IN_PROGRESS",
        score: 0,
        questions: questions as any,
        answers: {},
        progress: { currentIndex: 0, timeLeft: 600, lastSavedAt: new Date().toISOString() },
        creditsCost: uid ? actualCredits : null,
        actualTokens: totalTokens,
      },
    });

    res.json({
      attemptId: attempt.id,
      questions,
      creditsUsed: uid ? actualCredits : null,
      actualTokens: totalTokens,
      remainingCredits,
      isGuest: !uid,
    });
  } catch (error: any) {
    console.error("[quiz] Generation error:", error?.message || error);
    res.status(500).json({
      error: error?.message || "Failed to generate quiz. Please try again.",
    });
  }
});

export default router;
