/**
 * 管理后台 — 存储层
 *
 * 职责：
 * 1. 管理 cfxz-admin-store-v1 的 CRUD
 * 2. 读取/重置员工个人进度（cfxz-phase3-learning-progress-v2-${username}）
 * 3. 提供 React Hook useAdminStore 实现响应式更新
 * 4. Dashboard 统计计算
 * 5. CSV 导出
 */

import { useSyncExternalStore, useEffect, useRef } from "react";
import type {
  AdminAccount,
  AdminAction,
  AdminLearningRecord,
  AdminStageId,
  AdminStoreData,
  Batch,
  DashboardStats,
  Employee,
  EmployeeProgress,
  LearningEventType,
  StoreSnapshot,
} from "./types";
import { ADMIN_STAGES } from "./types";
import {
  isApiMode,
  employeeApi,
  batchApi,
  adminApi,
  dashboardApi,
  exportApi,
} from "../lib/api";
import type {
  EmployeeListItem,
  BatchItem,
  AdminUserItem,
  DashboardStatsResponse,
  EmployeeDetailProgress,
  AdminLog,
  LearningEventItem,
  CreateEmployeeResponse,
} from "../lib/api";

// ──────────────────────────────────────────────
// 常量
// ──────────────────────────────────────────────

const STORE_KEY = "cfxz-admin-store-v1";
const EVENT_NAME = "cfxz-admin-store-change";
const PROGRESS_KEY_PREFIX = "cfxz-phase3-learning-progress-v2";

// ──────────────────────────────────────────────
// 密码哈希（cyrb53 — MVP 用，非密码学安全）
// ──────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = "cfxz-admin-v1";
  const input = salt + password;
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

export function generateId(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ──────────────────────────────────────────────
// Store 读写
// ──────────────────────────────────────────────

let memorySnapshot: StoreSnapshot = {
  admins: [],
  employees: [],
  batches: [],
  records: [],
  actions: [],
};
let memoryRaw = "";
let initialized = false;

function readStoreRaw(): AdminStoreData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminStoreData;
  } catch {
    return null;
  }
}

function readStore(): StoreSnapshot {
  if (typeof window === "undefined") return memorySnapshot;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return memorySnapshot;
    if (raw === memoryRaw) return memorySnapshot;
    const data = JSON.parse(raw) as AdminStoreData;
    memorySnapshot = {
      admins: data.admins ?? [],
      employees: data.employees ?? [],
      batches: data.batches ?? [],
      records: data.records ?? [],
      actions: data.actions ?? [],
    };
    memoryRaw = raw;
    return memorySnapshot;
  } catch {
    return memorySnapshot;
  }
}

function writeStore(data: AdminStoreData): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(data);
  window.localStorage.setItem(STORE_KEY, raw);
  memoryRaw = raw;
  memorySnapshot = {
    admins: data.admins,
    employees: data.employees,
    batches: data.batches,
    records: data.records,
    actions: data.actions,
  };
  window.dispatchEvent(new Event(EVENT_NAME));
}

function mutate(fn: (data: AdminStoreData) => AdminStoreData): void {
  const current = readStoreRaw() ?? {
    admins: [],
    employees: [],
    batches: [],
    records: [],
    actions: [],
    version: 1,
  };
  writeStore(fn(current));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

// ──────────────────────────────────────────────
// React Hook
// ──────────────────────────────────────────────

const emptySnapshot: StoreSnapshot = {
  admins: [],
  employees: [],
  batches: [],
  records: [],
  actions: [],
};

export function useAdminStore(): StoreSnapshot {
  return useSyncExternalStore(subscribe, readStore, () => emptySnapshot);
}

// ──────────────────────────────────────────────
// 初始化检查
// ──────────────────────────────────────────────

export function isStoreInitialized(): boolean {
  if (initialized) return true;
  if (typeof window === "undefined") return false;
  initialized = window.localStorage.getItem(STORE_KEY) !== null;
  return initialized;
}

export function ensureStoreInitialized(seedFn: () => AdminStoreData): void {
  if (isStoreInitialized()) return;
  const data = seedFn();
  writeStore(data);
  initialized = true;
}

// ──────────────────────────────────────────────
// 管理员 CRUD
// ──────────────────────────────────────────────

export function createAdmin(data: {
  name: string;
  username: string;
  password: string;
  role: AdminAccount["role"];
}): AdminAccount {
  const admin: AdminAccount = {
    id: generateId("admin"),
    name: data.name,
    username: data.username,
    passwordHash: hashPassword(data.password),
    role: data.role,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  mutate((d) => ({ ...d, admins: [...d.admins, admin] }));
  return admin;
}

export function updateAdmin(
  id: string,
  updates: Partial<Pick<AdminAccount, "name" | "username" | "role" | "status" | "passwordHash" | "lastLoginAt">>,
): void {
  mutate((d) => ({
    ...d,
    admins: d.admins.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  }));
}

export function deleteAdmin(id: string): void {
  mutate((d) => ({
    ...d,
    admins: d.admins.filter((a) => a.id !== id),
  }));
}

export function getAdminByUsername(username: string): AdminAccount | undefined {
  return readStore().admins.find((a) => a.username === username && a.status === "active");
}

export function getAdminById(id: string): AdminAccount | undefined {
  return readStore().admins.find((a) => a.id === id);
}

// ──────────────────────────────────────────────
// 员工 CRUD
// ──────────────────────────────────────────────

export function createEmployee(
  data: Omit<Employee, "id" | "createdAt" | "status"> & { status?: Employee["status"] },
): Employee {
  const employee: Employee = {
    ...data,
    id: generateId("emp"),
    status: data.status ?? "active",
    createdAt: new Date().toISOString(),
  };
  mutate((d) => ({ ...d, employees: [...d.employees, employee] }));
  if (employee.batchId) {
    addEmployeeToBatch(employee.batchId, employee.id);
  }
  return employee;
}

export function updateEmployee(id: string, updates: Partial<Employee>): void {
  mutate((d) => ({
    ...d,
    employees: d.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
  }));
}

export function deleteEmployee(id: string): void {
  const emp = readStore().employees.find((e) => e.id === id);
  mutate((d) => ({
    ...d,
    employees: d.employees.filter((e) => e.id !== id),
    batches: d.batches.map((b) =>
      b.employeeIds.includes(id)
        ? { ...b, employeeIds: b.employeeIds.filter((eid) => eid !== id) }
        : b,
    ),
  }));
  if (emp?.username) {
    try {
      window.localStorage.removeItem(getEmployeeProgressKey(emp.username));
    } catch {
      // ignore
    }
  }
}

/**
 * 清空所有员工及其个人进度/记录。
 *
 * 用于演示场景一键重置。会同步删除：
 * - employees 列表中的全部员工
 * - 每个员工 username 对应的 cfxz-phase3-learning-progress-v2-${username} 进度记录
 * - 与这些员工相关的 store 内学习记录（records）和管理员操作记录（actions 中的 employee target）
 *
 * 注意：批次（batches）和管理员账号（admins）不会被清空。
 */
export function clearAllEmployees(): { deletedCount: number } {
  const store = readStore();
  const emps = store.employees;
  const ids = new Set(emps.map((e) => e.id));

  // 删除每个员工对应的 localStorage 进度键
  for (const emp of emps) {
    if (emp.username) {
      try {
        window.localStorage.removeItem(getEmployeeProgressKey(emp.username));
      } catch {
        // ignore
      }
    }
  }

  mutate((d) => ({
    ...d,
    employees: [],
    batches: d.batches.map((b) => ({ ...b, employeeIds: [] })),
    records: d.records.filter((r) => !ids.has(r.employeeId)),
    actions: d.actions.filter(
      (a) => !(a.targetType === "employee" && ids.has(a.targetId)),
    ),
  }));

  return { deletedCount: emps.length };
}

export function getEmployee(id: string): Employee | undefined {
  return readStore().employees.find((e) => e.id === id);
}

export function getEmployeesByBatch(batchId: string): Employee[] {
  return readStore().employees.filter((e) => e.batchId === batchId);
}

// ──────────────────────────────────────────────
// 批次 CRUD
// ──────────────────────────────────────────────

export function createBatch(data: {
  name: string;
  startDate: string;
  deadline: string;
}): Batch {
  const batch: Batch = {
    id: generateId("batch"),
    name: data.name,
    startDate: data.startDate,
    deadline: data.deadline,
    employeeIds: [],
    status: "active",
    createdAt: new Date().toISOString(),
  };
  mutate((d) => ({ ...d, batches: [...d.batches, batch] }));
  return batch;
}

export function updateBatch(id: string, updates: Partial<Batch>): void {
  mutate((d) => ({
    ...d,
    batches: d.batches.map((b) => (b.id === id ? { ...b, ...updates } : b)),
  }));
}

export function deleteBatch(id: string): void {
  mutate((d) => ({
    ...d,
    batches: d.batches.filter((b) => b.id !== id),
    employees: d.employees.map((e) => (e.batchId === id ? { ...e, batchId: "" } : e)),
  }));
}

export function addEmployeeToBatch(batchId: string, employeeId: string): void {
  mutate((d) => ({
    ...d,
    batches: d.batches.map((b) =>
      b.id === batchId && !b.employeeIds.includes(employeeId)
        ? { ...b, employeeIds: [...b.employeeIds, employeeId] }
        : b,
    ),
    employees: d.employees.map((e) => (e.id === employeeId ? { ...e, batchId } : e)),
  }));
}

export function removeEmployeeFromBatch(batchId: string, employeeId: string): void {
  mutate((d) => ({
    ...d,
    batches: d.batches.map((b) =>
      b.id === batchId
        ? { ...b, employeeIds: b.employeeIds.filter((eid) => eid !== employeeId) }
        : b,
    ),
    employees: d.employees.map((e) =>
      e.id === employeeId && e.batchId === batchId ? { ...e, batchId: "" } : e,
    ),
  }));
}

// ──────────────────────────────────────────────
// 员工进度读取
// ──────────────────────────────────────────────

export function getEmployeeProgressKey(username: string): string {
  return `${PROGRESS_KEY_PREFIX}-${username}`;
}

function readRawProgress(username: string): Record<string, unknown> | null {
  try {
    const key = getEmployeeProgressKey(username);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// API 模式：员工进度缓存（从后端获取后缓存在内存中）
// ──────────────────────────────────────────────

const apiProgressCache = new Map<string, EmployeeProgress>();
const apiDashboardCache: { stats: DashboardStats | null } = { stats: null };
const apiRecordsCache = new Map<string, AdminLearningRecord[]>();

function defaultProgress(employeeId: string): EmployeeProgress {
  return {
    employeeId,
    welcome: { status: "pending" },
    company: { status: "pending" },
    culture: { status: "pending", completedExhibits: [] },
    product: { status: "pending" },
    rules: {
      status: "pending",
      games: { regulation: false, compliance: false, culture: false, knowledge: false },
    },
    certification: { status: "locked", attempts: [], bestScore: 0 },
    learningWorldUnlocked: false,
    completedCount: 0,
    overallPercent: 0,
    currentStageLabel: ADMIN_STAGES[0].label,
  };
}

function mapProgress(employeeId: string, raw: Record<string, unknown>): EmployeeProgress {
  const welcome = (raw.welcome as { completed?: boolean; completedAt?: string }) ?? {};
  const company = (raw.company as { completed?: boolean; completedAt?: string }) ?? {};
  const culture = (raw.culture as {
    started?: boolean; completed?: boolean; completedExhibits?: string[]; completedAt?: string;
  }) ?? {};
  const product = (raw.product as { completed?: boolean; completedAt?: string }) ?? {};
  const rules = (raw.rules as {
    completed?: boolean; completedAt?: string; rulesGamesCompleted?: Record<string, boolean>;
  }) ?? {};
  const cert = (raw.certification as {
    attempts?: number; bestScore?: number; passed?: boolean; lastAttemptAt?: string;
    score?: number; weakAreas?: string[];
  }) ?? {};

  const gamesCompleted = rules.rulesGamesCompleted ?? {};
  const anyGameDone = Object.values(gamesCompleted).some(Boolean);

  const welcomeDone = Boolean(welcome.completed);
  const companyDone = Boolean(company.completed);
  const cultureDone = Boolean(culture.completed);
  const productDone = Boolean(product.completed);
  const rulesDone = Boolean(rules.completed);
  const allStagesDone = welcomeDone && companyDone && cultureDone && productDone && rulesDone;

  let certStatus: EmployeeProgress["certification"]["status"];
  if (cert.passed) certStatus = "passed";
  else if ((cert.attempts ?? 0) > 0) certStatus = "failed";
  else if (allStagesDone) certStatus = "in_progress";
  else certStatus = "locked";

  let completedCount = 0;
  if (welcomeDone) completedCount++;
  if (companyDone) completedCount++;
  if (cultureDone) completedCount++;
  if (productDone) completedCount++;
  if (rulesDone) completedCount++;
  if (cert.passed) completedCount++;

  let currentStageLabel = ADMIN_STAGES[0].label;
  for (const stage of ADMIN_STAGES) {
    if (stage.id === "welcome" && !welcomeDone) { currentStageLabel = stage.label; break; }
    if (stage.id === "company" && !companyDone) { currentStageLabel = stage.label; break; }
    if (stage.id === "culture" && !cultureDone) { currentStageLabel = stage.label; break; }
    if (stage.id === "product" && !productDone) { currentStageLabel = stage.label; break; }
    if (stage.id === "rules" && !rulesDone) { currentStageLabel = stage.label; break; }
    if (stage.id === "certification" && !cert.passed) { currentStageLabel = stage.label; break; }
  }
  if (completedCount === 6) currentStageLabel = "已全部完成";

  return {
    employeeId,
    welcome: { status: welcomeDone ? "completed" : "pending", completedAt: welcome.completedAt },
    company: { status: companyDone ? "completed" : "pending", completedAt: company.completedAt },
    culture: {
      status: cultureDone ? "completed" : culture.started ? "in_progress" : "pending",
      completedExhibits: culture.completedExhibits ?? [],
      completedAt: culture.completedAt,
    },
    product: { status: productDone ? "completed" : "pending", completedAt: product.completedAt },
    rules: {
      status: rulesDone ? "completed" : anyGameDone ? "in_progress" : "pending",
      games: {
        regulation: Boolean(gamesCompleted.rocketBoss),
        compliance: Boolean(gamesCompleted.valueCatch),
        culture: Boolean(gamesCompleted.valueMatch),
        knowledge: Boolean(gamesCompleted.quiz),
      },
      completedAt: rules.completedAt,
    },
    certification: {
      status: certStatus,
      attempts: cert.lastAttemptAt
        ? [{
            attemptNo: cert.attempts ?? 1,
            score: cert.score ?? cert.bestScore ?? 0,
            passed: Boolean(cert.passed),
            weakAreas: cert.weakAreas ?? [],
            submittedAt: cert.lastAttemptAt,
          }]
        : [],
      bestScore: cert.bestScore ?? 0,
    },
    lastStage: raw.lastStage as string | undefined,
    lastSection: raw.lastSection as string | undefined,
    lastVisitedAt: raw.lastVisitedAt as string | undefined,
    learningWorldUnlocked: Boolean(raw.learningWorldUnlocked),
    completedCount,
    overallPercent: Math.round((completedCount / 6) * 100),
    currentStageLabel,
  };
}

export function getEmployeeProgress(employee: Employee): EmployeeProgress {
  if (isApiMode()) {
    return apiProgressCache.get(employee.id) ?? defaultProgress(employee.id);
  }
  const raw = readRawProgress(employee.username);
  if (!raw) return defaultProgress(employee.id);
  return mapProgress(employee.id, raw);
}

export function getEmployeesProgress(employees: Employee[]): Map<string, EmployeeProgress> {
  const map = new Map<string, EmployeeProgress>();
  for (const emp of employees) map.set(emp.id, getEmployeeProgress(emp));
  return map;
}

// ──────────────────────────────────────────────
// 员工进度重置
// ──────────────────────────────────────────────

function modifyEmployeeProgress(
  username: string,
  modifier: (raw: Record<string, unknown>) => Record<string, unknown>,
): void {
  const key = getEmployeeProgressKey(username);
  let raw: Record<string, unknown>;
  try {
    const stored = window.localStorage.getItem(key);
    raw = stored ? JSON.parse(stored) : {};
  } catch {
    raw = {};
  }
  const next = modifier(raw);
  window.localStorage.setItem(key, JSON.stringify(next));
}

export function resetEmployeeStage(
  employee: Employee,
  stageId: AdminStageId,
  adminName: string,
): void {
  modifyEmployeeProgress(employee.username, (raw) => {
    const next = { ...raw };
    switch (stageId) {
      case "welcome":
        next.welcome = { completed: false };
        break;
      case "company":
        next.company = { completed: false };
        break;
      case "culture":
        next.culture = { started: false, completedExhibits: [], completed: false };
        break;
      case "product":
        next.product = { completed: false };
        break;
      case "rules":
        next.rules = {
          foundationViewed: [],
          rocketTargetsHit: [],
          culturePairsMatched: [],
          valueCatchCorrect: [],
          quizAnswered: [],
          quizCorrect: [],
          rulesGamesCompleted: { rocketBoss: false, valueMatch: false, valueCatch: false, quiz: false },
          completed: false,
        };
        break;
      case "certification":
        next.certification = { attempts: 0, bestScore: 0, passed: false };
        next.learningWorldUnlocked = false;
        break;
    }
    return next;
  });

  const stageLabel = ADMIN_STAGES.find((s) => s.id === stageId)?.label ?? stageId;
  logAdminAction({
    adminName,
    action: `重置关卡：${stageLabel}`,
    targetType: "employee",
    targetId: employee.id,
    targetName: employee.name,
  });
  addLearningRecord({
    employeeId: employee.id,
    employeeName: employee.name,
    event: "admin_reset",
    stageId,
    result: `管理员 ${adminName} 重置了 ${stageLabel}`,
  });
}

export function resetEmployeeAllProgress(employee: Employee, adminName: string): void {
  const key = getEmployeeProgressKey(employee.username);
  const initial = {
    welcome: { completed: false },
    company: { completed: false },
    culture: { started: false, completedExhibits: [], completed: false },
    product: { completed: false },
    rules: {
      foundationViewed: [], rocketTargetsHit: [], culturePairsMatched: [],
      valueCatchCorrect: [], quizAnswered: [], quizCorrect: [],
      rulesGamesCompleted: { rocketBoss: false, valueMatch: false, valueCatch: false, quiz: false },
      completed: false,
    },
    learningRecords: [],
    certification: { attempts: 0, bestScore: 0, passed: false },
    learningWorldUnlocked: false,
  };
  window.localStorage.setItem(key, JSON.stringify(initial));

  logAdminAction({
    adminName, action: "重置全部进度",
    targetType: "employee", targetId: employee.id, targetName: employee.name,
  });
  addLearningRecord({
    employeeId: employee.id, employeeName: employee.name,
    event: "admin_reset", result: `管理员 ${adminName} 重置了全部进度`,
  });
}

export function resetEmployeeCertification(employee: Employee, adminName: string): void {
  modifyEmployeeProgress(employee.username, (raw) => ({
    ...raw,
    certification: { attempts: 0, bestScore: 0, passed: false },
    learningWorldUnlocked: false,
  }));

  logAdminAction({
    adminName, action: "重置认证次数",
    targetType: "employee", targetId: employee.id, targetName: employee.name,
  });
  addLearningRecord({
    employeeId: employee.id, employeeName: employee.name,
    event: "admin_reset", stageId: "certification",
    result: `管理员 ${adminName} 重置了认证次数`,
  });
}

// ──────────────────────────────────────────────
// 管理员操作记录 & 学习记录
// ──────────────────────────────────────────────

export function logAdminAction(data: {
  adminId?: string;
  adminName: string;
  action: string;
  targetType: AdminAction["targetType"];
  targetId: string;
  targetName?: string;
  details?: string;
}): void {
  // API 模式下由后端自动记录操作日志，前端无需手动写入
  if (isApiMode()) return;
  const action: AdminAction = {
    id: generateId("action"),
    adminId: data.adminId ?? "",
    adminName: data.adminName,
    action: data.action,
    targetType: data.targetType,
    targetId: data.targetId,
    targetName: data.targetName,
    details: data.details,
    timestamp: new Date().toISOString(),
  };
  mutate((d) => ({ ...d, actions: [action, ...d.actions].slice(0, 500) }));
}

export function addLearningRecord(data: {
  employeeId: string;
  employeeName: string;
  event: LearningEventType;
  stageId?: string;
  result?: string;
}): void {
  // API 模式下由后端自动记录学习事件，前端无需手动写入
  if (isApiMode()) return;
  const record: AdminLearningRecord = {
    id: generateId("rec"),
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    event: data.event,
    stageId: data.stageId,
    result: data.result,
    timestamp: new Date().toISOString(),
  };
  mutate((d) => ({ ...d, records: [record, ...d.records].slice(0, 2000) }));
}

export function getEmployeeRecords(employee: Employee): AdminLearningRecord[] {
  if (isApiMode() && apiRecordsCache.has(employee.id)) {
    return apiRecordsCache.get(employee.id)!;
  }
  const storeRecords = readStore().records.filter((r) => r.employeeId === employee.id);
  const raw = readRawProgress(employee.username);
  const empRecords: AdminLearningRecord[] = [];
  if (raw && Array.isArray(raw.learningRecords)) {
    const stageTitleMap: Record<string, string> = {
      welcome: "欢迎加入", company: "认识长发小寨", culture: "云游博物馆",
      product: "认识产品", organization: "制度闯关", certification: "入职认证",
    };
    for (const rec of raw.learningRecords as Array<Record<string, unknown>>) {
      const type = rec.type as string;
      const stageId = rec.stageId as string;
      let event: LearningEventType = "stage_complete";
      let result: string | undefined;
      if (type === "stage_complete") {
        event = "stage_complete";
        result = `完成 ${stageTitleMap[stageId] ?? stageId}`;
      } else if (type === "exhibit_complete") {
        event = "stage_complete";
        result = `完成展区 ${rec.title ?? ""}`;
      } else if (type === "game_complete") {
        event = "game_complete";
        result = `完成游戏 ${rec.title ?? ""}`;
      } else if (type === "certification_attempt") {
        const title = rec.title as string;
        event = title?.includes("已通过") ? "cert_passed" : "cert_failed";
        result = title;
      } else if (type === "section_viewed") {
        event = "stage_start";
        result = `浏览 ${rec.title ?? ""}`;
      }
      empRecords.push({
        id: rec.id as string, employeeId: employee.id, employeeName: employee.name,
        event, stageId, result, timestamp: rec.timestamp as string,
      });
    }
  }
  return [...storeRecords, ...empRecords].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

// ──────────────────────────────────────────────
// Dashboard 统计
// ──────────────────────────────────────────────

export function getDashboardStats(): DashboardStats {
  if (isApiMode() && apiDashboardCache.stats) {
    return apiDashboardCache.stats;
  }
  const store = readStore();
  const employees = store.employees.filter((e) => e.status === "active");
  const progressMap = getEmployeesProgress(employees);

  let learningCount = 0;
  let completedAllStages = 0;
  let certifiedCount = 0;
  let notStartedCount = 0;
  let overdueCount = 0;

  const stageDist = ADMIN_STAGES.map((s) => ({
    stageId: s.id, label: s.label, completed: 0, inProgress: 0, pending: 0,
  }));

  const attentionList: DashboardStats["attentionList"] = [];
  const now = new Date();

  for (const emp of employees) {
    const prog = progressMap.get(emp.id);
    if (!prog) continue;

    if (prog.completedCount === 0) {
      notStartedCount++;
    } else if (prog.completedCount < 6 || prog.certification.status !== "passed") {
      learningCount++;
    }

    const sixStagesDone =
      prog.welcome.status === "completed" &&
      prog.company.status === "completed" &&
      prog.culture.status === "completed" &&
      prog.product.status === "completed" &&
      prog.rules.status === "completed";

    if (sixStagesDone) completedAllStages++;
    if (prog.certification.status === "passed") certifiedCount++;

    for (const sd of stageDist) {
      const stageProg = prog[sd.stageId as keyof EmployeeProgress] as { status?: string };
      if (stageProg && typeof stageProg === "object" && "status" in stageProg) {
        const status = stageProg.status;
        if (status === "completed") sd.completed++;
        else if (status === "in_progress") sd.inProgress++;
        else if (status === "pending" || status === "locked") sd.pending++;
      }
    }

    const batch = store.batches.find((b) => b.id === emp.batchId);
    if (batch && batch.status === "active" && prog.completedCount < 6) {
      const deadline = new Date(batch.deadline);
      if (deadline < now) {
        const daysOverdue = Math.floor((now.getTime() - deadline.getTime()) / 86400000);
        overdueCount++;
        attentionList.push({
          employee: emp,
          reason: `培训已超期 ${daysOverdue} 天`,
          daysOverdue,
        });
      }
    }

    // 认证未通过也需关注
    if (prog.certification.status === "failed") {
      attentionList.push({
        employee: emp,
        reason: "认证未通过，需关注",
      });
    }
  }

  return {
    totalEmployees: employees.length,
    learningCount,
    completedAllStages,
    certifiedCount,
    notStartedCount,
    overdueCount,
    stageDistribution: stageDist,
    attentionList: attentionList.slice(0, 20),
  };
}

// ──────────────────────────────────────────────
// CSV 导出
// ──────────────────────────────────────────────

export function exportEmployeesCSV(
  employees: Employee[],
  progressMap: Map<string, EmployeeProgress>,
  batchMap: Map<string, Batch>,
): string {
  const headers = [
    "姓名", "工号", "登录账号", "部门", "岗位", "入职日期",
    "培训批次", "当前关卡", "整体进度(%)", "认证状态",
    "最后学习时间", "账号状态",
  ];
  const rows = employees.map((emp) => {
    const prog = progressMap.get(emp.id);
    const batch = emp.batchId ? batchMap.get(emp.batchId) : undefined;
    const certStatus = prog
      ? prog.certification.status === "passed"
        ? "已通过"
        : prog.certification.status === "failed"
          ? "未通过"
          : prog.certification.status === "in_progress"
            ? "待认证"
            : "未解锁"
      : "未知";
    return [
      emp.name,
      emp.employeeNo,
      emp.username,
      emp.department,
      emp.position,
      emp.entryDate,
      batch?.name ?? "未分配",
      prog?.currentStageLabel ?? "未知",
      prog?.overallPercent.toString() ?? "0",
      certStatus,
      prog?.lastVisitedAt ? new Date(prog.lastVisitedAt).toLocaleString("zh-CN") : "无记录",
      emp.status === "active" ? "正常" : "已停用",
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  // 添加 BOM 以支持 Excel 正确显示中文
  return "\uFEFF" + csv;
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════
// API 模式：映射函数
// ═══════════════════════════════════════════════

function mapApiEmployeeToEmployee(item: EmployeeListItem): Employee {
  return {
    id: item.id,
    name: item.name,
    employeeNo: item.employeeNo ?? "",
    username: item.phone,
    department: item.department ?? "",
    position: item.position ?? "",
    phone: item.phone,
    entryDate: item.entryDate ?? "",
    batchId: item.batchId ?? "",
    initialPassword: "",
    status: item.status === "active" ? "active" : "disabled",
    createdAt: item.createdAt,
  };
}

function mapApiBatchToBatch(item: BatchItem): Batch {
  return {
    id: item.id,
    name: item.name,
    startDate: item.startDate,
    deadline: item.deadline,
    employeeIds: [],
    status: item.status === "active" ? "active" : "closed",
    createdAt: item.createdAt,
  };
}

function mapApiAdminToAdmin(item: AdminUserItem): AdminAccount {
  return {
    id: item.id,
    name: item.name,
    username: item.username,
    passwordHash: "",
    role: item.role,
    status: item.status === "active" ? "active" : "disabled",
    lastLoginAt: item.lastLoginAt ?? undefined,
    createdAt: item.createdAt,
  };
}

function mapCreatedEmployee(res: CreateEmployeeResponse): Employee {
  return {
    id: res.employee.id,
    name: res.employee.name,
    employeeNo: res.employee.employeeNo ?? "",
    username: res.employee.phone,
    department: res.employee.department ?? "",
    position: res.employee.position ?? "",
    phone: res.employee.phone,
    entryDate: res.employee.entryDate ?? "",
    batchId: res.employee.batchId ?? "",
    initialPassword: res.initialPassword,
    status: "active",
    createdAt: new Date().toISOString(),
  };
}

function mapDetailToProgress(employeeId: string, detail: EmployeeDetailProgress): EmployeeProgress {
  const stagesMap = new Map(detail.stages.map((s) => [s.stageId, s]));
  const gamesMap = new Map(detail.games.map((g) => [g.gameKey, g]));
  const certs = detail.certifications;
  const bestScore = certs.length > 0 ? Math.max(...certs.map((c) => c.score)) : 0;
  const passed = certs.some((c) => c.passed);
  const attemptCount = certs.length;

  const welcomeDone = stagesMap.get("welcome")?.status === "completed";
  const companyDone = stagesMap.get("company")?.status === "completed";
  const cultureDone = stagesMap.get("culture")?.status === "completed";
  const productDone = stagesMap.get("product")?.status === "completed";
  const rulesDone = stagesMap.get("rules")?.status === "completed";
  const allStagesDone = welcomeDone && companyDone && cultureDone && productDone && rulesDone;

  let certStatus: EmployeeProgress["certification"]["status"];
  if (passed) certStatus = "passed";
  else if (attemptCount > 0) certStatus = "failed";
  else if (allStagesDone) certStatus = "in_progress";
  else certStatus = "locked";

  let completedCount = 0;
  if (welcomeDone) completedCount++;
  if (companyDone) completedCount++;
  if (cultureDone) completedCount++;
  if (productDone) completedCount++;
  if (rulesDone) completedCount++;
  if (passed) completedCount++;

  let currentStageLabel = ADMIN_STAGES[0].label;
  for (const stage of ADMIN_STAGES) {
    if (stage.id === "welcome" && !welcomeDone) { currentStageLabel = stage.label; break; }
    if (stage.id === "company" && !companyDone) { currentStageLabel = stage.label; break; }
    if (stage.id === "culture" && !cultureDone) { currentStageLabel = stage.label; break; }
    if (stage.id === "product" && !productDone) { currentStageLabel = stage.label; break; }
    if (stage.id === "rules" && !rulesDone) { currentStageLabel = stage.label; break; }
    if (stage.id === "certification" && !passed) { currentStageLabel = stage.label; break; }
  }
  if (completedCount === 6) currentStageLabel = "已全部完成";

  const rocketBossDone = Boolean(gamesMap.get("rocketBoss")?.completed);
  const valueCatchDone = Boolean(gamesMap.get("valueCatch")?.completed);
  const valueMatchDone = Boolean(gamesMap.get("valueMatch")?.completed);
  const quizDone = Boolean(gamesMap.get("quiz")?.completed);
  const anyGameDone = rocketBossDone || valueCatchDone || valueMatchDone || quizDone;

  return {
    employeeId,
    welcome: {
      status: welcomeDone ? "completed" : "pending",
      completedAt: stagesMap.get("welcome")?.completedAt ?? undefined,
    },
    company: {
      status: companyDone ? "completed" : "pending",
      completedAt: stagesMap.get("company")?.completedAt ?? undefined,
    },
    culture: {
      status: cultureDone ? "completed" : stagesMap.get("culture")?.status === "in_progress" ? "in_progress" : "pending",
      completedExhibits: stagesMap.get("culture")?.completedExhibits ?? [],
      completedAt: stagesMap.get("culture")?.completedAt ?? undefined,
    },
    product: {
      status: productDone ? "completed" : "pending",
      completedAt: stagesMap.get("product")?.completedAt ?? undefined,
    },
    rules: {
      status: rulesDone ? "completed" : anyGameDone ? "in_progress" : "pending",
      games: {
        regulation: rocketBossDone,
        compliance: valueCatchDone,
        culture: valueMatchDone,
        knowledge: quizDone,
      },
      completedAt: stagesMap.get("rules")?.completedAt ?? undefined,
    },
    certification: {
      status: certStatus,
      attempts: certs.map((c, i) => ({
        attemptNo: i + 1,
        score: c.score,
        passed: c.passed,
        weakAreas: c.weakAreas,
        submittedAt: c.submittedAt,
      })),
      bestScore,
    },
    lastStage: detail.progress?.currentStage,
    lastSection: detail.progress?.lastSection ?? undefined,
    lastVisitedAt: detail.progress?.lastVisitedAt ?? undefined,
    learningWorldUnlocked: detail.progress?.learningWorldUnlocked ?? false,
    completedCount,
    overallPercent: Math.round((completedCount / 6) * 100),
    currentStageLabel,
  };
}

function mapDashboardResponse(res: DashboardStatsResponse): DashboardStats {
  const stageDist = ADMIN_STAGES.map((s) => {
    const apiDist = res.stageDistribution.find((d) => d.stageId === s.id);
    return {
      stageId: s.id,
      label: s.label,
      completed: apiDist?.completed ?? 0,
      inProgress: apiDist?.inProgress ?? 0,
      pending: apiDist?.pending ?? 0,
    };
  });

  return {
    totalEmployees: res.totalEmployees,
    learningCount: res.learningCount,
    completedAllStages: res.completedAllStages,
    certifiedCount: res.certifiedCount,
    notStartedCount: res.notStartedCount,
    overdueCount: res.overdueCount,
    stageDistribution: stageDist,
    attentionList: res.attentionList.map((a) => ({
      employee: {
        id: a.employee.id,
        name: a.employee.name,
        employeeNo: "",
        username: a.employee.phone,
        department: a.employee.department ?? "",
        position: "",
        phone: a.employee.phone,
        entryDate: "",
        batchId: "",
        initialPassword: "",
        status: "active" as const,
        createdAt: "",
      },
      reason: a.reason,
      daysOverdue: a.daysOverdue,
    })),
  };
}

// ═══════════════════════════════════════════════
// API 模式：数据刷新
// ═══════════════════════════════════════════════

export async function refreshAdminCache(): Promise<void> {
  if (!isApiMode()) return;

  try {
    const [empRes, batchRes, adminRes] = await Promise.all([
      employeeApi.list({ pageSize: 1000 }),
      batchApi.list(),
      adminApi.listUsers(),
    ]);

    const employees = empRes.employees.map(mapApiEmployeeToEmployee);
    const batches = batchRes.batches.map(mapApiBatchToBatch);

    // Fill in employeeIds for batches from employee data
    for (const batch of batches) {
      batch.employeeIds = employees.filter((e) => e.batchId === batch.id).map((e) => e.id);
    }
    const admins = adminRes.admins.map(mapApiAdminToAdmin);

    const current = readStoreRaw() ?? {
      admins: [],
      employees: [],
      batches: [],
      records: [],
      actions: [],
      version: 1,
    };
    writeStore({
      ...current,
      employees,
      batches,
      admins,
    });
  } catch {
    // Silently fail -- local cache will be used
  }
}

export function useAdminDataSync(): void {
  const ref = useRef(false);
  useEffect(() => {
    if (!isApiMode()) return;
    if (ref.current) return;
    ref.current = true;
    refreshAdminCache().catch(() => {});
  }, []);
}

// ═══════════════════════════════════════════════
// API 模式：异步数据获取
// ═══════════════════════════════════════════════

export async function fetchDashboardStats(): Promise<void> {
  if (!isApiMode()) return;
  try {
    const res = await dashboardApi.getStats();
    apiDashboardCache.stats = mapDashboardResponse(res);
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // ignore
  }
}

export async function fetchEmployeeProgress(employee: Employee): Promise<void> {
  if (!isApiMode()) return;
  try {
    const detail = await exportApi.progressJSON(employee.id);
    const progress = mapDetailToProgress(employee.id, detail);
    apiProgressCache.set(employee.id, progress);

    // Also cache records from events
    const records: AdminLearningRecord[] = detail.events.map((e) => ({
      id: e.id,
      employeeId: employee.id,
      employeeName: employee.name,
      event: e.eventType as LearningEventType,
      stageId: e.stageId ?? undefined,
      result: e.result,
      timestamp: e.createdAt,
    }));
    apiRecordsCache.set(employee.id, records);

    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // ignore
  }
}

export async function fetchEmployeeProgressBatch(employees: Employee[]): Promise<void> {
  if (!isApiMode()) return;
  await Promise.all(employees.map((e) => fetchEmployeeProgress(e)));
}

export async function fetchLogs(params?: {
  page?: number;
  pageSize?: number;
  targetType?: string;
}): Promise<AdminLog[]> {
  if (!isApiMode()) return [];
  try {
    const res = await adminApi.getLogs(params);
    const actions: AdminAction[] = res.logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      adminName: log.adminName,
      action: log.action,
      targetType: log.targetType as AdminAction["targetType"],
      targetId: log.targetId,
      targetName: log.targetName ?? undefined,
      details: log.details ?? undefined,
      timestamp: log.createdAt,
    }));
    const current = readStoreRaw();
    if (current) {
      writeStore({ ...current, actions });
    }
    return res.logs;
  } catch {
    return [];
  }
}

export async function fetchEvents(params?: {
  page?: number;
  pageSize?: number;
  userId?: string;
  eventType?: string;
}): Promise<LearningEventItem[]> {
  if (!isApiMode()) return [];
  try {
    const res = await adminApi.getEvents(params);
    const records: AdminLearningRecord[] = res.events.map((e) => ({
      id: e.id,
      employeeId: e.userId,
      employeeName: e.userName,
      event: e.eventType as LearningEventType,
      stageId: e.stageId ?? undefined,
      result: e.result,
      timestamp: e.createdAt,
    }));
    const current = readStoreRaw();
    if (current) {
      writeStore({ ...current, records });
    }
    return res.events;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════
// API 模式：异步 CRUD 操作
// ═══════════════════════════════════════════════

export async function apiCreateEmployee(
  data: Omit<Employee, "id" | "createdAt" | "status"> & { status?: Employee["status"] },
): Promise<{ employee: Employee; initialPassword: string }> {
  const res = await employeeApi.create({
    name: data.name,
    phone: data.phone,
    employeeNo: data.employeeNo || undefined,
    department: data.department || undefined,
    position: data.position || undefined,
    entryDate: data.entryDate || undefined,
    batchId: data.batchId || undefined,
    initialPassword: data.initialPassword || undefined,
  });
  const employee = mapCreatedEmployee(res);
  await refreshAdminCache();
  return { employee, initialPassword: res.initialPassword };
}

export async function apiUpdateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
  await employeeApi.update(id, {
    name: updates.name,
    phone: updates.phone,
    employeeNo: updates.employeeNo,
    department: updates.department,
    position: updates.position,
    entryDate: updates.entryDate,
    batchId: updates.batchId,
    status: updates.status as "active" | "disabled" | undefined,
    resetPassword: updates.initialPassword || undefined,
  });
  await refreshAdminCache();
}

export async function apiDeleteEmployee(id: string): Promise<void> {
  await employeeApi.delete(id);
  apiProgressCache.delete(id);
  apiRecordsCache.delete(id);
  await refreshAdminCache();
}

export async function apiClearAllEmployees(): Promise<{ deletedCount: number }> {
  const store = readStore();
  const count = store.employees.length;
  // Delete each employee via API
  await Promise.all(store.employees.map((e) => employeeApi.delete(e.id)));
  apiProgressCache.clear();
  apiRecordsCache.clear();
  await refreshAdminCache();
  return { deletedCount: count };
}

export async function apiCreateBatch(data: {
  name: string;
  startDate: string;
  deadline: string;
}): Promise<Batch> {
  const res = await batchApi.create(data);
  await refreshAdminCache();
  return mapApiBatchToBatch(res.batch);
}

export async function apiUpdateBatch(id: string, updates: Partial<Batch>): Promise<void> {
  await batchApi.update(id, {
    name: updates.name,
    startDate: updates.startDate,
    deadline: updates.deadline,
    status: updates.status as "active" | "closed" | undefined,
  });
  await refreshAdminCache();
}

export async function apiDeleteBatch(id: string): Promise<void> {
  await batchApi.delete(id);
  await refreshAdminCache();
}

export async function apiAddEmployeeToBatch(
  batchId: string,
  employeeId: string,
): Promise<void> {
  await employeeApi.update(employeeId, { batchId });
  await refreshAdminCache();
}

export async function apiRemoveEmployeeFromBatch(
  _batchId: string,
  employeeId: string,
): Promise<void> {
  await employeeApi.update(employeeId, { batchId: null });
  await refreshAdminCache();
}

export async function apiCreateAdmin(data: {
  name: string;
  username: string;
  password: string;
  role: AdminAccount["role"];
}): Promise<AdminAccount> {
  const res = await adminApi.createUser(data);
  await refreshAdminCache();
  return mapApiAdminToAdmin(res.admin);
}

export async function apiUpdateAdmin(
  id: string,
  updates: Partial<Pick<AdminAccount, "name" | "username" | "role" | "status" | "passwordHash">> & {
    password?: string;
    resetPassword?: boolean;
  },
): Promise<void> {
  await adminApi.updateUser(id, {
    name: updates.name,
    username: updates.username,
    role: updates.role,
    status: updates.status as "active" | "disabled" | undefined,
    password: updates.password || updates.passwordHash || undefined,
  });
  await refreshAdminCache();
}

export async function apiDeleteAdmin(id: string): Promise<void> {
  await adminApi.deleteUser(id);
  await refreshAdminCache();
}

export async function apiResetEmployeeStage(
  employee: Employee,
  _stageId: AdminStageId,
  _adminName: string,
): Promise<void> {
  // 后端目前只有全量重置接口，暂用全量重置替代单关卡重置
  await employeeApi.resetProgress(employee.id);
  await fetchEmployeeProgress(employee);
}

export async function apiResetEmployeeAllProgress(
  employee: Employee,
  _adminName: string,
): Promise<void> {
  await employeeApi.resetProgress(employee.id);
  await fetchEmployeeProgress(employee);
}

export async function apiResetEmployeeCertification(
  employee: Employee,
  _adminName: string,
): Promise<void> {
  // 后端目前只有全量重置接口，暂用全量重置替代认证重置
  await employeeApi.resetProgress(employee.id);
  await fetchEmployeeProgress(employee);
}

export async function apiExportEmployeesCSV(): Promise<Blob> {
  return exportApi.employeesCSV();
}

export async function apiBatchCreateEmployees(
  employees: Array<{
    name: string;
    phone: string;
    employeeNo?: string;
    department?: string;
    position?: string;
    entryDate?: string;
  }>,
  batchId?: string,
): Promise<{ results: Array<{ name: string; phone: string; password: string; success: boolean; error?: string }> }> {
  const res = await employeeApi.batchCreate(employees, batchId);
  await refreshAdminCache();
  return res;
}
