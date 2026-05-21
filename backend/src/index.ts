import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import "./services/sentry.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));

// Global rate limiter
import { globalLimiter } from "./middleware/rateLimiter.js";
app.use("/api", globalLimiter);

// Routes
import authRoutes from "./routes/auth.js";
import { authLimiter } from "./middleware/rateLimiter.js";
app.use("/api/auth", authLimiter, authRoutes);

import uploadRoutes from "./routes/upload.js";
import { uploadLimiter } from "./middleware/rateLimiter.js";
app.use("/api/upload", uploadLimiter, uploadRoutes);

import analyzeRoutes from "./routes/analyze.js";
import { analyzeLimiter } from "./middleware/rateLimiter.js";
app.use("/api/analyze", analyzeLimiter, analyzeRoutes);

import testsRoutes from "./routes/tests.js";
app.use("/api/tests", testsRoutes);

import resultsRoutes from "./routes/results.js";
app.use("/api/results", resultsRoutes);

import attemptsRoutes from "./routes/attempts.js";
app.use("/api/attempts", attemptsRoutes);

import adminRoutes from "./routes/admin.js";
app.use("/api/admin", adminRoutes);

import searchRoutes from "./routes/search.js";
app.use("/api/search", searchRoutes);

app.get("/", (_req, res) => {
  res.json({
    status: "Backend Running Successfully",
    service: "Fouri AI Mocktest API"
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
import { captureError } from "./services/sentry.js";
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  captureError(err);
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
