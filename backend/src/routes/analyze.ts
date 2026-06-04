import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { extractText } from "../services/ocr.js";
import { downloadTelegramFile } from "../services/telegramStorage.js";
import { analyzeQuestions } from "../services/openai.js";
import { analyzeLimiter, standardLimiter, analyzeStatusLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/:uploadId", analyzeLimiter, authenticate, async (req, res) => {
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

    if (!upload.telegramFileId) {
      throw new Error("Upload has no Telegram file reference");
    }

    const fileBuffer = await downloadTelegramFile(upload.telegramFileId);
    const rawText = await extractText(fileBuffer, upload.fileType);
    if (!rawText || rawText.trim().length === 0) {
      throw new Error("OCR returned empty text - could not extract any content from the file");
    }

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

    const _filename = upload.filename
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

    const calculatedDuration = Math.max(count * 120, 600);

    const mockTest = await prisma.mockTest.create({
      data: {
        title: `${subject} Mock Test`,
        subject,
        sourceUploadId: uploadId,
        status: "PUBLISHED",
        duration: calculatedDuration,
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
      `[Analyze] Test created: ID=${mockTest.id}, title="${mockTest.title}", questions=${count}, uploadId=${uploadId}, status=PUBLISHED`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    const statusCode = error && typeof error === "object" && "status" in error ? (error as { status: number }).status : 0;
    console.error(`[Analyze] Upload ${uploadId} failed:`);
    console.error(`[Analyze] Error: ${errorMessage}`);
    if (statusCode) console.error(`[Analyze] HTTP Status: ${statusCode}`);
    if (errorStack) console.error(`[Analyze] Stack: ${errorStack}`);

    if (error instanceof SyntaxError) {
      console.error(`[Analyze] JSON parse error - AI response may be malformed`);
    }

    const failureReason = (() => {
      if (errorMessage.includes("OCR") || errorMessage.includes("extract text") || errorMessage.includes("Tesseract")) {
        return "Could not read text from the file. Ensure the image is clear or the PDF is not scanned poorly.";
      }
      if (
        errorMessage.includes("Empty response from OpenAI") ||
        errorMessage.includes("OpenRouter") ||
        errorMessage.includes("API key") ||
        errorMessage.includes("Incorrect API key") ||
        errorMessage.includes("Invalid Authentication") ||
        errorMessage.includes("Insufficient Credits") ||
        errorMessage.includes("Insufficient credits") ||
        errorMessage.includes("Credit limit") ||
        errorMessage.includes("quota") ||
        errorMessage.includes("402") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403") ||
        errorMessage.includes("429") ||
        errorMessage.includes("Rate limit") ||
        errorMessage.includes("Too Many Requests") ||
        statusCode === 401 ||
        statusCode === 402 ||
        statusCode === 403 ||
        statusCode === 429
      ) {
        return "AI service is temporarily unavailable or your API key has exceeded its limit. Please try again later or check your OpenRouter API key.";
      }
      if (errorMessage.includes("JSON parse") || errorMessage.includes("Invalid response format") || errorMessage.includes("Unexpected token")) {
        return "AI returned an unexpected response. This usually resolves on retry.";
      }
      if (errorMessage.includes("connect ECONNREFUSED") || errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT") || errorMessage.includes("ENOTFOUND") || errorMessage.includes("EAI_AGAIN")) {
        return "Network issue connecting to AI service. Please check your connection and try again.";
      }
      if (errorMessage.includes("Prisma") || errorMessage.includes("prisma") || errorMessage.includes("Database") || errorMessage.includes("Unique constraint")) {
        return "Database error occurred. Please try again.";
      }
      if (errorMessage.includes("Telegram") || errorMessage.includes("upload")) {
        return "File storage error. Please try uploading again.";
      }
      return `Analysis failed: ${errorMessage}`;
    })();

    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "FAILED", failureReason },
    });
  }
}

router.get("/:uploadId/status", analyzeStatusLimiter, authenticate, async (req, res) => {
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
      failureReason: upload.failureReason,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

export default router;
