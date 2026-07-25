/**
 * 管理后台 — 确认弹窗
 * 用于危险操作（重置进度、删除员工、停用账号等）的二次确认
 */

import type { ReactNode } from "react";
import { Button } from "./UI";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  variant = "danger",
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="admin-modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
      onClick={onCancel}
    >
      <div
        className="admin-modal-panel mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {variant === "danger" && (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-stone-800">{title}</h3>
            {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
            {children && <div className="mt-3">{children}</div>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
