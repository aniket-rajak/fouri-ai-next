import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validate.js";
import { prisma, withRetry } from "../lib/prisma.js";
import { evaluationQueue } from "../lib/evaluationQueue.js";
import { generateExplanationForMCQ } from "../services/openai.js";

const router = Router();

const submittingAttempts = new Set<string>();

router.post("/", authenticate, validate(schemas.mockTestId), async (req, res) => {
  try {
    const { mockTestId } = req.body;

    const mockTest = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      select: { id: true, duration: true },
    });

    if (!mockTest) {
      res.status(404).json({ error: "Test not found" });
      return;
    }

    const existing = await prisma.testAttempt.findFirst({
      where: {
        userId: req.user!.uid,
        mockTestId,
        status: "IN_PROGRESS",
      },
    });

    if (existing) {
      res.json({ attempt: existing });
      return;
    }

    const attempt = await prisma.testAttempt.create({
      data: {
        userId: req.user!.uid,
        mockTestId,
        status: "IN_PROGRESS",
      },
    });

    res.status(201).json({ attempt });
  } catch (error) {
    console.error("Create attempt error:", error);
    res.status(500).json({ error: "Failed to create attempt" });
  }
});

router.put("/:id/save", authenticate, validate(schemas.answers), async (req, res) => {
  try {
    const attemptId = req.params.id as string;
    const { answers, markedIds } = req.body;
    const markedSet = new Set(markedIds || []);

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== req.user!.uid) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }

    for (const ans of answers) {
      await prisma.answer.upsert({
        where: {
          testAttemptId_questionId: {
            testAttemptId: attemptId,
            questionId: ans.questionId,
          },
        },
        update: { selectedOption: ans.selectedOption, isMarkedForReview: markedSet.has(ans.questionId) },
        create: {
          testAttemptId: attemptId,
          questionId: ans.questionId,
          selectedOption: ans.selectedOption,
          isMarkedForReview: markedSet.has(ans.questionId),
        },
      });
    }

    res.json({ saved: true });
  } catch (error) {
    console.error("Save answers error:", error);
    res.status(500).json({ error: "Failed to save answers" });
  }
});

router.post("/:id/submit", authenticate, async (req, res) => {
  const attemptId = req.params.id as string;

  if (submittingAttempts.has(attemptId)) {
    res.status(429).json({ error: "Submission already in progress. Please wait." });
    return;
  }
  submittingAttempts.add(attemptId);

  const markedIds: string[] = req.body.markedIds || [];
  const markedSet = new Set(markedIds);

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        mockTest: {
          include: { questions: true },
        },
      },
    });

    if (!attempt || attempt.userId !== req.user!.uid) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }

    if (attempt.status !== "IN_PROGRESS") {
      res.json({ alreadySubmitted: true, attempt });
      return;
    }

    const answerMap = new Map(
      attempt.answers.map((a) => [a.questionId, a.selectedOption])
    );

    let score = 0;
    const updatedAnswers: Promise<any>[] = [];

    for (const question of attempt.mockTest.questions) {
      const selected = answerMap.get(question.id);
      let isCorrect: boolean | null;

      isCorrect = selected === question.correctAnswer;

      if (isCorrect === true) score++;

      updatedAnswers.push(
        prisma.answer.upsert({
          where: {
            testAttemptId_questionId: {
              testAttemptId: attemptId,
              questionId: question.id,
            },
          },
          update: { isCorrect, selectedOption: selected, isMarkedForReview: markedSet.has(question.id) },
          create: {
            testAttemptId: attemptId,
            questionId: question.id,
            selectedOption: selected || null,
            isCorrect,
            isMarkedForReview: markedSet.has(question.id),
          },
        })
      );
    }

    await withRetry(() => Promise.all(updatedAnswers));

    const totalQuestions = attempt.mockTest.questions.length;
    const accuracy = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const submitted = await withRetry(() =>
      prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          status: "COMPLETED",
          score,
          totalMarks: totalQuestions,
          accuracy: Math.round(accuracy * 100) / 100,
          timeTaken: req.body.timeTaken || null,
          completedAt: new Date(),
        },
      })
    );

    await withRetry(() =>
      prisma.mockTest.update({
        where: { id: attempt.mockTest.id },
        data: { attemptCount: { increment: 1 } },
      })
    );

    res.json({ attempt: submitted });

    // Background AI explanation for marked MCQ questions
    (async () => {
      const markedMcqAnswers = attempt.answers.filter((a) => {
        const q = attempt.mockTest.questions.find((q) => q.id === a.questionId);
        return markedSet.has(a.questionId) && a.selectedOption != null && q;
      });

      for (const ans of markedMcqAnswers) {
        const question = attempt.mockTest.questions.find(
          (q) => q.id === ans.questionId
        );
        if (!question) continue;

        evaluationQueue.enqueue(async () => {
          try {
            const options = Array.isArray(question.options)
              ? question.options
              : typeof question.options === "string"
              ? JSON.parse(question.options)
              : [];
            const explanation = await generateExplanationForMCQ(
              question.questionText,
              options,
              question.correctAnswer,
              ans.selectedOption
            );
            await prisma.explanation.upsert({
              where: { questionId: question.id },
              update: {
                shortExplanation: explanation.shortExplanation,
                detailedExplanation: explanation.detailedExplanation,
              },
              create: {
                questionId: question.id,
                shortExplanation: explanation.shortExplanation,
                detailedExplanation: explanation.detailedExplanation,
              },
            });
          } catch (error) {
            console.error(
              `Background MCQ explanation failed for question ${question.id}:`,
              error
            );
          }
        });
      }
    })();
  } catch (error) {
    console.error("Submit attempt error:", error);
    res.status(500).json({ error: "Failed to submit attempt" });
  } finally {
    submittingAttempts.delete(attemptId);
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const attemptId = req.params.id as string;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockTest: {
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt || attempt.userId !== req.user!.uid) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }

    const normalized = JSON.parse(JSON.stringify(attempt));
    if (normalized.mockTest?.questions) {
      for (const q of normalized.mockTest.questions) {
        if (!Array.isArray(q.options)) {
          if (typeof q.options === "string") {
            try { q.options = JSON.parse(q.options); }
            catch { q.options = []; }
          } else {
            q.options = [];
          }
        }
      }
    }
    res.json({ attempt: normalized });
  } catch (error) {
    console.error("Get attempt error:", error);
    res.status(500).json({ error: "Failed to fetch attempt" });
  }
});



router.get("/", authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = { userId: req.user!.uid };
    if (status && typeof status === "string") {
      where.status = status;
    }
    const attempts = await prisma.testAttempt.findMany({
      where,
      include: {
        mockTest: {
          select: { id: true, title: true, subject: true, totalQuestions: true, duration: true },
        },
        answers: {
          where: { selectedOption: { not: null } },
          select: { id: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });
    res.json({ attempts });
  } catch (error) {
    console.error("Fetch attempts error:", error);
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
});

router.put("/:id/pause", authenticate, async (req, res) => {
  try {
    const attemptId = req.params.id as string;
    const { remainingTime, currentQuestionIndex } = req.body;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== req.user!.uid) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }

    if (attempt.status !== "IN_PROGRESS") {
      res.status(400).json({ error: "Attempt is not in progress" });
      return;
    }

    const paused = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: "PAUSED",
        remainingTime: remainingTime ?? undefined,
        currentQuestionIndex: currentQuestionIndex ?? undefined,
      },
    });

    res.json({ attempt: paused });
  } catch (error) {
    console.error("Pause attempt error:", error);
    res.status(500).json({ error: "Failed to pause attempt" });
  }
});

router.put("/:id/resume", authenticate, async (req, res) => {
  try {
    const attemptId = req.params.id as string;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== req.user!.uid) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }

    if (attempt.status !== "PAUSED") {
      res.status(400).json({ error: "Attempt is not paused" });
      return;
    }

    const resumed = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { status: "IN_PROGRESS" },
    });

    res.json({ attempt: resumed });
  } catch (error) {
    console.error("Resume attempt error:", error);
    res.status(500).json({ error: "Failed to resume attempt" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const attemptId = req.params.id as string;
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt || attempt.userId !== req.user!.uid) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }
    await prisma.testAttempt.delete({ where: { id: attemptId } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete attempt error:", error);
    res.status(500).json({ error: "Failed to delete attempt" });
  }
});

router.post("/:id/suspicious-activity", authenticate, async (req, res) => {
  try {
    const attemptId = req.params.id as string;
    const { activityType, metadata } = req.body;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== req.user!.uid) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }

    await prisma.suspiciousActivity.create({
      data: {
        attemptId,
        userId: req.user!.uid,
        activityType: activityType || "TAB_SWITCH",
        metadata: metadata || {},
      },
    });

    res.status(201).json({ logged: true });
  } catch (error) {
    console.error("Log suspicious activity error:", error);
    res.status(500).json({ error: "Failed to log activity" });
  }
});

export default router;
