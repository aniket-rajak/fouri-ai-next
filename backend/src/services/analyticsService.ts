import { prisma } from "../lib/prisma.js";
import { getCached, setCache } from "../lib/cache.js";
import { env } from "../config/env.js";

function cacheKey(prefix: string, params: Record<string, string | undefined>): string {
  return `analytics:${prefix}:${JSON.stringify(params)}`;
}

export async function logEvent(
  eventType: string,
  userId?: string | null,
  metadata?: Record<string, unknown> | null,
  ip?: string | null,
  userAgent?: string | null
): Promise<void> {
  await prisma.analyticsEvent.create({
    data: {
      eventType, userId,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) as any : undefined,
      ip, userAgent,
    },
  });
}

export async function trackAiUsage(
  feature: string, model: string, tokensIn: number, tokensOut: number,
  durationMs: number, success: boolean, userId?: string | null
): Promise<void> {
  await prisma.aiUsageLog.create({
    data: { feature, model, tokensIn, tokensOut, durationMs, success, userId },
  });
}

export async function trackBlogView(blogId: string, userId?: string | null, ip?: string | null): Promise<void> {
  await prisma.$transaction([
    prisma.blogView.create({ data: { blogId, userId, ip } }),
    prisma.blog.update({ where: { id: blogId }, data: { viewCount: { increment: 1 } } }),
  ]);
}

function periodToDateRange(period: string): { from: Date; to: Date } {
  const to = new Date();
  let from: Date;
  switch (period) {
    case "today": from = new Date(to); from.setHours(0, 0, 0, 0); break;
    case "7d": from = new Date(to.getTime() - 7 * 86400000); break;
    case "30d": from = new Date(to.getTime() - 30 * 86400000); break;
    case "1y": from = new Date(to.getTime() - 365 * 86400000); break;
    default: from = new Date(to.getTime() - 30 * 86400000);
  }
  return { from, to };
}

// ---- 1. Overview ----
export async function getOverviewStats(period: string) {
  const { from } = periodToDateRange(period);
  const key = cacheKey("overview", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const [totalUsers, newUsers, activeUsers, totalUploads, totalAttempts, aiCalls, blogViews] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: from } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: from } } }),
      prisma.upload.count(),
      prisma.testAttempt.count({ where: { status: "COMPLETED" } }),
      prisma.aiUsageLog.count({ where: { createdAt: { gte: from } } }),
      prisma.blogView.count({ where: { createdAt: { gte: from } } }),
    ]);

  const result = { totalUsers, newUsers, activeUsers, inactiveUsers: totalUsers - activeUsers, totalUploads, totalAttempts, aiCalls, blogViews };
  setCache(key, result, 60000);
  return result;
}

// ---- 2. Active vs Inactive Users ----
export async function getActiveUsers(period: string) {
  const { from, to } = periodToDateRange(period);
  const key = cacheKey("activeUsers", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const total = await prisma.user.count();
  const active = await prisma.user.count({ where: { lastActiveAt: { gte: from } } });

  const dailyActivity = await prisma.$queryRaw<
    { date: string; active: bigint; inactive: bigint }[]
  >`
    SELECT d::date::text AS date, COALESCE(active.cnt, 0) AS active,
      ${total} - COALESCE(active.cnt, 0) AS inactive
    FROM generate_series($1::date, $2::date, '1 day'::interval) d
    LEFT JOIN (
      SELECT DATE("lastActiveAt") AS dt, COUNT(*)::bigint AS cnt
      FROM "User" WHERE "lastActiveAt" >= $1 GROUP BY DATE("lastActiveAt")
    ) active ON d::date = active.dt
    ORDER BY d
  `;

  const days = dailyActivity.map((r) => ({ date: r.date, active: Number(r.active), inactive: Number(r.inactive) }));
  const result = { total, active, inactive: total - active, days };
  setCache(key, result, 60000);
  return result;
}

// ---- 3. Traffic ----
export async function getTrafficData(period: string) {
  const { from, to } = periodToDateRange(period);
  const key = cacheKey("traffic", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const dailyVisitors = await prisma.$queryRaw<{ date: string; visitors: bigint; pageViews: bigint }[]>`
    SELECT d::date::text AS date, COALESCE(v.visitors, 0) AS visitors, COALESCE(v.page_views, 0) AS page_views
    FROM generate_series($1::date, $2::date, '1 day'::interval) d
    LEFT JOIN (
      SELECT DATE("createdAt") AS dt, COUNT(DISTINCT "userId") AS visitors, COUNT(*) AS page_views
      FROM "AnalyticsEvent" WHERE "eventType" = 'PAGE_VIEW' AND "createdAt" >= $1 GROUP BY DATE("createdAt")
    ) v ON d::date = v.dt ORDER BY d
  `;

  const result = dailyVisitors.map((r) => ({ date: r.date, visitors: Number(r.visitors), pageViews: Number(r.pageViews) }));
  setCache(key, result, 60000);
  return result;
}

// ---- 4. Daily Activities ----
export async function getDailyActivities(period: string) {
  const { from, to } = periodToDateRange(period);
  const key = cacheKey("activities", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const activities = await prisma.$queryRaw<{ date: string; eventType: string; count: bigint }[]>`
    SELECT DATE("createdAt")::text AS date, "eventType", COUNT(*)::bigint AS count
    FROM "AnalyticsEvent" WHERE "createdAt" >= $1 AND "createdAt" <= $2
    GROUP BY DATE("createdAt"), "eventType" ORDER BY date, "eventType"
  `;

  const map = new Map<string, Record<string, string | number>>();
  for (const a of activities) {
    if (!map.has(a.date)) map.set(a.date, { date: a.date });
    (map.get(a.date)!)[a.eventType] = Number(a.count);
  }
  const result = Array.from(map.values());
  setCache(key, result, 60000);
  return result;
}

// ---- 5. Page Analytics ----
export async function getPageAnalytics(period: string, limit = 20) {
  const { from } = periodToDateRange(period);
  const key = cacheKey("pages", { period, limit: String(limit) });
  const cached: any = getCached(key);
  if (cached) return cached;

  const pages = await prisma.$queryRaw<{ path: string; views: bigint; uniqueUsers: bigint }[]>`
    SELECT "metadata"->>'path' AS path, COUNT(*)::bigint AS views,
      COUNT(DISTINCT "userId")::bigint AS "uniqueUsers"
    FROM "AnalyticsEvent"
    WHERE "eventType" = 'PAGE_VIEW' AND "createdAt" >= $1 AND "metadata"->>'path' IS NOT NULL
    GROUP BY "metadata"->>'path' ORDER BY views DESC LIMIT $2
  `;

  const total = pages.reduce((s, p) => s + Number(p.views), 0);
  const result = pages.map((p) => ({ path: p.path, views: Number(p.views), uniqueUsers: Number(p.uniqueUsers), percentage: total > 0 ? Math.round((Number(p.views) / total) * 100) : 0 }));
  setCache(key, result, 60000);
  return result;
}

// ---- 6. Feature Usage Ranking ----
export async function getFeatureRanking(period: string) {
  const { from } = periodToDateRange(period);
  const key = cacheKey("features", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const features = await prisma.$queryRaw<{ feature: string; usageCount: bigint; uniqueUsers: bigint }[]>`
    SELECT "metadata"->>'feature' AS feature, COUNT(*)::bigint AS "usageCount",
      COUNT(DISTINCT "userId")::bigint AS "uniqueUsers"
    FROM "AnalyticsEvent"
    WHERE "eventType" = 'FEATURE_USAGE' AND "createdAt" >= $1 AND "metadata"->>'feature' IS NOT NULL
    GROUP BY "metadata"->>'feature' ORDER BY "usageCount" DESC
  `;

  const result = features.map((f) => ({ feature: f.feature, usageCount: Number(f.usageCount), uniqueUsers: Number(f.uniqueUsers) }));
  setCache(key, result, 60000);
  return result;
}

// ---- 7. Blog Analytics ----
export async function getBlogAnalytics(period: string) {
  const { from } = periodToDateRange(period);
  const key = cacheKey("blog", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const topBlogs = await prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { viewCount: "desc" },
    take: 10,
    select: { id: true, title: true, slug: true, viewCount: true, positiveFeedback: true, negativeFeedback: true, createdAt: true },
  });

  const viewTrend = await prisma.$queryRaw<{ date: string; views: bigint }[]>`
    SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS views
    FROM "BlogView" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date
  `;

  const result = { topBlogs, viewTrend: viewTrend.map((v) => ({ date: v.date, views: Number(v.views) })), totalViews: viewTrend.reduce((s, v) => s + Number(v.views), 0), totalPositiveFeedback: topBlogs.reduce((s, b) => s + b.positiveFeedback, 0), totalNegativeFeedback: topBlogs.reduce((s, b) => s + b.negativeFeedback, 0), totalFeedback: topBlogs.reduce((s, b) => s + b.positiveFeedback + b.negativeFeedback, 0) };
  setCache(key, result, 60000);
  return result;
}

// ---- 8. Quiz Detailed Analytics ----
export async function getQuizDetailed(period: string) {
  const { from, to } = periodToDateRange(period);
  const key = cacheKey("quizDetailed", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { id: true, status: true, score: true, totalQuestions: true, createdAt: true, completedAt: true, subject: true, difficulty: true },
  });

  const total = quizAttempts.length;
  const completed = quizAttempts.filter((q) => q.status === "COMPLETED").length;
  const generating = quizAttempts.filter((q) => q.status === "GENERATING").length;
  const abandoned = quizAttempts.filter((q) => q.status !== "COMPLETED" && q.status !== "GENERATING").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const abandonmentRate = total > 0 ? Math.round((abandoned / total) * 100) : 0;

  const scored = quizAttempts.filter((q) => q.score != null && q.totalQuestions != null);
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, q) => s + (q.score! / q.totalQuestions!) * 100, 0) / scored.length) : 0;
  const withTime = quizAttempts.filter((q) => q.completedAt && q.createdAt);
  const avgCompletionTime = withTime.length > 0 ? Math.round(withTime.reduce((s, q) => s + (q.completedAt!.getTime() - q.createdAt.getTime()) / 1000, 0) / withTime.length) : 0;

  const subjectPopularity = await prisma.quizAttempt.groupBy({
    by: ["subject"], _count: { id: true },
    where: { createdAt: { gte: from } },
    orderBy: { _count: { id: "desc" } },
  });

  const difficultyDist = await prisma.quizAttempt.groupBy({
    by: ["difficulty"], _count: { id: true },
    where: { createdAt: { gte: from } },
  });

  const scoreDistribution = [0, 0, 0, 0, 0];
  for (const q of scored) {
    const pct = (q.score! / q.totalQuestions!) * 100;
    if (pct < 20) scoreDistribution[0]++;
    else if (pct < 40) scoreDistribution[1]++;
    else if (pct < 60) scoreDistribution[2]++;
    else if (pct < 80) scoreDistribution[3]++;
    else scoreDistribution[4]++;
  }

  const trend = await prisma.$queryRaw<{ date: string; attempts: bigint; completed: bigint }[]>`
    SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS attempts,
      COUNT(*) FILTER (WHERE status = 'COMPLETED')::bigint AS completed
    FROM "QuizAttempt" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date
  `;

  const result = {
    total, completed, generating, abandoned, completionRate, abandonmentRate, avgScore, avgCompletionTime,
    subjectPopularity: subjectPopularity.map((s) => ({ subject: s.subject, count: s._count.id })),
    difficultyDistribution: difficultyDist.map((d) => ({ difficulty: d.difficulty, count: d._count.id })),
    scoreDistribution: [
      { range: "0-20%", count: scoreDistribution[0] },
      { range: "20-40%", count: scoreDistribution[1] },
      { range: "40-60%", count: scoreDistribution[2] },
      { range: "60-80%", count: scoreDistribution[3] },
      { range: "80-100%", count: scoreDistribution[4] },
    ],
    trend: trend.map((t) => ({ date: t.date, attempts: Number(t.attempts), completed: Number(t.completed) })),
  };
  setCache(key, result, 60000);
  return result;
}

// ---- 9. Content Popularity ----
export async function getContentPopularity(period: string) {
  const { from } = periodToDateRange(period);
  const key = cacheKey("contentPop", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const subjectPopularity = await prisma.mockTest.groupBy({
    by: ["subject"], _count: { id: true }, _sum: { attemptCount: true },
    where: { createdAt: { gte: from }, subject: { not: null } },
    orderBy: { _count: { id: "desc" } }, take: 10,
  });

  const difficultyDist = await prisma.mockTest.groupBy({
    by: ["difficulty"], _count: { id: true },
    where: { createdAt: { gte: from } },
  });

  const result = {
    subjectPopularity: subjectPopularity.map((s) => ({ subject: s.subject, testCount: s._count.id, attemptCount: s._sum.attemptCount || 0 })),
    difficultyDistribution: difficultyDist.map((d) => ({ difficulty: d.difficulty, count: d._count.id })),
  };
  setCache(key, result, 60000);
  return result;
}

// ---- 10. User Segments ----
export async function getUserSegments(period: string) {
  const { from } = periodToDateRange(period);
  const key = cacheKey("segments", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const segments = await prisma.$queryRaw<{ date: string; loggedIn: bigint; guest: bigint }[]>`
    SELECT DATE("createdAt")::text AS date,
      COUNT(*) FILTER (WHERE "userId" IS NOT NULL)::bigint AS "loggedIn",
      COUNT(*) FILTER (WHERE "userId" IS NULL)::bigint AS guest
    FROM "AnalyticsEvent" WHERE "eventType" = 'PAGE_VIEW' AND "createdAt" >= $1
    GROUP BY DATE("createdAt") ORDER BY date
  `;

  const totalLoggedIn = segments.reduce((s, r) => s + Number(r.loggedIn), 0);
  const totalGuest = segments.reduce((s, r) => s + Number(r.guest), 0);
  const total = totalLoggedIn + totalGuest;

  return {
    totalLoggedIn, totalGuest,
    loggedInPercentage: total > 0 ? Math.round((totalLoggedIn / total) * 100) : 0,
    guestPercentage: total > 0 ? Math.round((totalGuest / total) * 100) : 0,
    trend: segments.map((r) => ({ date: r.date, loggedIn: Number(r.loggedIn), guest: Number(r.guest) })),
    total,
  };
}

// ---- 11. Geo Analytics ----
export async function getGeoData(period: string) {
  const { from } = periodToDateRange(period);
  const key = cacheKey("geo", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const geo = await prisma.$queryRaw<{ country: string; count: bigint }[]>`
    SELECT "metadata"->>'country' AS country, COUNT(*)::bigint AS count
    FROM "AnalyticsEvent" WHERE "eventType" = 'PAGE_VIEW' AND "createdAt" >= $1 AND "metadata"->>'country' IS NOT NULL
    GROUP BY "metadata"->>'country' ORDER BY count DESC LIMIT 20
  `;

  const total = geo.reduce((s, g) => s + Number(g.count), 0);
  const result = geo.map((g) => ({ country: g.country, count: Number(g.count), percentage: total > 0 ? Math.round((Number(g.count) / total) * 100) : 0 }));
  setCache(key, result, 60000);
  return result;
}

// ---- 12. Device Analytics ----
export async function getDeviceData(period: string) {
  const { from } = periodToDateRange(period);
  const key = cacheKey("devices", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const [deviceTypes, browsers, oss] = await Promise.all([
    prisma.$queryRaw<{ device: string; count: bigint }[]>`
      SELECT "metadata"->>'deviceType' AS device, COUNT(*)::bigint AS count
      FROM "AnalyticsEvent" WHERE "eventType" = 'PAGE_VIEW' AND "createdAt" >= $1 AND "metadata"->>'deviceType' IS NOT NULL
      GROUP BY "metadata"->>'deviceType' ORDER BY count DESC
    `,
    prisma.$queryRaw<{ browser: string; count: bigint }[]>`
      SELECT "metadata"->>'browser' AS browser, COUNT(*)::bigint AS count
      FROM "AnalyticsEvent" WHERE "eventType" = 'PAGE_VIEW' AND "createdAt" >= $1 AND "metadata"->>'browser' IS NOT NULL
      GROUP BY "metadata"->>'browser' ORDER BY count DESC
    `,
    prisma.$queryRaw<{ os: string; count: bigint }[]>`
      SELECT "metadata"->>'os' AS os, COUNT(*)::bigint AS count
      FROM "AnalyticsEvent" WHERE "eventType" = 'PAGE_VIEW' AND "createdAt" >= $1 AND "metadata"->>'os' IS NOT NULL
      GROUP BY "metadata"->>'os' ORDER BY count DESC
    `,
  ]);

  return {
    deviceTypes: deviceTypes.map((d) => ({ device: d.device, count: Number(d.count) })),
    browsers: browsers.map((b) => ({ browser: b.browser, count: Number(b.count) })),
    oss: oss.map((o) => ({ os: o.os, count: Number(o.count) })),
  };
}

// ---- 13. Search Analytics ----
export async function getSearchAnalytics(period: string) {
  const { from } = periodToDateRange(period);
  const key = cacheKey("search", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const queries = await prisma.$queryRaw<{ query: string; count: bigint; zeroResults: bigint }[]>`
    SELECT "metadata"->>'query' AS query, COUNT(*)::bigint AS count,
      COUNT(*) FILTER (WHERE ("metadata"->>'resultsCount')::int = 0)::bigint AS "zeroResults"
    FROM "AnalyticsEvent" WHERE "eventType" = 'SEARCH' AND "createdAt" >= $1 AND "metadata"->>'query' IS NOT NULL
    GROUP BY "metadata"->>'query' ORDER BY count DESC LIMIT 30
  `;

  const totalSearches = queries.reduce((s, q) => s + Number(q.count), 0);
  const totalZeroResults = queries.reduce((s, q) => s + Number(q.zeroResults), 0);

  const trend = await prisma.$queryRaw<{ date: string; searches: bigint }[]>`
    SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS searches
    FROM "AnalyticsEvent" WHERE "eventType" = 'SEARCH' AND "createdAt" >= $1
    GROUP BY DATE("createdAt") ORDER BY date
  `;

  return {
    topQueries: queries.map((q) => ({ query: q.query, count: Number(q.count), zeroResults: Number(q.zeroResults), zeroResultRate: Number(q.count) > 0 ? Math.round((Number(q.zeroResults) / Number(q.count)) * 100) : 0 })),
    totalSearches, totalZeroResults,
    zeroResultRate: totalSearches > 0 ? Math.round((totalZeroResults / totalSearches) * 100) : 0,
    trend: trend.map((t) => ({ date: t.date, searches: Number(t.searches) })),
  };
}

// ---- 14. AI Usage by Feature ----
export async function getAiUsageByFeature(period: string, featureFilter?: string) {
  const { from, to } = periodToDateRange(period);
  const key = cacheKey("aiUsage", { period, feature: featureFilter });
  const cached: any = getCached(key);
  if (cached) return cached;

  const where = featureFilter ? { feature: featureFilter, createdAt: { gte: from, lte: to } } : { createdAt: { gte: from, lte: to } };
  const logs = await prisma.aiUsageLog.findMany({ where, orderBy: { createdAt: "asc" } });

  const byFeature = new Map<string, { requests: number; tokensIn: number; tokensOut: number; durationMs: number; success: number; failed: number }>();
  for (const log of logs) {
    if (!byFeature.has(log.feature)) byFeature.set(log.feature, { requests: 0, tokensIn: 0, tokensOut: 0, durationMs: 0, success: 0, failed: 0 });
    const f = byFeature.get(log.feature)!;
    f.requests++; f.tokensIn += log.tokensIn; f.tokensOut += log.tokensOut; f.durationMs += log.durationMs;
    if (log.success) f.success++; else f.failed++;
  }

  const dailyTrend = await prisma.$queryRaw<{ date: string; requests: bigint; tokensIn: bigint; tokensOut: bigint }[]>`
    SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS requests,
      COALESCE(SUM("tokensIn"), 0)::bigint AS "tokensIn",
      COALESCE(SUM("tokensOut"), 0)::bigint AS "tokensOut"
    FROM "AiUsageLog" WHERE "createdAt" >= $1 AND "createdAt" <= $2
      ${featureFilter ? `AND feature = '${featureFilter.replace(/'/g, "''")}'` : ""}
    GROUP BY DATE("createdAt") ORDER BY date
  `;

  return {
    byFeature: Array.from(byFeature.entries()).map(([feature, stats]) => ({ feature, ...stats, successRate: stats.requests > 0 ? Math.round((stats.success / stats.requests) * 100) : 0 })),
    dailyTrend: dailyTrend.map((d) => ({ date: d.date, requests: Number(d.requests), tokensIn: Number(d.tokensIn), tokensOut: Number(d.tokensOut) })),
    totalRequests: logs.length,
    totalTokensIn: logs.reduce((s, l) => s + l.tokensIn, 0),
    totalTokensOut: logs.reduce((s, l) => s + l.tokensOut, 0),
  };
}

// ---- 15. AI Threshold ----
export async function getAiThreshold() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const todayUsage = await prisma.aiUsageLog.findMany({
    where: { createdAt: { gte: today, lt: tomorrow } },
    select: { feature: true, model: true },
  });

  const usage8b = todayUsage.filter((u) => u.model.includes("8b")).length;
  const usage70b = todayUsage.filter((u) => u.model.includes("70b")).length;
  const limit8b = env.ai.dailyLimit8b;
  const limit70b = env.ai.dailyLimit70b;
  const totalLimit = limit8b + limit70b;
  const totalUsage = usage8b + usage70b;
  const pct = totalLimit > 0 ? Math.round((totalUsage / totalLimit) * 100) : 0;

  let warningLevel: "green" | "yellow" | "orange" | "red" = "green";
  if (pct >= 90) warningLevel = "red";
  else if (pct >= 75) warningLevel = "orange";
  else if (pct >= 50) warningLevel = "yellow";

  let estimatedExhaustion: string | null = null;
  if (totalUsage > 0) {
    const ratePerMs = totalUsage / (Date.now() - today.getTime());
    if (ratePerMs > 0) {
      const remaining = totalLimit - totalUsage;
      const msUntilExhaustion = remaining / ratePerMs;
      if (msUntilExhaustion < 86400000) estimatedExhaustion = new Date(Date.now() + msUntilExhaustion).toISOString();
    }
  }

  return {
    limits: {
      llama3_8b: { limit: limit8b, used: usage8b, remaining: Math.max(0, limit8b - usage8b) },
      llama3_70b: { limit: limit70b, used: usage70b, remaining: Math.max(0, limit70b - usage70b) },
    },
    totalLimit, totalUsage,
    remaining: Math.max(0, totalLimit - totalUsage),
    percentage: pct, estimatedExhaustion, warningLevel,
  };
}

// ---- 16. User Growth Trend ----
export async function getUserGrowthTrend(period: string) {
  const { from, to } = periodToDateRange(period);
  const key = cacheKey("userGrowth", { period });
  const cached: any = getCached(key);
  if (cached) return cached;

  const growth = await prisma.$queryRaw<{ date: string; signups: bigint; cumulative: bigint }[]>`
    WITH daily_signups AS (
      SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS signups
      FROM "User" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt")
    ), all_dates AS (
      SELECT d::date::text AS date FROM generate_series($1::date, $2::date, '1 day'::interval) d
    )
    SELECT ad.date, COALESCE(ds.signups, 0)::bigint AS signups,
      SUM(COALESCE(ds.signups, 0)) OVER (ORDER BY ad.date)::bigint AS cumulative
    FROM all_dates ad LEFT JOIN daily_signups ds ON ad.date = ds.date ORDER BY ad.date
  `;

  const result = growth.map((g) => ({ date: g.date, signups: Number(g.signups), cumulative: Number(g.cumulative) }));
  setCache(key, result, 60000);
  return result;
}

// ---- CSV Export ----
export async function generateCsv(section: string, period: string): Promise<string> {
  const rows: string[] = [];

  switch (section) {
    case "users": {
      rows.push("Date,New Signups,Active Users,Total Users");
      const growth = await getUserGrowthTrend(period);
      const active = await getActiveUsers(period);
      const activeMap = new Map(active.days.map((d: { date: string; active: number }) => [d.date, d.active]));
      for (const g of growth) rows.push(`${g.date},${g.signups},${activeMap.get(g.date) || 0},${g.cumulative}`);
      break;
    }
    case "traffic": {
      rows.push("Date,Visitors,Page Views");
      const traffic = await getTrafficData(period);
      for (const t of traffic) rows.push(`${t.date},${t.visitors},${t.pageViews}`);
      break;
    }
    case "pages": {
      rows.push("Page Path,Views,Unique Users,% of Total");
      const pages = await getPageAnalytics(period);
      for (const p of pages) rows.push(`"${p.path}",${p.views},${p.uniqueUsers},${p.percentage}%`);
      break;
    }
    case "blog": {
      rows.push("Blog Title,Views,Positive Feedback,Negative Feedback");
      const blog = await getBlogAnalytics(period);
      for (const b of blog.topBlogs) rows.push(`"${b.title}",${b.viewCount},${b.positiveFeedback},${b.negativeFeedback}`);
      break;
    }
    case "quiz": {
      rows.push("Date,Total Attempts,Completed,Completion Rate");
      const quiz = await getQuizDetailed(period);
      for (const t of quiz.trend) rows.push(`${t.date},${t.attempts},${t.completed},${quiz.completionRate}%`);
      break;
    }
    case "ai": {
      rows.push("Date,Feature,Requests,Tokens In,Tokens Out");
      const ai = await getAiUsageByFeature(period);
      for (const d of ai.dailyTrend) rows.push(`${d.date},all,${d.requests},${d.tokensIn},${d.tokensOut}`);
      for (const f of ai.byFeature) rows.push(`total,${f.feature},${f.requests},${f.tokensIn},${f.tokensOut}`);
      break;
    }
    default: {
      rows.push("Section,Period"); rows.push(`${section},${period}`);
    }
  }

  return rows.join("\n");
}
