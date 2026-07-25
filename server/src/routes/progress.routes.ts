/**
 * 学习进度路由
 * - GET  /api/progress          获取当前员工的完整学习进度
 * - PUT  /api/progress/stage    更新关卡进度
 * - PUT  /api/progress/game     更新游戏进度
 * - PUT  /api/progress/position 保存学习位置
 * - GET  /api/progress/:userId  管理员查看指定员工进度
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";
import { logLearningEvent } from "../lib/logger";

export const progressRouter = Router();

// ── STAGE 常量 ──
const STAGES = ["welcome", "company", "culture", "product", "rules", "certification"] as const;
const STAGE_LABELS: Record<string, string> = {
  welcome: "01 欢迎加入",
  company: "02 品牌起源",
  culture: "03 云游博物馆",
  product: "04 认识产品",
  rules: "05 制度闯关",
  certification: "06 入职认证",
};

// ── 获取当前员工的完整进度 ──
progressRouter.get("/", authenticate, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "employee") {
      return res.status(403).json({ error: "仅员工可查看自己的学习进度" });
    }
    const userId = req.user.userId;

    const [progress, stages, games, certifications] = await Promise.all([
      prisma.learningProgress.findUnique({ where: { userId } }),
      prisma.stageProgress.findMany({ where: { userId } }),
      prisma.gameProgress.findMany({ where: { userId } }),
      prisma.certificationAttempt.findMany({
        where: { userId },
        orderBy: { submittedAt: "desc" },
      }),
    ]);

    // 构建 stage 状态 map
    const stageMap: Record<string, { status: string; completedExhibits: string[]; completedAt: string | null }> = {};
    for (const s of stages) {
      stageMap[s.stageId] = {
        status: s.status,
        completedExhibits: s.completedExhibits,
        completedAt: s.completedAt?.toISOString() ?? null,
      };
    }

    // 构建 game 状态 map
    const gameMap: Record<string, { completed: boolean; completedAt: string | null }> = {};
    for (const g of games) {
      gameMap[g.gameKey] = {
        completed: g.completed,
        completedAt: g.completedAt?.toISOString() ?? null,
      };
    }

    // 计算完成数和当前关卡
    const welcomeDone = stageMap.welcome?.status === "completed";
    const companyDone = stageMap.company?.status === "completed";
    const cultureDone = stageMap.culture?.status === "completed";
    const productDone = stageMap.product?.status === "completed";
    const rulesDone = stageMap.rules?.status === "completed";
    const allFiveDone = welcomeDone && companyDone && cultureDone && productDone && rulesDone;

    const bestCert = certifications[0];
    const certPassed = bestCert?.passed ?? false;
    const bestScore = certifications.reduce((max, c) => Math.max(max, c.score), 0);

    let completedCount = 0;
    if (welcomeDone) completedCount++;
    if (companyDone) completedCount++;
    if (cultureDone) completedCount++;
    if (productDone) completedCount++;
    if (rulesDone) completedCount++;
    if (certPassed) completedCount++;

    let currentStage = "welcome";
    for (const s of STAGES) {
      if (s === "certification") {
        if (!certPassed && allFiveDone) { currentStage = s; break; }
        if (!certPassed) { currentStage = "locked"; break; }
      } else {
        if (stageMap[s]?.status !== "completed") { currentStage = s; break; }
      }
    }
    if (completedCount === 6) currentStage = "completed";

    let certStatus = "locked";
    if (certPassed) certStatus = "passed";
    else if (certifications.length > 0) certStatus = "failed";
    else if (allFiveDone) certStatus = "in_progress";

    res.json({
      progress: {
        currentStage,
        lastSection: progress?.lastSection ?? null,
        lastVisitedAt: progress?.lastVisitedAt?.toISOString() ?? null,
        learningWorldUnlocked: progress?.learningWorldUnlocked ?? false,
      },
      stages: stageMap,
      games: gameMap,
      certification: {
        status: certStatus,
        attempts: certifications.length,
        bestScore,
        passed: certPassed,
        lastAttempt: bestCert
          ? {
              score: bestCert.score,
              passed: bestCert.passed,
              weakAreas: bestCert.weakAreas,
              submittedAt: bestCert.submittedAt.toISOString(),
            }
          : null,
      },
      completedCount,
      overallPercent: Math.round((completedCount / 6) * 100),
    });
  } catch (err) {
    next(err);
  }
});

// ── 更新关卡进度 ──
const updateStageSchema = z.object({
  stageId: z.enum(STAGES),
  action: z.enum(["start", "complete", "complete_exhibit"]),
  exhibitId: z.string().optional(), // culture 展区
});

progressRouter.put("/stage", authenticate, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "employee") {
      return res.status(403).json({ error: "仅员工可更新学习进度" });
    }
    const userId = req.user.userId;
    const { stageId, action, exhibitId } = updateStageSchema.parse(req.body);

    const existing = await prisma.stageProgress.findUnique({
      where: { userId_stageId: { userId, stageId } },
    });

    if (action === "start") {
      if (existing?.status === "pending" || !existing) {
        await prisma.stageProgress.upsert({
          where: { userId_stageId: { userId, stageId } },
          update: { status: "in_progress" },
          create: { userId, stageId, status: "in_progress" },
        });
        await logLearningEvent({
          userId,
          eventType: "stage_start",
          stageId,
          result: `开始 ${STAGE_LABELS[stageId] ?? stageId}`,
        });
      }
    } else if (action === "complete") {
      await prisma.stageProgress.upsert({
        where: { userId_stageId: { userId, stageId } },
        update: { status: "completed", completedAt: new Date() },
        create: { userId, stageId, status: "completed", completedAt: new Date() },
      });
      await logLearningEvent({
        userId,
        eventType: "stage_complete",
        stageId,
        result: `完成 ${STAGE_LABELS[stageId] ?? stageId}`,
      });
    } else if (action === "complete_exhibit" && exhibitId) {
      // culture 展区完成
      const exhibits = existing?.completedExhibits ?? [];
      if (!exhibits.includes(exhibitId)) {
        exhibits.push(exhibitId);
      }
      const allExhibits = ["long-hair", "logo-story", "rice-water", "technology-museum"];
      const completed = allExhibits.every((e) => exhibits.includes(e));
      await prisma.stageProgress.upsert({
        where: { userId_stageId: { userId, stageId } },
        update: {
          status: completed ? "completed" : "in_progress",
          completedExhibits: exhibits,
          completedAt: completed ? new Date() : existing?.completedAt,
        },
        create: {
          userId,
          stageId,
          status: completed ? "completed" : "in_progress",
          completedExhibits: exhibits,
          completedAt: completed ? new Date() : null,
        },
      });
      await logLearningEvent({
        userId,
        eventType: "stage_complete",
        stageId,
        result: `完成展区 ${exhibitId}`,
      });
    }

    res.json({ message: "进度已更新" });
  } catch (err) {
    next(err);
  }
});

// ── 更新游戏进度 ──
const updateGameSchema = z.object({
  gameKey: z.enum(["rocketBoss", "valueMatch", "valueCatch", "quiz"]),
  gameData: z.any().optional(),
});

progressRouter.put("/game", authenticate, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "employee") {
      return res.status(403).json({ error: "仅员工可更新学习进度" });
    }
    const userId = req.user.userId;
    const { gameKey, gameData } = updateGameSchema.parse(req.body);

    const existing = await prisma.gameProgress.findUnique({
      where: { userId_gameKey: { userId, gameKey } },
    });

    // 如果已经完成，不重复记录
    if (existing?.completed) {
      return res.json({ message: "游戏已完成", alreadyCompleted: true });
    }

    await prisma.gameProgress.upsert({
      where: { userId_gameKey: { userId, gameKey } },
      update: { completed: true, completedAt: new Date(), gameData: gameData ?? null },
      create: { userId, gameKey, completed: true, completedAt: new Date(), gameData: gameData ?? null },
    });

    // 检查是否四关全通
    const allGames = await prisma.gameProgress.findMany({ where: { userId } });
    const allDone = allGames.every((g) => g.completed);
    if (allDone) {
      await prisma.stageProgress.upsert({
        where: { userId_stageId: { userId, stageId: "rules" } },
        update: { status: "completed", completedAt: new Date() },
        create: { userId, stageId: "rules", status: "completed", completedAt: new Date() },
      });
      await logLearningEvent({
        userId,
        eventType: "stage_complete",
        stageId: "rules",
        result: "完成 05 制度闯关（四关全通）",
      });
    }

    await logLearningEvent({
      userId,
      eventType: "game_complete",
      stageId: "rules",
      result: `完成游戏 ${gameKey}`,
    });

    res.json({ message: "游戏进度已更新", allGamesCompleted: allDone });
  } catch (err) {
    next(err);
  }
});

// ── 保存学习位置 ──
const savePositionSchema = z.object({
  currentStage: z.string().optional(),
  lastSection: z.string().optional(),
});

progressRouter.put("/position", authenticate, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "employee") {
      return res.status(403).json({ error: "仅员工可更新学习进度" });
    }
    const userId = req.user.userId;
    const data = savePositionSchema.parse(req.body);

    const updates: Record<string, unknown> = { lastVisitedAt: new Date() };
    if (data.currentStage) updates.currentStage = data.currentStage;
    if (data.lastSection !== undefined) updates.lastSection = data.lastSection;

    await prisma.learningProgress.upsert({
      where: { userId },
      update: updates,
      create: { userId, ...updates },
    });

    res.json({ message: "学习位置已保存" });
  } catch (err) {
    next(err);
  }
});

// ── 管理员查看指定员工进度 ──
progressRouter.get("/:userId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { batch: true } });
    if (!user) return res.status(404).json({ error: "员工不存在" });

    const [progress, stages, games, certifications, events] = await Promise.all([
      prisma.learningProgress.findUnique({ where: { userId } }),
      prisma.stageProgress.findMany({ where: { userId } }),
      prisma.gameProgress.findMany({ where: { userId } }),
      prisma.certificationAttempt.findMany({
        where: { userId },
        orderBy: { submittedAt: "desc" },
      }),
      prisma.learningEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    res.json({
      employee: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        department: user.department,
        position: user.position,
        employeeNo: user.employeeNo,
        batchName: user.batch?.name ?? null,
        entryDate: user.entryDate,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      progress: progress
        ? {
            currentStage: progress.currentStage,
            lastSection: progress.lastSection,
            lastVisitedAt: progress.lastVisitedAt,
            learningWorldUnlocked: progress.learningWorldUnlocked,
          }
        : null,
      stages: stages.map((s) => ({
        stageId: s.stageId,
        status: s.status,
        completedExhibits: s.completedExhibits,
        completedAt: s.completedAt,
      })),
      games: games.map((g) => ({
        gameKey: g.gameKey,
        completed: g.completed,
        completedAt: g.completedAt,
      })),
      certifications: certifications.map((c) => ({
        id: c.id,
        score: c.score,
        passed: c.passed,
        weakAreas: c.weakAreas,
        questionVersion: c.questionVersion,
        submittedAt: c.submittedAt,
      })),
      events: events.map((e) => ({
        id: e.id,
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
