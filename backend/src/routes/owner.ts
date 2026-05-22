import { Router } from "express";
import jwt from "jsonwebtoken";
import https from "https";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { ownerAuth } from "../middleware/ownerAuth.js";
import { validate, schemas } from "../middleware/validate.js";
import { blogAdminLimiter } from "../middleware/rateLimiter.js";

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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers30d,
      newUsers7d,
      totalUploads,
      uploads30d,
      totalTests,
      totalAttempts,
      attempts30d,
      completedUploads,
      failedUploads,
      processingUploads,
      analyzingUploads,
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

    res.json({
      totalUsers,
      newUsers30d,
      newUsers7d,
      totalUploads,
      uploads30d,
      totalTests,
      totalAttempts,
      attempts30d,
      completedUploads,
      failedUploads,
      processingUploads,
      analyzingUploads,
      aiCalls,
      ocrSuccessRate,
    });
  } catch (error) {
    console.error("Owner stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/users", ownerAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string)?.trim() || "";
    const sort = (req.query.sort as string) || "newest";
    const provider = req.query.provider as string | undefined;

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
      prisma.user.count({ where: where as any }),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Owner users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/daily-stats", ownerAuth, async (_req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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

router.get("/upload-stats", ownerAuth, async (_req, res) => {
  try {
    const uploadsByType = await prisma.$queryRawUnsafe<Array<{ fileType: string; count: bigint }>>(
      `SELECT "fileType", COUNT(*)::int as count FROM "Upload" GROUP BY "fileType" ORDER BY count DESC`
    );

    const uploadsByStatus = await prisma.$queryRawUnsafe<Array<{ status: string; count: bigint }>>(
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

router.get("/weekly-stats", ownerAuth, async (_req, res) => {
  try {
    const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);

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

router.get("/monthly-stats", ownerAuth, async (_req, res) => {
  try {
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

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

router.post("/seed-blogs", ownerAuth, async (_req, res) => {
  try {
    const existing = await prisma.blog.findFirst();
    if (existing) {
      res.status(400).json({ error: "Blogs already seeded" });
      return;
    }

    const blogs = await prisma.blog.createMany({
      data: [
        {
          title: "How AI-Powered Mock Tests Are Revolutionizing Exam Preparation",
          slug: "ai-powered-mock-tests-revolutionizing-exam-prep",
          content: [
            "## The Traditional Way vs. AI-Powered Learning",
            "",
            "For decades, students have relied on static question banks, printed test papers, and manual evaluation to prepare for competitive exams like JEE, NEET, WBJEE, and CUET. While effective to some extent, this traditional approach has significant limitations \u2014 it\u2019s time-consuming, lacks personalization, and provides limited feedback.",
            "",
            "## Enter AI-Powered Mock Tests",
            "",
            "Artificial Intelligence is transforming how students prepare for exams. Platforms like FOURI.IN are at the forefront of this revolution, offering intelligent mock test generation that adapts to each student\u2019s needs.",
            "",
            "### How It Works",
            "",
            "1. **Upload Your Question Paper** \u2014 Simply upload any question paper (PDF or image) to the platform.",
            "2. **AI Analysis** \u2014 Our advanced OCR technology extracts the text, and AI analyzes each question, identifying the subject, difficulty level, and correct answers.",
            "3. **Instant Mock Test** \u2014 A fully interactive mock test is generated automatically, complete with a timer, question palette, and auto-save features.",
            "4. **Detailed Analytics** \u2014 After completing the test, you get comprehensive performance analytics including accuracy scores, time analysis, and answer reviews.",
            "",
            "## Benefits of AI-Powered Mock Tests",
            "",
            "### 1. Time Efficiency",
            "What used to take hours of manual work now happens in minutes. The AI handles question extraction, formatting, and answer key mapping automatically.",
            "",
            "### 2. Unlimited Practice",
            "Upload any number of question papers \u2014 from previous years\u2019 exams to custom tests created by your teachers. The system never runs out of practice material.",
            "",
            "### 3. Real Exam Simulation",
            "The test interface mimics actual exam conditions with a countdown timer, full-screen mode, and tab-switch detection to help you build exam-day discipline.",
            "",
            "### 4. Detailed Performance Insights",
            "Unlike traditional practice where you only see a score, AI analytics break down your performance by subject, difficulty level, and question type, helping you identify exactly where to focus your efforts.",
            "",
            "## The Future of Exam Preparation",
            "",
            "As AI technology continues to evolve, we can expect even more sophisticated features \u2014 personalized study plans, predictive performance scoring, and adaptive difficulty adjustment. The goal is simple: make quality exam preparation accessible to every student, regardless of their background or resources.",
            "",
            "Ready to experience the future of exam preparation? Upload your first question paper on FOURI.IN and let AI do the heavy lifting.",
          ].join("\n"),
          excerpt: "Discover how AI-powered mock tests are transforming exam preparation for JEE, NEET, WBJEE, and CUET aspirants. Learn about the benefits of intelligent test generation, real exam simulation, and detailed performance analytics.",
          imageUrl: null,
          author: "FOURI Team",
          published: true,
        },
        {
          title: "5 Proven Strategies for Maximizing Your Mock Test Performance",
          slug: "5-strategies-maximizing-mock-test-performance",
          content: [
            "## Why Mock Tests Matter",
            "",
            "Mock tests are the single most effective tool for exam preparation. They not only assess your knowledge but also build the mental stamina and time management skills needed for success. Here are five proven strategies to get the most out of every mock test you take.",
            "",
            "## 1. Simulate Real Exam Conditions",
            "",
            "The biggest mistake students make is taking mock tests in a relaxed environment. To get accurate feedback on your preparation:",
            "",
            "- Set up a distraction-free environment",
            "- Use the full-screen mode and timer exactly as in the real exam",
            "- Follow the same time limits strictly",
            "- Avoid pausing or taking breaks during the test",
            "",
            "This conditions your mind to perform under pressure and reveals your true preparation level.",
            "",
            "## 2. Analyze Your Mistakes Thoroughly",
            "",
            "Getting a question wrong is an opportunity to learn. After each mock test:",
            "",
            "- Review every incorrect answer using the explanation feature",
            "- Identify patterns in your mistakes (careless errors vs. concept gaps)",
            "- Categorize errors by subject and topic",
            "- Create a targeted revision plan based on weak areas",
            "",
            "## 3. Focus on Time Management",
            "",
            "Time pressure is one of the biggest challenges in competitive exams. Practice these techniques:",
            "",
            "- Allocate time per section based on your strengths",
            "- Use the question palette to track answered vs. skipped questions",
            "- Skip difficult questions and return to them later",
            "- Practice with the built-in timer to develop your pacing instinct",
            "",
            "## 4. Take Tests Regularly and Progressively",
            "",
            "Consistency beats intensity. Create a schedule that includes:",
            "",
            "- At least 2-3 mock tests per week during preparation",
            "- Gradually increase from topic-specific tests to full syllabus tests",
            "- Use tests from different sources to avoid pattern familiarity",
            "- Track your scores over time to see improvement trends",
            "",
            "## 5. Leverage Technology for Smarter Practice",
            "",
            "Modern AI-powered platforms like FOURI.IN offer features that traditional methods cannot match:",
            "",
            "- **Auto-save** ensures you never lose progress, even if your connection drops",
            "- **Instant evaluation** provides immediate feedback on your performance",
            "- **Comprehensive analytics** show your accuracy, speed, and topic-wise strengths",
            "- **Answer review** with green/red indicators helps you visualize your performance at a glance",
            "",
            "## Putting It All Together",
            "",
            "Success in competitive exams is not just about how much you study \u2014 it\u2019s about how effectively you practice. By combining consistent effort with smart strategies and leveraging AI technology, you can maximize every study session and approach your exam with confidence.",
            "",
            "Start implementing these strategies today. Upload a question paper on FOURI.IN, take a mock test, and use the analytics to guide your preparation. Your dream score is within reach!",
          ].join("\n"),
          excerpt: "Learn five proven strategies to maximize your mock test performance. From simulating real exam conditions to leveraging AI analytics, discover how to make every practice session count for JEE, NEET, and other competitive exams.",
          imageUrl: null,
          author: "FOURI Team",
          published: true,
        },
      ],
    });

    res.status(201).json({ message: "Blogs seeded successfully", count: blogs.count });
  } catch (error) {
    console.error("Seed blogs error:", error);
    res.status(500).json({ error: "Failed to seed blogs" });
  }
});

// Blog admin routes
router.get("/blogs", blogAdminLimiter, ownerAuth, async (_req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ blogs });
  } catch (error) {
    console.error("Fetch all blogs error:", error);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

router.post("/blogs", blogAdminLimiter, ownerAuth, validate(schemas.blogCreate), async (req, res) => {
  try {
    const { title, slug, content, excerpt, imageUrl, author, published } = req.body;

    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: "A blog with this slug already exists" });
      return;
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        imageUrl: imageUrl || null,
        author: author || "FOURI Team",
        published: published || false,
      },
    });

    res.status(201).json({ blog });
  } catch (error) {
    console.error("Create blog error:", error);
    res.status(500).json({ error: "Failed to create blog" });
  }
});

router.put("/blogs/:id", blogAdminLimiter, ownerAuth, validate(schemas.blogUpdate), async (req, res) => {
  try {
    const blogId = req.params.id as string;
    const { title, slug, content, excerpt, imageUrl, author, published } = req.body;

    const existing = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!existing) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.blog.findUnique({ where: { slug } });
      if (slugConflict) {
        res.status(409).json({ error: "A blog with this slug already exists" });
        return;
      }
    }

    const blog = await prisma.blog.update({
      where: { id: blogId },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(author !== undefined && { author }),
        ...(published !== undefined && { published }),
      },
    });

    res.json({ blog });
  } catch (error) {
    console.error("Update blog error:", error);
    res.status(500).json({ error: "Failed to update blog" });
  }
});

router.delete("/blogs/:id", blogAdminLimiter, ownerAuth, async (req, res) => {
  try {
    const blogId = req.params.id as string;

    const existing = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!existing) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    await prisma.blog.delete({ where: { id: blogId } });
    res.json({ deleted: true });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({ error: "Failed to delete blog" });
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
    if (!upload?.cloudinaryUrl) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const filename = upload.filename || `download.${upload.fileType?.split("/").pop() || "bin"}`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", upload.fileType || "application/octet-stream");

    https.get(upload.cloudinaryUrl, (cloudRes) => {
      if (cloudRes.statusCode !== 200) {
        res.status(502).json({ error: "Failed to fetch file from storage" });
        return;
      }
      cloudRes.pipe(res);
    }).on("error", () => {
      res.status(502).json({ error: "Failed to fetch file from storage" });
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Download failed" });
  }
});

export default router;
