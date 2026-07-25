/**
 * 管理后台 — 学习进度
 *
 * 功能：实时查看所有新人进度 + 六关时间线 + 后台可见字段
 */

import { useState, useMemo, useEffect } from "react";
import { useAdminStore, getEmployeeProgress, fetchEmployeeProgressBatch } from "../store";
import { isApiMode } from "../../lib/api";
import type { Employee, EmployeeProgress } from "../types";
import { ADMIN_STAGES, ADMIN_GAME_INFO } from "../types";
import {
  SearchInput, StageStatusBadge, ProgressBar, Badge,
} from "../components/UI";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { AdminDrawer, InfoRow, InfoSection } from "../components/AdminDrawer";

export function ProgressPage() {
  const store = useAdminStore();

  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const progressMap = useMemo(() => {
    const map = new Map<string, EmployeeProgress>();
    for (const emp of store.employees) {
      map.set(emp.id, getEmployeeProgress(emp));
    }
    return map;
  }, [store.employees]);

  // API 模式：挂载时批量拉取员工进度
  useEffect(() => {
    if (!isApiMode() || store.employees.length === 0) return;
    fetchEmployeeProgressBatch(store.employees).catch(() => {});
  }, [store.employees.length]);

  const filtered = useMemo(() => {
    return store.employees.filter((emp) => {
      if (search) {
        const q = search.toLowerCase();
        if (!emp.name.toLowerCase().includes(q) && !emp.employeeNo.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (batchFilter && emp.batchId !== batchFilter) return false;
      return true;
    });
  }, [store.employees, search, batchFilter]);

  const columns: Column<Employee>[] = [
    {
      key: "name",
      label: "姓名 / 工号",
      render: (emp) => (
        <div>
          <div className="font-medium text-stone-800">{emp.name}</div>
          <div className="text-xs text-stone-400">{emp.employeeNo}</div>
        </div>
      ),
    },
    { key: "department", label: "部门", render: (emp) => emp.department },
    {
      key: "currentStage",
      label: "当前关卡",
      render: (emp) => {
        const prog = progressMap.get(emp.id);
        return prog?.currentStageLabel ?? "未知";
      },
    },
    {
      key: "completedCount",
      label: "已完成",
      align: "center",
      render: (emp) => {
        const prog = progressMap.get(emp.id);
        return `${prog?.completedCount ?? 0}/6`;
      },
    },
    {
      key: "progress",
      label: "整体进度",
      width: "140px",
      render: (emp) => {
        const prog = progressMap.get(emp.id);
        return <ProgressBar percent={prog?.overallPercent ?? 0} showLabel />;
      },
    },
    {
      key: "lastVisited",
      label: "最后学习时间",
      render: (emp) => {
        const prog = progressMap.get(emp.id);
        if (!prog?.lastVisitedAt) return <span className="text-stone-400">无记录</span>;
        return new Date(prog.lastVisitedAt).toLocaleString("zh-CN");
      },
    },
  ];

  const selectedProgress = selectedEmp ? progressMap.get(selectedEmp.id) : null;

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="搜索姓名 / 工号"
          value={search}
          onChange={setSearch}
          className="w-64"
        />
        <select
          className="admin-input rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
        >
          <option value="">全部批次</option>
          {store.batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <div className="flex-1" />
        <span className="text-sm text-stone-400">共 {filtered.length} 人</span>
      </div>

      {/* 表格 */}
      <AdminTable
        columns={columns}
        data={filtered}
        rowKey={(emp) => emp.id}
        onRowClick={(emp) => setSelectedEmp(emp)}
        emptyTitle="暂无员工"
      />

      {/* 进度详情抽屉 */}
      <AdminDrawer
        open={!!selectedEmp}
        title={`${selectedEmp?.name ?? ""} — 学习进度`}
        onClose={() => setSelectedEmp(null)}
        width={600}
      >
        {selectedEmp && selectedProgress && (
          <ProgressDetailContent
            employee={selectedEmp}
            progress={selectedProgress}
            batchName={store.batches.find((b) => b.id === selectedEmp.batchId)?.name}
          />
        )}
      </AdminDrawer>
    </div>
  );
}

// ──────────────────────────────────────────────
// 进度详情内容
// ──────────────────────────────────────────────

function ProgressDetailContent({
  employee, progress, batchName,
}: {
  employee: Employee;
  progress: EmployeeProgress;
  batchName?: string;
}) {
  return (
    <div className="space-y-6">
      <InfoSection title="基本信息">
        <InfoRow label="姓名" value={employee.name} />
        <InfoRow label="部门 / 岗位" value={`${employee.department} / ${employee.position}`} />
        <InfoRow label="培训批次" value={batchName ?? "未分配"} />
        <InfoRow label="最后学习关卡" value={progress.lastStage ?? "无"} />
        <InfoRow label="最后学习章节" value={progress.lastSection ?? "无"} />
        <InfoRow label="最后学习时间" value={progress.lastVisitedAt
          ? new Date(progress.lastVisitedAt).toLocaleString("zh-CN")
          : "无记录"} />
        <InfoRow label="学习天地解锁" value={
          progress.learningWorldUnlocked ? <Badge variant="success">已解锁</Badge> : <Badge variant="neutral">未解锁</Badge>
        } />
      </InfoSection>

      {/* 六关时间线 */}
      <InfoSection title="六关完成时间线">
        {ADMIN_STAGES.map((stage, idx) => {
          const stageProg = progress[stage.id as keyof EmployeeProgress] as {
            status?: string; completedAt?: string;
            completedExhibits?: string[]; games?: Record<string, boolean>;
            attempts?: unknown[]; bestScore?: number;
          };
          const status = stageProg?.status ?? "pending";
          return (
            <div key={stage.id} className="flex items-start gap-3 py-3">
              {/* 时间线圆点 */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    status === "completed"
                      ? "bg-emerald-100 text-emerald-600"
                      : status === "in_progress"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < ADMIN_STAGES.length - 1 && (
                  <div className={`mt-1 h-8 w-0.5 ${status === "completed" ? "bg-emerald-200" : "bg-stone-100"}`} />
                )}
              </div>

              {/* 关卡信息 */}
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-700">{stage.label}</span>
                    <StageStatusBadge status={status} />
                  </div>
                  {stageProg?.completedAt && (
                    <span className="text-xs text-stone-400">
                      {new Date(stageProg.completedAt).toLocaleString("zh-CN")}
                    </span>
                  )}
                </div>

                {/* 第三关：展区详情 */}
                {stage.id === "culture" && stageProg?.completedExhibits && (
                  <div className="mt-1 text-xs text-stone-400">
                    已参观展区：{stageProg.completedExhibits.length} 个
                  </div>
                )}

                {/* 第五关：游戏详情 */}
                {stage.id === "rules" && stageProg?.games && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {ADMIN_GAME_INFO.map((g) => (
                      <Badge key={g.key} variant={stageProg.games![g.key] ? "success" : "neutral"}>
                        {g.label}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* 第六关：认证详情 */}
                {stage.id === "certification" && (
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-stone-500">
                    <span>最高分：{progress.certification.bestScore}</span>
                    <span>尝试次数：{progress.certification.attempts.length}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </InfoSection>
    </div>
  );
}
