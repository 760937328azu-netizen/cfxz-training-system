/**
 * 管理后台 — 学习记录
 *
 * 只记录关键事件：登录/开始关卡/完成关卡/完成游戏/提交认证/认证通过或未通过/学习天地解锁/管理员重置
 */

import { useState, useMemo, useEffect } from "react";
import { useAdminStore, fetchEvents, fetchLogs } from "../store";
import { isApiMode } from "../../lib/api";
import type { AdminLearningRecord, LearningEventType } from "../types";
import { SearchInput, Badge, EmptyState } from "../components/UI";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";

const EVENT_CONFIG: Record<LearningEventType, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" | "primary" }> = {
  login: { label: "登录", variant: "neutral" },
  stage_start: { label: "开始关卡", variant: "info" },
  stage_complete: { label: "完成关卡", variant: "success" },
  game_complete: { label: "完成游戏", variant: "success" },
  cert_submit: { label: "提交认证", variant: "info" },
  cert_passed: { label: "认证通过", variant: "success" },
  cert_failed: { label: "认证未通过", variant: "danger" },
  world_unlocked: { label: "学习天地解锁", variant: "primary" },
  admin_reset: { label: "管理员重置", variant: "warning" },
};

export function HistoryPage() {
  const store = useAdminStore();

  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("");

  // API 模式：挂载时从后端拉取学习事件和管理员操作日志
  useEffect(() => {
    if (!isApiMode()) return;
    fetchEvents().catch(() => {});
    fetchLogs().catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return store.records.filter((rec) => {
      if (search) {
        const q = search.toLowerCase();
        if (!rec.employeeName.toLowerCase().includes(q)) return false;
      }
      if (eventFilter && rec.event !== eventFilter) return false;
      return true;
    });
  }, [store.records, search, eventFilter]);

  const columns: Column<AdminLearningRecord>[] = [
    {
      key: "timestamp",
      label: "时间",
      width: "180px",
      render: (rec) => (
        <span className="text-stone-500">
          {new Date(rec.timestamp).toLocaleString("zh-CN")}
        </span>
      ),
    },
    {
      key: "employeeName",
      label: "员工",
      render: (rec) => <span className="font-medium text-stone-700">{rec.employeeName}</span>,
    },
    {
      key: "event",
      label: "事件类型",
      render: (rec) => {
        const config = EVENT_CONFIG[rec.event] ?? { label: rec.event, variant: "neutral" as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "result",
      label: "详情",
      render: (rec) => (
        <span className="text-stone-500">{rec.result ?? "-"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="搜索员工姓名"
          value={search}
          onChange={setSearch}
          className="w-64"
        />
        <select
          className="admin-input rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
        >
          <option value="">全部事件</option>
          {Object.entries(EVENT_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        <div className="flex-1" />
        <span className="text-sm text-stone-400">共 {filtered.length} 条记录</span>
      </div>

      {/* 表格 */}
      <AdminTable
        columns={columns}
        data={filtered}
        rowKey={(rec) => rec.id}
        emptyIcon={<EmptyState title="暂无记录" />}
        emptyTitle="暂无学习记录"
        emptyDescription="员工学习过程中的关键事件将在此显示"
        maxHeight="600px"
      />
    </div>
  );
}
