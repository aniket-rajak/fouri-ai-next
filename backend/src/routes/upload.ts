import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import { uploadToTelegram } from "../services/telegramStorage.js";
import { prisma } from "../lib/prisma.js";
import pdf from "pdf-parse";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, JPEG, and PDF files are allowed"));
    }
  },
});

const router = Router();

router.post("/", authenticate, upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        const { fileId } = await uploadToTelegram(file.buffer, file.originalname);

        let totalPages: number | null = null;
        if (file.mimetype === "application/pdf") {
          try {
            const pdfData = await pdf(file.buffer);
            totalPages = pdfData.numpages;
          } catch {
            console.warn(`[Upload] Could not count pages for ${file.originalname}`);
          }
        }

        const record = await prisma.upload.create({
          data: {
            userId: req.user!.uid,
            filename: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            telegramFileId: fileId,
            status: "PROCESSING",
            totalPages,
          },
        });

        return { ...record, telegramFileId: fileId, totalPages };
      })
    );

    res.json({ uploads });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const uploads = await prisma.upload.findMany({
      where: { userId: req.user!.uid },
      orderBy: { createdAt: "desc" },
    });
    res.json({ uploads });
  } catch {
    res.status(500).json({ error: "Failed to fetch uploads" });
  }
});

router.get("/:id/details", authenticate, async (req, res) => {
  try {
    const uploadId = req.params.id as string;
    const record = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        mockTests: {
          select: { id: true, totalQuestions: true, difficulty: true },
        },
      },
    });

    if (!record || record.userId !== req.user!.uid) {
      res.status(404).json({ error: "Upload not found" });
      return;
    }

    let pageEstimates: { pageIndex: number; estimatedImageSize: number; estimatedTokens: number }[] | null = null;
    if (record.totalPages && record.fileSize && !record.processingMeta) {
      const avgPageSize = Math.round(record.fileSize / record.totalPages);
      pageEstimates = Array.from({ length: record.totalPages }, (_, i) => ({
        pageIndex: i + 1,
        estimatedImageSize: avgPageSize,
        estimatedTokens: Math.max(1, Math.round(avgPageSize * 0.001)),
      }));
    }

    res.json({
      id: record.id,
      filename: record.filename,
      fileType: record.fileType,
      fileSize: record.fileSize,
      status: record.status,
      totalPages: record.totalPages,
      processingMeta: record.processingMeta,
      pageEstimates,
      failureReason: record.failureReason,
      createdAt: record.createdAt,
      mockTest: record.mockTests?.[0] || null,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch upload details" });
  }
});

// Only removes DB records (Upload + associated MockTests/questions).
// The original raw file in Telegram storage is preserved and NOT deleted.
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const uploadId = req.params.id as string;
    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.userId !== req.user!.uid) {
      res.status(404).json({ error: "Upload not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.mockTest.deleteMany({ where: { sourceUploadId: uploadId } });
      await tx.upload.delete({ where: { id: uploadId } });
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete upload error:", error);
    res.status(500).json({ error: "Failed to delete upload" });
  }
});

export default router;
