/**
 * 管理后台 — 数据导出
 *
 * 按批次/部门/入职时间/完成状态/认证状态筛选导出 CSV
 */

import { useState, useMemo, useEffect } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import {
  useAdminStore, getEmployeeProgress, exportEmployeesCSV, downloadCSV,
  fetchEmployeeProgressBatch, apiExportEmployeesCSV,
} from "../store";
import { isApiMode } from "../../lib/api";
import type { Employee, EmployeeProgress, Batch } from "../types";
import { Button, Card, AdminSelect } from "../components/UI";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";

export function ReportsPage() {
  const store = useAdminStore();

  const [batchId, setBatchId] = useState("");
  const [department, setDepartment] = useState("");
  const [entryDateFrom, setEntryDateFrom] = useState("");
  const [entryDateTo, setEntryDateTo] = useState("");
  const [completionStatus, setCompletionStatus] = useState("");
  const [certStatus, setCertStatus] = useState("");

  // 部门列表
  const departments = useMemo(() => {
    const set = new Set<string>();
    store.employees.forEach((e) => { if (e.department) set.add(e.department); });
    return Array.from(set).sort();
  }, [store.employees]);

  // 进度缓存
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

  // 批次映射
  const batchMap = useMemo(() => {
    const map = new Map<string, Batch>();
    store.batches.forEach((b) => map.set(b.id, b));
    return map;
  }, [store.batches]);

  // 筛选
  const filtered = useMemo(() => {
    return store.employees.filter((emp) => {
      if (batchId && emp.batchId !== batchId) return false;
      if (department && emp.department !== department) return false;
      if (entryDateFrom && emp.entryDate < entryDateFrom) return false;
      if (entryDateTo && emp.entryDate > entryDateTo) return false;

      const prog = progressMap.get(emp.id);
      if (completionStatus) {
        if (completionStatus === "completed" && prog?.completedCount !== 6) return false;
        if (completionStatus === "learning" && (prog?.completedCount === 0 || prog?.completedCount === 6)) return false;
        if (completionStatus === "not_started" && prog?.completedCount !== 0) return false;
      }
      if (certStatus) {
        if (prog?.certification.status !== certStatus) return false;
      }
      return true;
    });
  }, [store.employees, batchId, department, entryDateFrom, entryDateTo, completionStatus, certStatus, progressMap]);

  // 导出 CSV
  const handleExport = async () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    if (isApiMode()) {
      try {
        const blob = await apiExportEmployeesCSV();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `员工培训数据_${dateStr}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // 降级：使用本地数据导出
        const csv = exportEmployeesCSV(filtered, progressMap, batchMap);
        downloadCSV(csv, `员工培训数据_${dateStr}.csv`);
      }
    } else {
      const csv = exportEmployeesCSV(filtered, progressMap, batchMap);
      downloadCSV(csv, `员工培训数据_${dateStr}.csv`);
    }
  };

  // 预览表格列
  const columns: Column<Employee>[] = [
    {
      key: "name",
      label: "姓名",
      render: (emp) => <span className="font-medium text-stone-700">{emp.name}</span>,
    },
    { key: "employeeNo", label: "工号", render: (emp) => emp.employeeNo },
    { key: "department", label: "部门", render: (emp) => emp.department },
    {
      key: "batch",
      label: "批次",
      render: (emp) => batchMap.get(emp.batchId)?.name ?? "未分配",
    },
    {
      key: "progress",
      label: "进度",
      render: (emp) => {
        const prog = progressMap.get(emp.id);
        return `${prog?.completedCount ?? 0}/6 (${prog?.overallPercent ?? 0}%)`;
      },
    },
    {
      key: "certStatus",
      label: "认证",
      render: (emp) => {
        const prog = progressMap.get(emp.id);
        const s = prog?.certification.status ?? "locked";
        const labels: Record<string, string> = {
          passed: "已通过", failed: "未通过", in_progress: "待认证", locked: "未解锁",
        };
        return labels[s] ?? s;
      },
    },
  ];

  const hasFilters = batchId || department || entryDateFrom || entryDateTo || completionStatus || certStatus;

  return (
    <div className="space-y-4">
      {/* 筛选区 */}
      <Card title="筛选条件">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <AdminSelect label="培训批次" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">全部批次</option>
            {store.batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </AdminSelect>

          <AdminSelect label="部门" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">全部部门</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </AdminSelect>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-600">入职日期</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={entryDateFrom}
                onChange={(e) => setEntryDateFrom(e.target.value)}
                className="admin-input rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm"
              />
              <span className="text-stone-400">~</span>
              <input
                type="date"
                value={entryDateTo}
                onChange={(e) => setEntryDateTo(e.target.value)}
                className="admin-input rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm"
              />
            </div>
          </div>

          <AdminSelect label="完成状态" value={completionStatus} onChange={(e) => setCompletionStatus(e.target.value)}>
            <option value="">全部</option>
            <option value="completed">已完成六关</option>
            <option value="learning">学习中</option>
            <option value="not_started">尚未开始</option>
          </AdminSelect>

          <AdminSelect label="认证状态" value={certStatus} onChange={(e) => setCertStatus(e.target.value)}>
            <option value="">全部</option>
            <option value="passed">已通过</option>
            <option value="failed">未通过</option>
            <option value="in_progress">待认证</option>
            <option value="locked">未解锁</option>
          </AdminSelect>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <FileSpreadsheet size={16} />
            <span>已筛选 {filtered.length} 人 / 共 {store.employees.length} 人</span>
            {hasFilters && (
              <button
                onClick={() => {
                  setBatchId(""); setDepartment(""); setEntryDateFrom("");
                  setEntryDateTo(""); setCompletionStatus(""); setCertStatus("");
                }}
                className="ml-2 text-xs text-[#b0453a] hover:underline"
              >
                清除筛选
              </button>
            )}
          </div>
          <Button variant="primary" onClick={handleExport} disabled={filtered.length === 0}>
            <Download size={16} /> 导出 CSV
          </Button>
        </div>
      </Card>

      {/* 预览表格 */}
      <Card title="导出预览">
        <AdminTable
          columns={columns}
          data={filtered}
          rowKey={(emp) => emp.id}
          emptyTitle="暂无符合条件的数据"
          maxHeight="400px"
        />
        <p className="mt-3 text-xs text-stone-400">
          导出的 CSV 文件包含：姓名、工号、登录账号、部门、岗位、入职日期、培训批次、当前关卡、整体进度(%)、认证状态、最后学习时间、账号状态
        </p>
      </Card>
    </div>
  );
}
