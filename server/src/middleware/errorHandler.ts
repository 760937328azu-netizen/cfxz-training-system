/**
 * 全局错误处理中间件
 * 生产环境不暴露内部错误堆栈
 */

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

const isProduction = process.env.NODE_ENV === "production";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error("[ERROR]", err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "参数校验失败",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  if (err instanceof Error) {
    // Prisma 已知错误（这些消息是安全的，可以返回给客户端）
    if (err.message.includes("Unique constraint")) {
      return res.status(409).json({ error: "数据冲突：该记录已存在" });
    }
    if (err.message.includes("Foreign key")) {
      return res.status(400).json({ error: "关联数据不存在" });
    }

    // 生产环境：只返回通用错误消息，不暴露内部细节
    if (isProduction) {
      return res.status(500).json({ error: "服务器内部错误，请稍后重试" });
    }
    // 开发环境：返回完整错误信息便于调试
    return res.status(500).json({ error: err.message });
  }

  return res.status(500).json({ error: "服务器内部错误" });
}
