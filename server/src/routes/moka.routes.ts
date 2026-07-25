/**
 * Moka 接口路由
 * - POST /api/moka/webhook   接收 Moka 新人入职 Webhook
 * - GET  /api/moka/sync-events  查看 Moka 同步事件（admin）
 *
 * Moka 接入流程：
 * 1. Moka 确认新人入职 → 调用本系统 Webhook
 * 2. Webhook 收到 employeeId → 调用 Moka 员工任职接口获取详细信息
 * 3. 将员工信息写入 users 表（dataSource = moka）
 * 4. 分配培训批次 → 初始化学习进度
 *
 * 注意：Moka API Key 和 RSA 私钥只存在服务端环境变量中
 */

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword, generateInitialPassword } from "../lib/auth";
import { authenticate, requireAdmin } from "../middleware/auth";
import { logAdminAction } from "../lib/logger";

export const mokaRouter = Router();

// ── 接收 Moka Webhook ──
mokaRouter.post("/webhook", async (req, res, next) => {
  try {
    // 验证 Webhook 签名（如果配置了 secret）
    const webhookSecret = process.env.MOKA_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers["x-moka-signature"] as string;
      if (!signature || signature !== webhookSecret) {
        return res.status(401).json({ error: "Webhook 签名验证失败" });
      }
    }

    const payload = req.body;
    const eventType = payload?.eventType || "employee_onboard";
    const mokaEmployeeId = payload?.employeeId || payload?.data?.employeeId;

    if (!mokaEmployeeId) {
      return res.status(400).json({ error: "缺少 employeeId" });
    }

    // 记录同步事件
    const syncEvent = await prisma.mokaSyncEvent.create({
      data: {
        eventType,
        mokaEmployeeId: String(mokaEmployeeId),
        payload: payload as any,
        status: "pending",
      },
    });

    // 尝试处理
    try {
      // 如果 payload 中已经包含完整的员工信息，直接写入
      const empData = payload?.data || payload;

      if (eventType === "employee_onboard" && empData?.name && empData?.phone) {
        // 检查是否已存在
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { mokaEmployeeId: String(mokaEmployeeId) },
              { phone: String(empData.phone) },
            ],
          },
        });

        if (existing) {
          // 更新信息
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: empData.name,
              phone: String(empData.phone),
              department: empData.department || existing.department,
              position: empData.position || existing.position,
              employeeNo: empData.employeeNo || existing.employeeNo,
              entryDate: empData.entryDate ? new Date(empData.entryDate) : existing.entryDate,
              mokaEmployeeId: String(mokaEmployeeId),
              dataSource: "moka",
            },
          });

          await prisma.mokaSyncEvent.update({
            where: { id: syncEvent.id },
            data: { status: "processed", processedAt: new Date() },
          });

          return res.json({ message: "员工信息已更新", syncEventId: syncEvent.id });
        }

        // 创建新员工
        const password = generateInitialPassword();
        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
          data: {
            name: empData.name,
            phone: String(empData.phone),
            employeeNo: empData.employeeNo || null,
            department: empData.department || null,
            position: empData.position || null,
            entryDate: empData.entryDate ? new Date(empData.entryDate) : new Date(),
            passwordHash,
            status: "active",
            dataSource: "moka",
            mokaEmployeeId: String(mokaEmployeeId),
          },
        });

        // 初始化进度
        await prisma.learningProgress.create({ data: { userId: user.id } });
        const stages = ["welcome", "company", "culture", "product", "rules", "certification"];
        await prisma.stageProgress.createMany({
          data: stages.map((stageId) => ({ userId: user.id, stageId })),
        });
        const games = ["rocketBoss", "valueMatch", "valueCatch", "quiz"];
        await prisma.gameProgress.createMany({
          data: games.map((gameKey) => ({ userId: user.id, gameKey })),
        });

        await prisma.mokaSyncEvent.update({
          where: { id: syncEvent.id },
          data: { status: "processed", processedAt: new Date() },
        });

        return res.status(201).json({
          message: "新员工已通过 Moka 自动创建",
          userId: user.id,
          syncEventId: syncEvent.id,
        });
      }

      // 如果 payload 不包含完整信息，标记为待处理
      // 后续可以通过调用 Moka API 获取详细信息
      await prisma.mokaSyncEvent.update({
        where: { id: syncEvent.id },
        data: {
          status: "failed",
          errorMessage: "Payload 缺少必要的员工信息，需要调用 Moka API 获取",
          processedAt: new Date(),
        },
      });

      res.status(202).json({
        message: "已收到 Webhook，但需要手动处理或配置 Moka API 调用",
        syncEventId: syncEvent.id,
      });
    } catch (processErr) {
      await prisma.mokaSyncEvent.update({
        where: { id: syncEvent.id },
        data: {
          status: "failed",
          errorMessage: processErr instanceof Error ? processErr.message : "处理失败",
          processedAt: new Date(),
        },
      });
      throw processErr;
    }
  } catch (err) {
    next(err);
  }
});

// ── 查看 Moka 同步事件 ──
mokaRouter.get("/sync-events", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = "1", pageSize = "50", status } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const total = await prisma.mokaSyncEvent.count({ where });
    const events = await prisma.mokaSyncEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
    });

    res.json({
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      events,
    });
  } catch (err) {
    next(err);
  }
});
