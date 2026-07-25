/**
 * 管理后台 — 认证管理
 *
 * 功能：查看和管理认证结果 + 认证详情 + 重置认证次数
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useAdminStore, getEmployeeProgress, resetEmployeeCertification, logAdminAction, fetchEmployeeProgressBatch, apiResetEmployeeCertification } from "../store";
import { useAdminAuth, canEdit } from "../auth";
import { isApiMode } from "../../lib/api";
import type { Employee, EmployeeProgress } from "../types";
import {
  SearchInput, StageStatusBadge, EmptyState, Badge, Button,
} from "../components/UI";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { AdminDrawer, InfoRow, InfoSection } from "../components/AdminDrawer";
import { ConfirmModal } from "../components/ConfirmModal";

export function CertificationPage() {
  const store = useAdminStore();
  const { admin } = useAdminAuth();
  const isSuper = canEdit(admin);

  const [search, setSearch] = useState("");
  const [certFilter, setCertFilter] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

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
      if (certFilter) {
        const prog = progressMap.get(emp.id);
        if (prog?.certification.status !== certFilter) return false;
      }
      return true;
    });
  }, [store.employees, search, certFilter, progressMap]);

  const handleResetCert = useCallback(async () => {
    if (!selectedEmp || !admin) return;
    if (isApiMode()) {
      await apiResetEmployeeCertification(selectedEmp, admin.name).catch(() => {});
    } else {
      resetEmployeeCertification(selectedEmp, admin.name);
      logAdminAction({
        adminName: admin.name,
        action: "重置认证次数",
        targetType: "employee",
        targetId: selectedEmp.id,
        targetName: selectedEmp.name,
      });
    }
    setConfirmReset(false);
    setSelectedEmp({ ...selectedEmp });
  }, [selectedEmp, admin]);

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
      key: "batch",
      label: "批次",
      render: (emp) => {
        const batch = store.batches.find((b) => b.id === emp.batchId);
        return batch?.name ?? "未分配";
      },
    },
    {
      key: "certStatus",
      label: "认证状态",
      render: (emp) => {
        const prog = progressMap.get(emp.id);
        return <StageStatusBadge status={prog?.certification.status ?? "locked"} />;
      },
    },
    {
      key: "bestScore",
      label: "最高分",
      align: "center",
      render: (emp) => {
        const prog = progressMap.get(emp.id);
        const score = prog?.certification.bestScore ?? 0;
        return score > 0 ? <span className="font-medium text-stone-700">{score}</span> : "-";
      },
    },
    {
      key: "attempts",
      label: "尝试次数",
      align: "center",
      render: (emp) => {
        const prog = progressMap.get(emp.id);
        return prog?.certification.attempts.length ?? 0;
      },
    },
    {
      key: "lastAttempt",
      label: "最后认证时间",
      render: (emp) => {
        const prog = progressMap.get(emp.id);
        const attempts = prog?.certification.attempts;
        if (!attempts || attempts.length === 0) return <span className="text-stone-400">未参加</span>;
        const last = attempts[attempts.length - 1];
        return new Date(last.submittedAt).toLocaleDateString("zh-CN");
      },
    },
  ];

  const selectedProgress = selectedEmp ? progressMap.get(selectedEmp.id) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="搜索姓名 / 工号"
          value={search}
          onChange={setSearch}
          className="w-64"
        />
        <select
          className="admin-input rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          value={certFilter}
          onChange={(e) => setCertFilter(e.target.value)}
        >
          <option value="">全部认证状态</option>
          <option value="passed">已通过</option>
          <option value="failed">未通过</option>
          <option value="in_progress">待认证</option>
          <option value="locked">未解锁</option>
        </select>
        <div className="flex-1" />
        <span className="text-sm text-stone-400">共 {filtered.length} 人</span>
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        rowKey={(emp) => emp.id}
        onRowClick={(emp) => setSelectedEmp(emp)}
        emptyTitle="暂无认证记录"
      />

      <AdminDrawer
        open={!!selectedEmp}
        title={`${selectedEmp?.name ?? ""} — 认证详情`}
        onClose={() => setSelectedEmp(null)}
        width={560}
        footer={
          selectedEmp && isSuper && selectedProgress?.certification.status !== "locked" ? (
            <Button size="sm" variant="danger" onClick={() => setConfirmReset(true)}>
              重置认证次数
            </Button>
          ) : undefined
        }
      >
        {selectedEmp && selectedProgress && (
          <CertDetailContent employee={selectedEmp} progress={selectedProgress} />
        )}
      </AdminDrawer>

      <ConfirmModal
        open={confirmReset}
        title="重置认证次数"
        description={`确认重置 ${selectedEmp?.name} 的认证记录？认证次数归零，可重新参加认证。该操作不可撤销。`}
        confirmLabel="确认重置"
        onConfirm={handleResetCert}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

function CertDetailContent({
  employee, progress,
}: {
  employee: Employee;
  progress: EmployeeProgress;
}) {
  const cert = progress.certification;

  return (
    <div className="space-y-6">
      <InfoSection title="认证概览">
        <InfoRow label="姓名" value={employee.name} />
        <InfoRow label="部门 / 岗位" value={`${employee.department} / ${employee.position}`} />
        <InfoRow label="认证状态" value={<StageStatusBadge status={cert.status} />} />
        <InfoRow label="最高分" value={cert.bestScore > 0 ? cert.bestScore : "未参加"} />
        <InfoRow label="尝试次数" value={cert.attempts.length} />
        <InfoRow
          label="学习天地"
          value={progress.learningWorldUnlocked
            ? <Badge variant="success">已解锁</Badge>
            : <Badge variant="neutral">未解锁</Badge>}
        />
      </InfoSection>

      <InfoSection title="前置条件">
        <InfoRow
          label="前五关完成状态"
          value={
            progress.completedCount >= 5
              ? <Badge variant="success">已完成</Badge>
              : <Badge variant="warning">未完成 ({progress.completedCount}/5)</Badge>
          }
        />
      </InfoSection>

      <InfoSection title="认证记录">
        {cert.attempts.length === 0 ? (
          <EmptyState title="暂无认证记录" description="该员工尚未参加认证" />
        ) : (
          <div className="space-y-3">
            {cert.attempts.map((attempt, idx) => (
              <div key={idx} className="rounded-lg border border-stone-100 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-700">
                      第 {attempt.attemptNo} 次
                    </span>
                    {attempt.passed
                      ? <Badge variant="success">通过</Badge>
                      : <Badge variant="danger">未通过</Badge>}
                  </div>
                  <span className="text-xs text-stone-400">
                    {new Date(attempt.submittedAt).toLocaleString("zh-CN")}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="text-stone-600">得分：<span className="font-semibold text-stone-800">{attempt.score}</span></span>
                </div>
                {attempt.weakAreas.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-stone-500">薄弱领域：</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {attempt.weakAreas.map((area, i) => (
                        <Badge key={i} variant="warning">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </InfoSection>
    </div>
  );
}
