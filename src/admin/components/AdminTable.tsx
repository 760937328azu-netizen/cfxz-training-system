/**
 * 管理后台 — 通用表格组件
 *
 * 支持自定义列、行点击、空状态、排序
 */

import type { ReactNode } from "react";
import { EmptyState } from "./UI";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
};

export function AdminTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyIcon,
  emptyTitle = "暂无数据",
  emptyDescription,
  maxHeight,
}: {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  maxHeight?: string;
}) {
  const alignClass = (align?: string) =>
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="admin-scroll overflow-x-auto" style={maxHeight ? { maxHeight } : undefined}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 ${alignClass(col.align)}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={`admin-table-row ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-stone-700 ${alignClass(col.align)} ${col.className ?? ""}`}
                    >
                      {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
