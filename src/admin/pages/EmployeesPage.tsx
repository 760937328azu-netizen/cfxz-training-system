/**
 * 管理后台 — 新人管理
 *
 * 功能：列表 + 搜索筛选 + 抽屉详情 + 新增/编辑 + 重置操作
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Plus, UserPlus, RotateCcw, Trash2, Ban, CheckCircle, KeyRound, Pencil,
} from "lucide-react";
import {
  useAdminStore, getEmployeeProgress, getEmployeeRecords,
  resetEmployeeStage, resetEmployeeAllProgress, resetEmployeeCertification,
  createEmployee, updateEmployee, deleteEmployee, clearAllEmployees, logAdminAction,
  fetchEmployeeProgressBatch,
  apiCreateEmployee, apiUpdateEmployee, apiDeleteEmployee, apiClearAllEmployees,
  apiResetEmployeeStage, apiResetEmployeeAllProgress, apiResetEmployeeCertification,
} from "../store";
import { useAdminAuth, canEdit } from "../auth";
import { isApiMode } from "../../lib/api";
import type { Employee, EmployeeProgress, AdminStageId } from "../types";
import { ADMIN_STAGES, ADMIN_GAME_INFO } from "../types";
import {
  Badge, Button, SearchInput, StageStatusBadge,
  ProgressBar, ProgressRing, EmptyState,
} from "../components/UI";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { AdminDrawer, InfoRow, InfoSection } from "../components/AdminDrawer";
import { ConfirmModal } from "../components/ConfirmModal";
import { EmployeeFormModal } from "../components/EmployeeFormModal";

export function EmployeesPage() {
  const store = useAdminStore();
  const { admin } = useAdminAuth();
  const isSuper = canEdit(admin);

  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  // API 模式：挂载时批量拉取员工进度
  useEffect(() => {
    if (!isApiMode() || store.employees.length === 0) return;
    fetchEmployeeProgressBatch(store.employees).catch(() => {});
  }, [store.employees.length]);

  // 进度缓存
  const progressMap = useMemo(() => {
    const map = new Map<string, EmployeeProgress>();
    for (const emp of store.employees) {
      map.set(emp.id, getEmployeeProgress(emp));
    }
    return map;
  }, [store.employees]);

  // 筛选
  const filtered = useMemo(() => {
    return store.employees.filter((emp) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          emp.name.toLowerCase().includes(q) ||
          emp.employeeNo.toLowerCase().includes(q) ||
          emp.username.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (batchFilter && emp.batchId !== batchFilter) return false;
      if (statusFilter && emp.status !== statusFilter) return false;
      return true;
    });
  }, [store.employees, search, batchFilter, statusFilter]);

  const handleAddNew = useCallback(() => {
    setEditingEmp(null);
    setShowFormModal(true);
  }, []);

  const handleEdit = useCallback((emp: Employee) => {
    setEditingEmp(emp);
    setShowFormModal(true);
  }, []);

  const handleViewDetail = useCallback((emp: Employee) => {
    setSelectedEmp(emp);
  }, []);

  // 重置操作
  const handleResetStage = useCallback((emp: Employee, stageId: AdminStageId) => {
    if (!admin) return;
    setConfirmAction({
      title: `重置「${ADMIN_STAGES.find((s) => s.id === stageId)?.label}」`,
      description: `确认重置 ${emp.name} 的该关进度？该操作不可撤销。`,
      onConfirm: async () => {
        if (isApiMode()) {
          await apiResetEmployeeStage(emp, stageId, admin.name).catch(() => {});
        } else {
          resetEmployeeStage(emp, stageId, admin.name);
        }
        setConfirmAction(null);
        setSelectedEmp({ ...emp });
      },
    });
  }, [admin]);

  const handleResetAll = useCallback((emp: Employee) => {
    if (!admin) return;
    setConfirmAction({
      title: "重置全部进度",
      description: `确认重置 ${emp.name} 的所有学习进度？包括六关完成状态、游戏记录、认证记录。该操作不可撤销。`,
      onConfirm: async () => {
        if (isApiMode()) {
          await apiResetEmployeeAllProgress(emp, admin.name).catch(() => {});
        } else {
          resetEmployeeAllProgress(emp, admin.name);
        }
        setConfirmAction(null);
        setSelectedEmp({ ...emp });
      },
    });
  }, [admin]);

  const handleResetCert = useCallback((emp: Employee) => {
    if (!admin) return;
    setConfirmAction({
      title: "重置认证次数",
      description: `确认重置 ${emp.name} 的认证记录？认证次数归零，可重新参加认证。该操作不可撤销。`,
      onConfirm: async () => {
        if (isApiMode()) {
          await apiResetEmployeeCertification(emp, admin.name).catch(() => {});
        } else {
          resetEmployeeCertification(emp, admin.name);
        }
        setConfirmAction(null);
        setSelectedEmp({ ...emp });
      },
    });
  }, [admin]);

  const handleToggleStatus = useCallback((emp: Employee) => {
    if (!admin) return;
    const newStatus = emp.status === "active" ? "disabled" : "active";
    setConfirmAction({
      title: newStatus === "disabled" ? "停用账号" : "启用账号",
      description: `确认${newStatus === "disabled" ? "停用" : "启用"} ${emp.name} 的账号？`,
      onConfirm: async () => {
        if (isApiMode()) {
          await apiUpdateEmployee(emp.id, { status: newStatus }).catch(() => {});
        } else {
          updateEmployee(emp.id, { status: newStatus });
          logAdminAction({
            adminName: admin.name,
            action: newStatus === "disabled" ? "停用员工账号" : "启用员工账号",
            targetType: "employee",
            targetId: emp.id,
            targetName: emp.name,
          });
        }
        setConfirmAction(null);
      },
    });
  }, [admin]);

  const handleDelete = useCallback((emp: Employee) => {
    if (!admin) return;
    setConfirmAction({
      title: "删除员工",
      description: `确认删除 ${emp.name}？该操作将同时删除其所有学习进度和记录，不可撤销。`,
      onConfirm: async () => {
        if (isApiMode()) {
          await apiDeleteEmployee(emp.id).catch(() => {});
        } else {
          deleteEmployee(emp.id);
          logAdminAction({
            adminName: admin.name,
            action: "删除员工",
            targetType: "employee",
            targetId: emp.id,
            targetName: emp.name,
          });
        }
        setConfirmAction(null);
        setSelectedEmp(null);
      },
    });
  }, [admin]);

  const handleResetPassword = useCallback((emp: Employee) => {
    if (!admin) return;
    setConfirmAction({
      title: "重置密码",
      description: `确认将 ${emp.name} 的密码重置为初始密码「${emp.initialPassword}」？`,
      onConfirm: () => {
        logAdminAction({
          adminName: admin.name,
          action: "重置员工密码",
          targetType: "employee",
          targetId: emp.id,
          targetName: emp.name,
        });
        setConfirmAction(null);
      },
    });
  }, [admin]);

  // 一键清空所有员工（仅超管可见，用于清空初始演示数据）
  const handleClearAll = useCallback(() => {
    if (!admin) return;
    const count = store.employees.length;
    if (count === 0) {
      setConfirmAction({
        title: "没有员工数据",
        description: "当前列表为空，无需清空。",
        onConfirm: () => setConfirmAction(null),
      });
      return;
    }
    setConfirmAction({
      title: "清空所有员工",
      description: `确认清空全部 ${count} 名员工及其学习进度和记录？此操作不可撤销。请确认后再执行。`,
      confirmLabel: "我已确认，清空全部",
      onConfirm: async () => {
        if (isApiMode()) {
          await apiClearAllEmployees().catch(() => {});
        } else {
          const result = clearAllEmployees();
          logAdminAction({
            adminName: admin.name,
            action: `清空全部员工（${result.deletedCount} 人）`,
            targetType: "system",
            targetId: "",
            targetName: "所有员工",
            details: `共删除 ${result.deletedCount} 名员工及其个人进度记录`,
          });
        }
        setConfirmAction(null);
        setSelectedEmp(null);
      },
    });
  }, [admin, store.employees.length]);

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
    { key: "department", label: "部门 / 岗位", render: (emp) => (
      <div>
        <div className="text-stone-700">{emp.department}</div>
        <div className="text-xs text-stone-400">{emp.position}</div>
      </div>
    ) },
    { key: "batch", label: "批次", render: (emp) => {
      const batch = store.batches.find((b) => b.id === emp.batchId);
      return batch?.name ?? <span className="text-stone-400">未分配</span>;
    } },
    { key: "currentStage", label: "当前关卡", render: (emp) => {
      const prog = progressMap.get(emp.id);
      return prog?.currentStageLabel ?? "未知";
    } },
    { key: "progress", label: "整体进度", width: "140px", render: (emp) => {
      const prog = progressMap.get(emp.id);
      const pct = prog?.overallPercent ?? 0;
      return <ProgressBar percent={pct} showLabel />;
    } },
    { key: "certStatus", label: "认证状态", render: (emp) => {
      const prog = progressMap.get(emp.id);
      const s = prog?.certification.status ?? "locked";
      return <StageStatusBadge status={s} />;
    } },
    { key: "lastVisited", label: "最后学习", render: (emp) => {
      const prog = progressMap.get(emp.id);
      if (!prog?.lastVisitedAt) return <span className="text-stone-400">无记录</span>;
      return new Date(prog.lastVisitedAt).toLocaleDateString("zh-CN");
    } },
    { key: "status", label: "账号状态", render: (emp) => (
      <StageStatusBadge status={emp.status} />
    ) },
    {
      key: "actions",
      label: "操作",
      width: "110px",
      align: "right",
      render: (emp) => (
        <div className="flex items-center justify-end gap-1">
          {isSuper && (
            <button
              type="button"
              title="编辑"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(emp);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-[#b0453a]"
            >
              <Pencil size={15} />
            </button>
          )}
          {isSuper && (
            <button
              type="button"
              title="删除"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(emp);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  // 是否应用了筛选条件
  const hasActiveFilter = Boolean(search || batchFilter || statusFilter);

  // 删除当前筛选结果（仅删除筛选出的员工）
  const handleDeleteFiltered = useCallback(() => {
    if (!admin) return;
    if (filtered.length === 0) return;
    setConfirmAction({
      title: "删除筛选结果",
      description: `当前筛选条件共匹配 ${filtered.length} 名员工，确认删除这些员工？其学习进度和记录将一并清除，不可撤销。`,
      confirmLabel: "确认删除筛选结果",
      onConfirm: async () => {
        if (isApiMode()) {
          for (const emp of filtered) {
            await apiDeleteEmployee(emp.id).catch(() => {});
          }
        } else {
          for (const emp of filtered) {
            deleteEmployee(emp.id);
          }
          logAdminAction({
            adminName: admin.name,
            action: `批量删除筛选员工（${filtered.length} 人）`,
            targetType: "system",
            targetId: "",
            targetName: "筛选结果",
            details: `筛选条件：搜索=${search || "无"}，批次=${batchFilter || "全部"}，状态=${statusFilter || "全部"}`,
          });
        }
        setConfirmAction(null);
        setSelectedEmp(null);
      },
    });
  }, [admin, filtered, search, batchFilter, statusFilter]);

  const selectedProgress = selectedEmp ? progressMap.get(selectedEmp.id) : null;
  const selectedRecords = selectedEmp ? getEmployeeRecords(selectedEmp) : [];

  return (
    <div className="space-y-4">
      {/* ── 工具栏 ── */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="搜索姓名 / 工号 / 账号"
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
        <select
          className="admin-input rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="disabled">已停用</option>
        </select>
        <div className="flex-1" />
        <span className="text-sm text-stone-400">
          {hasActiveFilter ? `已筛选 ${filtered.length} / 共 ${store.employees.length} 人` : `共 ${filtered.length} 人`}
        </span>
        {isSuper && (
          <span
            title={hasActiveFilter ? "删除当前筛选出的员工" : "请先使用搜索或筛选条件"}
          >
            <Button
              variant="ghost"
              onClick={handleDeleteFiltered}
              disabled={!hasActiveFilter || filtered.length === 0}
            >
              <Trash2 size={16} /> 删除筛选结果
            </Button>
          </span>
        )}
        {isSuper && (
          <Button variant="ghost" onClick={handleClearAll} disabled={store.employees.length === 0}>
            <Trash2 size={16} /> 清空所有员工
          </Button>
        )}
        {isSuper && (
          <Button variant="primary" onClick={handleAddNew}>
            <UserPlus size={16} /> 新增员工
          </Button>
        )}
      </div>

      {/* ── 表格 ── */}
      <AdminTable
        columns={columns}
        data={filtered}
        rowKey={(emp) => emp.id}
        onRowClick={handleViewDetail}
        emptyIcon={<Plus size={32} />}
        emptyTitle="暂无员工"
        emptyDescription={isSuper ? "点击「新增员工」创建第一个员工" : undefined}
      />

      {/* ── 员工详情抽屉 ── */}
      <AdminDrawer
        open={!!selectedEmp}
        title={selectedEmp?.name ?? ""}
        onClose={() => setSelectedEmp(null)}
        width={600}
        footer={
          selectedEmp && isSuper ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleEdit(selectedEmp)}>
                编辑信息
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleResetPassword(selectedEmp)}>
                <KeyRound size={14} /> 重置密码
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleResetAll(selectedEmp)}>
                <RotateCcw size={14} /> 重置全部
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleResetCert(selectedEmp)}>
                重置认证
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggleStatus(selectedEmp)}
              >
                {selectedEmp.status === "active" ? <Ban size={14} /> : <CheckCircle size={14} />}
                {selectedEmp.status === "active" ? "停用" : "启用"}
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(selectedEmp)}>
                <Trash2 size={14} /> 删除
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedEmp && selectedProgress && (
          <EmployeeDetailContent
            employee={selectedEmp}
            progress={selectedProgress}
            records={selectedRecords}
            batchName={store.batches.find((b) => b.id === selectedEmp.batchId)?.name}
            onResetStage={(stageId) => handleResetStage(selectedEmp, stageId)}
            isSuper={isSuper}
          />
        )}
      </AdminDrawer>

      {/* ── 新增/编辑弹窗 ── */}
      {showFormModal && (
        <EmployeeFormModal
          employee={editingEmp}
          batches={store.batches}
          onClose={() => {
            setShowFormModal(false);
            setEditingEmp(null);
          }}
          onSave={async (data) => {
            if (editingEmp) {
              if (isApiMode()) {
                await apiUpdateEmployee(editingEmp.id, data).catch(() => {});
              } else {
                updateEmployee(editingEmp.id, data);
                if (admin) {
                  logAdminAction({
                    adminName: admin.name,
                    action: "修改员工信息",
                    targetType: "employee",
                    targetId: editingEmp.id,
                    targetName: data.name,
                  });
                }
              }
            } else {
              if (isApiMode()) {
                await apiCreateEmployee(data).catch(() => {});
              } else {
                createEmployee(data);
                if (admin) {
                  logAdminAction({
                    adminName: admin.name,
                    action: "新增员工",
                    targetType: "employee",
                    targetId: "",
                    targetName: data.name,
                  });
                }
              }
            }
            setShowFormModal(false);
            setEditingEmp(null);
          }}
        />
      )}

      {/* ── 确认弹窗 ── */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description}
        confirmLabel={confirmAction?.confirmLabel ?? "确认执行"}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// 员工详情内容
// ──────────────────────────────────────────────

function EmployeeDetailContent({
  employee, progress, records, batchName, onResetStage, isSuper,
}: {
  employee: Employee;
  progress: EmployeeProgress;
  records: { id: string; event: string; result?: string; timestamp: string }[];
  batchName?: string;
  onResetStage: (stageId: AdminStageId) => void;
  isSuper: boolean;
}) {
  const eventLabels: Record<string, string> = {
    login: "登录",
    stage_start: "开始关卡",
    stage_complete: "完成关卡",
    game_complete: "完成游戏",
    cert_submit: "提交认证",
    cert_passed: "认证通过",
    cert_failed: "认证未通过",
    world_unlocked: "学习天地解锁",
    admin_reset: "管理员重置",
  };

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <InfoSection title="基本信息">
        <InfoRow label="姓名" value={employee.name} />
        <InfoRow label="工号" value={employee.employeeNo} />
        <InfoRow label="手机号(登录账号)" value={employee.phone || "-"} />
        <InfoRow label="部门" value={employee.department} />
        <InfoRow label="岗位" value={employee.position} />
        <InfoRow label="入职日期" value={employee.entryDate} />
        <InfoRow label="培训批次" value={batchName ?? "未分配"} />
        <InfoRow label="账号状态" value={<StageStatusBadge status={employee.status} />} />
      </InfoSection>

      {/* 整体进度 */}
      <InfoSection title="整体进度">
        <div className="flex items-center gap-4 py-3">
          <ProgressRing percent={progress.overallPercent} size={64} />
          <div>
            <p className="text-sm font-medium text-stone-700">{progress.currentStageLabel}</p>
            <p className="text-xs text-stone-400">
              已完成 {progress.completedCount}/6 关
            </p>
            {progress.learningWorldUnlocked && (
              <Badge variant="success" className="mt-1">学习天地已解锁</Badge>
            )}
          </div>
        </div>
      </InfoSection>

      {/* 六关详情 */}
      <InfoSection title="六关进度">
        {ADMIN_STAGES.map((stage) => {
          const stageProg = progress[stage.id as keyof EmployeeProgress] as {
            status?: string; completedAt?: string;
            completedExhibits?: string[]; games?: Record<string, boolean>;
            attempts?: unknown[]; bestScore?: number;
          };
          const status = stageProg?.status ?? "pending";
          return (
            <div key={stage.id} className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StageStatusBadge status={status} />
                  <span className="text-sm text-stone-700">{stage.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {stageProg?.completedAt && (
                    <span className="text-xs text-stone-400">
                      {new Date(stageProg.completedAt).toLocaleDateString("zh-CN")}
                    </span>
                  )}
                  {isSuper && status === "completed" && (
                    <button
                      onClick={() => onResetStage(stage.id)}
                      className="text-xs text-[#b0453a] hover:underline"
                    >
                      重置此关
                    </button>
                  )}
                </div>
              </div>

              {/* 第三关：展区 */}
              {stage.id === "culture" && stageProg?.completedExhibits && (
                <div className="mt-1.5 pl-2 text-xs text-stone-400">
                  已参观展区：{stageProg.completedExhibits.length} 个
                </div>
              )}

              {/* 第五关：游戏 */}
              {stage.id === "rules" && stageProg?.games && (
                <div className="mt-1.5 flex flex-wrap gap-1.5 pl-2">
                  {ADMIN_GAME_INFO.map((g) => (
                    <Badge
                      key={g.key}
                      variant={stageProg.games![g.key] ? "success" : "neutral"}
                    >
                      {g.label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 第六关：认证 */}
              {stage.id === "certification" && (
                <div className="mt-1.5 pl-2">
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span>状态：<StageStatusBadge status={progress.certification.status} /></span>
                    <span>最高分：{progress.certification.bestScore}</span>
                    <span>尝试次数：{progress.certification.attempts.length}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </InfoSection>

      {/* 学习记录 */}
      <InfoSection title="最近学习记录">
        {records.length === 0 ? (
          <EmptyState title="暂无学习记录" />
        ) : (
          <div className="space-y-2">
            {records.slice(0, 10).map((rec) => (
              <div key={rec.id} className="flex items-start justify-between py-1.5">
                <div className="flex-1">
                  <span className="text-xs font-medium text-stone-600">
                    {eventLabels[rec.event] ?? rec.event}
                  </span>
                  {rec.result && (
                    <span className="ml-2 text-xs text-stone-400">{rec.result}</span>
                  )}
                </div>
                <span className="text-xs text-stone-400">
                  {new Date(rec.timestamp).toLocaleString("zh-CN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </InfoSection>
    </div>
  );
}
