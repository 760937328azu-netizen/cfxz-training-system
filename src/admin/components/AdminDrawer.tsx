/**
 * 管理后台 — 右侧抽屉
 * 用于显示员工详情、批次详情、认证详情等
 */

import type { ReactNode } from "react";

export function AdminDrawer({
  open,
  title,
  onClose,
  children,
  width = 560,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="admin-drawer-overlay fixed inset-0 z-[90] bg-black/20" onClick={onClose}>
      <div
        className="admin-drawer-panel absolute right-0 top-0 flex h-full w-full max-w-full flex-col bg-white shadow-xl md:w-[var(--drawer-width)]"
        style={{ "--drawer-width": `${width}px` } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-800">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="admin-scroll flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-stone-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Drawer 子组件：信息行
// ──────────────────────────────────────────────

export function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 ${className}`}>
      <span className="flex-shrink-0 text-sm text-stone-500">{label}</span>
      <span className="text-right text-sm font-medium text-stone-800">{value}</span>
    </div>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">{title}</h4>
      <div className="divide-y divide-stone-50">{children}</div>
    </div>
  );
}
