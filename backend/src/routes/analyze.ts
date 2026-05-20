import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { extractText } from "../services/ocr.js";
import { analyzeQuestions } from "../services/openai.js";

const router = Router();

router.post("/:uploadId", authenticate, async (req, res) => {
  try {
    const uploadId = req.params.uploadId as string;
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload || upload.userId !== req.user!.uid) {
      res.status(404).json({ error: "Upload not found" });
      return;
    }

    await prisma.upload.update({
      where: { id: upload.id },
      data: { status: "ANALYZING" },
    });

    res.json({ status: "processing", uploadId: upload.id });

    processUpload(upload.id).catch((err) =>
      console.error(`Process upload ${upload.id} failed:`, err)
    );
  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({ error: "Failed to start analysis" });
  }
});

async function processUpload(uploadId: string): Promise<void> {
  try {
    const upload = await prisma.upload.findUniqueOrThrow({
      where: { id: uploadId },
    });

    if (!upload.cloudinaryUrl) {
      throw new Error("Upload has no Cloudinary URL");
    }

    const rawText = await extractText(upload.cloudinaryUrl, upload.fileType);

    const questions = await analyzeQuestions(rawText);

    const subjectCounts = new Map<string, number>();
    for (const q of questions) {
      if (q.subject) {
        subjectCounts.set(q.subject, (subjectCounts.get(q.subject) || 0) + 1);
      }
    }
    let subject = "General";
    let maxCount = 0;
    for (const [s, c] of subjectCounts) {
      if (c > maxCount) {
        subject = s;
        maxCount = c;
      }
    }

    const filename = upload.filename
      .replace(/\.(pdf|png|jpg|jpeg)$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const count = questions.length;
    const difficultyMap = { EASY: 0, MEDIUM: 1, HARD: 2 };
    const avgDifficulty = questions.reduce(
      (acc, q) => acc + (difficultyMap[q.difficulty] || 1),
      0
    );
    const dominantDifficulty =
      avgDifficulty / count < 0.8
        ? "EASY"
        : avgDifficulty / count < 1.5
        ? "MEDIUM"
        : "HARD";

    const mockTest = await prisma.mockTest.create({
      data: {
        title: `${subject} Mock Test`,
        subject,
        sourceUploadId: uploadId,
        status: "PUBLISHED",
        totalQuestions: count,
        difficulty: dominantDifficulty as "EASY" | "MEDIUM" | "HARD",
        questions: {
          create: questions.map((q, i) => ({
            questionText: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            type: q.type,
            difficulty: q.difficulty,
            order: i + 1,
          })),
        },
      },
    });

    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "COMPLETED" },
    });

    console.log(
      `Upload ${uploadId} processed: ${count} questions in test ${mockTest.id}`
    );
  } catch (error) {
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "FAILED" },
    });
    console.error(`Process upload ${uploadId} error:`, error);
  }
}

router.get("/:uploadId/status", authenticate, async (req, res) => {
  try {
    const uploadId = req.params.uploadId as string;
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        mockTests: {
          select: { id: true, title: true, totalQuestions: true },
        },
      },
    });

    if (!upload || upload.userId !== req.user!.uid) {
      res.status(404).json({ error: "Upload not found" });
      return;
    }

    const mockTest = upload.mockTests?.[0] || null;

    res.json({
      status: upload.status,
      uploadId: upload.id,
      mockTest,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

export default router;
