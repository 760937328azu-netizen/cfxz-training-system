/**
 * 数据导出路由
 * - GET /api/export/employees    导出员工进度 CSV
 * - GET /api/export/progress/:userId  导出单个员工详细进度 JSON
 */

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";

export const exportRouter = Router();

// ── 导出员工进度 CSV ──
exportRouter.get("/employees", authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const employees = await prisma.user.findMany({
      include: { batch: true },
      orderBy: { createdAt: "desc" },
    });

    // 批量获取所有员工的进度
    const stageProgressMap = new Map<string, Map<string, { status: string; completedAt: Date | null }>>();
    const certMap = new Map<string, { bestScore: number; passed: boolean; attempts: number }>();
    const progressMap = new Map<string, { lastVisitedAt: Date | null; currentStage: string }>();

    for (const emp of employees) {
      const stages = await prisma.stageProgress.findMany({ where: { userId: emp.id } });
      const stageMap = new Map<string, { status: string; completedAt: Date | null }>();
      for (const s of stages) {
        stageMap.set(s.stageId, { status: s.status, completedAt: s.completedAt });
      }
      stageProgressMap.set(emp.id, stageMap);

      const certs = await prisma.certificationAttempt.findMany({ where: { userId: emp.id } });
      certMap.set(emp.id, {
        bestScore: certs.reduce((max, c) => Math.max(max, c.score), 0),
        passed: certs.some((c) => c.passed),
        attempts: certs.length,
      });

      const progress = await prisma.learningProgress.findUnique({ where: { userId: emp.id } });
      if (progress) {
        progressMap.set(emp.id, { lastVisitedAt: progress.lastVisitedAt, currentStage: progress.currentStage });
      }
    }

    const stageLabels: Record<string, string> = {
      welcome: "01 欢迎加入",
      company: "02 品牌起源",
      culture: "03 云游博物馆",
      product: "04 认识产品",
      rules: "05 制度闯关",
      certification: "06 入职认证",
    };

    const headers = [
      "姓名", "工号", "手机号", "部门", "岗位", "入职日期",
      "培训批次", "当前关卡", "整体进度(%)", "认证状态", "认证最高分", "认证次数",
      "最后学习时间", "账号状态", "数据来源",
    ];

    const rows = employees.map((emp) => {
      const stageMap = stageProgressMap.get(emp.id);
      const cert = certMap.get(emp.id);
      const progress = progressMap.get(emp.id);

      const completedCount = ["welcome", "company", "culture", "product", "rules"].filter(
        (s) => stageMap?.get(s)?.status === "completed",
      ).length + (cert?.passed ? 1 : 0);

      const overallPercent = Math.round((completedCount / 6) * 100);

      let currentStageLabel = "未开始";
      if (progress?.currentStage === "completed") {
        currentStageLabel = "已全部完成";
      } else if (progress?.currentStage && stageLabels[progress.currentStage]) {
        currentStageLabel = stageLabels[progress.currentStage];
      }

      const certStatus = cert?.passed
        ? "已通过"
        : cert && cert.attempts > 0
          ? "未通过"
          : completedCount >= 5
            ? "待认证"
            : "未解锁";

      return [
        emp.name,
        emp.employeeNo || "",
        emp.phone,
        emp.department || "",
        emp.position || "",
        emp.entryDate ? emp.entryDate.toISOString().split("T")[0] : "",
        emp.batch?.name || "未分配",
        currentStageLabel,
        overallPercent.toString(),
        certStatus,
        cert ? cert.bestScore.toString() : "0",
        cert ? cert.attempts.toString() : "0",
        progress?.lastVisitedAt
          ? new Date(progress.lastVisitedAt).toLocaleString("zh-CN")
          : "无记录",
        emp.status === "active" ? "正常" : "已停用",
        emp.dataSource === "moka" ? "Moka同步" : "手动录入",
      ];
    });

    // 生成 CSV（带 BOM 支持 Excel 中文）
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const bomCsv = "\uFEFF" + csv;
    const filename = encodeURIComponent(`员工培训进度_${new Date().toISOString().split("T")[0]}.csv`);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
    res.send(bomCsv);
  } catch (err) {
    next(err);
  }
});

// ── 导出单个员工详细进度 JSON ──
exportRouter.get("/progress/:userId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { batch: true },
    });
    if (!user) return res.status(404).json({ error: "员工不存在" });

    const [progress, stages, games, certs, events] = await Promise.all([
      prisma.learningProgress.findUnique({ where: { userId } }),
      prisma.stageProgress.findMany({ where: { userId } }),
      prisma.gameProgress.findMany({ where: { userId } }),
      prisma.certificationAttempt.findMany({ where: { userId }, orderBy: { submittedAt: "desc" } }),
      prisma.learningEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);

    res.json({
      employee: {
        name: user.name,
        phone: user.phone,
        employeeNo: user.employeeNo,
        department: user.department,
        position: user.position,
        entryDate: user.entryDate,
        batchName: user.batch?.name ?? null,
        status: user.status,
      },
      progress,
      stages,
      games,
      certifications: certs,
      events,
    });
  } catch (err) {
    next(err);
  }
});
