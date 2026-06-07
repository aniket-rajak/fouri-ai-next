export interface DailyStat { date: string; count: number }
export interface UploadStat { fileType: string; count: number }
export interface SubjectStat { subject: string; count: number }

export interface OverviewStats {
  totalUsers: number; newUsers: number; activeUsers: number;
  inactiveUsers: number; totalUploads: number; totalAttempts: number;
  aiCalls: number; blogViews: number;
}

export interface ActiveUserData {
  total: number; active: number; inactive: number;
  days: { date: string; active: number; inactive: number }[];
}

export interface TrafficData {
  date: string; visitors: number; pageViews: number;
}

export interface PageAnalytics {
  path: string; views: number; uniqueUsers: number; percentage: number;
}

export interface FeatureRanking {
  feature: string; usageCount: number; uniqueUsers: number;
}

export interface BlogAnalytics {
  topBlogs: { id: string; title: string; slug: string; viewCount: number; positiveFeedback: number; negativeFeedback: number; createdAt: string }[];
  viewTrend: { date: string; views: number }[];
  totalViews: number;
  totalPositiveFeedback: number;
  totalNegativeFeedback: number;
  totalFeedback: number;
}

export interface QuizDetailed {
  total: number; completed: number; generating: number; abandoned: number;
  completionRate: number; abandonmentRate: number; avgScore: number; avgCompletionTime: number;
  subjectPopularity: { subject: string; count: number }[];
  difficultyDistribution: { difficulty: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
  trend: { date: string; attempts: number; completed: number }[];
}

export interface ContentPopularity {
  subjectPopularity: { subject: string; testCount: number; attemptCount: number }[];
  difficultyDistribution: { difficulty: string; count: number }[];
}

export interface UserSegments {
  totalLoggedIn: number; totalGuest: number;
  loggedInPercentage: number; guestPercentage: number;
  trend: { date: string; loggedIn: number; guest: number }[];
  total: number;
}

export interface GeoData {
  country: string; count: number; percentage: number;
}

export interface DeviceData {
  deviceTypes: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  oss: { os: string; count: number }[];
}

export interface SearchAnalytics {
  topQueries: { query: string; count: number; zeroResults: number; zeroResultRate: number }[];
  totalSearches: number; totalZeroResults: number; zeroResultRate: number;
  trend: { date: string; searches: number }[];
}

export interface AiUsageByFeature {
  byFeature: { feature: string; requests: number; tokensIn: number; tokensOut: number; durationMs: number; success: number; failed: number; successRate: number }[];
  dailyTrend: { date: string; requests: number; tokensIn: number; tokensOut: number }[];
  totalRequests: number; totalTokensIn: number; totalTokensOut: number;
}

export interface AiThreshold {
  limits: { llama3_8b: { limit: number; used: number; remaining: number }; llama3_70b: { limit: number; used: number; remaining: number } };
  totalLimit: number; totalUsage: number; remaining: number; percentage: number;
  estimatedExhaustion: string | null;
  warningLevel: "green" | "yellow" | "orange" | "red";
}

export interface UserGrowth {
  date: string; signups: number; cumulative: number;
}

export interface RealtimeMetrics {
  onlineUsers: { userId: string; name: string; email: string; currentPage: string; lastHeartbeat: number }[];
  onlineCount: number;
  activeQuizSessions: { attemptId: string; userId: string; startedAt: number }[];
  activeQuizCount: number;
  activeAiRequests: { feature: string; userId: string | null; startedAt: number }[];
  activeAiRequestCount: number;
  liveEvents: { timestamp: number; message: string; type: string }[];
}

export interface DailyActivity {
  date: string; [key: string]: string | number;
}
