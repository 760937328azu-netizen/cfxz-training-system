/**
 * 管理后台 — 培训批次
 *
 * 功能：批次列表 + 创建/修改 + 添加/移除新人 + 查看进度 + 关闭
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, CalendarPlus, X, Users } from "lucide-react";
import {
  useAdminStore, getEmployeeProgress, createBatch, updateBatch,
  deleteBatch, addEmployeeToBatch, removeEmployeeFromBatch, logAdminAction,
  fetchEmployeeProgressBatch,
  apiCreateBatch, apiUpdateBatch, apiDeleteBatch,
  apiAddEmployeeToBatch, apiRemoveEmployeeFromBatch,
} from "../store";
import { useAdminAuth, canEdit } from "../auth";
import { isApiMode } from "../../lib/api";
import type { Batch, Employee, EmployeeProgress } from "../types";
import {
  Button, Badge, StageStatusBadge, ProgressBar, EmptyState, AdminInput,
} from "../components/UI";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { AdminDrawer, InfoRow, InfoSection } from "../components/AdminDrawer";
import { ConfirmModal } from "../components/ConfirmModal";

export function BatchesPage() {
  const store = useAdminStore();
  const { admin } = useAdminAuth();
  const isSuper = canEdit(admin);

  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // 批次内的员工列表
  const batchEmployees = useMemo(() => {
    if (!selectedBatch) return [];
    return store.employees.filter((e) => selectedBatch.employeeIds.includes(e.id));
  }, [selectedBatch, store.employees]);

  // API 模式：批次员工变化时批量拉取进度
  useEffect(() => {
    if (!isApiMode() || batchEmployees.length === 0) return;
    fetchEmployeeProgressBatch(batchEmployees).catch(() => {});
  }, [batchEmployees.length]);

  // 员工进度缓存
  const progressMap = useMemo(() => {
    const map = new Map<string, EmployeeProgress>();
    for (const emp of batchEmployees) {
      map.set(emp.id, getEmployeeProgress(emp));
    }
    return map;
  }, [batchEmployees]);

  // 未分配批次的员工（可添加到当前批次）
  const availableEmployees = useMemo(() => {
    if (!selectedBatch) return [];
    return store.employees.filter(
      (e) => !selectedBatch.employeeIds.includes(e.id) && e.status === "active",
    );
  }, [selectedBatch, store.employees]);

  // 批次统计
  const batchStats = useMemo(() => {
    if (!selectedBatch) return { total: 0, completed: 0, certified: 0 };
    let completed = 0;
    let certified = 0;
    for (const emp of batchEmployees) {
      const prog = progressMap.get(emp.id);
      if (prog?.completedCount === 6) completed++;
      if (prog?.certification.status === "passed") certified++;
    }
    return { total: batchEmployees.length, completed, certified };
  }, [selectedBatch, batchEmployees, progressMap]);

  const handleCreate = useCallback(async (name: string, startDate: string, deadline: string) => {
    if (isApiMode()) {
      await apiCreateBatch({ name, startDate, deadline }).catch(() => {});
    } else {
      createBatch({ name, startDate, deadline });
      if (admin) {
        logAdminAction({
          adminName: admin.name,
          action: `创建批次：${name}`,
          targetType: "batch",
          targetId: "",
          targetName: name,
        });
      }
    }
    setShowCreateModal(false);
  }, [admin]);

  const handleCloseBatch = useCallback((batch: Batch) => {
    if (!admin) return;
    setConfirmAction({
      title: "关闭批次",
      description: `确认关闭批次「${batch.name}」？关闭后该批次内的新人进度仍保留，但不再进行超期计算。`,
      onConfirm: async () => {
        if (isApiMode()) {
          await apiUpdateBatch(batch.id, { status: "closed" }).catch(() => {});
        } else {
          updateBatch(batch.id, { status: "closed" });
          logAdminAction({
            adminName: admin.name,
            action: `关闭批次：${batch.name}`,
            targetType: "batch",
            targetId: batch.id,
            targetName: batch.name,
          });
        }
        setConfirmAction(null);
        setSelectedBatch(null);
      },
    });
  }, [admin]);

  const handleDeleteBatch = useCallback((batch: Batch) => {
    if (!admin) return;
    setConfirmAction({
      title: "删除批次",
      description: `确认删除批次「${batch.name}」？该批次内的新人将变为未分配状态。此操作不可撤销。`,
      onConfirm: async () => {
        if (isApiMode()) {
          await apiDeleteBatch(batch.id).catch(() => {});
        } else {
          deleteBatch(batch.id);
          logAdminAction({
            adminName: admin.name,
            action: `删除批次：${batch.name}`,
            targetType: "batch",
            targetId: batch.id,
            targetName: batch.name,
          });
        }
        setConfirmAction(null);
        setSelectedBatch(null);
      },
    });
  }, [admin]);

  const handleAddEmployee = useCallback(async (emp: Employee) => {
    if (!selectedBatch || !admin) return;
    if (isApiMode()) {
      await apiAddEmployeeToBatch(selectedBatch.id, emp.id).catch(() => {});
    } else {
      addEmployeeToBatch(selectedBatch.id, emp.id);
      logAdminAction({
        adminName: admin.name,
        action: `添加 ${emp.name} 到批次 ${selectedBatch.name}`,
        targetType: "batch",
        targetId: selectedBatch.id,
        targetName: selectedBatch.name,
      });
    }
    // 刷新选中批次
    const updated = store.batches.find((b) => b.id === selectedBatch.id);
    if (updated) setSelectedBatch({ ...updated });
  }, [selectedBatch, admin, store.batches]);

  const handleRemoveEmployee = useCallback((emp: Employee) => {
    if (!selectedBatch || !admin) return;
    setConfirmAction({
      title: "移出批次",
      description: `确认将 ${emp.name} 从批次「${selectedBatch.name}」中移出？`,
      onConfirm: async () => {
        if (isApiMode()) {
          await apiRemoveEmployeeFromBatch(selectedBatch.id, emp.id).catch(() => {});
        } else {
          removeEmployeeFromBatch(selectedBatch.id, emp.id);
          logAdminAction({
            adminName: admin.name,
            action: `将 ${emp.name} 移出批次 ${selectedBatch.name}`,
            targetType: "batch",
            targetId: selectedBatch.id,
            targetName: selectedBatch.name,
          });
        }
        setConfirmAction(null);
        const updated = store.batches.find((b) => b.id === selectedBatch.id);
        if (updated) setSelectedBatch({ ...updated });
      },
    });
  }, [selectedBatch, admin, store.batches]);

  // 批次列表统计
  const batchListStats = useMemo(() => {
    return store.batches.map((batch) => {
      const emps = store.employees.filter((e) => batch.employeeIds.includes(e.id));
      let completed = 0;
      let certified = 0;
      for (const emp of emps) {
        const prog = getEmployeeProgress(emp);
        if (prog.completedCount === 6) completed++;
        if (prog.certification.status === "passed") certified++;
      }
      return { batch, employeeCount: emps.length, completed, certified };
    });
  }, [store.batches, store.employees]);

  const columns: Column<typeof batchListStats[number]>[] = [
    {
      key: "name",
      label: "批次名称",
      render: (item) => (
        <div>
          <div className="font-medium text-stone-800">{item.batch.name}</div>
          <div className="text-xs text-stone-400">
            {item.batch.startDate} ~ {item.batch.deadline}
          </div>
        </div>
      ),
    },
    { key: "employeeCount", label: "参与人数", align: "center", render: (item) => item.employeeCount },
    { key: "completed", label: "已完成", align: "center", render: (item) => (
      <span className="text-emerald-600">{item.completed}</span>
    ) },
    { key: "certified", label: "认证通过", align: "center", render: (item) => (
      <span className="text-purple-600">{item.certified}</span>
    ) },
    { key: "status", label: "状态", render: (item) => (
      <StageStatusBadge status={item.batch.status} />
    ) },
  ];

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-400">共 {store.batches.length} 个批次</span>
        {isSuper && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <CalendarPlus size={16} /> 创建批次
          </Button>
        )}
      </div>

      {/* 批次列表 */}
      <AdminTable
        columns={columns}
        data={batchListStats}
        rowKey={(item) => item.batch.id}
        onRowClick={(item) => setSelectedBatch(item.batch)}
        emptyIcon={<Plus size={32} />}
        emptyTitle="暂无批次"
        emptyDescription={isSuper ? "点击「创建批次」创建第一个培训批次" : undefined}
      />

      {/* 批次详情抽屉 */}
      <AdminDrawer
        open={!!selectedBatch}
        title={selectedBatch?.name ?? ""}
        onClose={() => setSelectedBatch(null)}
        width={600}
        footer={
          selectedBatch && isSuper ? (
            <div className="flex flex-wrap items-center gap-2">
              {selectedBatch.status === "active" && (
                <>
                  <Button size="sm" variant="primary" onClick={() => setShowAddEmpModal(true)}>
                    <Plus size={14} /> 添加新人
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCloseBatch(selectedBatch)}>
                    关闭批次
                  </Button>
                </>
              )}
              <Button size="sm" variant="danger" onClick={() => handleDeleteBatch(selectedBatch)}>
                删除批次
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedBatch && (
          <div className="space-y-6">
            <InfoSection title="批次信息">
              <InfoRow label="批次名称" value={selectedBatch.name} />
              <InfoRow label="开始日期" value={selectedBatch.startDate} />
              <InfoRow label="完成期限" value={selectedBatch.deadline} />
              <InfoRow label="批次状态" value={<StageStatusBadge status={selectedBatch.status} />} />
              <InfoRow label="创建时间" value={new Date(selectedBatch.createdAt).toLocaleString("zh-CN")} />
            </InfoSection>

            <InfoSection title="批次统计">
              <InfoRow label="参与人数" value={batchStats.total} />
              <InfoRow label="已完成六关" value={batchStats.completed} />
              <InfoRow label="认证通过" value={batchStats.certified} />
              {batchStats.total > 0 && (
                <div className="py-2">
                  <div className="mb-1 text-sm text-stone-500">整体完成率</div>
                  <ProgressBar percent={Math.round((batchStats.completed / batchStats.total) * 100)} showLabel />
                </div>
              )}
            </InfoSection>

            <InfoSection title="批次内新人">
              {batchEmployees.length === 0 ? (
                <EmptyState icon={<Users size={28} />} title="批次内暂无新人" />
              ) : (
                <div className="space-y-2">
                  {batchEmployees.map((emp) => {
                    const prog = progressMap.get(emp.id);
                    return (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-stone-700">{emp.name}</div>
                          <div className="text-xs text-stone-400">
                            {emp.department} · {prog?.currentStageLabel}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {prog && <ProgressBar percent={prog.overallPercent} className="w-24" />}
                          {prog?.certification.status === "passed" && <Badge variant="success">已认证</Badge>}
                          {isSuper && (
                            <button
                              onClick={() => handleRemoveEmployee(emp)}
                              className="text-stone-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </InfoSection>
          </div>
        )}
      </AdminDrawer>

      {/* 创建批次弹窗 */}
      {showCreateModal && (
        <CreateBatchModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />
      )}

      {/* 添加新人弹窗 */}
      {showAddEmpModal && selectedBatch && (
        <AddEmployeeModal
          employees={availableEmployees}
          batchName={selectedBatch.name}
          onClose={() => setShowAddEmpModal(false)}
          onAdd={handleAddEmployee}
        />
      )}

      {/* 确认弹窗 */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description}
        confirmLabel="确认"
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// 创建批次弹窗
// ──────────────────────────────────────────────

function CreateBatchModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, startDate: string, deadline: string) => void;
}) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) { setError("请输入批次名称"); return; }
    if (!deadline) { setError("请选择完成期限"); return; }
    onCreate(name.trim(), startDate, deadline);
  };

  return (
    <ConfirmModal
      open
      title="创建培训批次"
      confirmLabel="创建"
      variant="primary"
      onConfirm={handleSubmit}
      onCancel={onClose}
    >
      <div className="space-y-3">
        <AdminInput
          label="批次名称 *"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="如：2026年7月新人批次"
          error={error && !name.trim() ? error : undefined}
        />
        <AdminInput
          label="开始日期 *"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <AdminInput
          label="完成期限 *"
          type="date"
          value={deadline}
          onChange={(e) => { setDeadline(e.target.value); setError(""); }}
          error={error && !deadline ? error : undefined}
        />
      </div>
    </ConfirmModal>
  );
}

// ──────────────────────────────────────────────
// 添加新人弹窗
// ──────────────────────────────────────────────

function AddEmployeeModal({
  employees,
  batchName,
  onClose,
  onAdd,
}: {
  employees: Employee[];
  batchName: string;
  onClose: () => void;
  onAdd: (emp: Employee) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = employees.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.employeeNo.toLowerCase().includes(q);
  });

  return (
    <ConfirmModal
      open
      title={`添加新人到「${batchName}」`}
      confirmLabel="关闭"
      variant="primary"
      onConfirm={onClose}
      onCancel={onClose}
    >
      <div className="space-y-3">
        <input
          type="text"
          placeholder="搜索姓名 / 工号"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        {filtered.length === 0 ? (
          <EmptyState title="暂无可添加的新人" description="所有在岗员工已在此批次中" />
        ) : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {filtered.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 hover:bg-stone-50"
              >
                <div>
                  <span className="text-sm font-medium text-stone-700">{emp.name}</span>
                  <span className="ml-2 text-xs text-stone-400">{emp.department}</span>
                </div>
                <Button size="sm" variant="primary" onClick={() => onAdd(emp)}>
                  <Plus size={14} /> 添加
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ConfirmModal>
  );
}
