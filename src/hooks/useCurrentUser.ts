/**
 * 全系统用户身份唯一入口
 * 所有组件读取用户姓名 / 部门 / 登录账号时必须经过此模块，禁止直接 localStorage.getItem("cfxz-user-name")
 *
 * 双模式支持：
 * - API 模式（VITE_API_BASE_URL 已配置）：JWT token 认证，用户信息从后端获取，localStorage 作为会话缓存
 * - 降级模式（VITE_API_BASE_URL 未配置）：纯 localStorage 读取（兼容现有演示流程）
 */

import { useSyncExternalStore } from "react";
import {
  isApiMode,
  authApi,
  getEmployeeToken,
  clearEmployeeToken,
  type EmployeeLoginResponse,
} from "../lib/api";

export const USER_STORAGE_KEYS = {
  name: "cfxz-user-name",
  department: "cfxz-user-department",
  session: "cfxz-login-session",
  username: "cfxz-user-username", // 登录账号（API 模式下为手机号，与后台 Employee.phone 对齐）
  employeeId: "cfxz-user-employee-id", // 后台员工记录 ID（API 模式下为数据库 UUID）
  position: "cfxz-user-position",
  phone: "cfxz-user-phone",
  batchName: "cfxz-user-batch-name",
  entryDate: "cfxz-user-entry-date",
} as const;

const DEFAULT_NAME = "新员工";

// ═══════════════════════════════════════════════
// 响应式缓存版本（触发 useCurrentUser 重渲染）
// ═══════════════════════════════════════════════

const VERSION_EVENT = "cfxz-user-cache-update";
let cacheVersion = 0;

function bumpCacheVersion(): void {
  cacheVersion++;
  try {
    window.dispatchEvent(new Event(VERSION_EVENT));
  } catch {
    // ignore
  }
}

function subscribeUser(callback: () => void): () => void {
  window.addEventListener(VERSION_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(VERSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getUserSnapshot(): number {
  return cacheVersion;
}

// ═══════════════════════════════════════════════
// 同步读取函数（组件外也可调用）
// ═══════════════════════════════════════════════

/** 读取当前用户姓名 */
export function getCurrentUserName(): string {
  try {
    return window.localStorage.getItem(USER_STORAGE_KEYS.name) || DEFAULT_NAME;
  } catch {
    return DEFAULT_NAME;
  }
}

/** 读取当前用户部门 */
export function getCurrentUserDepartment(): string {
  try {
    return window.localStorage.getItem(USER_STORAGE_KEYS.department) || "";
  } catch {
    return "";
  }
}

/** 读取当前用户登录账号（API 模式下为手机号） */
export function getCurrentUserUsername(): string {
  try {
    return window.localStorage.getItem(USER_STORAGE_KEYS.username) || "";
  } catch {
    return "";
  }
}

/** 读取当前用户后台员工 ID */
export function getCurrentUserEmployeeId(): string {
  try {
    return window.localStorage.getItem(USER_STORAGE_KEYS.employeeId) || "";
  } catch {
    return "";
  }
}

/** 读取当前用户职位 */
export function getCurrentUserPosition(): string {
  try {
    return window.localStorage.getItem(USER_STORAGE_KEYS.position) || "";
  } catch {
    return "";
  }
}

/** 读取当前用户手机号 */
export function getCurrentUserPhone(): string {
  try {
    return window.localStorage.getItem(USER_STORAGE_KEYS.phone) || "";
  } catch {
    return "";
  }
}

/** 读取当前用户培训批次名称 */
export function getCurrentUserBatchName(): string {
  try {
    return window.localStorage.getItem(USER_STORAGE_KEYS.batchName) || "";
  } catch {
    return "";
  }
}

// ═══════════════════════════════════════════════
// 登录状态检查
// ═══════════════════════════════════════════════

/** 检查用户是否已登录（API 模式检查 JWT token，降级模式检查 session 标记） */
export function isLoggedIn(): boolean {
  if (isApiMode()) {
    return !!getEmployeeToken();
  }
  try {
    return window.localStorage.getItem(USER_STORAGE_KEYS.session) === "1";
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════
// 用户信息写入 / 清除（供 LoginPage 调用）
// ═══════════════════════════════════════════════

/** API 登录成功后保存用户信息到 localStorage 缓存 */
export function saveCurrentUser(user: EmployeeLoginResponse["user"]): void {
  try {
    window.localStorage.setItem(USER_STORAGE_KEYS.session, "1");
    window.localStorage.setItem(USER_STORAGE_KEYS.name, user.name);
    window.localStorage.setItem(USER_STORAGE_KEYS.phone, user.phone);
    window.localStorage.setItem(USER_STORAGE_KEYS.username, user.phone); // API 模式下 username = phone
    window.localStorage.setItem(USER_STORAGE_KEYS.employeeId, user.id);

    const optionalFields: Array<[string, string | null]> = [
      [USER_STORAGE_KEYS.department, user.department],
      [USER_STORAGE_KEYS.position, user.position],
      [USER_STORAGE_KEYS.batchName, user.batchName],
      [USER_STORAGE_KEYS.entryDate, user.entryDate],
    ];
    for (const [key, value] of optionalFields) {
      if (value) {
        window.localStorage.setItem(key, value);
      } else {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
  bumpCacheVersion();
}

/** 清除当前用户信息（登出时调用） */
export function clearCurrentUser(): void {
  const keys = Object.values(USER_STORAGE_KEYS);
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  if (isApiMode()) {
    clearEmployeeToken();
  }
  bumpCacheVersion();
}

/**
 * 从后端刷新当前用户信息（仅 API 模式下有效）
 * 当页面刷新后 localStorage 有 token 但用户信息可能过期时调用
 * @returns true 表示刷新成功，false 表示失败（token 无效或非 API 模式）
 */
export async function refreshCurrentUser(): Promise<boolean> {
  if (!isApiMode()) return false;
  const token = getEmployeeToken();
  if (!token) return false;
  try {
    const me = await authApi.getMe("employee");
    if (me.role === "employee") {
      saveCurrentUser(me.user);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════
// React Hooks
// ═══════════════════════════════════════════════

/**
 * 用户身份信息 Hook（同步读取，供组件使用）
 * 通过 useSyncExternalStore 订阅缓存版本变更，当 saveCurrentUser / clearCurrentUser / refreshCurrentUser 被调用时自动重渲染
 */
export function useCurrentUser() {
  // 订阅缓存版本变更，确保用户信息更新时组件重渲染
  useSyncExternalStore(subscribeUser, getUserSnapshot, () => 0);

  const name = getCurrentUserName();
  const department = getCurrentUserDepartment();
  const username = getCurrentUserUsername();
  const employeeId = getCurrentUserEmployeeId();
  const position = getCurrentUserPosition();
  const phone = getCurrentUserPhone();
  const batchName = getCurrentUserBatchName();
  const firstChar = name.charAt(0);
  const subtitle = department
    ? position
      ? `${department} · ${position}`
      : `${department} · 新员工`
    : "新员工";
  return { name, department, username, employeeId, position, phone, batchName, firstChar, subtitle };
}
