import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn"] : ["warn"],
  });

  process.on("SIGTERM", () => { void client.$disconnect(); });
  process.on("SIGINT", () => { void client.$disconnect(); });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const RETRYABLE_CODES = new Set(["P1000", "P1001", "P1002", "P1017"]);

const RETRYABLE_PATTERNS = [
  /Can't reach/i,
  /Connection refused/i,
  /database server/i,
  /ECONNREFUSED/i,
  /E57P01/i,
  /terminating connection/i,
  /administrator command/i,
  /connection .* (closed|reset|terminated)/i,
];

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; delay?: number },
): Promise<T> {
  let lastError: unknown;
  const retries = options?.retries ?? 3;
  const delay = options?.delay ?? 1500;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const code: string | undefined = error?.code;
      const message = error?.message ?? String(error ?? "");

      const isRetryable = code
        ? RETRYABLE_CODES.has(code) || RETRYABLE_PATTERNS.some((p) => p.test(message))
        : RETRYABLE_PATTERNS.some((p) => p.test(message));

      if (!isRetryable) throw error;

      console.warn(
        `[withRetry] ${code || "UNKNOWN"} on attempt ${attempt}/${retries}. Retrying in ${delay * attempt}ms...`,
      );
      await new Promise((r) => setTimeout(r, delay * attempt));
    }
  }

  throw lastError;
}
