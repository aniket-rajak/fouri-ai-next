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

export async function getUserCredits(uid: string) {
  const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const lastReset = new Date(user.lastResetDate);
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

  if (hoursSinceReset >= 24) {
    await prisma.user.update({
      where: { firebaseUid: uid },
      data: { usedCredits: 0, lastResetDate: now },
    });
    return {
      dailyCredits: user.dailyCredits,
      usedCredits: 0,
      remaining: user.dailyCredits,
      resetsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  return {
    dailyCredits: user.dailyCredits,
    usedCredits: user.usedCredits,
    remaining: Math.max(0, user.dailyCredits - user.usedCredits),
    resetsAt: new Date(lastReset.getTime() + 24 * 60 * 60 * 1000).toISOString(),
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

export async function deductCredits(uid: string, amount: number) {
  const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const lastReset = new Date(user.lastResetDate);
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

  let usedCredits = user.usedCredits;
  if (hoursSinceReset >= 24) {
    usedCredits = 0;
  }

  const remaining = user.dailyCredits - usedCredits;
  if (amount > remaining) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  const updated = await prisma.user.update({
    where: { firebaseUid: uid },
    data: {
      usedCredits: usedCredits + amount,
      lastResetDate: now,
    },
  });

  return {
    usedCredits: updated.usedCredits,
    remaining: updated.dailyCredits - updated.usedCredits,
  };
}
