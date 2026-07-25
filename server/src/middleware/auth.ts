/**
 * 认证中间件
 * 从 Authorization: Bearer <token> 头中解析 JWT
 */

import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../lib/auth";

// 扩展 Request 类型，添加 user 字段
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** 从请求头解析 JWT，将用户信息挂载到 req.user */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未提供认证令牌" });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "认证令牌无效或已过期" });
  }

  req.user = payload;
  next();
}

/** 可选认证：有 token 就解析，没有也放行 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
}

// 重新导出角色权限中间件，方便统一引用
export { requireAdmin, requireSuper, requireEmployeeOrAdmin } from "./requireRole";
