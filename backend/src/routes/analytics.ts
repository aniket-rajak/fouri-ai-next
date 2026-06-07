import { Router, Request, Response } from "express";
import { ownerAuth } from "../middleware/ownerAuth.js";
import * as analyticsService from "../services/analyticsService.js";
import * as realtimeService from "../services/realtimeService.js";

const router = Router();

router.use(ownerAuth);

// ---- Event tracking (single or batch) ----
router.post("/track", async (req: Request, res: Response) => {
  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip;
    const userAgent = req.headers["user-agent"] || null;

    const events = req.body.events || [req.body];
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "events array or eventType is required" });
      return;
    }
    for (const ev of events) {
      if (!ev.eventType) continue;
      await analyticsService.logEvent(ev.eventType, ev.userId || null, ev.metadata || null, ip, userAgent);
    }
    res.json({ ok: true, count: events.length });
  } catch (err: any) {
    console.error("[analytics] track error:", err?.message);
    res.status(500).json({ error: "Failed to track event" });
  }
});

router.post("/heartbeat", async (req: Request, res: Response) => {
  try {
    const { userId, name, email, currentPage } = req.body;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }
    realtimeService.recordHeartbeat(userId, name || "Unknown", email || "", currentPage || "/");
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[analytics] heartbeat error:", err?.message);
    res.status(500).json({ error: "Failed to record heartbeat" });
  }
});

// ---- Overview ----
router.get("/overview", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getOverviewStats(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] overview error:", err?.message);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

// ---- Active Users ----
router.get("/users/active", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getActiveUsers(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] active users error:", err?.message);
    res.status(500).json({ error: "Failed to fetch active users" });
  }
});

// ---- Traffic ----
router.get("/traffic", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getTrafficData(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] traffic error:", err?.message);
    res.status(500).json({ error: "Failed to fetch traffic data" });
  }
});

// ---- Daily Activities ----
router.get("/activities", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getDailyActivities(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] activities error:", err?.message);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// ---- Page Analytics ----
router.get("/pages", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await analyticsService.getPageAnalytics(period, limit);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] pages error:", err?.message);
    res.status(500).json({ error: "Failed to fetch page analytics" });
  }
});

// ---- Feature Ranking ----
router.get("/features/ranking", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getFeatureRanking(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] feature ranking error:", err?.message);
    res.status(500).json({ error: "Failed to fetch feature ranking" });
  }
});

// ---- Blog Analytics ----
router.get("/blog", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getBlogAnalytics(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] blog error:", err?.message);
    res.status(500).json({ error: "Failed to fetch blog analytics" });
  }
});

// ---- Quiz Detailed Analytics ----
router.get("/quiz/detailed", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getQuizDetailed(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] quiz error:", err?.message);
    res.status(500).json({ error: "Failed to fetch quiz analytics" });
  }
});

// ---- Content Popularity ----
router.get("/content/popularity", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getContentPopularity(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] content popularity error:", err?.message);
    res.status(500).json({ error: "Failed to fetch content popularity" });
  }
});

// ---- User Segments ----
router.get("/users/segments", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getUserSegments(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] segments error:", err?.message);
    res.status(500).json({ error: "Failed to fetch user segments" });
  }
});

// ---- Geo Analytics ----
router.get("/geo", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getGeoData(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] geo error:", err?.message);
    res.status(500).json({ error: "Failed to fetch geo data" });
  }
});

// ---- Device Analytics ----
router.get("/devices", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getDeviceData(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] devices error:", err?.message);
    res.status(500).json({ error: "Failed to fetch device data" });
  }
});

// ---- Search Analytics ----
router.get("/search", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getSearchAnalytics(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] search error:", err?.message);
    res.status(500).json({ error: "Failed to fetch search analytics" });
  }
});

// ---- AI Usage ----
router.get("/ai/usage", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const feature = req.query.feature as string | undefined;
    const data = await analyticsService.getAiUsageByFeature(period, feature);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] ai usage error:", err?.message);
    res.status(500).json({ error: "Failed to fetch AI usage" });
  }
});

// ---- AI Threshold ----
router.get("/ai/threshold", async (_req: Request, res: Response) => {
  try {
    const data = await analyticsService.getAiThreshold();
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] ai threshold error:", err?.message);
    res.status(500).json({ error: "Failed to fetch AI threshold" });
  }
});

// ---- User Growth Trend ----
router.get("/users/growth", async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const data = await analyticsService.getUserGrowthTrend(period);
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] user growth error:", err?.message);
    res.status(500).json({ error: "Failed to fetch user growth" });
  }
});

// ---- Real-time ----
router.get("/realtime", async (_req: Request, res: Response) => {
  try {
    const data = realtimeService.getRealTimeMetrics();
    res.json(data);
  } catch (err: any) {
    console.error("[analytics] realtime error:", err?.message);
    res.status(500).json({ error: "Failed to fetch realtime data" });
  }
});

// ---- CSV Export ----
router.get("/export", async (req: Request, res: Response) => {
  try {
    const section = (req.query.section as string) || "overview";
    const period = (req.query.period as string) || "30d";
    const csv = await analyticsService.generateCsv(section, period);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="analytics-${section}-${period}.csv"`);
    res.send(csv);
  } catch (err: any) {
    console.error("[analytics] export error:", err?.message);
    res.status(500).json({ error: "Failed to export analytics" });
  }
});

export default router;
