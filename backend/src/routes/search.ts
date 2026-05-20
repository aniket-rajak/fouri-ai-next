import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim() || "";
    const subject = req.query.subject as string | undefined;
    const examType = req.query.examType as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    const sort = (req.query.sort as string) || "newest";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const where: Record<string, unknown> = { status: "PUBLISHED" };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { chapter: { contains: q, mode: "insensitive" } },
      ];
    }

    if (subject) where.subject = subject;
    if (examType) where.examType = examType;
    if (difficulty) where.difficulty = difficulty;

    const orderBy: Record<string, string> =
      sort === "popular" ? { attemptCount: "desc" } : { createdAt: "desc" };

    const [tests, total] = await Promise.all([
      prisma.mockTest.findMany({
        where: where as any,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          subject: true,
          examType: true,
          difficulty: true,
          totalQuestions: true,
          duration: true,
          attemptCount: true,
          createdAt: true,
        },
      }),
      prisma.mockTest.count({ where: where as any }),
    ]);

    const distinct = await Promise.all([
      prisma.mockTest.findMany({
        where: { status: "PUBLISHED", subject: { not: null } },
        distinct: ["subject"],
        select: { subject: true },
      }),
      prisma.mockTest.findMany({
        where: { status: "PUBLISHED", examType: { not: null } },
        distinct: ["examType"],
        select: { examType: true },
      }),
    ]);

    res.json({
      tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        subjects: distinct[0].map((s) => s.subject).filter(Boolean),
        examTypes: distinct[1].map((e) => e.examType).filter(Boolean),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/trending", authenticate, async (_req, res) => {
  try {
    const tests = await prisma.mockTest.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { attemptCount: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        subject: true,
        difficulty: true,
        totalQuestions: true,
        attemptCount: true,
      },
    });
    res.json({ tests });
  } catch (error) {
    console.error("Trending error:", error);
    res.status(500).json({ error: "Failed to fetch trending" });
  }
});

export default router;
