/**
 * 管理后台 — 员工新增/编辑表单弹窗
 */

import { useState, useEffect } from "react";
import type { Employee, Batch } from "../types";
import { AdminInput, AdminSelect } from "./UI";
import { ConfirmModal } from "./ConfirmModal";

export function EmployeeFormModal({
  employee,
  batches,
  onClose,
  onSave,
}: {
  employee: Employee | null;
  batches: Batch[];
  onClose: () => void;
  onSave: (data: Omit<Employee, "id" | "createdAt" | "status"> & { status?: Employee["status"] }) => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    employeeNo: "",
    username: "",
    department: "",
    position: "",
    phone: "",
    entryDate: new Date().toISOString().slice(0, 10),
    batchId: "",
    initialPassword: "cfxz123456",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name,
        employeeNo: employee.employeeNo,
        username: employee.username,
        department: employee.department,
        position: employee.position,
        phone: employee.phone,
        entryDate: employee.entryDate,
        batchId: employee.batchId,
        initialPassword: employee.initialPassword,
      });
    }
  }, [employee]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "请输入姓名";
    if (!form.employeeNo.trim()) errs.employeeNo = "请输入工号";
    if (!form.phone.trim()) errs.phone = "请输入手机号";
    if (!form.department.trim()) errs.department = "请输入部门";
    if (!form.entryDate) errs.entryDate = "请选择入职日期";
    if (!form.initialPassword.trim()) errs.initialPassword = "请输入初始密码";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSave({
      name: form.name.trim(),
      employeeNo: form.employeeNo.trim(),
      username: form.phone.trim(), // 登录账号默认使用手机号
      department: form.department.trim(),
      position: form.position.trim(),
      phone: form.phone.trim(),
      entryDate: form.entryDate,
      batchId: form.batchId,
      initialPassword: form.initialPassword.trim(),
      ...(employee ? { status: employee.status } : {}),
    });
  };

  return (
    <ConfirmModal
      open
      title={employee ? "编辑员工信息" : "新增员工"}
      confirmLabel={employee ? "保存修改" : "创建员工"}
      variant="primary"
      onConfirm={handleSubmit}
      onCancel={onClose}
    >
      <div className="grid grid-cols-2 gap-3">
        <AdminInput
          label="姓名 *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <AdminInput
          label="工号 *"
          value={form.employeeNo}
          onChange={(e) => setForm({ ...form, employeeNo: e.target.value })}
          error={errors.employeeNo}
        />
        <AdminInput
          label="手机号 *"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value, username: e.target.value })}
          error={errors.phone}
          placeholder="此手机号将作为登录账号"
        />
        <AdminInput
          label="部门 *"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          error={errors.department}
        />
        <AdminInput
          label="岗位"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
        />
        <AdminInput
          label="入职日期 *"
          type="date"
          value={form.entryDate}
          onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
          error={errors.entryDate}
        />
        <AdminSelect
          label="培训批次"
          value={form.batchId}
          onChange={(e) => setForm({ ...form, batchId: e.target.value })}
        >
          <option value="">未分配</option>
          {batches.filter((b) => b.status === "active").map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </AdminSelect>
        <div className="flex items-end">
          <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 leading-relaxed">
            员工使用手机号作为登录账号登录前台培训系统
          </p>
        </div>
        <div className="col-span-2">
          <AdminInput
            label="初始密码 *"
            value={form.initialPassword}
            onChange={(e) => setForm({ ...form, initialPassword: e.target.value })}
            error={errors.initialPassword}
            placeholder="员工首次登录使用的密码"
          />
        </div>
      </div>
    </ConfirmModal>
  );
}
