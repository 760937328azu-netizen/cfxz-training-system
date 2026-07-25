/**
 * 认证路由
 * - POST /api/auth/employee/login  员工登录（手机号 + 密码）
 * - POST /api/auth/admin/login     管理员登录（用户名 + 密码）
 * - GET  /api/auth/me              获取当前登录用户信息
 * - POST /api/auth/change-password 修改密码
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, signToken } from "../lib/auth";
import { authenticate } from "../middleware/auth";
import { logLearningEvent } from "../lib/logger";
import { loginLimiter } from "../middleware/rateLimiter";

export const authRouter = Router();

// 登录接口应用限流：防止暴力破解
authRouter.use("/employee/login", loginLimiter);
authRouter.use("/admin/login", loginLimiter);

// ── 员工登录 ──
const employeeLoginSchema = z.object({
  phone: z.string().min(1, "手机号不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

authRouter.post("/employee/login", async (req, res, next) => {
  try {
    const { phone, password } = employeeLoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { batch: true },
    });

    if (!user) {
      return res.status(401).json({ error: "手机号或密码错误" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ error: "账号已停用，请联系管理员" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "手机号或密码错误" });
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 记录登录事件
    await logLearningEvent({
      userId: user.id,
      eventType: "login",
      result: "员工登录",
    });

    const token = signToken({
      userId: user.id,
      role: "employee",
      name: user.name,
      username: user.phone,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        department: user.department,
        position: user.position,
        employeeNo: user.employeeNo,
        batchId: user.batchId,
        batchName: user.batch?.name ?? null,
        entryDate: user.entryDate,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── 管理员登录 ──
const adminLoginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

authRouter.post("/admin/login", async (req, res, next) => {
  try {
    const { username, password } = adminLoginSchema.parse(req.body);

    const admin = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (!admin) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    if (admin.status !== "active") {
      return res.status(403).json({ error: "账号已停用" });
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({
      userId: admin.id,
      role: admin.role,
      name: admin.name,
      username: admin.username,
    });

    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── 获取当前用户信息 ──
authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "未认证" });

    if (req.user.role === "employee") {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { batch: true },
      });
      if (!user) return res.status(404).json({ error: "用户不存在" });

      res.json({
        role: "employee",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          department: user.department,
          position: user.position,
          employeeNo: user.employeeNo,
          batchId: user.batchId,
          batchName: user.batch?.name ?? null,
          entryDate: user.entryDate,
        },
      });
    } else {
      const admin = await prisma.adminUser.findUnique({
        where: { id: req.user.userId },
      });
      if (!admin) return res.status(404).json({ error: "管理员不存在" });

      res.json({
        role: admin.role,
        admin: {
          id: admin.id,
          name: admin.name,
          username: admin.username,
          role: admin.role,
        },
      });
    }
  } catch (err) {
    next(err);
  }
});

// ── 修改密码 ──
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6, "新密码至少 6 位"),
});

authRouter.post("/change-password", authenticate, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
    if (!req.user) return res.status(401).json({ error: "未认证" });

    if (req.user.role === "employee") {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!user) return res.status(404).json({ error: "用户不存在" });

      const valid = await verifyPassword(oldPassword, user.passwordHash);
      if (!valid) return res.status(400).json({ error: "原密码错误" });

      const newHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    } else {
      const admin = await prisma.adminUser.findUnique({ where: { id: req.user.userId } });
      if (!admin) return res.status(404).json({ error: "管理员不存在" });

      const valid = await verifyPassword(oldPassword, admin.passwordHash);
      if (!valid) return res.status(400).json({ error: "原密码错误" });

      const newHash = await hashPassword(newPassword);
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash: newHash },
      });
    }

    res.json({ message: "密码修改成功" });
  } catch (err) {
    next(err);
  }
});
