import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { extractText } from "../services/ocr.js";
import { downloadTelegramFile } from "../services/telegramStorage.js";
import { analyzeQuestions } from "../services/openai.js";
import { analyzeLimiter, standardLimiter, analyzeStatusLimiter } from "../middleware/rateLimiter.js";
import { getUserCredits, deductCredits, estimateRequiredCredits } from "../services/creditService.js";
import type { AnalysisMode } from "../services/creditService.js";

const router = Router();

router.post("/:uploadId", analyzeLimiter, authenticate, async (req, res) => {
  try {
    const uploadId = req.params.uploadId as string;
    const mode = (req.query.mode as string) || "full";
    if (!["basic", "standard", "full"].includes(mode)) {
      res.status(400).json({ error: "Invalid analysis mode. Use 'basic', 'standard', or 'full'." });
      return;
    }

    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload || upload.userId !== req.user!.uid) {
      res.status(404).json({ error: "Upload not found" });
      return;
    }

    const credits = await getUserCredits(req.user!.uid);
    const required = estimateRequiredCredits(upload.fileSize || 0, mode as AnalysisMode);
    if (credits.remaining < required) {
      res.status(403).json({
        error: "INSUFFICIENT_CREDITS",
        message: `This analysis requires ${required} AI Credits but you only have ${credits.remaining}.`,
        required,
        available: credits.remaining,
        resetsAt: credits.resetsAt,
      });
      return;
    }

    await prisma.upload.update({
      where: { id: upload.id },
      data: { status: "ANALYZING" },
    });

    res.json({ status: "processing", uploadId: upload.id, creditsRequired: required, creditsAvailable: credits.remaining });

    processUpload(upload.id, mode as AnalysisMode).catch((err) =>
      console.error(`Process upload ${upload.id} failed:`, err)
    );
  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({ error: "Failed to start analysis" });
  }
});

async function processUpload(uploadId: string, mode: AnalysisMode = "full"): Promise<void> {
  let upload: Awaited<ReturnType<typeof prisma.upload.findUniqueOrThrow>> | null = null;
  let required = 0;
  let creditsDeducted = false;

  try {
    upload = await prisma.upload.findUniqueOrThrow({
      where: { id: uploadId },
    });

    if (!upload.telegramFileId) {
      throw new Error("Upload has no Telegram file reference");
    }

    required = estimateRequiredCredits(upload.fileSize || 0, mode);
    await deductCredits(upload.userId, required);
    creditsDeducted = true;
    console.log(`[Analyze] Deducted ${required} credits (${mode}) for upload ${uploadId}`);

    const telegramFileId = upload.telegramFileId!;
    const fileType = upload.fileType;

    await Promise.race([
      (async () => {
        const fileBuffer = await downloadTelegramFile(telegramFileId);
        const { text: rawText, pageBreakdown } = await extractText(fileBuffer, fileType);
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

        const _filename = upload!.filename
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

        const latexRegex = /\$\$[\s\S]*?\$\$|\$[^$]*?\$/g;

        const questionsData = questions.map((q, i) => {
          const latexMatches = q.question.match(latexRegex);
          return {
            questionText: q.question,
            latexContent: latexMatches ? latexMatches.join("\n") : null,
            options: q.options,
            correctAnswer: q.correctAnswer,
            type: q.type,
            difficulty: q.difficulty,
            order: i + 1,
          };
        });

        const mockTest = await prisma.mockTest.create({
          data: {
            title: `${subject} Mock Test`,
            subject,
            sourceUploadId: uploadId,
            status: "PUBLISHED",
            duration: calculatedDuration,
            totalQuestions: count,
            difficulty: dominantDifficulty as "EASY" | "MEDIUM" | "HARD",
            questions: { create: questionsData },
          },
        });

        const pagesProcessed = upload?.totalPages || null;

        // OCR processing complete. All in-memory page buffers were released.
        // Only the original raw file remains in Telegram storage.
        await prisma.upload.update({
          where: { id: uploadId },
          data: {
            status: "COMPLETED",
            processingMeta: {
              creditsUsed: required,
              creditsPerPage: pagesProcessed ? Math.ceil(required / pagesProcessed) : null,
              pagesProcessed,
              ocrCompletedAt: new Date().toISOString(),
              pageBreakdown: pageBreakdown as any,
            },
          },
        });

        console.log(
          `[Analyze] Test created: ID=${mockTest.id}, title="${mockTest.title}", questions=${count}, uploadId=${uploadId}, status=PUBLISHED`
        );
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Analysis timed out after 30 minutes")), 1_800_000)
      ),
    ]);
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

    if (creditsDeducted) {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: upload!.userId } });
        if (user) {
          const refunded = Math.min(required, user.usedCredits);
          await prisma.user.update({
            where: { firebaseUid: upload!.userId },
            data: { usedCredits: { decrement: refunded } },
          });
          console.log(`[Analyze] Refunded ${refunded} credits to user ${upload!.userId} after failure`);
        }
      } catch (refundError) {
        console.error(`[Analyze] Failed to refund credits:`, refundError);
      }
    }

    const failureReason = (() => {
      if (errorMessage.includes("Timed out") || errorMessage.includes("timeout after") || errorMessage.includes("AbortError") || errorMessage.includes("operation was aborted")) {
        return "Analysis timed out. The file may be too large or the AI service is slow. Please try again with a smaller file or during off-peak hours.";
      }
      if (errorMessage.includes("OCR") || errorMessage.includes("extract text") || errorMessage.includes("Tesseract") || errorMessage.includes("unsupported image format")) {
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
      data: { status: "FAILED", failureReason, processingMeta: upload?.processingMeta || {} },
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
      filename: upload.filename,
      fileType: upload.fileType,
      fileSize: upload.fileSize,
      totalPages: upload.totalPages,
      processingMeta: upload.processingMeta,
      failureReason: upload.failureReason,
      createdAt: upload.createdAt,
      mockTest,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

export default router;
