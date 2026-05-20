import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validate.js";
import { prisma } from "../lib/prisma.js";
import { auth as firebaseAuth } from "../services/firebaseAdmin.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/stats", async (_req, res) => {
  try {
    const [users, uploads, tests, attempts] = await Promise.all([
      prisma.user.count(),
      prisma.upload.count(),
      prisma.mockTest.count({ where: { status: "PUBLISHED" } }),
      prisma.testAttempt.count(),
    ]);

    res.json({
      stats: { users, uploads, tests, attempts },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { uploads: true, testAttempts: true } },
      },
    });
    res.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.patch("/users/:id/role", validate(schemas.roleUpdate), async (req, res) => {
  try {
    const userId = req.params.id as string;
    const { role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });

    try {
      await firebaseAuth.setCustomUserClaims(user.firebaseUid, {
        role: role.toLowerCase(),
      });
    } catch {
      // Firebase custom claims failed but DB updated
    }

    res.json({ user: updated });
  } catch (error) {
    console.error("Admin role update error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.get("/uploads", async (_req, res) => {
  try {
    const uploads = await prisma.upload.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        mockTests: { select: { id: true, title: true } },
      },
    });
    res.json({ uploads });
  } catch (error) {
    console.error("Admin uploads error:", error);
    res.status(500).json({ error: "Failed to fetch uploads" });
  }
});

router.get("/tests", async (_req, res) => {
  try {
    const tests = await prisma.mockTest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        sourceUpload: {
          select: { user: { select: { email: true, name: true } } },
        },
        _count: { select: { questions: true, attempts: true } },
      },
    });
    res.json({ tests });
  } catch (error) {
    console.error("Admin tests error:", error);
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});

router.get("/analytics", async (_req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [recentSignups, recentUploads, recentAttempts, uploadsByStatus, testsByDifficulty] =
      await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.upload.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.testAttempt.count({ where: { startedAt: { gte: thirtyDaysAgo } } }),
        prisma.upload.groupBy({
          by: ["status"],
          _count: true,
        }),
        prisma.mockTest.groupBy({
          by: ["difficulty"],
          where: { status: "PUBLISHED" },
          _count: true,
        }),
      ]);

    const totalAiCalls =
      (await prisma.upload.count({ where: { status: "COMPLETED" } })) +
      (await prisma.upload.count({ where: { status: "FAILED" } }));

    res.json({
      analytics: {
        recentSignups,
        recentUploads,
        recentAttempts,
        totalAiCalls,
        uploadsByStatus: uploadsByStatus.map((u) => ({
          status: u.status,
          count: u._count,
        })),
        testsByDifficulty: testsByDifficulty.map((t) => ({
          difficulty: t.difficulty,
          count: t._count,
        })),
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
