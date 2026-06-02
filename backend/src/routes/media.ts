import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { uploadToTelegram } from "../services/telegramStorage.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WebP, SVG, and GIF images are allowed"));
    }
  },
});

const router = Router();

// List media files (paginated, filterable)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 26));
    const skip = (page - 1) * limit;
    const category = (req.query.category as string) || "";

    const where = category ? { category } : {};

    const [files, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.mediaFile.count({ where }),
    ]);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const result = files.map((f) => ({
      ...f,
      url: `${baseUrl}/api/files/${f.fileId}`,
    }));

    res.json({
      files: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    console.error("List media error:", error);
    res.status(500).json({ error: "Failed to list media" });
  }
});

// Upload media
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }

    const category = (req.body.category as string) || "general";
    const { fileId, cdnUrl } = await uploadToTelegram(file.buffer, file.originalname);

    const media = await prisma.mediaFile.create({
      data: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileId,
        cdnUrl,
        category,
      },
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.status(201).json({
      file: { ...media, url: `${baseUrl}/api/files/${media.fileId}` },
    });
  } catch (error) {
    console.error("Media upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
});

// Delete media
router.delete("/:id", async (req, res) => {
  try {
    await prisma.mediaFile.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete media error:", error);
    res.status(500).json({ error: "Failed to delete media" });
  }
});

export default router;
