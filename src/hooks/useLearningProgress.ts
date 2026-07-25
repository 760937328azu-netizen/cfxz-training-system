import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getCurrentUserUsername, getCurrentUserName } from "./useCurrentUser";
import { isApiMode, progressApi, certificationApi } from "../lib/api";
import type { ProgressResponse } from "../lib/api";

const STORAGE_KEY_PREFIX = "cfxz-phase3-learning-progress-v2";
const EVENT_NAME = "cfxz-learning-progress";

export function getStorageKey(): string {
  if (typeof window === "undefined") return STORAGE_KEY_PREFIX;
  // 优先使用 username（登录账号），与后台 Employee.username 对齐
  const username = getCurrentUserUsername().trim();
  if (username) return `${STORAGE_KEY_PREFIX}-${username}`;
  // 向后兼容：旧 session 可能没有 username，fallback 到 name
  const name = getCurrentUserName().trim();
  return name ? `${STORAGE_KEY_PREFIX}-${name}` : STORAGE_KEY_PREFIX;
}

export type CultureExhibitId = "long-hair" | "logo-story" | "rice-water" | "technology-museum";
export type RulesGameKey = "rocketBoss" | "valueMatch" | "valueCatch" | "quiz";

export type RulesProgress = {
  foundationViewed: string[];
  rocketTargetsHit: string[];
  culturePairsMatched: string[];
  valueCatchCorrect: string[];
  quizAnswered: string[];
  quizCorrect: string[];
  rulesGamesCompleted: Record<RulesGameKey, boolean>;
  completed: boolean;
  completedAt?: string;
};

export type LearningRecord = {
  id: string;
  stageId: StageId;
  section?: string;
  title: string;
  time: string;
  date: string;
  timestamp: string;
  type: "stage_complete" | "exhibit_complete" | "game_complete" | "section_viewed" | "certification_attempt";
};

export type CertificationProgress = {
  attempts: number;
  bestScore: number;
  passed: boolean;
  lastAttemptAt?: string;
  answers?: number[];
  weakAreas?: string[];
  score?: number;
};

export type LearningProgress = {
  welcome: { completed: boolean; completedAt?: string };
  company: { completed: boolean; completedAt?: string };
  culture: {
    started: boolean;
    completedExhibits: CultureExhibitId[];
    completed: boolean;
    completedAt?: string;
  };
  product: { completed: boolean; completedAt?: string };
  rules: RulesProgress;
  // ── Step 3: 继续学习 / 学习记录 ──
  lastStage?: string;
  lastSection?: string;
  lastVisitedAt?: string;
  learningRecords: LearningRecord[];
  // ── Step 6: 入职认证 / 学习天地解锁 ──
  certification: CertificationProgress;
  learningWorldUnlocked: boolean;
};

const RULE_GAME_KEYS: RulesGameKey[] = ["rocketBoss", "valueMatch", "valueCatch", "quiz"];
const emptyRulesProgress = (): RulesProgress => ({
  foundationViewed: [],
  rocketTargetsHit: [],
  culturePairsMatched: [],
  valueCatchCorrect: [],
  quizAnswered: [],
  quizCorrect: [],
  rulesGamesCompleted: { rocketBoss: false, valueMatch: false, valueCatch: false, quiz: false },
  completed: false,
});

const initialProgress: LearningProgress = {
  welcome: { completed: false },
  company: { completed: false },
  culture: { started: false, completedExhibits: [], completed: false },
  product: { completed: false },
  rules: emptyRulesProgress(),
  learningRecords: [],
  certification: { attempts: 0, bestScore: 0, passed: false },
  learningWorldUnlocked: false,
};

let memorySnapshot = initialProgress;
let memoryRaw = "";

function readProgress(): LearningProgress {
  if (typeof window === "undefined") return memorySnapshot;
  try {
    const key = getStorageKey();
    const saved = window.localStorage.getItem(key);
    // ── Migration from v1 ──
    // If the old v1 key exists but v2 doesn't, migrate data.
    if (!saved) {
      const v1Raw = window.localStorage.getItem("cfxz-phase3-learning-progress-v1");
      if (v1Raw) {
        try {
          const v1 = JSON.parse(v1Raw) as any;
          const migrated: LearningProgress = {
            welcome: { completed: true, completedAt: v1.culture?.completedAt ?? new Date().toISOString() },
            company: { completed: true, completedAt: v1.culture?.completedAt ?? new Date().toISOString() },
            culture: {
              started: true,
              completedExhibits: v1.culture?.completedExhibits ?? ["long-hair", "logo-story", "rice-water", "technology-museum"],
              completed: Boolean(v1.culture?.completed),
              completedAt: v1.culture?.completedAt,
            },
            product: { completed: false },
            rules: v1.rules ?? emptyRulesProgress(),
            learningRecords: [],
            certification: { attempts: 0, bestScore: 0, passed: false },
            learningWorldUnlocked: false,
          };
          writeProgress(migrated);
          // Remove old key
          window.localStorage.removeItem("cfxz-phase3-learning-progress-v1");
          return migrated;
        } catch {
          // v1 data is corrupt — start fresh
        }
      }
      return memorySnapshot;
    }
    if (saved === memoryRaw) return memorySnapshot;
    const parsed = JSON.parse(saved) as LearningProgress & {
      rulesGamesCompleted?: Record<string, boolean>;
      rocketTargetsHit?: string[];
      culturePairsMatched?: string[];
      valueCatchCorrect?: string[];
      quizAnswered?: string[];
      quizCorrect?: string[];
    };
    // ── Back-fill welcome/company if culture is already completed ──
    // Old data may not have welcome/company fields; if culture is done,
    // stages 1-2 must have been completed too.
    if (parsed.culture?.completed && !parsed.welcome?.completed) {
      parsed.welcome = { completed: true, completedAt: parsed.culture.completedAt ?? new Date().toISOString() };
    }
    if (parsed.culture?.completed && !parsed.company?.completed) {
      parsed.company = { completed: true, completedAt: parsed.culture.completedAt ?? new Date().toISOString() };
    }
    // Ensure all top-level fields exist
    parsed.welcome = parsed.welcome ?? { completed: false };
    parsed.company = parsed.company ?? { completed: false };
    parsed.product = parsed.product ?? { completed: false };

    if (parsed.culture?.completed && !parsed.culture.completedExhibits.includes("logo-story")) {
      parsed.culture.completedExhibits = ["long-hair", "logo-story", "rice-water", "technology-museum"];
    }
    const defaults = emptyRulesProgress();
    const source = parsed.rules ?? defaults;
    const legacyGames = parsed.rulesGamesCompleted ?? {};
    const rulesGamesCompleted = {
      rocketBoss: Boolean(source.rulesGamesCompleted?.rocketBoss || legacyGames.rocketBoss || legacyGames.ruleGame),
      valueMatch: Boolean(source.rulesGamesCompleted?.valueMatch || legacyGames.valueMatch || legacyGames.cultureMatch),
      valueCatch: Boolean(source.rulesGamesCompleted?.valueCatch || legacyGames.valueCatch || legacyGames.complianceGame),
      quiz: Boolean(source.rulesGamesCompleted?.quiz || legacyGames.quiz),
    };
    parsed.rules = {
      ...defaults,
      ...source,
      foundationViewed: source.foundationViewed ?? [],
      rocketTargetsHit: source.rocketTargetsHit ?? parsed.rocketTargetsHit ?? [],
      culturePairsMatched: source.culturePairsMatched ?? parsed.culturePairsMatched ?? [],
      valueCatchCorrect: source.valueCatchCorrect ?? parsed.valueCatchCorrect ?? [],
      quizAnswered: source.quizAnswered ?? parsed.quizAnswered ?? [],
      quizCorrect: source.quizCorrect ?? parsed.quizCorrect ?? [],
      rulesGamesCompleted,
      completed: RULE_GAME_KEYS.every((key) => rulesGamesCompleted[key]),
    };
    // ── Step 3 migration: ensure learningRecords exists ──
    if (!Array.isArray(parsed.learningRecords)) {
      parsed.learningRecords = [];
    }
    // Auto-generate records from existing stage completion data (one-time migration)
    if (parsed.learningRecords.length === 0) {
      const records: LearningRecord[] = [];
      const pushRecord = (id: string, stageId: StageId, title: string, type: LearningRecord["type"], completedAt?: string) => {
        if (!completedAt) return;
        const ts = new Date(completedAt);
        records.push({
          id,
          stageId,
          title,
          type,
          timestamp: completedAt,
          date: ts.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
          time: "已完成",
        });
      };
      pushRecord("welcome-done", "welcome", "欢迎加入", "stage_complete", parsed.welcome.completedAt);
      pushRecord("company-done", "company", "认识长发小寨", "stage_complete", parsed.company.completedAt);
      if (parsed.culture.completedExhibits.includes("long-hair"))
        pushRecord("exh-longhair", "culture", "红瑶长发文化展区", "exhibit_complete", parsed.culture.completedAt);
      if (parsed.culture.completedExhibits.includes("logo-story"))
        pushRecord("exh-logo", "culture", "品牌 Logo 故事展区", "exhibit_complete", parsed.culture.completedAt);
      if (parsed.culture.completedExhibits.includes("rice-water"))
        pushRecord("exh-ricewater", "culture", "淘米水非遗技艺展区", "exhibit_complete", parsed.culture.completedAt);
      if (parsed.culture.completedExhibits.includes("technology-museum"))
        pushRecord("exh-tech", "culture", "中国长发科技馆展区", "exhibit_complete", parsed.culture.completedAt);
      pushRecord("product-done", "product", "认识产品与核心技术", "stage_complete", parsed.product.completedAt);
      if (parsed.rules.completed)
        pushRecord("rules-done", "organization", "组织与基础制度", "stage_complete", parsed.rules.completedAt);
      if (records.length > 0) parsed.learningRecords = records;
    }

    // ── Step 6 migration: ensure certification and learningWorldUnlocked exist ──
    parsed.certification = parsed.certification ?? {
      attempts: 0,
      bestScore: 0,
      passed: false,
    };
    parsed.learningWorldUnlocked = parsed.learningWorldUnlocked ?? parsed.certification?.passed ?? false;

    memorySnapshot = parsed;
    memoryRaw = saved;
    return parsed;
  } catch {
    return memorySnapshot;
  }
}

function writeProgress(next: LearningProgress) {
  memorySnapshot = next;
  memoryRaw = JSON.stringify(next);
  window.localStorage.setItem(getStorageKey(), memoryRaw);
  window.dispatchEvent(new Event(EVENT_NAME));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

// ═══════════════════════════════════════════════
// API ↔ Local 映射（仅 API 模式使用）
// ═══════════════════════════════════════════════

/** 将后端 ProgressResponse 转换为前端 LearningProgress 格式 */
function apiProgressToLocal(api: ProgressResponse): LearningProgress {
  const stages = api.stages;
  const games = api.games;
  const cert = api.certification;

  const rulesGamesCompleted: Record<RulesGameKey, boolean> = {
    rocketBoss: games.rocketBoss?.completed ?? false,
    valueMatch: games.valueMatch?.completed ?? false,
    valueCatch: games.valueCatch?.completed ?? false,
    quiz: games.quiz?.completed ?? false,
  };

  const rulesCompleted = stages.rules?.status === "completed";

  return {
    welcome: {
      completed: stages.welcome?.status === "completed",
      completedAt: stages.welcome?.completedAt ?? undefined,
    },
    company: {
      completed: stages.company?.status === "completed",
      completedAt: stages.company?.completedAt ?? undefined,
    },
    culture: {
      started: stages.culture?.status === "in_progress" || stages.culture?.status === "completed",
      completedExhibits: (stages.culture?.completedExhibits ?? []) as CultureExhibitId[],
      completed: stages.culture?.status === "completed",
      completedAt: stages.culture?.completedAt ?? undefined,
    },
    product: {
      completed: stages.product?.status === "completed",
      completedAt: stages.product?.completedAt ?? undefined,
    },
    rules: {
      ...emptyRulesProgress(),
      rulesGamesCompleted,
      completed: rulesCompleted,
      completedAt: stages.rules?.completedAt ?? undefined,
    },
    lastStage: api.progress.currentStage,
    lastSection: api.progress.lastSection ?? undefined,
    lastVisitedAt: api.progress.lastVisitedAt ?? undefined,
    learningRecords: [], // API 不返回学习记录，保留本地缓存
    certification: {
      attempts: cert.attempts,
      bestScore: cert.bestScore,
      passed: cert.passed,
      lastAttemptAt: cert.lastAttempt?.submittedAt ?? undefined,
      weakAreas: cert.lastAttempt?.weakAreas ?? undefined,
      score: cert.lastAttempt?.score ?? undefined,
    },
    learningWorldUnlocked: api.progress.learningWorldUnlocked,
  };
}

/**
 * 从后端 API 同步学习进度到 localStorage 缓存
 * 在 API 模式下，页面加载时调用此函数获取最新进度
 * @returns true 表示同步成功
 */
export async function syncProgressFromApi(): Promise<boolean> {
  if (!isApiMode()) return false;
  try {
    const apiData = await progressApi.get();
    const localData = readProgress();
    const merged = apiProgressToLocal(apiData);
    // 保留本地学习记录（API 不返回此数据）
    merged.learningRecords = localData.learningRecords;
    writeProgress(merged);
    return true;
  } catch {
    // 静默失败 — localStorage 作为降级
    return false;
  }
}

/**
 * 进度自动同步 Hook
 * 在 API 模式下，组件挂载时自动从后端获取最新进度
 */
export function useProgressSync() {
  useEffect(() => {
    if (!isApiMode()) return;
    syncProgressFromApi();
  }, []);
}

// ── Stage order definitions ──
// Stage 1→6 in sequence; a stage is "current" when all prior stages are completed.
// Note: "organization" is the public stage id (URL/learningData); progress storage still uses the "rules" key.
export const STAGE_ORDER = ["welcome", "company", "culture", "product", "organization", "certification"] as const;
export type StageId = (typeof STAGE_ORDER)[number];

function getProgressKey(stageId: StageId): keyof LearningProgress {
  return stageId === "organization" ? "rules" : stageId;
}

function getStageProgress(progress: LearningProgress, stageId: StageId) {
  return progress[getProgressKey(stageId)] as { completed?: boolean } | undefined;
}

export function getStageStatuses(progress: LearningProgress): Record<StageId, "completed" | "current" | "locked"> {
  const result: Record<string, "completed" | "current" | "locked"> = {};
  let currentFound = false;
  for (const id of STAGE_ORDER) {
    if (id === "certification") {
      // Stage 6 — completed if passed, current if all prior stages done, otherwise locked
      if (progress.certification.passed) {
        result[id] = "completed";
      } else {
        result[id] = (progress.welcome.completed && progress.company.completed && progress.culture.completed && progress.product.completed && progress.rules.completed)
          ? "current" : "locked";
      }
      continue;
    }
    const stageProgress = getStageProgress(progress, id);
    const isCompleted = typeof stageProgress === "object" && "completed" in stageProgress && stageProgress.completed === true;
    if (isCompleted) {
      result[id] = "completed";
    } else if (!currentFound) {
      result[id] = "current";
      currentFound = true;
    } else {
      result[id] = "locked";
    }
  }
  return result as Record<StageId, "completed" | "current" | "locked">;
}

/** Returns the number of completed stages out of 6. */
export function getCompletedCount(progress: LearningProgress): number {
  let count = 0;
  if (progress.welcome.completed) count++;
  if (progress.company.completed) count++;
  if (progress.culture.completed) count++;
  if (progress.product.completed) count++;
  if (progress.rules.completed) count++;
  if (progress.certification.passed) count++;
  return count;
}

/** Returns the stageId of the current (first non-completed) stage. */
export function getCurrentStageId(progress: LearningProgress): StageId {
  for (const id of STAGE_ORDER) {
    if (id === "certification") return id;
    const sp = getStageProgress(progress, id);
    if (typeof sp === "object" && "completed" in sp && sp.completed !== true) return id;
  }
  return "certification";
}

// ── Helpers for Step 3 ──

const STAGE_TITLES_MAP: Record<string, string> = {
  welcome: "欢迎加入",
  company: "认识长发小寨",
  culture: "认识品牌与非遗文化",
  product: "认识产品与核心技术",
  organization: "认识组织与基础制度",
  certification: "完成新人认证",
};

const EXHIBIT_TITLES: Record<CultureExhibitId, string> = {
  "long-hair": "红瑶长发文化展区",
  "logo-story": "品牌 Logo 故事展区",
  "rice-water": "淘米水非遗技艺展区",
  "technology-museum": "中国长发科技馆展区",
};

const GAME_TITLES: Record<RulesGameKey, string> = {
  rocketBoss: "制度守卫战",
  valueMatch: "价值观对对碰",
  valueCatch: "小瑶接价值观",
  quiz: "制度知识问答",
};

function makeRecord(
  stageId: StageId,
  title: string,
  type: LearningRecord["type"],
  section?: string,
): LearningRecord {
  const now = new Date();
  return {
    id: `${type}-${stageId}-${section ?? "stage"}-${now.getTime()}`,
    stageId,
    section,
    title,
    type,
    timestamp: now.toISOString(),
    date: now.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
    time: type === "stage_complete" ? "已完成" : type === "exhibit_complete" ? "已探索" : "已完成",
  };
}

// ═══════════════════════════════════════════════
// API 模式下提交认证考试（供认证页面直接调用）
// ═══════════════════════════════════════════════

/**
 * API 模式下提交认证考试
 * 后端自动评分、保存记录、解锁学习天地（如果通过）
 * 认证页面应调用此函数而非 submitCertificationAttempt
 */
export async function submitCertificationViaApi(
  version: string,
  answers: Array<{ questionId: string; selectedOption: number }>,
) {
  return certificationApi.submit(version, answers);
}

/** API 模式下获取认证题库 */
export async function fetchCertificationQuestions() {
  return certificationApi.getQuestions();
}

export function useLearningProgress() {
  const progress = useSyncExternalStore(subscribe, readProgress, () => initialProgress);

  const completeWelcomeStage = useCallback(() => {
    const current = readProgress();
    if (current.welcome.completed) return;
    const completedAt = new Date().toISOString();
    const record = makeRecord("welcome", STAGE_TITLES_MAP.welcome, "stage_complete");
    writeProgress({
      ...current,
      welcome: { completed: true, completedAt },
      learningRecords: [record, ...current.learningRecords],
    });
    // API 同步（fire-and-forget）
    if (isApiMode()) {
      progressApi.updateStage("welcome", "complete").catch(() => {});
    }
  }, []);

  const completeCompanyStage = useCallback(() => {
    const current = readProgress();
    if (current.company.completed) return;
    const completedAt = new Date().toISOString();
    const record = makeRecord("company", STAGE_TITLES_MAP.company, "stage_complete");
    writeProgress({
      ...current,
      company: { completed: true, completedAt },
      learningRecords: [record, ...current.learningRecords],
    });
    // API 同步
    if (isApiMode()) {
      progressApi.updateStage("company", "complete").catch(() => {});
    }
  }, []);

  const startCultureStage = useCallback(() => {
    const current = readProgress();
    if (current.culture.started) return;
    writeProgress({ ...current, culture: { ...current.culture, started: true } });
    // API 同步
    if (isApiMode()) {
      progressApi.updateStage("culture", "start").catch(() => {});
    }
  }, []);

  const completeCultureExhibit = useCallback((id: CultureExhibitId) => {
    const current = readProgress();
    if (current.culture.completedExhibits.includes(id)) return;
    const completedExhibits = [...current.culture.completedExhibits, id];
    const completed = completedExhibits.length === 4;
    const record = makeRecord("culture", EXHIBIT_TITLES[id], "exhibit_complete", id);
    const stageRecord = completed
      ? makeRecord("culture", STAGE_TITLES_MAP.culture, "stage_complete")
      : null;
    writeProgress({
      ...current,
      culture: {
        started: true,
        completedExhibits,
        completed,
        completedAt: completed ? new Date().toISOString() : current.culture.completedAt,
      },
      learningRecords: [
        stageRecord,
        record,
        ...current.learningRecords,
      ].filter(Boolean) as LearningRecord[],
    });
    // API 同步
    if (isApiMode()) {
      progressApi.updateStage("culture", "complete_exhibit", id).catch(() => {});
    }
  }, []);

  const completeProductStage = useCallback(() => {
    const current = readProgress();
    if (current.product.completed) return;
    const completedAt = new Date().toISOString();
    const record = makeRecord("product", STAGE_TITLES_MAP.product, "stage_complete");
    writeProgress({
      ...current,
      product: { completed: true, completedAt },
      learningRecords: [record, ...current.learningRecords],
    });
    // API 同步
    if (isApiMode()) {
      progressApi.updateStage("product", "complete").catch(() => {});
    }
  }, []);

  const updateRulesProgress = useCallback((updater: (current: RulesProgress) => RulesProgress) => {
    const current = readProgress();
    const nextRules = updater(current.rules);
    const wasCompleted = current.rules.completed;
    const isCompleted = RULE_GAME_KEYS.every((key) => Boolean(nextRules.rulesGamesCompleted[key]));

    // Detect newly completed games for record-keeping
    const newRecords: LearningRecord[] = [];
    const newlyCompletedGames: RulesGameKey[] = [];
    for (const key of RULE_GAME_KEYS) {
      if (!current.rules.rulesGamesCompleted[key] && nextRules.rulesGamesCompleted[key]) {
        newRecords.push(makeRecord("organization", GAME_TITLES[key], "game_complete", key));
        newlyCompletedGames.push(key);
      }
    }
    if (!wasCompleted && isCompleted) {
      newRecords.push(makeRecord("organization", STAGE_TITLES_MAP.organization, "stage_complete"));
    }

    writeProgress({
      ...current,
      rules: {
        ...nextRules,
        completed: isCompleted,
        completedAt: isCompleted ? nextRules.completedAt ?? new Date().toISOString() : undefined,
      },
      learningRecords: [...newRecords, ...current.learningRecords],
    });

    // API 同步 — 每个新完成的游戏都同步到后端
    if (isApiMode()) {
      for (const key of newlyCompletedGames) {
        progressApi.updateGame(key).catch(() => {});
      }
    }
  }, []);

  // ── Step 3: save / restore scroll position ──
  const saveLearningPosition = useCallback((stageId: string, section?: string) => {
    const current = readProgress();
    writeProgress({
      ...current,
      lastStage: stageId,
      lastSection: section,
      lastVisitedAt: new Date().toISOString(),
    });
    // API 同步（位置更新频率低，直接同步即可）
    if (isApiMode()) {
      progressApi.savePosition(stageId, section).catch(() => {});
    }
  }, []);

  // ── Step 3: add arbitrary learning record ──
  const addLearningRecord = useCallback((record: Omit<LearningRecord, "id" | "timestamp" | "date" | "time">) => {
    const current = readProgress();
    const now = new Date();
    const full: LearningRecord = {
      ...record,
      id: `${record.type}-${record.stageId}-${now.getTime()}`,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
      time: "已完成",
    };
    writeProgress({ ...current, learningRecords: [full, ...current.learningRecords] });
  }, []);

  // ── Step 6: certification functions ──
  const startCertificationAttempt = useCallback(() => {
    const current = readProgress();
    writeProgress({
      ...current,
      certification: {
        ...current.certification,
        attempts: current.certification.attempts + 1,
      },
    });
    // API 模式下，attempt 在 submit 时由后端记录，此处仅更新本地 UI
  }, []);

  const submitCertificationAttempt = useCallback((
    score: number,
    answers: number[],
    weakAreas: string[],
  ) => {
    const current = readProgress();
    const passed = score >= 80;
    const bestScore = Math.max(current.certification.bestScore, score);
    const record = makeRecord("certification", `新人认证考试 — ${score}分`, "certification_attempt");
    record.time = passed ? "已通过" : "未通过";
    writeProgress({
      ...current,
      certification: {
        ...current.certification,
        attempts: current.certification.attempts,
        bestScore,
        passed,
        lastAttemptAt: new Date().toISOString(),
        answers,
        weakAreas,
        score,
      },
      learningWorldUnlocked: passed,
      learningRecords: [record, ...current.learningRecords],
    });
    // API 模式下，认证提交应由认证页面调用 submitCertificationViaApi()
    // 后端会自动处理：保存记录 → 解锁学习天地 → 标记 certification 关卡完成
    // 此处的 localStorage 更新仅用于即时 UI 反馈
  }, []);

  const resetCertification = useCallback(() => {
    const current = readProgress();
    writeProgress({
      ...current,
      certification: { attempts: 0, bestScore: 0, passed: false },
      learningWorldUnlocked: false,
    });
    // API 模式下，认证重置由管理员通过后台 API 执行
    // 此处仅重置本地缓存
  }, []);

  return {
    progress,
    completeWelcomeStage,
    completeCompanyStage,
    startCultureStage,
    completeCultureExhibit,
    completeProductStage,
    updateRulesProgress,
    saveLearningPosition,
    addLearningRecord,
    startCertificationAttempt,
    submitCertificationAttempt,
    resetCertification,
  };
}
