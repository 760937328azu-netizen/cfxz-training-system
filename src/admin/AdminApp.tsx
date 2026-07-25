/**
 * 管理后台 — 路由入口
 *
 * 检测 hash 路由中的 admin/* 路径，渲染对应的管理后台页面。
 * 未登录时重定向到 admin/login。
 */

import { useCallback, useEffect } from "react";
import { useHashRoute } from "../hooks/useHashRoute";
import { useAdminAuth } from "./auth";
import { AdminShell, type AdminPageId } from "./components/AdminShell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { BatchesPage } from "./pages/BatchesPage";
import { ProgressPage } from "./pages/ProgressPage";
import { CertificationPage } from "./pages/CertificationPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";

export function AdminApp() {
  const { route, navigate } = useHashRoute();
  const { isAuthenticated } = useAdminAuth();

  const adminPage = route.name === "admin" ? route.page : "login";

  const handleNavigate = useCallback(
    (page: AdminPageId) => {
      navigate(`/admin/${page}`);
    },
    [navigate],
  );

  // 已认证但停在 login 页 → 自动跳转到 dashboard
  useEffect(() => {
    if (isAuthenticated && adminPage === "login") {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, adminPage, navigate]);

  // 未登录 → 显示登录页
  if (!isAuthenticated || adminPage === "login") {
    return <LoginPage />;
  }

  const pageId = adminPage as AdminPageId;

  return (
    <AdminShell currentPage={pageId} onNavigate={handleNavigate}>
      {pageId === "dashboard" && <DashboardPage />}
      {pageId === "employees" && <EmployeesPage />}
      {pageId === "batches" && <BatchesPage />}
      {pageId === "progress" && <ProgressPage />}
      {pageId === "certification" && <CertificationPage />}
      {pageId === "history" && <HistoryPage />}
      {pageId === "reports" && <ReportsPage />}
      {pageId === "settings" && <SettingsPage />}
    </AdminShell>
  );
}
