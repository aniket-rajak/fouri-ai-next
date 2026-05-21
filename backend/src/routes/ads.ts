import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ownerAuth } from "../middleware/ownerAuth.js";

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
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ads });
  } catch (error) {
    console.error("Fetch active ads error:", error);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

router.post("/", ownerAuth, async (req, res) => {
  try {
    const { title, description, imageUrl, ctaText, ctaLink } = req.body;

    if (!title || !imageUrl || !ctaLink) {
      res.status(400).json({ error: "Title, imageUrl, and ctaLink are required" });
      return;
    }

    const ad = await prisma.ad.create({
      data: {
        title,
        description: description || null,
        imageUrl,
        ctaText: ctaText || "Learn More",
        ctaLink,
        active: true,
      },
    });

    res.status(201).json({ ad });
  } catch (error) {
    console.error("Create ad error:", error);
    res.status(500).json({ error: "Failed to create ad" });
  }
});

router.put("/:id", ownerAuth, async (req, res) => {
  try {
    const adId = req.params.id as string;
    const { title, description, imageUrl, ctaText, ctaLink, active } = req.body;

    const existing = await prisma.ad.findUnique({ where: { id: adId } });
    if (!existing) {
      res.status(404).json({ error: "Ad not found" });
      return;
    }

    const ad = await prisma.ad.update({
      where: { id: adId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(ctaText !== undefined && { ctaText }),
        ...(ctaLink !== undefined && { ctaLink }),
        ...(active !== undefined && { active }),
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
