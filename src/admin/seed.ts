/**
 * 管理后台 — 种子数据
 *
 * 首次加载管理后台时初始化默认数据：
 * - 2 个管理员账号（超级管理员 + 查看管理员）
 * - 2 个培训批次
 * - 10 个示例员工（含不同进度阶段）
 * - 每个员工的模拟进度数据（写入各自 localStorage key）
 */

import type { AdminStoreData, Employee } from "./types";
import { hashPassword, getEmployeeProgressKey } from "./store";

// ──────────────────────────────────────────────
// 种子数据定义
// ──────────────────────────────────────────────

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const SEED_BATCHES = [
  {
    id: "batch-2026-06",
    name: "2026年6月新员工培训",
    startDate: "2026-06-01",
    deadline: "2026-06-30",
    status: "closed" as const,
    createdAt: "2026-05-25T08:00:00.000Z",
  },
  {
    id: "batch-2026-07",
    name: "2026年7月新员工培训",
    startDate: "2026-07-01",
    deadline: "2026-07-31",
    status: "active" as const,
    createdAt: "2026-06-25T08:00:00.000Z",
  },
];

const SEED_EMPLOYEES: Array<Omit<Employee, "id" | "createdAt" | "status">> = [
  // 6月批次 — 大多已完成
  {
    name: "张明", employeeNo: "EMP2401", username: "13800001001",
    department: "市场部", position: "市场专员", phone: "13800001001",
    entryDate: "2026-06-01", batchId: "batch-2026-06", initialPassword: "123456",
  },
  {
    name: "李芳", employeeNo: "EMP2402", username: "13800001002",
    department: "研发部", position: "前端工程师", phone: "13800001002",
    entryDate: "2026-06-01", batchId: "batch-2026-06", initialPassword: "123456",
  },
  {
    name: "王强", employeeNo: "EMP2403", username: "13800001003",
    department: "销售部", position: "销售代表", phone: "13800001003",
    entryDate: "2026-06-03", batchId: "batch-2026-06", initialPassword: "123456",
  },
  {
    name: "赵雪", employeeNo: "EMP2404", username: "13800001004",
    department: "运营部", position: "运营专员", phone: "13800001004",
    entryDate: "2026-06-05", batchId: "batch-2026-06", initialPassword: "123456",
  },
  // 7月批次 — 进行中
  {
    name: "陈伟", employeeNo: "EMP2405", username: "13800001005",
    department: "市场部", position: "品牌策划", phone: "13800001005",
    entryDate: "2026-07-01", batchId: "batch-2026-07", initialPassword: "123456",
  },
  {
    name: "刘洋", employeeNo: "EMP2406", username: "13800001006",
    department: "财务部", position: "会计", phone: "13800001006",
    entryDate: "2026-07-03", batchId: "batch-2026-07", initialPassword: "123456",
  },
  {
    name: "周婷", employeeNo: "EMP2407", username: "13800001007",
    department: "人力资源部", position: "HR专员", phone: "13800001007",
    entryDate: "2026-07-10", batchId: "batch-2026-07", initialPassword: "123456",
  },
  {
    name: "吴磊", employeeNo: "EMP2408", username: "13800001008",
    department: "研发部", position: "后端工程师", phone: "13800001008",
    entryDate: "2026-07-15", batchId: "batch-2026-07", initialPassword: "123456",
  },
  {
    name: "孙丽", employeeNo: "EMP2409", username: "13800001009",
    department: "运营部", position: "内容运营", phone: "13800001009",
    entryDate: "2026-07-01", batchId: "batch-2026-07", initialPassword: "123456",
  },
  {
    name: "郑华", employeeNo: "EMP2410", username: "13800001010",
    department: "销售部", position: "大客户经理", phone: "13800001010",
    entryDate: "2026-07-05", batchId: "batch-2026-07", initialPassword: "123456",
  },
];

// ──────────────────────────────────────────────
// 模拟进度数据生成器
// ──────────────────────────────────────────────

/** 生成空规则进度 */
function emptyRules() {
  return {
    foundationViewed: [],
    rocketTargetsHit: [],
    culturePairsMatched: [],
    valueCatchCorrect: [],
    quizAnswered: [],
    quizCorrect: [],
    rulesGamesCompleted: { rocketBoss: false, valueMatch: false, valueCatch: false, quiz: false },
    completed: false,
  };
}

/** 为员工生成模拟进度并写入 localStorage */
function generateMockProgress(
  username: string,
  scenario: "all_done_certified" | "five_stages_cert_failed" | "four_stages" | "three_stages"
    | "two_stages" | "one_stage" | "just_started" | "not_started" | "all_done_certified_2" | "five_stages_no_cert",
): void {
  const key = getEmployeeProgressKey(username);
  // 如果已有数据则不覆盖
  try {
    if (window.localStorage.getItem(key)) return;
  } catch {
    return;
  }

  let progress: Record<string, unknown>;

  switch (scenario) {
    case "all_done_certified":
    case "all_done_certified_2": {
      const certScore = scenario === "all_done_certified" ? 92 : 88;
      progress = {
        welcome: { completed: true, completedAt: daysAgo(28) },
        company: { completed: true, completedAt: daysAgo(27) },
        culture: {
          started: true, completed: true,
          completedExhibits: ["long-hair", "logo-story", "rice-water", "technology-museum"],
          completedAt: daysAgo(25),
        },
        product: { completed: true, completedAt: daysAgo(22) },
        rules: {
          ...emptyRules(),
          rulesGamesCompleted: { rocketBoss: true, valueMatch: true, valueCatch: true, quiz: true },
          completed: true, completedAt: daysAgo(20),
        },
        certification: {
          attempts: 1, bestScore: certScore, passed: true,
          lastAttemptAt: daysAgo(18), score: certScore,
          weakAreas: [], answers: [],
        },
        learningWorldUnlocked: true,
        lastStage: "certification", lastSection: "result",
        lastVisitedAt: daysAgo(18),
        learningRecords: [
          { id: "r1", stageId: "welcome", title: "欢迎加入", type: "stage_complete", timestamp: daysAgo(28), date: "6/3", time: "已完成" },
          { id: "r2", stageId: "company", title: "认识长发小寨", type: "stage_complete", timestamp: daysAgo(27), date: "6/4", time: "已完成" },
          { id: "r3", stageId: "culture", title: "红瑶长发文化展区", type: "exhibit_complete", timestamp: daysAgo(26), date: "6/5", time: "已探索" },
          { id: "r4", stageId: "culture", title: "品牌 Logo 故事展区", type: "exhibit_complete", timestamp: daysAgo(26), date: "6/5", time: "已探索" },
          { id: "r5", stageId: "culture", title: "淘米水非遗技艺展区", type: "exhibit_complete", timestamp: daysAgo(25), date: "6/6", time: "已探索" },
          { id: "r6", stageId: "culture", title: "中国长发科技馆展区", type: "exhibit_complete", timestamp: daysAgo(25), date: "6/6", time: "已探索" },
          { id: "r7", stageId: "product", title: "认识产品与核心技术", type: "stage_complete", timestamp: daysAgo(22), date: "6/9", time: "已完成" },
          { id: "r8", stageId: "organization", title: "制度守卫战", type: "game_complete", timestamp: daysAgo(21), date: "6/10", time: "已完成" },
          { id: "r9", stageId: "organization", title: "价值观对对碰", type: "game_complete", timestamp: daysAgo(21), date: "6/10", time: "已完成" },
          { id: "r10", stageId: "organization", title: "小瑶接价值观", type: "game_complete", timestamp: daysAgo(20), date: "6/11", time: "已完成" },
          { id: "r11", stageId: "organization", title: "制度知识问答", type: "game_complete", timestamp: daysAgo(20), date: "6/11", time: "已完成" },
          { id: "r12", stageId: "organization", title: "认识组织与基础制度", type: "stage_complete", timestamp: daysAgo(20), date: "6/11", time: "已完成" },
          { id: "r13", stageId: "certification", title: `新人认证考试 — ${certScore}分`, type: "certification_attempt", timestamp: daysAgo(18), date: "6/13", time: "已通过" },
        ],
      };
      break;
    }

    case "five_stages_cert_failed": {
      progress = {
        welcome: { completed: true, completedAt: daysAgo(28) },
        company: { completed: true, completedAt: daysAgo(27) },
        culture: {
          started: true, completed: true,
          completedExhibits: ["long-hair", "logo-story", "rice-water", "technology-museum"],
          completedAt: daysAgo(24),
        },
        product: { completed: true, completedAt: daysAgo(21) },
        rules: {
          ...emptyRules(),
          rulesGamesCompleted: { rocketBoss: true, valueMatch: true, valueCatch: true, quiz: true },
          completed: true, completedAt: daysAgo(19),
        },
        certification: {
          attempts: 1, bestScore: 65, passed: false,
          lastAttemptAt: daysAgo(15), score: 65,
          weakAreas: ["品牌文化", "产品知识"], answers: [],
        },
        learningWorldUnlocked: false,
        lastStage: "certification", lastSection: "result",
        lastVisitedAt: daysAgo(10),
        learningRecords: [
          { id: "r1", stageId: "welcome", title: "欢迎加入", type: "stage_complete", timestamp: daysAgo(28), date: "6/3", time: "已完成" },
          { id: "r2", stageId: "company", title: "认识长发小寨", type: "stage_complete", timestamp: daysAgo(27), date: "6/4", time: "已完成" },
          { id: "r3", stageId: "culture", title: "云游博物馆", type: "stage_complete", timestamp: daysAgo(24), date: "6/7", time: "已完成" },
          { id: "r4", stageId: "product", title: "认识产品与核心技术", type: "stage_complete", timestamp: daysAgo(21), date: "6/10", time: "已完成" },
          { id: "r5", stageId: "organization", title: "认识组织与基础制度", type: "stage_complete", timestamp: daysAgo(19), date: "6/12", time: "已完成" },
          { id: "r6", stageId: "certification", title: "新人认证考试 — 65分", type: "certification_attempt", timestamp: daysAgo(15), date: "6/16", time: "未通过" },
        ],
      };
      break;
    }

    case "four_stages": {
      progress = {
        welcome: { completed: true, completedAt: daysAgo(20) },
        company: { completed: true, completedAt: daysAgo(19) },
        culture: {
          started: true, completed: true,
          completedExhibits: ["long-hair", "logo-story", "rice-water", "technology-museum"],
          completedAt: daysAgo(15),
        },
        product: { completed: true, completedAt: daysAgo(10) },
        rules: {
          ...emptyRules(),
          rulesGamesCompleted: { rocketBoss: true, valueMatch: true, valueCatch: false, quiz: false },
          completed: false,
        },
        certification: { attempts: 0, bestScore: 0, passed: false },
        learningWorldUnlocked: false,
        lastStage: "organization", lastSection: "valueCatch",
        lastVisitedAt: daysAgo(3),
        learningRecords: [
          { id: "r1", stageId: "welcome", title: "欢迎加入", type: "stage_complete", timestamp: daysAgo(20), date: "7/4", time: "已完成" },
          { id: "r2", stageId: "company", title: "认识长发小寨", type: "stage_complete", timestamp: daysAgo(19), date: "7/5", time: "已完成" },
          { id: "r3", stageId: "culture", title: "云游博物馆", type: "stage_complete", timestamp: daysAgo(15), date: "7/9", time: "已完成" },
          { id: "r4", stageId: "product", title: "认识产品与核心技术", type: "stage_complete", timestamp: daysAgo(10), date: "7/14", time: "已完成" },
          { id: "r5", stageId: "organization", title: "制度守卫战", type: "game_complete", timestamp: daysAgo(5), date: "7/19", time: "已完成" },
          { id: "r6", stageId: "organization", title: "价值观对对碰", type: "game_complete", timestamp: daysAgo(4), date: "7/20", time: "已完成" },
        ],
      };
      break;
    }

    case "three_stages": {
      progress = {
        welcome: { completed: true, completedAt: daysAgo(18) },
        company: { completed: true, completedAt: daysAgo(17) },
        culture: {
          started: true, completed: true,
          completedExhibits: ["long-hair", "logo-story", "rice-water", "technology-museum"],
          completedAt: daysAgo(12),
        },
        product: { completed: false },
        rules: emptyRules(),
        certification: { attempts: 0, bestScore: 0, passed: false },
        learningWorldUnlocked: false,
        lastStage: "product", lastSection: "hero",
        lastVisitedAt: daysAgo(5),
        learningRecords: [
          { id: "r1", stageId: "welcome", title: "欢迎加入", type: "stage_complete", timestamp: daysAgo(18), date: "7/6", time: "已完成" },
          { id: "r2", stageId: "company", title: "认识长发小寨", type: "stage_complete", timestamp: daysAgo(17), date: "7/7", time: "已完成" },
          { id: "r3", stageId: "culture", title: "云游博物馆", type: "stage_complete", timestamp: daysAgo(12), date: "7/12", time: "已完成" },
        ],
      };
      break;
    }

    case "two_stages": {
      progress = {
        welcome: { completed: true, completedAt: daysAgo(15) },
        company: { completed: true, completedAt: daysAgo(14) },
        culture: {
          started: true, completed: false,
          completedExhibits: ["long-hair", "logo-story"],
        },
        product: { completed: false },
        rules: emptyRules(),
        certification: { attempts: 0, bestScore: 0, passed: false },
        learningWorldUnlocked: false,
        lastStage: "culture", lastSection: "rice-water",
        lastVisitedAt: daysAgo(2),
        learningRecords: [
          { id: "r1", stageId: "welcome", title: "欢迎加入", type: "stage_complete", timestamp: daysAgo(15), date: "7/9", time: "已完成" },
          { id: "r2", stageId: "company", title: "认识长发小寨", type: "stage_complete", timestamp: daysAgo(14), date: "7/10", time: "已完成" },
          { id: "r3", stageId: "culture", title: "红瑶长发文化展区", type: "exhibit_complete", timestamp: daysAgo(5), date: "7/19", time: "已探索" },
          { id: "r4", stageId: "culture", title: "品牌 Logo 故事展区", type: "exhibit_complete", timestamp: daysAgo(3), date: "7/21", time: "已探索" },
        ],
      };
      break;
    }

    case "one_stage": {
      progress = {
        welcome: { completed: true, completedAt: daysAgo(10) },
        company: { completed: false },
        culture: { started: false, completedExhibits: [], completed: false },
        product: { completed: false },
        rules: emptyRules(),
        certification: { attempts: 0, bestScore: 0, passed: false },
        learningWorldUnlocked: false,
        lastStage: "company", lastSection: "intro",
        lastVisitedAt: daysAgo(3),
        learningRecords: [
          { id: "r1", stageId: "welcome", title: "欢迎加入", type: "stage_complete", timestamp: daysAgo(10), date: "7/14", time: "已完成" },
        ],
      };
      break;
    }

    case "just_started": {
      progress = {
        welcome: { completed: false },
        company: { completed: false },
        culture: { started: false, completedExhibits: [], completed: false },
        product: { completed: false },
        rules: emptyRules(),
        certification: { attempts: 0, bestScore: 0, passed: false },
        learningWorldUnlocked: false,
        lastStage: "welcome", lastSection: "intro",
        lastVisitedAt: daysAgo(1),
        learningRecords: [],
      };
      break;
    }

    case "five_stages_no_cert": {
      progress = {
        welcome: { completed: true, completedAt: daysAgo(15) },
        company: { completed: true, completedAt: daysAgo(14) },
        culture: {
          started: true, completed: true,
          completedExhibits: ["long-hair", "logo-story", "rice-water", "technology-museum"],
          completedAt: daysAgo(10),
        },
        product: { completed: true, completedAt: daysAgo(7) },
        rules: {
          ...emptyRules(),
          rulesGamesCompleted: { rocketBoss: true, valueMatch: true, valueCatch: true, quiz: true },
          completed: true, completedAt: daysAgo(3),
        },
        certification: { attempts: 0, bestScore: 0, passed: false },
        learningWorldUnlocked: false,
        lastStage: "certification", lastSection: "intro",
        lastVisitedAt: daysAgo(1),
        learningRecords: [
          { id: "r1", stageId: "welcome", title: "欢迎加入", type: "stage_complete", timestamp: daysAgo(15), date: "7/9", time: "已完成" },
          { id: "r2", stageId: "company", title: "认识长发小寨", type: "stage_complete", timestamp: daysAgo(14), date: "7/10", time: "已完成" },
          { id: "r3", stageId: "culture", title: "云游博物馆", type: "stage_complete", timestamp: daysAgo(10), date: "7/14", time: "已完成" },
          { id: "r4", stageId: "product", title: "认识产品与核心技术", type: "stage_complete", timestamp: daysAgo(7), date: "7/17", time: "已完成" },
          { id: "r5", stageId: "organization", title: "制度守卫战", type: "game_complete", timestamp: daysAgo(5), date: "7/19", time: "已完成" },
          { id: "r6", stageId: "organization", title: "价值观对对碰", type: "game_complete", timestamp: daysAgo(4), date: "7/20", time: "已完成" },
          { id: "r7", stageId: "organization", title: "小瑶接价值观", type: "game_complete", timestamp: daysAgo(4), date: "7/20", time: "已完成" },
          { id: "r8", stageId: "organization", title: "制度知识问答", type: "game_complete", timestamp: daysAgo(3), date: "7/21", time: "已完成" },
          { id: "r9", stageId: "organization", title: "认识组织与基础制度", type: "stage_complete", timestamp: daysAgo(3), date: "7/21", time: "已完成" },
        ],
      };
      break;
    }

    case "not_started":
    default: {
      progress = {
        welcome: { completed: false },
        company: { completed: false },
        culture: { started: false, completedExhibits: [], completed: false },
        product: { completed: false },
        rules: emptyRules(),
        certification: { attempts: 0, bestScore: 0, passed: false },
        learningWorldUnlocked: false,
        learningRecords: [],
      };
      break;
    }
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

// ──────────────────────────────────────────────
// 初始化入口
// ──────────────────────────────────────────────

export function createSeedData(): AdminStoreData {
  // 生成员工完整数据（带 id 和 createdAt）
  const employees: Employee[] = SEED_EMPLOYEES.map((e, i) => ({
    ...e,
    id: `emp-seed-${String(i + 1).padStart(2, "0")}`,
    status: "active",
    createdAt: new Date(`2026-${e.batchId === "batch-2026-06" ? "05" : "06"}-25T08:00:00.000Z`).toISOString(),
  }));

  // 批次数据
  const batches = SEED_BATCHES.map((b) => ({
    ...b,
    employeeIds: employees.filter((e) => e.batchId === b.id).map((e) => e.id),
    createdAt: b.createdAt,
  })) as AdminStoreData["batches"];

  const scenarioMap: Record<string, string> = {
    "13800001001": "all_done_certified",
    "13800001002": "five_stages_cert_failed",
    "13800001003": "four_stages",
    "13800001004": "three_stages",
    "13800001005": "two_stages",
    "13800001006": "one_stage",
    "13800001007": "just_started",
    "13800001008": "not_started",
    "13800001009": "all_done_certified_2",
    "13800001010": "five_stages_no_cert",
  };

  for (const emp of employees) {
    const scenario = scenarioMap[emp.username] ?? "not_started";
    generateMockProgress(emp.username, scenario as Parameters<typeof generateMockProgress>[1]);
  }

  return {
    admins: [
      {
        id: "admin-super-01",
        name: "超级管理员",
        username: "admin",
        passwordHash: hashPassword("admin123"),
        role: "super",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "admin-viewer-01",
        name: "查看管理员",
        username: "viewer",
        passwordHash: hashPassword("viewer123"),
        role: "viewer",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    employees,
    batches,
    records: [],
    actions: [
      {
        id: "action-seed-01",
        adminId: "admin-super-01",
        adminName: "超级管理员",
        action: "初始化系统",
        targetType: "admin",
        targetId: "system",
        targetName: "系统",
        details: "管理后台系统初始化，创建默认管理员账号和示例数据",
        timestamp: "2026-01-01T00:00:00.000Z",
      },
    ],
    version: 1,
  };
}
