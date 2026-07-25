/**
 * 管理员管理路由
 * - GET    /api/admin/users          获取管理员列表（super only）
 * - POST   /api/admin/users          创建管理员（super only）
 * - PUT    /api/admin/users/:id      更新管理员（super only）
 * - DELETE /api/admin/users/:id      删除管理员（super only）
 * - GET    /api/admin/logs           获取操作日志
 * - GET    /api/admin/events         获取学习事件
 * - POST   /api/admin/questions      上传/更新题库（super only）
 * - GET    /api/admin/questions      获取题库列表
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";
import { authenticate, requireAdmin, requireSuper } from "../middleware/auth";
import { logAdminAction } from "../lib/logger";

export const adminRouter = Router();

// ═══ 管理员用户管理 ═══

adminRouter.get("/users", authenticate, requireSuper, async (_req, res, next) => {
  try {
    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    res.json({ admins });
  } catch (err) {
    next(err);
  }
});

const createAdminSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(6, "密码至少 6 位"),
  role: z.enum(["super", "viewer"]),
});

adminRouter.post("/users", authenticate, requireSuper, async (req, res, next) => {
  try {
    const data = createAdminSchema.parse(req.body);
    const passwordHash = await hashPassword(data.password);

    const admin = await prisma.adminUser.create({
      data: {
        name: data.name,
        username: data.username,
        passwordHash,
        role: data.role,
        status: "active",
      },
    });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: `创建管理员 (${data.role === "super" ? "超级" : "只读"})`,
      targetType: "admin",
      targetId: admin.id,
      targetName: admin.name,
    });

    res.status(201).json({
      admin: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

const updateAdminSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["super", "viewer"]).optional(),
  status: z.enum(["active", "disabled"]).optional(),
});

adminRouter.put("/users/:id", authenticate, requireSuper, async (req, res, next) => {
  try {
    const data = updateAdminSchema.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (data.name) updates.name = data.name;
    if (data.username) updates.username = data.username;
    if (data.role) updates.role = data.role;
    if (data.status) updates.status = data.status;
    if (data.password) updates.passwordHash = await hashPassword(data.password);

    const admin = await prisma.adminUser.update({
      where: { id: req.params.id },
      data: updates,
    });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: data.password ? "更新管理员信息并重置密码" : "更新管理员信息",
      targetType: "admin",
      targetId: admin.id,
      targetName: admin.name,
    });

    res.json({
      admin: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/users/:id", authenticate, requireSuper, async (req, res, next) => {
  try {
    // 不允许删除自己
    if (req.params.id === req.user!.userId) {
      return res.status(400).json({ error: "不能删除自己的账号" });
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!admin) return res.status(404).json({ error: "管理员不存在" });

    await prisma.adminUser.delete({ where: { id: req.params.id } });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: "删除管理员",
      targetType: "admin",
      targetId: admin.id,
      targetName: admin.name,
    });

    res.json({ message: "管理员已删除" });
  } catch (err) {
    next(err);
  }
});

// ═══ 操作日志 ═══

adminRouter.get("/logs", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = "1", pageSize = "50", targetType, adminId } = req.query;

    const where: Record<string, unknown> = {};
    if (targetType) where.targetType = targetType;
    if (adminId) where.adminId = adminId;

    const total = await prisma.adminOperationLog.count({ where });
    const logs = await prisma.adminOperationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
    });

    res.json({
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      logs,
    });
  } catch (err) {
    next(err);
  }
});

// ═══ 学习事件 ═══

adminRouter.get("/events", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = "1", pageSize = "50", userId, eventType } = req.query;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (eventType) where.eventType = eventType;

    const total = await prisma.learningEvent.count({ where });
    const events = await prisma.learningEvent.findMany({
      where,
      include: {
        user: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
    });

    res.json({
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      events: events.map((e) => ({
        id: e.id,
        userId: e.userId,
        userName: e.user.name,
        userPhone: e.user.phone,
        eventType: e.eventType,
        stageId: e.stageId,
        result: e.result,
        createdAt: e.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ═══ 题库管理 ═══

adminRouter.get("/questions", authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const banks = await prisma.questionBank.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        version: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ banks });
  } catch (err) {
    next(err);
  }
});

const uploadQuestionsSchema = z.object({
  version: z.string().min(1),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      category: z.string(),
      explanation: z.string(),
    }),
  ),
  activate: z.boolean().default(true),
});

adminRouter.post("/questions", authenticate, requireSuper, async (req, res, next) => {
  try {
    const data = uploadQuestionsSchema.parse(req.body);

    // 如果设为激活，先停用其他版本
    if (data.activate) {
      await prisma.questionBank.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const bank = await prisma.questionBank.create({
      data: {
        version: data.version,
        questions: data.questions as any,
        isActive: data.activate,
      },
    });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: `上传题库 ${data.version}（${data.questions.length} 题）`,
      targetType: "system",
      targetId: bank.id,
      targetName: data.version,
    });

    res.status(201).json({
      bank: {
        id: bank.id,
        version: bank.version,
        isActive: bank.isActive,
        questionCount: data.questions.length,
      },
    });
  } catch (err) {
    next(err);
  }
});
