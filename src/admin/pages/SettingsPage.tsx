/**
 * 管理后台 — 管理员设置
 *
 * 超级管理员：新增/编辑/停用/删除管理员
 * 查看管理员：只读
 */

import { useState, useCallback } from "react";
import { Plus, Shield, Eye, KeyRound, Ban, CheckCircle, Trash2 } from "lucide-react";
import {
  useAdminStore, createAdmin, updateAdmin, deleteAdmin, hashPassword, logAdminAction,
  apiCreateAdmin, apiUpdateAdmin, apiDeleteAdmin,
} from "../store";
import { useAdminAuth, canEdit } from "../auth";
import { isApiMode } from "../../lib/api";
import type { AdminAccount, AdminRole } from "../types";
import {
  Button, Badge, StageStatusBadge, AdminInput, AdminSelect,
} from "../components/UI";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { ConfirmModal } from "../components/ConfirmModal";

export function SettingsPage() {
  const store = useAdminStore();
  const { admin: currentAdmin } = useAdminAuth();
  const isSuper = canEdit(currentAdmin);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const handleAddNew = useCallback(() => {
    setEditingAdmin(null);
    setShowFormModal(true);
  }, []);

  const handleEdit = useCallback((adminAcc: AdminAccount) => {
    setEditingAdmin(adminAcc);
    setShowFormModal(true);
  }, []);

  const handleToggleStatus = useCallback((adminAcc: AdminAccount) => {
    if (!currentAdmin) return;
    const newStatus = adminAcc.status === "active" ? "disabled" : "active";
    setConfirmAction({
      title: newStatus === "disabled" ? "停用管理员" : "启用管理员",
      description: `确认${newStatus === "disabled" ? "停用" : "启用"}管理员「${adminAcc.name}」？`,
      onConfirm: async () => {
        if (isApiMode()) {
          await apiUpdateAdmin(adminAcc.id, { status: newStatus }).catch(() => {});
        } else {
          updateAdmin(adminAcc.id, { status: newStatus });
          logAdminAction({
            adminName: currentAdmin.name,
            action: `${newStatus === "disabled" ? "停用" : "启用"}管理员：${adminAcc.name}`,
            targetType: "admin",
            targetId: adminAcc.id,
            targetName: adminAcc.name,
          });
        }
        setConfirmAction(null);
      },
    });
  }, [currentAdmin]);

  const handleDelete = useCallback((adminAcc: AdminAccount) => {
    if (!currentAdmin) return;
    setConfirmAction({
      title: "删除管理员",
      description: `确认删除管理员「${adminAcc.name}」？此操作不可撤销。`,
      onConfirm: async () => {
        if (isApiMode()) {
          await apiDeleteAdmin(adminAcc.id).catch(() => {});
        } else {
          deleteAdmin(adminAcc.id);
          logAdminAction({
            adminName: currentAdmin.name,
            action: `删除管理员：${adminAcc.name}`,
            targetType: "admin",
            targetId: adminAcc.id,
            targetName: adminAcc.name,
          });
        }
        setConfirmAction(null);
      },
    });
  }, [currentAdmin]);

  const handleResetPassword = useCallback((adminAcc: AdminAccount) => {
    if (!currentAdmin) return;
    setConfirmAction({
      title: "重置密码",
      description: `确认将管理员「${adminAcc.name}」的密码重置为默认密码？`,
      onConfirm: async () => {
        if (isApiMode()) {
          // API 模式：后端处理密码重置，前端不传明文密码
          await apiUpdateAdmin(adminAcc.id, { resetPassword: true }).catch(() => {});
        } else {
          updateAdmin(adminAcc.id, { passwordHash: hashPassword("admin123") });
          logAdminAction({
            adminName: currentAdmin.name,
            action: `重置管理员密码：${adminAcc.name}`,
            targetType: "admin",
            targetId: adminAcc.id,
            targetName: adminAcc.name,
          });
        }
        setConfirmAction(null);
      },
    });
  }, [currentAdmin]);

  const columns: Column<AdminAccount>[] = [
    {
      key: "name",
      label: "姓名",
      render: (adminAcc) => (
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            adminAcc.role === "super" ? "bg-[#b0453a]/10 text-[#b0453a]" : "bg-blue-50 text-blue-600"
          }`}>
            {adminAcc.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-stone-800">{adminAcc.name}</div>
            <div className="text-xs text-stone-400">{adminAcc.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "角色",
      render: (adminAcc) => (
        adminAcc.role === "super"
          ? <Badge variant="primary"><Shield size={12} /> 超级管理员</Badge>
          : <Badge variant="info"><Eye size={12} /> 查看管理员</Badge>
      ),
    },
    {
      key: "status",
      label: "状态",
      render: (adminAcc) => <StageStatusBadge status={adminAcc.status} />,
    },
    {
      key: "lastLogin",
      label: "最后登录",
      render: (adminAcc) => adminAcc.lastLoginAt
        ? new Date(adminAcc.lastLoginAt).toLocaleString("zh-CN")
        : <span className="text-stone-400">从未登录</span>,
    },
    {
      key: "createdAt",
      label: "创建时间",
      render: (adminAcc) => new Date(adminAcc.createdAt).toLocaleDateString("zh-CN"),
    },
    {
      key: "actions",
      label: "操作",
      align: "center",
      render: (adminAcc) => {
        if (!isSuper) return null;
        const isSelf = adminAcc.id === currentAdmin?.id;
        return (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleEdit(adminAcc); }}
              className="rounded p-1.5 text-stone-500 hover:bg-stone-100"
              title="编辑"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleResetPassword(adminAcc); }}
              className="rounded p-1.5 text-stone-500 hover:bg-stone-100"
              title="重置密码"
            >
              <KeyRound size={14} />
            </button>
            {!isSelf && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(adminAcc); }}
                  className="rounded p-1.5 text-stone-500 hover:bg-stone-100"
                  title={adminAcc.status === "active" ? "停用" : "启用"}
                >
                  {adminAcc.status === "active" ? <Ban size={14} /> : <CheckCircle size={14} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(adminAcc); }}
                  className="rounded p-1.5 text-red-400 hover:bg-red-50"
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-400">共 {store.admins.length} 个管理员账号</span>
        {isSuper && (
          <Button variant="primary" onClick={handleAddNew}>
            <Plus size={16} /> 新增管理员
          </Button>
        )}
      </div>

      {/* 管理员列表 */}
      <AdminTable
        columns={columns}
        data={store.admins}
        rowKey={(adminAcc) => adminAcc.id}
        emptyTitle="暂无管理员"
      />

      {/* 角色说明 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-stone-700">角色权限说明</h3>
        <div className="space-y-2 text-sm text-stone-500">
          <div className="flex items-start gap-2">
            <Badge variant="primary"><Shield size={12} /> 超级管理员</Badge>
            <span>全部权限：管理员工、批次、进度查看、认证管理、重置操作、数据导出、管理员设置</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="info"><Eye size={12} /> 查看管理员</Badge>
            <span>只读权限：查看所有数据和导出，不可进行任何修改操作</span>
          </div>
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      {showFormModal && (
        <AdminFormModal
          adminAcc={editingAdmin}
          onClose={() => { setShowFormModal(false); setEditingAdmin(null); }}
          onSave={async (data) => {
            if (editingAdmin) {
              if (isApiMode()) {
                await apiUpdateAdmin(editingAdmin.id, {
                  name: data.name,
                  username: data.username,
                  role: data.role,
                  ...(data.password ? { password: data.password } : {}),
                }).catch(() => {});
              } else {
                updateAdmin(editingAdmin.id, {
                  name: data.name,
                  username: data.username,
                  role: data.role,
                  ...(data.password ? { passwordHash: hashPassword(data.password) } : {}),
                });
                if (currentAdmin) {
                  logAdminAction({
                    adminName: currentAdmin.name,
                    action: `修改管理员信息：${data.name}`,
                    targetType: "admin",
                    targetId: editingAdmin.id,
                    targetName: data.name,
                  });
                }
              }
            } else {
              if (isApiMode()) {
                await apiCreateAdmin(data).catch(() => {});
              } else {
                createAdmin(data);
                if (currentAdmin) {
                  logAdminAction({
                    adminName: currentAdmin.name,
                    action: `新增管理员：${data.name}`,
                    targetType: "admin",
                    targetId: "",
                    targetName: data.name,
                  });
                }
              }
            }
            setShowFormModal(false);
            setEditingAdmin(null);
          }}
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
// 管理员新增/编辑弹窗
// ──────────────────────────────────────────────

function AdminFormModal({
  adminAcc,
  onClose,
  onSave,
}: {
  adminAcc: AdminAccount | null;
  onClose: () => void;
  onSave: (data: { name: string; username: string; password: string; role: AdminRole }) => void;
}) {
  const [name, setName] = useState(adminAcc?.name ?? "");
  const [username, setUsername] = useState(adminAcc?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>(adminAcc?.role ?? "viewer");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "请输入姓名";
    if (!username.trim()) errs.username = "请输入登录账号";
    if (!adminAcc && !password.trim()) errs.password = "请输入密码";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave({ name: name.trim(), username: username.trim(), password, role });
  };

  return (
    <ConfirmModal
      open
      title={adminAcc ? "编辑管理员" : "新增管理员"}
      confirmLabel={adminAcc ? "保存" : "创建"}
      variant="primary"
      onConfirm={handleSubmit}
      onCancel={onClose}
    >
      <div className="space-y-3">
        <AdminInput
          label="姓名 *"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: "" }); }}
          error={errors.name}
        />
        <AdminInput
          label="登录账号 *"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setErrors({ ...errors, username: "" }); }}
          error={errors.username}
        />
        <AdminInput
          label={adminAcc ? "新密码（留空则不修改）" : "密码 *"}
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: "" }); }}
          error={errors.password}
          placeholder={adminAcc ? "输入新密码以修改" : "请输入密码"}
        />
        <AdminSelect
          label="角色"
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
        >
          <option value="super">超级管理员（全部权限）</option>
          <option value="viewer">查看管理员（只读 + 导出）</option>
        </AdminSelect>
      </div>
    </ConfirmModal>
  );
}
