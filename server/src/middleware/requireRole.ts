/**
 * 角色权限中间件
 * 要求请求已通过 authenticate 中间件
 */

import { Request, Response, NextFunction } from "express";

/** 要求管理员身份（super 或 viewer） */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "未认证" });
  }
  if (req.user.role !== "super" && req.user.role !== "viewer") {
    return res.status(403).json({ error: "需要管理员权限" });
  }
  next();
}

/** 要求超级管理员身份（super only） */
export function requireSuper(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "未认证" });
  }
  if (req.user.role !== "super") {
    return res.status(403).json({ error: "需要超级管理员权限" });
  }
  next();
}

/** 要求员工身份或管理员身份 */
export function requireEmployeeOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "未认证" });
  }
  next();
}
