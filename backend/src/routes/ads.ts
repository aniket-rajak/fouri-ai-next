import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { ownerAuth } from "../middleware/ownerAuth.js";
import { validate, schemas } from "../middleware/validate.js";
import { generateAdContent } from "../services/openai.js";
import { uploadToTelegram } from "../services/telegramStorage.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
  },
});

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const ads = await prisma.ad.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ ads });
  } catch (error) {
    console.error("Fetch ads error:", error);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

router.get("/active", async (_req, res) => {
  try {
    const ads = await prisma.ad.findMany({
      where: {
        OR: [
          { status: "ACTIVE" },
          { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ads });
  } catch (error) {
    console.error("Fetch active ads error:", error);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

router.post("/", ownerAuth, validate(schemas.adCreate), async (req, res) => {
  try {
    const { title, description, imageUrl, ctaText, ctaLink, blogUrl, referenceUrl, status, scheduledAt } = req.body;

    const adStatus = status || "ACTIVE";
    const publishedAt = adStatus === "ACTIVE" ? new Date() : null;

    const ad = await prisma.ad.create({
      data: {
        title,
        description: description || null,
        imageUrl,
        ctaText: ctaText || "Learn More",
        ctaLink,
        blogUrl: blogUrl || null,
        referenceUrl: referenceUrl || null,
        status: adStatus,
        scheduledAt: adStatus === "SCHEDULED" && scheduledAt ? new Date(scheduledAt) : null,
        publishedAt,
      },
    });

    res.status(201).json({ ad });
  } catch (error) {
    console.error("Create ad error:", error);
    res.status(500).json({ error: "Failed to create ad" });
  }
});

router.put("/:id", ownerAuth, validate(schemas.adUpdate), async (req, res) => {
  try {
    const adId = req.params.id as string;
    const { title, description, imageUrl, ctaText, ctaLink, blogUrl, referenceUrl, status, scheduledAt } = req.body;

    const existing = await prisma.ad.findUnique({ where: { id: adId } });
    if (!existing) {
      res.status(404).json({ error: "Ad not found" });
      return;
    }

    let publishedAt = existing.publishedAt;
    if (status === "ACTIVE" && existing.status !== "ACTIVE") {
      publishedAt = new Date();
    }

    const ad = await prisma.ad.update({
      where: { id: adId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(ctaText !== undefined && { ctaText }),
        ...(ctaLink !== undefined && { ctaLink }),
        ...(blogUrl !== undefined && { blogUrl }),
        ...(referenceUrl !== undefined && { referenceUrl }),
        ...(status !== undefined && { status }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        publishedAt,
      },
    });

    res.json({ ad });
  } catch (error) {
    console.error("Update ad error:", error);
    res.status(500).json({ error: "Failed to update ad" });
  }
});

router.delete("/:id", ownerAuth, async (req, res) => {
  try {
    const adId = req.params.id as string;

    const existing = await prisma.ad.findUnique({ where: { id: adId } });
    if (!existing) {
      res.status(404).json({ error: "Ad not found" });
      return;
    }

    await prisma.ad.delete({ where: { id: adId } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete ad error:", error);
    res.status(500).json({ error: "Failed to delete ad" });
  }
});

router.post("/generate-ai", ownerAuth, validate(schemas.adGenerate), async (req, res) => {
  try {
    const generated = await generateAdContent(req.body.instructions);
    res.json({ generated });
  } catch (error) {
    console.error("AI generate ad error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate ad content",
    });
  }
});

router.post("/upload-image", ownerAuth, upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      res.status(400).json({ error: "Image too large. Maximum 2 MB." });
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
        category: "ad-images",
      },
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json({ url: `${baseUrl}/api/files/${encodeURIComponent(fileId)}` });
  } catch (error) {
    console.error("Ad image upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Image upload failed",
    });
  }
});

router.post("/:id/click", async (req, res) => {
  try {
    const adId = req.params.id as string;
    await prisma.ad.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
    });
    res.json({ tracked: true });
  } catch (error) {
    console.error("Track click error:", error);
    res.status(500).json({ error: "Failed to track click" });
  }
});

router.post("/:id/impression", async (req, res) => {
  try {
    const adId = req.params.id as string;
    await prisma.ad.update({
      where: { id: adId },
      data: { impressions: { increment: 1 } },
    });
    res.json({ tracked: true });
  } catch (error) {
    console.error("Track impression error:", error);
    res.status(500).json({ error: "Failed to track impression" });
  }
});

export default router;
