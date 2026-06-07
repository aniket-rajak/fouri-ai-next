interface ActiveUser {
  userId: string;
  name: string;
  email: string;
  currentPage: string;
  lastHeartbeat: number;
}

interface ActiveQuizSession {
  attemptId: string;
  userId: string;
  startedAt: number;
}

interface ActiveAiRequest {
  feature: string;
  userId: string | null;
  startedAt: number;
}

const HEARTBEAT_TTL_MS = 120_000;

const activeUsers = new Map<string, ActiveUser>();
const activeQuizSessions = new Map<string, ActiveQuizSession>();
const activeAiRequests = new Map<string, ActiveAiRequest>();
const liveEventLog: { timestamp: number; message: string; type: string }[] = [];
const MAX_LIVE_EVENTS = 100;

export function recordHeartbeat(
  userId: string,
  name: string,
  email: string,
  currentPage: string
): void {
  activeUsers.set(userId, {
    userId,
    name,
    email,
    currentPage,
    lastHeartbeat: Date.now(),
  });
}

export function removeHeartbeat(userId: string): void {
  activeUsers.delete(userId);
}

export function startQuizSession(attemptId: string, userId: string): void {
  activeQuizSessions.set(attemptId, { attemptId, userId, startedAt: Date.now() });
  addLiveEvent(`User started quiz session`, "quiz");
}

export function endQuizSession(attemptId: string): void {
  activeQuizSessions.delete(attemptId);
}

export function startAiRequest(id: string, feature: string, userId: string | null): void {
  activeAiRequests.set(id, { feature, userId, startedAt: Date.now() });
}

export function endAiRequest(id: string): void {
  activeAiRequests.delete(id);
}

export function addLiveEvent(message: string, type: string = "info"): void {
  liveEventLog.unshift({ timestamp: Date.now(), message, type });
  if (liveEventLog.length > MAX_LIVE_EVENTS) {
    liveEventLog.length = MAX_LIVE_EVENTS;
  }
}

export function getRealTimeMetrics() {
  const now = Date.now();
  const cutoff = now - HEARTBEAT_TTL_MS;

  for (const [id, user] of activeUsers) {
    if (user.lastHeartbeat < cutoff) activeUsers.delete(id);
  }
  for (const [id, session] of activeQuizSessions) {
    if (now - session.startedAt > 3600_000) activeQuizSessions.delete(id);
  }
  for (const [id, req] of activeAiRequests) {
    if (now - req.startedAt > 300_000) activeAiRequests.delete(id);
  }

  return {
    onlineUsers: Array.from(activeUsers.values()).map((u) => ({
      userId: u.userId,
      name: u.name,
      email: u.email,
      currentPage: u.currentPage,
      lastHeartbeat: u.lastHeartbeat,
    })),
    onlineCount: activeUsers.size,
    activeQuizSessions: Array.from(activeQuizSessions.values()),
    activeQuizCount: activeQuizSessions.size,
    activeAiRequests: Array.from(activeAiRequests.values()),
    activeAiRequestCount: activeAiRequests.size,
    liveEvents: liveEventLog.slice(0, 20),
  };
}

export function cleanupStaleEntries(): void {
  const cutoff = Date.now() - HEARTBEAT_TTL_MS;
  for (const [id, user] of activeUsers) {
    if (user.lastHeartbeat < cutoff) activeUsers.delete(id);
  }
}
