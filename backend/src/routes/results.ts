import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { userId: req.user!.uid },
      orderBy: { completedAt: "desc" },
      include: {
        mockTest: { select: { title: true } },
      },
    });
    res.json({ attempts });
  } catch (error) {
    console.error("Fetch results error:", error);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const attemptId = req.params.id as string;
    const attempt = await prisma.testAttempt.findUnique({
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
    });

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
