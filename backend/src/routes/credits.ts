import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { standardLimiter } from "../middleware/rateLimiter.js";
import { getUserCredits, estimateRequiredCredits } from "../services/creditService.js";

const router = Router();

router.get("/me", standardLimiter, authenticate, async (req, res) => {
  try {
    const credits = await getUserCredits(req.user!.uid);
    res.json(credits);
  } catch (error) {
    console.error("[Credits] GET /me error:", error);
    res.status(500).json({ error: "Failed to fetch credits" });
  }
});

router.post("/estimate", standardLimiter, authenticate, async (req, res) => {
  try {
    const { fileSize, analysisType } = req.body as {
      fileSize?: number;
      analysisType?: "basic" | "standard" | "full";
    };

    if (!fileSize || typeof fileSize !== "number" || fileSize <= 0) {
      res.status(400).json({ error: "fileSize is required and must be a positive number" });
      return;
    }

    const mode = analysisType ?? "full";
    if (!["basic", "standard", "full"].includes(mode)) {
      res.status(400).json({ error: "analysisType must be 'basic', 'standard', or 'full'" });
      return;
    }

    const requiredCredits = estimateRequiredCredits(fileSize, mode);
    const userCredits = await getUserCredits(req.user!.uid);

    res.json({
      estimatedTokens: Math.round(fileSize * 0.1 / 4 * (mode === "basic" ? 0.4 : mode === "standard" ? 0.7 : 1.0)),
      requiredCredits,
      availableCredits: userCredits.remaining,
      creditsAfterAnalysis: userCredits.remaining - requiredCredits,
      hasEnoughCredits: userCredits.remaining >= requiredCredits,
      analysisMode: mode,
    });
  } catch (error) {
    console.error("[Credits] POST /estimate error:", error);
    res.status(500).json({ error: "Failed to estimate credits" });
  }
});

export default router;
