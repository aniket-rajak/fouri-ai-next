import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import { uploadFile } from "../services/cloudinary.js";
import { prisma } from "../lib/prisma.js";

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
        const { url, publicId } = await uploadFile(file.buffer, file.originalname);

        const record = await prisma.upload.create({
          data: {
            userId: req.user!.uid,
            filename: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            cloudinaryUrl: url,
            status: "PROCESSING",
          },
        });

        return { ...record, publicId };
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

export default router;
