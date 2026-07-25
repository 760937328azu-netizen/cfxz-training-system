/**
 * 管理后台 — 总览页
 *
 * 展示：6 个统计卡片 + 六关进度分布 + 需要关注的新人列表
 */

import { useMemo, useEffect, useState } from "react";
import { Users, GraduationCap, Award, Clock, AlertTriangle, BookOpen } from "lucide-react";
import { useAdminStore, getDashboardStats, fetchDashboardStats } from "../store";
import { isApiMode } from "../../lib/api";
import type { DashboardStats } from "../types";
import { StatCard, Card, ProgressBar, EmptyState } from "../components/UI";
import type { Column } from "../components/AdminTable";
import { AdminTable } from "../components/AdminTable";

export function DashboardPage() {
  const store = useAdminStore();
  const [apiLoading, setApiLoading] = useState(false);

  // API 模式：挂载时从后端拉取 dashboard 数据
  useEffect(() => {
    if (!isApiMode()) return;
    setApiLoading(true);
    fetchDashboardStats()
      .catch(() => {})
      .finally(() => setApiLoading(false));
  }, []);

  const stats: DashboardStats = useMemo(() => getDashboardStats(), [store, apiLoading]);

  return (
    <div className="space-y-6">
      {/* ── 统计卡片 ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          title="新人总数"
          value={stats.totalEmployees}
          icon={<Users size={20} />}
          color="stone"
        />
        <StatCard
          title="正在学习"
          value={stats.learningCount}
          icon={<BookOpen size={20} />}
          color="blue"
          subtitle="已开始但未完成全部关卡"
        />
        <StatCard
          title="已完成六关"
          value={stats.completedAllStages}
          icon={<GraduationCap size={20} />}
          color="green"
          subtitle="前五关 + 认证全部通过"
        />
        <StatCard
          title="已通过认证"
          value={stats.certifiedCount}
          icon={<Award size={20} />}
          color="purple"
        />
        <StatCard
          title="尚未开始"
          value={stats.notStartedCount}
          icon={<Clock size={20} />}
          color="amber"
        />
        <StatCard
          title="超期未完成"
          value={stats.overdueCount}
          icon={<AlertTriangle size={20} />}
          color="red"
          subtitle="已超过批次截止日期"
        />
      </div>

      {/* ── 六关进度分布 ── */}
      <Card title="六关进度分布">
        <div className="space-y-4">
          {stats.stageDistribution.map((stage) => {
            const total = stage.completed + stage.inProgress + stage.pending;
            const completedPct = total > 0 ? Math.round((stage.completed / total) * 100) : 0;
            return (
              <div key={stage.stageId}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">{stage.label}</span>
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span className="text-emerald-600">已完成 {stage.completed}</span>
                    <span className="text-blue-600">进行中 {stage.inProgress}</span>
                    <span className="text-stone-400">未开始 {stage.pending}</span>
                  </div>
                </div>
                <ProgressBar percent={completedPct} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── 需要关注的新人 ── */}
      <Card title="需要关注的新人">
        {stats.attentionList.length === 0 ? (
          <EmptyState
            icon={<Users size={32} />}
            title="暂无需要关注的员工"
            description="所有新人进度正常"
          />
        ) : (
          <AdminTable
            columns={
              [
                { key: "name", label: "姓名", render: (r) => r.employee.name },
                { key: "department", label: "部门", render: (r) => r.employee.department },
                {
                  key: "batch",
                  label: "批次",
                  render: (r) => {
                    const batch = store.batches.find((b) => b.id === r.employee.batchId);
                    return batch?.name ?? "未分配";
                  },
                },
                { key: "reason", label: "关注原因", render: (r) => r.reason },
                {
                  key: "daysOverdue",
                  label: "超期天数",
                  align: "center" as const,
                  render: (r) => r.daysOverdue ? `${r.daysOverdue} 天` : "-",
                },
              ] as Column<DashboardStats["attentionList"][number]>[]
            }
            data={stats.attentionList}
            rowKey={(r) => r.employee.id}
            emptyTitle="暂无需要关注的员工"
          />
        )}
      </Card>
    </div>
  );
}
