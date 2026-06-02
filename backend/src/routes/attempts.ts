import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validate.js";
import { prisma, withRetry } from "../lib/prisma.js";
import { evaluationQueue } from "../lib/evaluationQueue.js";
import { evaluateSubjectiveWithAI } from "../services/openai.js";

function normalizeText(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

function evaluateSubjective(userAnswer: string | null | undefined, correctAnswer: string): boolean | null {
  const normalizedUser = normalizeText(userAnswer);
  const normalizedCorrect = normalizeText(correctAnswer);

  if (!normalizedCorrect) return null;
  if (!normalizedUser) return false;

  if (normalizedUser === normalizedCorrect) return true;

  if (normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)) return true;

  const userWords = normalizedUser.split(/\s+/).filter(Boolean);
  const correctWords = normalizedCorrect.split(/\s+/).filter(Boolean);

  if (correctWords.length <= 3) {
    return normalizedUser === normalizedCorrect;
  }

  const matched = correctWords.filter((w) => userWords.includes(w)).length;
  const overlap = matched / correctWords.length;

  return overlap >= 0.6;
}

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
  const attemptId = req.params.id as string;

  if (submittingAttempts.has(attemptId)) {
    res.status(429).json({ error: "Submission already in progress. Please wait." });
    return;
  }
  submittingAttempts.add(attemptId);

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
      res.status(400).json({ error: "Attempt already completed" });
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

      if (question.type === "SUBJECTIVE") {
        isCorrect = evaluateSubjective(selected, question.correctAnswer);
      } else {
        isCorrect = selected === question.correctAnswer;
      }

      if (isCorrect === true) score++;

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

    // Background AI evaluation for subjective questions
    (async () => {
      const subjectiveAnswers = attempt.answers.filter((a) => {
        const q = attempt.mockTest.questions.find((q) => q.id === a.questionId);
        return q?.type === "SUBJECTIVE" && a.selectedOption != null;
      });

      for (const ans of subjectiveAnswers) {
        const question = attempt.mockTest.questions.find(
          (q) => q.id === ans.questionId
        );
        if (!question) continue;

        evaluationQueue.enqueue(async () => {
          try {
            const evaluation = await evaluateSubjectiveWithAI(
              question.questionText,
              ans.selectedOption
            );
            await prisma.answer.update({
              where: { id: ans.id },
              data: { isCorrect: evaluation.isCorrect },
            });
            await prisma.explanation.upsert({
              where: { questionId: question.id },
              update: {
                shortExplanation: evaluation.feedback,
                detailedExplanation: evaluation.modelAnswer,
              },
              create: {
                questionId: question.id,
                shortExplanation: evaluation.feedback,
                detailedExplanation: evaluation.modelAnswer,
              },
            });
          } catch (error) {
            console.error(
              `Background AI eval failed for question ${question.id}:`,
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

router.post("/:id/re-evaluate", authenticate, async (req, res) => {
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

    let score = 0;
    const updates = [];

    for (const question of attempt.mockTest.questions) {
      if (question.type !== "SUBJECTIVE") continue;

      const answer = attempt.answers.find((a) => a.questionId === question.id);
      if (!answer) continue;

      const isCorrect = evaluateSubjective(answer.selectedOption, question.correctAnswer);

      updates.push(
        prisma.answer.update({
          where: { id: answer.id },
          data: { isCorrect },
        })
      );

      if (isCorrect === true) score++;
    }

    await Promise.all(updates);

    if (score > 0 || updates.length > 0) {
      const totalQuestions = attempt.mockTest.questions.length;
      const currentScore = attempt.score || 0;
      const newScore = currentScore + score;
      const accuracy = totalQuestions > 0 ? (newScore / totalQuestions) * 100 : 0;

      await prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          score: newScore,
          accuracy: Math.round(accuracy * 100) / 100,
        },
      });
    }

    res.json({ reEvaluated: updates.length, corrected: score });
  } catch (error) {
    console.error("Re-evaluate error:", error);
    res.status(500).json({ error: "Failed to re-evaluate" });
  }
});

router.post("/:id/evaluate-subjective-ai", authenticate, async (req, res) => {
  try {
    const attemptId = req.params.id as string;
    const { questionId } = req.body;

    if (!questionId) {
      res.status(400).json({ error: "questionId is required" });
      return;
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        mockTest: {
          include: {
            questions: {
              where: { id: questionId, type: "SUBJECTIVE" },
            },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== req.user!.uid) {
      res.status(404).json({ error: "Attempt not found" });
      return;
    }

    const question = attempt.mockTest.questions[0];
    if (!question) {
      res.status(400).json({ error: "Question not found or not subjective" });
      return;
    }

    const answer = attempt.answers.find((a) => a.questionId === questionId);

    const evaluation = await evaluationQueue.enqueue(() =>
      evaluateSubjectiveWithAI(
        question.questionText,
        answer?.selectedOption
      )
    );

    if (answer) {
      await prisma.answer.update({
        where: { id: answer.id },
        data: { isCorrect: evaluation.isCorrect },
      });
    }

    await prisma.explanation.upsert({
      where: { questionId: question.id },
      update: {
        shortExplanation: evaluation.feedback,
        detailedExplanation: evaluation.modelAnswer,
      },
      create: {
        questionId: question.id,
        shortExplanation: evaluation.feedback,
        detailedExplanation: evaluation.modelAnswer,
      },
    });

    res.json({
      modelAnswer: evaluation.modelAnswer,
      feedback: evaluation.feedback,
      isCorrect: evaluation.isCorrect,
    });
  } catch (error) {
    console.error("AI subjective evaluation error:", error);
    res.status(500).json({ error: "Failed to evaluate answer with AI" });
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
