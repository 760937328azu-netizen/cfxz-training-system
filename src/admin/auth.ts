/**
 * 管理后台 -- 认证与会话管理（双模式：API + localStorage 降级）
 *
 * 职责：
 * 1. 管理员登录验证（API 模式: JWT / localStorage 模式: cyrb53）
 * 2. 会话持久化
 * 3. 提供当前管理员信息
 * 4. 登出
 */

import { useSyncExternalStore } from "react";
import type { AdminAccount } from "./types";
import { getAdminByUsername, verifyPassword, updateAdmin, getAdminById } from "./store";
import { isApiMode, authApi, setAdminToken, clearAdminToken, getAdminToken, ApiError } from "../lib/api";

// ──────────────────────────────────────────────
// 常量
// ──────────────────────────────────────────────

const SESSION_KEY = "cfxz-admin-session";
const ADMIN_CACHE_KEY = "cfxz-admin-cache";
const AUTH_EVENT = "cfxz-admin-auth-change";

type SessionData = {
  adminId: string;
  loginAt: string;
};

// ──────────────────────────────────────────────
// 会话读写（localStorage 降级模式用）
// ──────────────────────────────────────────────

function readSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

function writeSession(data: SessionData | null): void {
  if (typeof window === "undefined") return;
  if (data) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// ──────────────────────────────────────────────
// 管理员信息缓存（API 模式用）
// ──────────────────────────────────────────────

function saveAdminCache(admin: {
  id: string;
  name: string;
  username: string;
  role: "super" | "viewer";
}): void {
  try {
    const cached: AdminAccount = {
      ...admin,
      passwordHash: "",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function readAdminCache(): AdminAccount | null {
  try {
    const raw = window.localStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminAccount;
  } catch {
    return null;
  }
}

function clearAdminCache(): void {
  try {
    window.localStorage.removeItem(ADMIN_CACHE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// ──────────────────────────────────────────────
// 订阅
// ──────────────────────────────────────────────

function subscribeAuth(callback: () => void): () => void {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// ──────────────────────────────────────────────
// 登录 / 登出
// ──────────────────────────────────────────────

export type LoginResult = {
  success: boolean;
  error?: string;
  admin?: AdminAccount;
};

export async function login(username: string, password: string): Promise<LoginResult> {
  if (isApiMode()) {
    // API 模式：调用后端验证
    try {
      const res = await authApi.adminLogin(username, password);
      setAdminToken(res.token);
      const admin: AdminAccount = {
        id: res.admin.id,
        name: res.admin.name,
        username: res.admin.username,
        role: res.admin.role,
        status: "active",
        passwordHash: "",
        createdAt: new Date().toISOString(),
      };
      saveAdminCache(admin);
      return { success: true, admin };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return { success: false, error: "用户名或密码错误" };
        if (err.status === 403) return { success: false, error: "该账号已被停用" };
        return { success: false, error: err.message || "登录失败" };
      }
      return { success: false, error: "网络错误，请检查网络连接" };
    }
  }

  // localStorage 降级模式
  const admin = getAdminByUsername(username);
  if (!admin) {
    return { success: false, error: "用户名不存在或已被停用" };
  }
  if (admin.status === "disabled") {
    return { success: false, error: "该账号已被停用" };
  }
  if (!verifyPassword(password, admin.passwordHash)) {
    return { success: false, error: "密码错误" };
  }

  // 更新最后登录时间
  const loginAt = new Date().toISOString();
  updateAdmin(admin.id, { lastLoginAt: loginAt });

  // 创建会话
  writeSession({ adminId: admin.id, loginAt });

  return {
    success: true,
    admin: { ...admin, lastLoginAt: loginAt },
  };
}

export function logout(): void {
  if (isApiMode()) {
    clearAdminToken();
    clearAdminCache();
    return;
  }
  writeSession(null);
}

// ──────────────────────────────────────────────
// 当前管理员
// ──────────────────────────────────────────────

export function getCurrentAdmin(): AdminAccount | null {
  if (isApiMode()) {
    return readAdminCache();
  }
  const session = readSession();
  if (!session) return null;
  return getAdminById(session.adminId) ?? null;
}

export function isAuthenticated(): boolean {
  if (isApiMode()) {
    return getAdminToken() !== null;
  }
  return getCurrentAdmin() !== null;
}

// ──────────────────────────────────────────────
// React Hook
// ──────────────────────────────────────────────

let authSnapshot: { admin: AdminAccount | null; isAuthenticated: boolean } = {
  admin: null,
  isAuthenticated: false,
};

function getAuthSnapshot(): { admin: AdminAccount | null; isAuthenticated: boolean } {
  const admin = getCurrentAdmin();
  const next = { admin, isAuthenticated: admin !== null };
  if (
    authSnapshot.admin?.id !== next.admin?.id ||
    authSnapshot.isAuthenticated !== next.isAuthenticated
  ) {
    authSnapshot = next;
  }
  return authSnapshot;
}

const emptyAuth = { admin: null, isAuthenticated: false };

export function useAdminAuth(): {
  admin: AdminAccount | null;
  isAuthenticated: boolean;
  login: typeof login;
  logout: typeof logout;
} {
  const { admin, isAuthenticated } = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    () => emptyAuth,
  );
  return { admin, isAuthenticated, login, logout };
}

// ──────────────────────────────────────────────
// 权限检查
// ──────────────────────────────────────────────

export function canEdit(admin: AdminAccount | null): boolean {
  return admin?.role === "super";
}

export function canView(admin: AdminAccount | null): boolean {
  return admin !== null;
}

export function canExport(admin: AdminAccount | null): boolean {
  return admin !== null; // super 和 viewer 都可以导出
}
