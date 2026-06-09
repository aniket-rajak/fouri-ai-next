import { Router } from "express";
import jwt from "jsonwebtoken";
import { downloadTelegramFile } from "../services/telegramStorage.js";
import { env } from "../config/env.js";
import { prisma, withRetry } from "../lib/prisma.js";
import { ownerAuth } from "../middleware/ownerAuth.js";
import { validate, schemas } from "../middleware/validate.js";
import { resolveFileUrl } from "../lib/resolveFileUrl.js";

const router = Router();

router.post("/login", validate(schemas.ownerLogin), (req, res) => {
  try {
    const { email, password } = req.body;

    if (!env.owner.email || !env.owner.password) {
      res.status(500).json({ error: "Owner credentials not configured" });
      return;
    }

    if (email !== env.owner.email || password !== env.owner.password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { email, role: "owner", iat: Math.floor(Date.now() / 1000) },
      env.jwtSecret,
      { expiresIn: "24h" }
    );

    res.json({ token, email });
  } catch (error) {
    console.error("Owner login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/verify", (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const token = header.split("Bearer ")[1];
    const decoded = jwt.verify(token, env.jwtSecret) as { email: string; role: string };

    if (decoded.email !== env.owner.email || decoded.role !== "owner") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({ valid: true, email: decoded.email });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.get("/dashboard/stats", ownerAuth, async (_req, res) => {
  try {
    const result = await withRetry(async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers, newUsers30d, newUsers7d,
        totalUploads, uploads30d, totalTests,
        totalAttempts, attempts30d,
        completedUploads, failedUploads, processingUploads, analyzingUploads,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.upload.count(),
        prisma.upload.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.mockTest.count({ where: { status: "PUBLISHED" } }),
        prisma.testAttempt.count(),
        prisma.testAttempt.count({ where: { startedAt: { gte: thirtyDaysAgo } } }),
        prisma.upload.count({ where: { status: "COMPLETED" } }),
        prisma.upload.count({ where: { status: "FAILED" } }),
        prisma.upload.count({ where: { status: "PROCESSING" } }),
        prisma.upload.count({ where: { status: "ANALYZING" } }),
      ]);

      const aiCalls = completedUploads + failedUploads;
      const ocrSuccessRate = aiCalls > 0 ? Math.round((completedUploads / aiCalls) * 100) : 100;

      return {
        totalUsers, newUsers30d, newUsers7d,
        totalUploads, uploads30d, totalTests,
        totalAttempts, attempts30d,
        completedUploads, failedUploads, processingUploads, analyzingUploads,
        aiCalls, ocrSuccessRate,
      };
    }, { retries: 3, delay: 2000 });

    res.json(result);
  } catch (error) {
    console.error("Owner stats error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    res.status(500).json({ error: message });
  }
});

router.get("/users", ownerAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string)?.trim() || "";
    const sort = (req.query.sort as string) || "newest";
    const _provider = req.query.provider as string | undefined;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Record<string, string> =
      sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: where as any,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { uploads: true, testAttempts: true } },
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.user.count({ where: where as any }),
    ]);

    res.json({
      users: users.map((u) => ({ ...u, avatarUrl: resolveFileUrl(u.avatarUrl, req) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Owner users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

function getPeriodDate(period?: string): Date {
  switch (period) {
    case "today": return new Date(Date.now() - 24 * 60 * 60 * 1000);
    case "7d": return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    case "30d": return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    case "1y": return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    default: return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }
}

router.get("/daily-stats", ownerAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = getPeriodDate(req.query.period as string);

    const dailySignups = await prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
      `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "User" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`,
      thirtyDaysAgo
    );

    const dailyUploads = await prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
      `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "Upload" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`,
      thirtyDaysAgo
    );

    const dailyAttempts = await prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
      `SELECT DATE("startedAt") as date, COUNT(*)::int as count FROM "TestAttempt" WHERE "startedAt" >= $1 GROUP BY DATE("startedAt") ORDER BY date`,
      thirtyDaysAgo
    );

    res.json({ dailySignups, dailyUploads, dailyAttempts });
  } catch (error) {
    console.error("Daily stats error:", error);
    res.status(500).json({ error: "Failed to fetch daily stats" });
  }
});

router.get("/upload-stats", ownerAuth, async (req, res) => {
  try {
    const periodDate = getPeriodDate(req.query.period as string);
    const hasPeriod = !!req.query.period;

    const uploadsByType = hasPeriod
      ? await prisma.$queryRawUnsafe<Array<{ fileType: string; count: bigint }>>(
          `SELECT "fileType", COUNT(*)::int as count FROM "Upload" WHERE "createdAt" >= $1 GROUP BY "fileType" ORDER BY count DESC`,
          periodDate
        )
      : await prisma.$queryRawUnsafe<Array<{ fileType: string; count: bigint }>>(
          `SELECT "fileType", COUNT(*)::int as count FROM "Upload" GROUP BY "fileType" ORDER BY count DESC`
        );

    const uploadsByStatus = hasPeriod
      ? await prisma.$queryRawUnsafe<Array<{ status: string; count: bigint }>>(
          `SELECT status, COUNT(*)::int as count FROM "Upload" WHERE "createdAt" >= $1 GROUP BY status`,
          periodDate
        )
      : await prisma.$queryRawUnsafe<Array<{ status: string; count: bigint }>>(
          `SELECT status, COUNT(*)::int as count FROM "Upload" GROUP BY status`
        );

    const subjectsWithCounts = await prisma.$queryRawUnsafe<Array<{ subject: string; count: bigint }>>(
      `SELECT subject, COUNT(*)::int as count FROM "MockTest" WHERE subject IS NOT NULL GROUP BY subject ORDER BY count DESC LIMIT 10`
    );

    res.json({ uploadsByType, uploadsByStatus, subjectsWithCounts });
  } catch (error) {
    console.error("Upload stats error:", error);
    res.status(500).json({ error: "Failed to fetch upload stats" });
  }
});

router.get("/weekly-stats", ownerAuth, async (req, res) => {
  try {
    const eightWeeksAgo = getPeriodDate(req.query.period as string);

    const weeklySignups = await prisma.$queryRawUnsafe<Array<{ week: string; count: bigint }>>(
      `SELECT to_char(date_trunc('week', "createdAt"), 'YYYY-MM-DD') as week, COUNT(*)::int as count FROM "User" WHERE "createdAt" >= $1 GROUP BY week ORDER BY week`,
      eightWeeksAgo
    );

    const weeklyUploads = await prisma.$queryRawUnsafe<Array<{ week: string; count: bigint }>>(
      `SELECT to_char(date_trunc('week', "createdAt"), 'YYYY-MM-DD') as week, COUNT(*)::int as count FROM "Upload" WHERE "createdAt" >= $1 GROUP BY week ORDER BY week`,
      eightWeeksAgo
    );

    const weeklyAttempts = await prisma.$queryRawUnsafe<Array<{ week: string; count: bigint }>>(
      `SELECT to_char(date_trunc('week', "startedAt"), 'YYYY-MM-DD') as week, COUNT(*)::int as count FROM "TestAttempt" WHERE "startedAt" >= $1 GROUP BY week ORDER BY week`,
      eightWeeksAgo
    );

    res.json({ weeklySignups, weeklyUploads, weeklyAttempts });
  } catch (error) {
    console.error("Weekly stats error:", error);
    res.status(500).json({ error: "Failed to fetch weekly stats" });
  }
});

router.get("/monthly-stats", ownerAuth, async (req, res) => {
  try {
    const twelveMonthsAgo = getPeriodDate(req.query.period as string);

    const monthlySignups = await prisma.$queryRawUnsafe<Array<{ month: string; count: bigint }>>(
      `SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month, COUNT(*)::int as count FROM "User" WHERE "createdAt" >= $1 GROUP BY month ORDER BY month`,
      twelveMonthsAgo
    );

    const monthlyUploads = await prisma.$queryRawUnsafe<Array<{ month: string; count: bigint }>>(
      `SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month, COUNT(*)::int as count FROM "Upload" WHERE "createdAt" >= $1 GROUP BY month ORDER BY month`,
      twelveMonthsAgo
    );

    const monthlyAttempts = await prisma.$queryRawUnsafe<Array<{ month: string; count: bigint }>>(
      `SELECT to_char(date_trunc('month', "startedAt"), 'YYYY-MM') as month, COUNT(*)::int as count FROM "TestAttempt" WHERE "startedAt" >= $1 GROUP BY month ORDER BY month`,
      twelveMonthsAgo
    );

    res.json({ monthlySignups, monthlyUploads, monthlyAttempts });
  } catch (error) {
    console.error("Monthly stats error:", error);
    res.status(500).json({ error: "Failed to fetch monthly stats" });
  }
});

router.get("/uploads", ownerAuth, async (req, res) => {
  try {
    const search = (req.query.search as string)?.trim() || "";
    const typeFilter = (req.query.type as string) || "";
    const statusFilter = (req.query.status as string) || "";
    const subjectFilter = (req.query.subject as string) || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (typeFilter) where.fileType = typeFilter;
    if (statusFilter) where.status = statusFilter;
    if (subjectFilter) {
      where.mockTests = { some: { subject: { equals: subjectFilter, mode: "insensitive" } } };
    }

    const uploads = await prisma.upload.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: where as any,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        mockTests: { select: { id: true, title: true, subject: true } },
      },
    });

    const subjects = await prisma.mockTest.findMany({
      where: { subject: { not: null } },
      select: { subject: true },
      distinct: ["subject"],
      orderBy: { subject: "asc" },
    });

    res.json({ uploads, subjects: subjects.map((s) => s.subject).filter(Boolean) });
  } catch (error) {
    console.error("Owner uploads error:", error);
    res.status(500).json({ error: "Failed to fetch uploads" });
  }
});

router.delete("/uploads/:id", ownerAuth, async (req, res) => {
  try {
    const uploadId = req.params.id as string;
    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload) {
      res.status(404).json({ error: "Upload not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.mockTest.deleteMany({ where: { sourceUploadId: uploadId } });
      await tx.upload.delete({ where: { id: uploadId } });
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Owner delete upload error:", error);
    res.status(500).json({ error: "Failed to delete upload" });
  }
});

router.post("/uploads/bulk-delete", ownerAuth, async (req, res) => {
  try {
    const { statuses } = req.body;
    if (!Array.isArray(statuses) || statuses.length === 0) {
      res.status(400).json({ error: "Provide at least one status to delete" });
      return;
    }

    const uploads = await prisma.upload.findMany({
      where: { status: { in: statuses } },
      select: { id: true },
    });
    const ids = uploads.map((u) => u.id);

    if (ids.length === 0) {
      res.json({ success: true, deleted: 0 });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.mockTest.deleteMany({ where: { sourceUploadId: { in: ids } } });
      await tx.upload.deleteMany({ where: { id: { in: ids } } });
    });

    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("Bulk delete uploads error:", error);
    res.status(500).json({ error: "Failed to delete uploads" });
  }
});



router.get("/uploads/:id/download", async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1] || req.query.token as string;
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as { email: string; role: string };
      if (decoded.email !== env.owner.email || decoded.role !== "owner") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    } catch {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const uploadId = req.params.id as string;
    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload?.telegramFileId) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const filename = upload.filename || `download.${upload.fileType?.split("/").pop() || "bin"}`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", upload.fileType || "application/octet-stream");

    const buffer = await downloadTelegramFile(upload.telegramFileId);
    res.send(buffer);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Download failed" });
  }
});

export default router;
