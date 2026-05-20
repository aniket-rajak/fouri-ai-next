import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validate.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

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
    const { answers } = req.body;

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
        update: { selectedOption: ans.selectedOption },
        create: {
          testAttemptId: attemptId,
          questionId: ans.questionId,
          selectedOption: ans.selectedOption,
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
  try {
    const attemptId = req.params.id as string;

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
      res.status(400).json({ error: "Attempt already completed" });
      return;
    }

    const answerMap = new Map(
      attempt.answers.map((a) => [a.questionId, a.selectedOption])
    );

    let score = 0;
    const updatedAnswers = [];

    for (const question of attempt.mockTest.questions) {
      const selected = answerMap.get(question.id);
      const isCorrect = selected === question.correctAnswer;

      if (isCorrect) score++;

      updatedAnswers.push(
        prisma.answer.upsert({
          where: {
            testAttemptId_questionId: {
              testAttemptId: attemptId,
              questionId: question.id,
            },
          },
          update: { isCorrect, selectedOption: selected },
          create: {
            testAttemptId: attemptId,
            questionId: question.id,
            selectedOption: selected || null,
            isCorrect,
          },
        })
      );
    }

    await Promise.all(updatedAnswers);

    const totalQuestions = attempt.mockTest.questions.length;
    const accuracy = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const submitted = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        score,
        totalMarks: totalQuestions,
        accuracy: Math.round(accuracy * 100) / 100,
        timeTaken: req.body.timeTaken || null,
        completedAt: new Date(),
      },
    });

    await prisma.mockTest.update({
      where: { id: attempt.mockTest.id },
      data: { attemptCount: { increment: 1 } },
    });

    res.json({ attempt: submitted });
  } catch (error) {
    console.error("Submit attempt error:", error);
    res.status(500).json({ error: "Failed to submit attempt" });
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

export default router;
