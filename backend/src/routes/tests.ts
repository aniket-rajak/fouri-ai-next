import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

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
      res.status(404).json({ error: "Test not found" });
      return;
    }

    const { sourceUpload, ...testData } = test;
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
