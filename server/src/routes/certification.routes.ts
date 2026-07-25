/**
 * 认证考试路由
 * - GET  /api/certification/questions    获取当前题库的题目
 * - POST /api/certification/submit       提交认证考试
 * - GET  /api/certification/history      获取认证历史记录
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";
import { logLearningEvent } from "../lib/logger";

export const certificationRouter = Router();

// ── 获取题目 ──
certificationRouter.get("/questions", authenticate, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "employee") {
      return res.status(403).json({ error: "仅员工可参加认证考试" });
    }

    const questionBank = await prisma.questionBank.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!questionBank) {
      return res.status(404).json({ error: "题库未配置，请联系管理员" });
    }

    // 返回题目但不暴露正确答案
    const questions = (questionBank.questions as unknown as Array<Record<string, unknown>>).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      category: q.category,
    }));

    res.json({
      version: questionBank.version,
      questions,
    });
  } catch (err) {
    next(err);
  }
});

// ── 提交认证考试 ──
const submitSchema = z.object({
  version: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOption: z.number(),
    }),
  ),
});

certificationRouter.post("/submit", authenticate, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "employee") {
      return res.status(403).json({ error: "仅员工可参加认证考试" });
    }
    const userId = req.user.userId;
    const { version, answers } = submitSchema.parse(req.body);

    // 获取题库并评分
    const questionBank = await prisma.questionBank.findFirst({
      where: { version, isActive: true },
    });
    if (!questionBank) {
      return res.status(400).json({ error: "题库版本无效" });
    }

    const questions = questionBank.questions as unknown as Array<{
      id: string;
      question: string;
      options: string[];
      correctIndex: number;
      category: string;
      explanation: string;
    }>;

    // 评分
    let correctCount = 0;
    const wrongQuestions: Array<{
      questionId: string;
      question: string;
      selectedOption: number;
      correctIndex: number;
      explanation: string;
    }> = [];
    const categoryStats: Record<string, { total: number; correct: number }> = {};

    for (const ans of answers) {
      const q = questions.find((qq) => qq.id === ans.questionId);
      if (!q) continue;

      if (!categoryStats[q.category]) {
        categoryStats[q.category] = { total: 0, correct: 0 };
      }
      categoryStats[q.category].total++;

      if (ans.selectedOption === q.correctIndex) {
        correctCount++;
        categoryStats[q.category].correct++;
      } else {
        wrongQuestions.push({
          questionId: q.id,
          question: q.question,
          selectedOption: ans.selectedOption,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        });
      }
    }

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= 80;

    // 计算薄弱领域（正确率 < 60% 的分类）
    const weakAreas = Object.entries(categoryStats)
      .filter(([, stats]) => stats.total > 0 && stats.correct / stats.total < 0.6)
      .map(([category]) => category);

    // 保存认证记录
    const attempt = await prisma.certificationAttempt.create({
      data: {
        userId,
        questionVersion: version,
        score,
        passed,
        answers: answers as any,
        weakAreas,
        wrongQuestions: wrongQuestions as any,
      },
    });

    // 如果通过，解锁学习天地
    if (passed) {
      await prisma.learningProgress.upsert({
        where: { userId },
        update: { learningWorldUnlocked: true },
        create: { userId, learningWorldUnlocked: true },
      });

      // 标记认证关卡完成
      await prisma.stageProgress.upsert({
        where: { userId_stageId: { userId, stageId: "certification" } },
        update: { status: "completed", completedAt: new Date() },
        create: { userId, stageId: "certification", status: "completed", completedAt: new Date() },
      });

      await logLearningEvent({
        userId,
        eventType: "cert_passed",
        stageId: "certification",
        result: `认证通过，得分 ${score}`,
      });
      await logLearningEvent({
        userId,
        eventType: "world_unlocked",
        result: "学习天地已解锁",
      });
    } else {
      await logLearningEvent({
        userId,
        eventType: "cert_failed",
        stageId: "certification",
        result: `认证未通过，得分 ${score}`,
      });
    }

    res.json({
      attemptId: attempt.id,
      score,
      passed,
      correctCount,
      totalQuestions,
      weakAreas,
      wrongQuestions,
    });
  } catch (err) {
    next(err);
  }
});

// ── 获取认证历史 ──
certificationRouter.get("/history", authenticate, async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "未认证" });

    const userId = req.user.role === "employee" ? req.user.userId : (req.query.userId as string);
    if (!userId) return res.status(400).json({ error: "需要指定 userId" });

    // 非员工只能查看指定员工的历史（需管理员权限）
    if (req.user.role !== "employee" && req.user.role !== "super" && req.user.role !== "viewer") {
      return res.status(403).json({ error: "无权限" });
    }

    const attempts = await prisma.certificationAttempt.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
    });

    res.json({
      attempts: attempts.map((a) => ({
        id: a.id,
        score: a.score,
        passed: a.passed,
        weakAreas: a.weakAreas,
        questionVersion: a.questionVersion,
        submittedAt: a.submittedAt,
      })),
      bestScore: attempts.reduce((max, a) => Math.max(max, a.score), 0),
      totalAttempts: attempts.length,
      passed: attempts.some((a) => a.passed),
    });
  } catch (err) {
    next(err);
  }
});

// ── 管理员重置员工认证 ──
certificationRouter.post("/:userId/reset", authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (req.user?.role !== "super") {
      return res.status(403).json({ error: "需要超级管理员权限" });
    }

    const userId = req.params.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "员工不存在" });

    // 删除所有认证记录
    await prisma.certificationAttempt.deleteMany({ where: { userId } });

    // 重置认证关卡状态
    await prisma.stageProgress.upsert({
      where: { userId_stageId: { userId, stageId: "certification" } },
      update: { status: "pending", completedAt: null },
      create: { userId, stageId: "certification", status: "pending" },
    });

    // 锁定学习天地
    await prisma.learningProgress.upsert({
      where: { userId },
      update: { learningWorldUnlocked: false },
      create: { userId, learningWorldUnlocked: false },
    });

    await logLearningEvent({
      userId,
      eventType: "admin_reset",
      stageId: "certification",
      result: `管理员 ${req.user.name} 重置了认证记录`,
    });

    res.json({ message: "认证记录已重置" });
  } catch (err) {
    next(err);
  }
});
