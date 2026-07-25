/**
 * Dashboard 统计路由
 * - GET /api/dashboard/stats  获取仪表盘统计数据
 */

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";

export const dashboardRouter = Router();

const STAGE_LABELS: Record<string, string> = {
  welcome: "01 欢迎加入",
  company: "02 品牌起源",
  culture: "03 云游博物馆",
  product: "04 认识产品",
  rules: "05 制度闯关",
  certification: "06 入职认证",
};

dashboardRouter.get("/stats", authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const employees = await prisma.user.findMany({
      where: { status: "active" },
      include: { batch: true },
    });

    // 批量查询进度
    let learningCount = 0;
    let completedAllStages = 0;
    let certifiedCount = 0;
    let notStartedCount = 0;
    let overdueCount = 0;

    const stageDist: Record<string, { stageId: string; label: string; completed: number; inProgress: number; pending: number }> = {};
    for (const stageId of ["welcome", "company", "culture", "product", "rules", "certification"]) {
      stageDist[stageId] = { stageId, label: STAGE_LABELS[stageId], completed: 0, inProgress: 0, pending: 0 };
    }

    const attentionList: Array<{ employee: { id: string; name: string; phone: string; department: string | null }; reason: string; daysOverdue?: number }> = [];
    const now = new Date();

    for (const emp of employees) {
      const stages = await prisma.stageProgress.findMany({ where: { userId: emp.id } });
      const stageMap = new Map(stages.map((s) => [s.stageId, s]));
      const certs = await prisma.certificationAttempt.findMany({ where: { userId: emp.id } });
      const certPassed = certs.some((c) => c.passed);
      const progress = await prisma.learningProgress.findUnique({ where: { userId: emp.id } });

      const welcomeDone = stageMap.get("welcome")?.status === "completed";
      const companyDone = stageMap.get("company")?.status === "completed";
      const cultureDone = stageMap.get("culture")?.status === "completed";
      const productDone = stageMap.get("product")?.status === "completed";
      const rulesDone = stageMap.get("rules")?.status === "completed";
      const allFiveDone = welcomeDone && companyDone && cultureDone && productDone && rulesDone;

      let completedCount = 0;
      if (welcomeDone) completedCount++;
      if (companyDone) completedCount++;
      if (cultureDone) completedCount++;
      if (productDone) completedCount++;
      if (rulesDone) completedCount++;
      if (certPassed) completedCount++;

      if (completedCount === 0) {
        notStartedCount++;
      } else if (completedCount < 6 || !certPassed) {
        learningCount++;
      }

      if (allFiveDone) completedAllStages++;
      if (certPassed) certifiedCount++;

      // 关卡分布
      for (const stageId of ["welcome", "company", "culture", "product", "rules"]) {
        const status = stageMap.get(stageId)?.status ?? "pending";
        if (status === "completed") stageDist[stageId].completed++;
        else if (status === "in_progress") stageDist[stageId].inProgress++;
        else stageDist[stageId].pending++;
      }
      // certification
      if (certPassed) stageDist.certification.completed++;
      else if (certs.length > 0) stageDist.certification.inProgress++;
      else if (allFiveDone) stageDist.certification.inProgress++;
      else stageDist.certification.pending++;

      // 超期检查
      if (emp.batch && emp.batch.status === "active" && completedCount < 6) {
        const deadline = new Date(emp.batch.deadline);
        if (deadline < now) {
          const daysOverdue = Math.floor((now.getTime() - deadline.getTime()) / 86400000);
          overdueCount++;
          attentionList.push({
            employee: { id: emp.id, name: emp.name, phone: emp.phone, department: emp.department },
            reason: `培训已超期 ${daysOverdue} 天`,
            daysOverdue,
          });
        }
      }

      // 认证未通过
      if (certs.length > 0 && !certPassed) {
        attentionList.push({
          employee: { id: emp.id, name: emp.name, phone: emp.phone, department: emp.department },
          reason: "认证未通过，需关注",
        });
      }
    }

    res.json({
      totalEmployees: employees.length,
      learningCount,
      completedAllStages,
      certifiedCount,
      notStartedCount,
      overdueCount,
      stageDistribution: Object.values(stageDist),
      attentionList: attentionList.slice(0, 20),
    });
  } catch (err) {
    next(err);
  }
});
