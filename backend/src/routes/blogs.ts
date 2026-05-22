import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        imageUrl: true,
        author: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ blogs });
  } catch (error) {
    console.error("Fetch blogs error:", error);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { slug: req.params.slug as string, published: true },
    });
    if (!blog) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }
    res.json({ blog });
  } catch (error) {
    console.error("Fetch blog error:", error);
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

export default router;
