/**
 * 员工管理路由
 * - GET    /api/employees          获取员工列表（支持筛选/分页）
 * - GET    /api/employees/:id      获取单个员工详情
 * - POST   /api/employees          新增员工（super only）
 * - PUT    /api/employees/:id      更新员工信息（super only）
 * - DELETE /api/employees/:id      删除员工（super only）
 * - POST   /api/employees/batch    批量新增员工（super only）
 * - POST   /api/employees/:id/reset-progress  重置员工进度（super only）
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, generateInitialPassword } from "../lib/auth";
import { authenticate, requireAdmin, requireSuper } from "../middleware/auth";
import { logAdminAction, logLearningEvent } from "../lib/logger";

export const employeeRouter = Router();

// ── 获取员工列表 ──
employeeRouter.get("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { search, batchId, status, page = "1", pageSize = "50" } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (batchId) where.batchId = batchId;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { phone: { contains: search as string } },
        { employeeNo: { contains: search as string } },
      ];
    }

    const total = await prisma.user.count({ where });
    const employees = await prisma.user.findMany({
      where,
      include: { batch: true },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
    });

    res.json({
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        employeeNo: e.employeeNo,
        phone: e.phone,
        department: e.department,
        position: e.position,
        entryDate: e.entryDate,
        batchId: e.batchId,
        batchName: e.batch?.name ?? null,
        status: e.status,
        dataSource: e.dataSource,
        mokaEmployeeId: e.mokaEmployeeId,
        lastLoginAt: e.lastLoginAt,
        createdAt: e.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── 获取单个员工详情 ──
employeeRouter.get("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { batch: true },
    });
    if (!employee) return res.status(404).json({ error: "员工不存在" });

    res.json({
      id: employee.id,
      name: employee.name,
      employeeNo: employee.employeeNo,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      entryDate: employee.entryDate,
      batchId: employee.batchId,
      batchName: employee.batch?.name ?? null,
      status: employee.status,
      dataSource: employee.dataSource,
      mokaEmployeeId: employee.mokaEmployeeId,
      lastLoginAt: employee.lastLoginAt,
      createdAt: employee.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// ── 新增员工 ──
const createEmployeeSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  phone: z.string().min(1, "手机号不能为空"),
  employeeNo: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  entryDate: z.string().optional(),
  batchId: z.string().optional(),
  initialPassword: z.string().optional(), // 不传则自动生成
});

employeeRouter.post("/", authenticate, requireSuper, async (req, res, next) => {
  try {
    const data = createEmployeeSchema.parse(req.body);
    const password = data.initialPassword || generateInitialPassword();
    const passwordHash = await hashPassword(password);

    const employee = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        employeeNo: data.employeeNo || null,
        department: data.department || null,
        position: data.position || null,
        entryDate: data.entryDate ? new Date(data.entryDate) : null,
        batchId: data.batchId || null,
        passwordHash,
        status: "active",
        dataSource: "manual",
      },
      include: { batch: true },
    });

    // 初始化学习进度
    await prisma.learningProgress.create({
      data: { userId: employee.id },
    });

    // 初始化六关进度
    const stages = ["welcome", "company", "culture", "product", "rules", "certification"];
    await prisma.stageProgress.createMany({
      data: stages.map((stageId) => ({ userId: employee.id, stageId })),
    });

    // 初始化四个游戏进度
    const games = ["rocketBoss", "valueMatch", "valueCatch", "quiz"];
    await prisma.gameProgress.createMany({
      data: games.map((gameKey) => ({ userId: employee.id, gameKey })),
    });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: "新增员工",
      targetType: "employee",
      targetId: employee.id,
      targetName: employee.name,
      details: `手机号: ${employee.phone}, 初始密码: ${password}`,
    });

    res.status(201).json({
      employee: {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        employeeNo: employee.employeeNo,
        department: employee.department,
        position: employee.position,
        entryDate: employee.entryDate,
        batchId: employee.batchId,
        status: employee.status,
      },
      initialPassword: password,
    });
  } catch (err) {
    next(err);
  }
});

// ── 更新员工信息 ──
const updateEmployeeSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  employeeNo: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  entryDate: z.string().optional(),
  batchId: z.string().nullable().optional(),
  status: z.enum(["active", "disabled"]).optional(),
  resetPassword: z.string().optional(), // 传则重置密码
});

employeeRouter.put("/:id", authenticate, requireSuper, async (req, res, next) => {
  try {
    const data = updateEmployeeSchema.parse(req.body);
    const employeeId = req.params.id;

    const existing = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!existing) return res.status(404).json({ error: "员工不存在" });

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.employeeNo !== undefined) updates.employeeNo = data.employeeNo;
    if (data.department !== undefined) updates.department = data.department;
    if (data.position !== undefined) updates.position = data.position;
    if (data.entryDate !== undefined) updates.entryDate = data.entryDate ? new Date(data.entryDate) : null;
    if (data.batchId !== undefined) updates.batchId = data.batchId;
    if (data.status !== undefined) updates.status = data.status;

    let newPassword: string | undefined;
    if (data.resetPassword) {
      newPassword = data.resetPassword;
      updates.passwordHash = await hashPassword(newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: employeeId },
      data: updates,
    });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: newPassword ? "更新员工信息并重置密码" : "更新员工信息",
      targetType: "employee",
      targetId: employeeId,
      targetName: updated.name,
      details: newPassword ? `新密码: ${newPassword}` : undefined,
    });

    res.json({
      employee: {
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        employeeNo: updated.employeeNo,
        department: updated.department,
        position: updated.position,
        entryDate: updated.entryDate,
        batchId: updated.batchId,
        status: updated.status,
      },
      ...(newPassword ? { newPassword } : {}),
    });
  } catch (err) {
    next(err);
  }
});

// ── 删除员工 ──
employeeRouter.delete("/:id", authenticate, requireSuper, async (req, res, next) => {
  try {
    const employee = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!employee) return res.status(404).json({ error: "员工不存在" });

    // 级联删除会自动清理 progress, stages, games, certifications, events
    await prisma.user.delete({ where: { id: req.params.id } });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: "删除员工",
      targetType: "employee",
      targetId: employee.id,
      targetName: employee.name,
    });

    res.json({ message: "员工已删除" });
  } catch (err) {
    next(err);
  }
});

// ── 批量新增员工 ──
const batchCreateSchema = z.object({
  employees: z.array(
    z.object({
      name: z.string().min(1),
      phone: z.string().min(1),
      employeeNo: z.string().optional(),
      department: z.string().optional(),
      position: z.string().optional(),
      entryDate: z.string().optional(),
    }),
  ),
  batchId: z.string().optional(),
});

employeeRouter.post("/batch", authenticate, requireSuper, async (req, res, next) => {
  try {
    const { employees: empList, batchId } = batchCreateSchema.parse(req.body);

    const results: Array<{ name: string; phone: string; password: string; success: boolean; error?: string }> = [];

    for (const emp of empList) {
      try {
        const password = generateInitialPassword();
        const passwordHash = await hashPassword(password);

        const created = await prisma.user.create({
          data: {
            name: emp.name,
            phone: emp.phone,
            employeeNo: emp.employeeNo || null,
            department: emp.department || null,
            position: emp.position || null,
            entryDate: emp.entryDate ? new Date(emp.entryDate) : null,
            batchId: batchId || null,
            passwordHash,
            status: "active",
            dataSource: "manual",
          },
        });

        // 初始化进度
        await prisma.learningProgress.create({ data: { userId: created.id } });
        const stages = ["welcome", "company", "culture", "product", "rules", "certification"];
        await prisma.stageProgress.createMany({
          data: stages.map((stageId) => ({ userId: created.id, stageId })),
        });
        const games = ["rocketBoss", "valueMatch", "valueCatch", "quiz"];
        await prisma.gameProgress.createMany({
          data: games.map((gameKey) => ({ userId: created.id, gameKey })),
        });

        results.push({ name: emp.name, phone: emp.phone, password, success: true });
      } catch (err) {
        results.push({
          name: emp.name,
          phone: emp.phone,
          password: "",
          success: false,
          error: err instanceof Error ? err.message : "创建失败",
        });
      }
    }

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: `批量新增 ${empList.length} 名员工`,
      targetType: "employee",
      targetId: batchId || "batch",
      details: `成功 ${results.filter((r) => r.success).length} / ${results.length}`,
    });

    res.status(201).json({ results });
  } catch (err) {
    next(err);
  }
});

// ── 重置员工进度 ──
employeeRouter.post("/:id/reset-progress", authenticate, requireSuper, async (req, res, next) => {
  try {
    const employee = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!employee) return res.status(404).json({ error: "员工不存在" });

    // 重置学习进度总表
    await prisma.learningProgress.upsert({
      where: { userId: employee.id },
      update: {
        currentStage: "welcome",
        lastSection: null,
        learningWorldUnlocked: false,
        lastVisitedAt: null,
      },
      create: { userId: employee.id },
    });

    // 重置所有关卡进度
    const stages = ["welcome", "company", "culture", "product", "rules", "certification"];
    for (const stageId of stages) {
      await prisma.stageProgress.upsert({
        where: { userId_stageId: { userId: employee.id, stageId } },
        update: { status: "pending", completedExhibits: [], completedAt: null },
        create: { userId: employee.id, stageId },
      });
    }

    // 重置所有游戏进度
    const games = ["rocketBoss", "valueMatch", "valueCatch", "quiz"];
    for (const gameKey of games) {
      await prisma.gameProgress.upsert({
        where: { userId_gameKey: { userId: employee.id, gameKey } },
        update: { completed: false, gameData: undefined, completedAt: null },
        create: { userId: employee.id, gameKey },
      });
    }

    // 删除所有认证记录
    await prisma.certificationAttempt.deleteMany({ where: { userId: employee.id } });

    await logAdminAction({
      adminId: req.user!.userId,
      adminName: req.user!.name,
      action: "重置员工全部进度",
      targetType: "employee",
      targetId: employee.id,
      targetName: employee.name,
    });

    await logLearningEvent({
      userId: employee.id,
      eventType: "admin_reset",
      result: `管理员 ${req.user!.name} 重置了全部进度`,
    });

    res.json({ message: "员工进度已重置" });
  } catch (err) {
    next(err);
  }
});
