/**
 * 培训批次路由
 * - GET    /api/batches       获取批次列表
 * - POST   /api/batches       创建批次（super only）
 * - PUT    /api/batches/:id   更新批次（super only）
 * - DELETE /api/batches/:id   删除批次（super only）
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin, requireSuper } from "../middleware/auth";
import { logAdminAction } from "../lib/logger";

export const batchRouter = Router();

// ── 获取批次列表 ──
batchRouter.get("/", authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const batches = await prisma.trainingBatch.findMany({
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      batches: batches.map((b) => ({
        id: b.id,
        name: b.name,
        startDate: b.startDate,
        deadline: b.deadline,
        status: b.status,
        employeeCount: b._count.employees,
        createdAt: b.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── 创建批次 ──
const createBatchSchema = z.object({
  name: z.string().min(1, "批次名称不能为空"),
  startDate: z.string(),
  deadline: z.string(),
});

batchRouter.post("/", authenticate, requireSuper, async (req, res, next) => {
  try {
    const data = createBatchSchema.parse(req.body);

    const batch = await prisma.trainingBatch.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        deadline: new Date(data.deadline),
        status: "active",
      },
    });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: "创建培训批次",
      targetType: "batch",
      targetId: batch.id,
      targetName: batch.name,
    });

    res.status(201).json({ batch });
  } catch (err) {
    next(err);
  }
});

// ── 更新批次 ──
const updateBatchSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(["active", "closed"]).optional(),
});

batchRouter.put("/:id", authenticate, requireSuper, async (req, res, next) => {
  try {
    const data = updateBatchSchema.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (data.name) updates.name = data.name;
    if (data.startDate) updates.startDate = new Date(data.startDate);
    if (data.deadline) updates.deadline = new Date(data.deadline);
    if (data.status) updates.status = data.status;

    const batch = await prisma.trainingBatch.update({
      where: { id: req.params.id },
      data: updates,
    });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: "更新培训批次",
      targetType: "batch",
      targetId: batch.id,
      targetName: batch.name,
    });

    res.json({ batch });
  } catch (err) {
    next(err);
  }
});

// ── 删除批次 ──
batchRouter.delete("/:id", authenticate, requireSuper, async (req, res, next) => {
  try {
    const batch = await prisma.trainingBatch.findUnique({ where: { id: req.params.id } });
    if (!batch) return res.status(404).json({ error: "批次不存在" });

    // 解除员工关联
    await prisma.user.updateMany({
      where: { batchId: batch.id },
      data: { batchId: null },
    });

    await prisma.trainingBatch.delete({ where: { id: req.params.id } });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: "删除培训批次",
      targetType: "batch",
      targetId: batch.id,
      targetName: batch.name,
    });

    res.json({ message: "批次已删除" });
  } catch (err) {
    next(err);
  }
});
