import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { ownerAuth } from "../middleware/ownerAuth.js";
import { uploadToTelegram } from "../services/telegramStorage.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WebP, and GIF images are allowed"));
    }
  },
});

const router = Router();

router.post("/", ownerAuth, upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }

    const { fileId, cdnUrl } = await uploadToTelegram(file.buffer, file.originalname);

    await prisma.mediaFile.create({
      data: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileId,
        cdnUrl,
        category: "general",
      },
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json({ url: `${baseUrl}/api/files/${encodeURIComponent(fileId)}` });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Image upload failed",
    });
  }
});

export default router;
