import { prisma } from "../lib/prisma.js";

const DAILY_CREDIT_LIMIT = 100;
const TOKENS_PER_CREDIT = 2500;
const CHARS_PER_BYTE = 0.1;
const MODE_MULTIPLIERS = {
  basic: 0.4,
  standard: 0.7,
  full: 1.0,
} as const;

export type AnalysisMode = keyof typeof MODE_MULTIPLIERS;

function isNewCalendarDay(lastReset: Date, now: Date): boolean {
  return (
    now.getFullYear() > lastReset.getFullYear() ||
    now.getMonth() > lastReset.getMonth() ||
    now.getDate() > lastReset.getDate()
  );
}

function midnightAfter(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0);
}

export async function getUserCredits(uid: string) {
  const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
  if (!user) throw new Error("User not found");

  const dailyCredits = user.dailyCredits ?? 100;
  const usedCredits = user.usedCredits ?? 0;
  const now = new Date();
  const lastReset = new Date(user.lastResetDate);

  if (isNewCalendarDay(lastReset, now)) {
    await prisma.user.update({
      where: { firebaseUid: uid },
      data: { usedCredits: 0, lastResetDate: now },
    });
    return {
      dailyCredits,
      usedCredits: 0,
      remaining: dailyCredits,
      resetsAt: midnightAfter(now).toISOString(),
    };
  }

  return {
    dailyCredits,
    usedCredits,
    remaining: Math.max(0, dailyCredits - usedCredits),
    resetsAt: midnightAfter(lastReset).toISOString(),
  };
}

export function estimateTokens(fileSize: number, mode: AnalysisMode = "full"): number {
  const chars = fileSize * CHARS_PER_BYTE;
  const tokens = Math.round(chars / 4);
  return Math.max(1, Math.round(tokens * MODE_MULTIPLIERS[mode]));
}

export function estimateRequiredCredits(fileSize: number, mode: AnalysisMode = "full"): number {
  const tokens = estimateTokens(fileSize, mode);
  return Math.max(1, Math.ceil(tokens / TOKENS_PER_CREDIT));
}

const ANALYSIS_REPORT_BASE_COST = 5;
const ANALYSIS_REPORT_PER_10_QUESTIONS = 1;

export function estimateAnalysisReportCost(questionCount: number): number {
  return ANALYSIS_REPORT_BASE_COST + Math.ceil(questionCount / 10) * ANALYSIS_REPORT_PER_10_QUESTIONS;
}

const QUIZ_BASE_INSTRUCTION_TOKENS = 350;
const QUIZ_SUBJECT_CHARS_PER_TOKEN = 50;
const QUIZ_DIFFICULTY_INSTRUCTION_EXTRA: Record<string, number> = {
  EASY: 0,
  MEDIUM: 150,
  HARD: 350,
};
const QUIZ_DIFFICULTY_OUTPUT_TOKENS: Record<string, number> = {
  EASY: 2500,
  MEDIUM: 3500,
  HARD: 4500,
};

export function estimateQuizCredits(subject: string, topic: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD') {
  const subjectLength = Math.ceil((subject.length + topic.length) / QUIZ_SUBJECT_CHARS_PER_TOKEN) * QUIZ_SUBJECT_CHARS_PER_TOKEN;
  const promptTokens = QUIZ_BASE_INSTRUCTION_TOKENS + subjectLength + (QUIZ_DIFFICULTY_INSTRUCTION_EXTRA[difficulty] || 0);
  const outputTokens = QUIZ_DIFFICULTY_OUTPUT_TOKENS[difficulty] || 3500;
  const totalTokens = promptTokens + outputTokens;
  const estimatedCredits = Math.max(1, Math.ceil(totalTokens / TOKENS_PER_CREDIT));

  return {
    estimatedCredits,
    breakdown: { promptTokens, outputTokens, totalTokens },
  };
}

export function calculateActualCredits(actualTokens: number): number {
  return Math.max(1, Math.ceil(actualTokens / TOKENS_PER_CREDIT));
}

export async function deductCredits(uid: string, amount: number) {
  const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
  if (!user) throw new Error("User not found");

  const dailyCredits = user.dailyCredits ?? 100;
  const now = new Date();
  const lastReset = new Date(user.lastResetDate);

  let usedCredits = user.usedCredits ?? 0;
  const resetDue = isNewCalendarDay(lastReset, now);
  if (resetDue) {
    usedCredits = 0;
  }

  const remaining = dailyCredits - usedCredits;
  if (amount > remaining) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  const updated = await prisma.user.update({
    where: { firebaseUid: uid },
    data: {
      usedCredits: usedCredits + amount,
      lastResetDate: resetDue ? now : undefined,
    },
  });

  return {
    usedCredits: updated.usedCredits,
    remaining: updated.dailyCredits - updated.usedCredits,
  };
}
