/**
 * 管理后台 — 主布局
 *
 * 结构：240px 浅色左侧导航 + 64px 顶部工具栏 + 表格主区域
 * 不含：小瑶、成长地图、游戏徽章、大型 Hero、黑色侧边栏
 */

import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  TrendingUp,
  Award,
  History,
  Download,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useAdminAuth, canEdit } from "../auth";
import { ensureStoreInitialized, isStoreInitialized, useAdminDataSync } from "../store";
import { createSeedData } from "../seed";
import { isApiMode } from "../../lib/api";
import "../admin.css";

export type AdminPageId =
  | "dashboard"
  | "employees"
  | "batches"
  | "progress"
  | "certification"
  | "history"
  | "reports"
  | "settings";

const NAV_ITEMS: { page: AdminPageId; label: string; icon: LucideIcon }[] = [
  { page: "dashboard", label: "总览", icon: LayoutDashboard },
  { page: "employees", label: "新人管理", icon: Users },
  { page: "batches", label: "培训批次", icon: CalendarDays },
  { page: "progress", label: "学习进度", icon: TrendingUp },
  { page: "certification", label: "认证管理", icon: Award },
  { page: "history", label: "学习记录", icon: History },
  { page: "reports", label: "数据导出", icon: Download },
  { page: "settings", label: "管理员设置", icon: Settings },
];

const PAGE_TITLES: Record<AdminPageId, string> = {
  dashboard: "总览",
  employees: "新人管理",
  batches: "培训批次",
  progress: "学习进度",
  certification: "认证管理",
  history: "学习记录",
  reports: "数据导出",
  settings: "管理员设置",
};

export function AdminShell({
  currentPage,
  onNavigate,
  children,
}: {
  currentPage: AdminPageId;
  onNavigate: (page: AdminPageId) => void;
  children: ReactNode;
}) {
  // 初始化 store（仅 localStorage 降级模式需要）；API 模式自动同步后端数据
  useEffect(() => {
    if (!isApiMode() && !isStoreInitialized()) {
      ensureStoreInitialized(createSeedData);
    }
  }, []);

  // API 模式：组件挂载时自动从后端拉取 employees/batches/admins
  useAdminDataSync();

  const { admin, isAuthenticated, logout } = useAdminAuth();

  if (!isAuthenticated || !admin) {
    // 由外层路由处理重定向到 login，这里不渲染
    return null;
  }

  const isSuperAdmin = canEdit(admin);

  return (
    <div className="flex h-screen bg-[#F9F6F0]">
      {/* ── 侧边栏 ── */}
      <aside className="flex w-[240px] flex-shrink-0 flex-col border-r border-stone-200 bg-[#F7F5F0]">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b0453a] text-sm font-bold text-white">
            长
          </div>
          <span className="text-sm font-semibold text-stone-700">长发小寨 · 培训管理</span>
        </div>

        {/* 导航 */}
        <nav className="admin-scroll flex-1 overflow-y-auto px-3 py-2">
          <div className="mb-1 px-2 py-1 text-xs font-medium uppercase tracking-wide text-stone-400">
            管理
          </div>
          {NAV_ITEMS.filter((item) => isSuperAdmin || item.page !== "settings").map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`admin-nav-item mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 ${isActive ? "active" : ""}`}
              >
                <Icon size={17} className="admin-nav-icon text-stone-400" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* 底部管理员信息 */}
        <div className="border-t border-stone-200 px-3 py-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b0453a]/10 text-sm font-medium text-[#b0453a]">
              {admin.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-stone-700">{admin.name}</p>
              <p className="text-xs text-stone-400">
                {admin.role === "super" ? "超级管理员" : "查看管理员"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-stone-200/50 hover:text-stone-700"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      {/* ── 主区域 ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-stone-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-stone-800">
            {PAGE_TITLES[currentPage]}
          </h1>
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <span className="text-stone-400">
              {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </header>

        {/* 内容区 */}
        <main className="admin-scroll flex-1 overflow-y-auto p-6">
          <div className="admin-fade-in mx-auto max-w-[1200px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
