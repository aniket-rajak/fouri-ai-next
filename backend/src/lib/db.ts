import { prisma } from "./prisma.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function isConnectionTerminated(error: unknown): boolean {
  if (error && typeof error === "object") {
    const msg = String((error as any).message || "");
    return msg.includes("terminating connection") || msg.includes("E57P01");
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function db<T>(query: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await query();
    } catch (error) {
      if (isConnectionTerminated(error) && attempt < retries) {
        await delay(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unexpected: retry loop exited without returning or throwing");
}
