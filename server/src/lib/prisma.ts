/**
 * Prisma Client 单例
 * 确保整个应用只创建一个 PrismaClient 实例
 * 包含 Supabase free tier 连接优化
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// 创建或复用 Prisma 客户端
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * 带重试的数据库操作包装器
 * Supabase free tier 连接池可能因闲置而断开，需要自动重试
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 2000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const isConnectionError =
        error instanceof Error &&
        (error.message.includes("Can't reach database") ||
          error.message.includes("Connection terminated") ||
          error.message.includes("Connection timed out") ||
          error.message.includes("ECONNRESET") ||
          error.message.includes("ETIMEDOUT"));

      if (isConnectionError && attempt < maxRetries) {
        console.warn(
          `[DB Retry] 第 ${attempt}/${maxRetries} 次重试 (${delayMs}ms 后)...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 1.5; // 指数退避
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
