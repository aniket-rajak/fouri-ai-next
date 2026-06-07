import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import "./services/sentry.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const port = process.env.PORT || 4000;

// Security headers
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com"],
      imgSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https://www.fouri.in"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https:", "data:"],
      frameSrc: ["'self'", "https://www.google.com"],
    },
  },
}));

// CORS — strict whitelist only (with localhost fallback for dev)
const corsEnv = process.env.CORS_ORIGIN || "";
const localhostOrigins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"];
const allowedOrigins = [
  ...localhostOrigins,
  ...corsEnv.split(",").map(o => o.trim().replace(/\/$/, "")).filter(Boolean),
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin === o)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === "development" && origin?.startsWith("http://localhost")) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  maxAge: 0,
}));
app.use(express.json({ limit: "10mb" }));

// Rate limiters
import {
  globalLimiter, authLimiter, uploadLimiter,
  standardLimiter, ownerLimiter, contactLimiter, quizLimiter,
} from "./middleware/rateLimiter.js";
app.use("/api", globalLimiter);

// Routes
import authRoutes from "./routes/auth.js";
app.use("/api/auth", authLimiter, authRoutes);

import uploadRoutes from "./routes/upload.js";
app.use("/api/upload", uploadLimiter, uploadRoutes);

import analyzeRoutes from "./routes/analyze.js";
app.use("/api/analyze", analyzeRoutes);

import testsRoutes from "./routes/tests.js";
app.use("/api/tests", standardLimiter, testsRoutes);

import resultsRoutes from "./routes/results.js";
app.use("/api/results", standardLimiter, resultsRoutes);

import attemptsRoutes from "./routes/attempts.js";
app.use("/api/attempts", standardLimiter, attemptsRoutes);

import adminRoutes from "./routes/admin.js";
app.use("/api/admin", standardLimiter, adminRoutes);

import searchRoutes from "./routes/search.js";
app.use("/api/search", standardLimiter, searchRoutes);

import ownerRoutes from "./routes/owner.js";
app.use("/api/owner", ownerLimiter, ownerRoutes);

import emailRoutes from "./routes/email.js";
import { ownerAuth } from "./middleware/ownerAuth.js";
app.use("/api/owner/email", ownerAuth, emailRoutes);

import adRoutes from "./routes/ads.js";
app.use("/api/ads", standardLimiter, adRoutes);

import imageUploadRoutes from "./routes/uploadImage.js";
app.use("/api/upload-image", standardLimiter, imageUploadRoutes);

import fileRoutes from "./routes/files.js";
app.use("/api/files", fileRoutes);

import mediaRoutes from "./routes/media.js";
app.use("/api/owner/media", ownerAuth, mediaRoutes);

import { blogRoutes, ownerBlogRoutes } from "./routes/blog.js";
app.use("/api/blog", standardLimiter, blogRoutes);
app.use("/api/owner/blog", ownerLimiter, ownerAuth, ownerBlogRoutes);

import creditRoutes from "./routes/credits.js";
app.use("/api/credits", standardLimiter, creditRoutes);

import historyRoutes from "./routes/history.js";
app.use("/api/users/history", standardLimiter, historyRoutes);

import contactRoutes from "./routes/contact.js";
app.use("/api/contact", contactLimiter, contactRoutes);

import donateRoutes from "./routes/donate.js";
app.use("/api/donate", standardLimiter, donateRoutes);

import quizRoutes from "./routes/quiz.js";
app.use("/api/quiz", quizRoutes);
import quizFeedbackRoutes from "./routes/quizFeedback.js";
import quizExplainRoutes from "./routes/quizExplain.js";

app.use("/api/quiz", quizFeedbackRoutes);
app.use("/api/quiz", quizExplainRoutes);

app.get("/", (_req, res) => {
  res.json({
    status: "Backend Running Successfully",
    service: "Fouri AI Mocktest API",
  });
});

import { prisma } from "./lib/prisma.js";

async function waitForDatabase(maxRetries = 10): Promise<void> {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("[DB] Connected");
      return;
    } catch {
      console.log(`[DB] Waiting for database (attempt ${i}/${maxRetries})...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.warn("[DB] Could not connect after all retries — starting anyway");
}

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded", message: "Database not ready" });
  }
});

// Global error handler
import multer from "multer";
import { captureError } from "./services/sentry.js";
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message === "Not allowed by CORS") {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File too large. Maximum size is 20 MB." });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  captureError(err);
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

waitForDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

export default app;
