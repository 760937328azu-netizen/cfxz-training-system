/**
 * 展示模式（Demo Mode）初始化模块
 *
 * 设计目的：
 * - 为"纯展示版本"前台网站提供预填数据，无需后端 API 即可完整体验所有功能
 * - 不影响正式版本：仅在 VITE_DEMO_MODE=true 时激活
 * - 每个浏览器标签页首次打开时初始化一次（sessionStorage 标记），刷新不重置
 *
 * 工作原理：
 * 1. isDemoMode() 检查 VITE_DEMO_MODE 环境变量
 * 2. initDemoMode() 在 main.tsx 中 createRoot 之前调用
 * 3. 预填 localStorage：
 *    - 用户身份（cfxz-login-session="1" + 用户信息）→ 绕过登录门
 *    - 学习进度（全部 6 关已完成 + 认证通过 + 学习天地解锁）→ 展示完整系统状态
 * 4. 由于 VITE_API_BASE_URL 未配置，isApiMode() 返回 false，所有 API 调用被跳过
 */

// ═══════════════════════════════════════════════
// 环境变量检测
// ═══════════════════════════════════════════════

/** 是否为展示模式（VITE_DEMO_MODE=true 时激活） */
export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === "true";
}

// ═══════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════

/** sessionStorage 标记 — 防止同一标签页内重复初始化 */
const DEMO_INIT_FLAG = "cfxz-demo-initialized-v1";

/** 演示用户登录账号（决定进度 storage key 后缀） */
const DEMO_USERNAME = "demo";

/** 进度 storage key（与 useLearningProgress.getStorageKey() 逻辑一致） */
const PROGRESS_KEY = `cfxz-phase3-learning-progress-v2-${DEMO_USERNAME}`;

// 用户信息 storage keys（与 useCurrentUser.USER_STORAGE_KEYS 一致）
const USER_KEYS = {
  name: "cfxz-user-name",
  department: "cfxz-user-department",
  session: "cfxz-login-session",
  username: "cfxz-user-username",
  position: "cfxz-user-position",
  batchName: "cfxz-user-batch-name",
  entryDate: "cfxz-user-entry-date",
} as const;

// ═══════════════════════════════════════════════
// 演示数据构建
// ═══════════════════════════════════════════════

/** 构建演示用户信息 */
function buildDemoUser(): Record<string, string> {
  return {
    [USER_KEYS.session]: "1",
    [USER_KEYS.name]: "演示员工",
    [USER_KEYS.username]: DEMO_USERNAME,
    [USER_KEYS.department]: "品牌中心",
    [USER_KEYS.position]: "新员工",
    [USER_KEYS.batchName]: "2026年7月新员工批次",
    [USER_KEYS.entryDate]: "2026-07-20",
  };
}

/** 构建全部已完成的学习进度（含学习记录） */
function buildDemoProgress(): Record<string, unknown> {
  const t1 = "2026-07-20T09:15:00.000Z";
  const t2 = "2026-07-20T10:45:00.000Z";
  const t3 = "2026-07-21T14:30:00.000Z";
  const t4 = "2026-07-22T15:30:00.000Z";
  const t5 = "2026-07-23T16:30:00.000Z";
  const t6 = "2026-07-24T11:00:00.000Z";

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });

  return {
    welcome: { completed: true, completedAt: t1 },
    company: { completed: true, completedAt: t2 },
    culture: {
      started: true,
      completedExhibits: ["long-hair", "logo-story", "rice-water", "technology-museum"],
      completed: true,
      completedAt: t3,
    },
    product: { completed: true, completedAt: t4 },
    rules: {
      foundationViewed: ["r1", "r2", "r3", "r4"],
      rocketTargetsHit: ["t1", "t2", "t3"],
      culturePairsMatched: ["c1", "c2", "c3", "c4"],
      valueCatchCorrect: ["v1", "v2", "v3"],
      quizAnswered: ["q1", "q2", "q3", "q4", "q5"],
      quizCorrect: ["q1", "q2", "q3", "q4", "q5"],
      rulesGamesCompleted: { rocketBoss: true, valueMatch: true, valueCatch: true, quiz: true },
      completed: true,
      completedAt: t5,
    },
    lastStage: "certification",
    lastVisitedAt: t6,
    learningRecords: [
      {
        id: "certification_attempt-certification-stage-1753354800000",
        stageId: "certification",
        title: "新人认证考试 — 95分",
        type: "certification_attempt",
        timestamp: t6,
        date: fmtDate(t6),
        time: "已通过",
      },
      {
        id: "stage_complete-organization-stage-1753275000000",
        stageId: "organization",
        title: "认识组织与基础制度",
        type: "stage_complete",
        timestamp: t5,
        date: fmtDate(t5),
        time: "已完成",
      },
      {
        id: "game_complete-organization-quiz-1753274400000",
        stageId: "organization",
        section: "quiz",
        title: "制度知识问答",
        type: "game_complete",
        timestamp: t5,
        date: fmtDate(t5),
        time: "已完成",
      },
      {
        id: "stage_complete-product-stage-1753189800000",
        stageId: "product",
        title: "认识产品与核心技术",
        type: "stage_complete",
        timestamp: t4,
        date: fmtDate(t4),
        time: "已完成",
      },
      {
        id: "stage_complete-culture-stage-1753107000000",
        stageId: "culture",
        title: "认识品牌与非遗文化",
        type: "stage_complete",
        timestamp: t3,
        date: fmtDate(t3),
        time: "已完成",
      },
      {
        id: "exhibit_complete-culture-technology-museum-1753106400000",
        stageId: "culture",
        section: "technology-museum",
        title: "中国长发科技馆展区",
        type: "exhibit_complete",
        timestamp: t3,
        date: fmtDate(t3),
        time: "已探索",
      },
      {
        id: "stage_complete-company-stage-1753011300000",
        stageId: "company",
        title: "认识长发小寨",
        type: "stage_complete",
        timestamp: t2,
        date: fmtDate(t2),
        time: "已完成",
      },
      {
        id: "stage_complete-welcome-stage-1753005300000",
        stageId: "welcome",
        title: "欢迎加入",
        type: "stage_complete",
        timestamp: t1,
        date: fmtDate(t1),
        time: "已完成",
      },
    ],
    certification: {
      attempts: 1,
      bestScore: 95,
      passed: true,
      lastAttemptAt: t6,
      score: 95,
      answers: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1],
      weakAreas: [],
    },
    learningWorldUnlocked: true,
  };
}

// ═══════════════════════════════════════════════
// 初始化入口
// ═══════════════════════════════════════════════

/**
 * 初始化展示模式
 * 在 main.tsx 中 createRoot 之前调用
 *
 * 行为：
 * - 仅在展示模式下执行（isDemoMode() === true）
 * - 每个标签页仅初始化一次（sessionStorage 标记）
 * - 预填用户身份 + 全部已完成的学习进度到 localStorage
 * - 刷新页面不重置（同一标签页内 sessionStorage 标记仍在）
 * - 关闭标签页重新打开会重置为初始展示状态
 */
export function initDemoMode(): void {
  if (!isDemoMode()) return;

  // 同一标签页内仅初始化一次
  try {
    if (sessionStorage.getItem(DEMO_INIT_FLAG)) return;
  } catch {
    // sessionStorage 不可用时继续执行
  }

  try {
    // 1. 预填演示用户信息
    const userInfo = buildDemoUser();
    for (const [key, value] of Object.entries(userInfo)) {
      window.localStorage.setItem(key, value);
    }

    // 2. 预填全部已完成的学习进度
    const progress = buildDemoProgress();
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

    // 3. 标记已初始化
    try {
      sessionStorage.setItem(DEMO_INIT_FLAG, "1");
    } catch {
      // ignore
    }
  } catch {
    // localStorage 不可用时静默失败
  }
}
