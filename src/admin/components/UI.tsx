/**
 * 管理后台 — UI 基础组件库
 *
 * 提供 Badge / Button / Input / Select / StatCard / ProgressRing / EmptyState / SearchInput
 * 所有组件使用 Tailwind utility classes + admin.css 补充样式
 */

import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react";

// ──────────────────────────────────────────────
// Badge
// ──────────────────────────────────────────────

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-stone-100 text-stone-600 border-stone-200",
  primary: "bg-[#b0453a]/8 text-[#b0453a] border-[#b0453a]/20",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// ──────────────────────────────────────────────
// Button
// ──────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-[#b0453a] text-white hover:bg-[#9a3c33] disabled:opacity-50",
  secondary: "bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  ghost: "text-stone-600 hover:bg-stone-100 disabled:opacity-50",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

export function Button({
  variant = "secondary",
  size = "md",
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// ──────────────────────────────────────────────
// Input
// ──────────────────────────────────────────────

export function AdminInput({
  label,
  error,
  className = "",
  ...props
}: {
  label?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-stone-600">{label}</label>}
      <input
        className={`admin-input rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

// ──────────────────────────────────────────────
// Select
// ──────────────────────────────────────────────

export function AdminSelect({
  label,
  children,
  className = "",
  ...props
}: {
  label?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-stone-600">{label}</label>}
      <select
        className={`admin-input rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ──────────────────────────────────────────────
// StatCard
// ──────────────────────────────────────────────

export function StatCard({
  title,
  value,
  icon,
  color = "stone",
  subtitle,
}: {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: "stone" | "blue" | "green" | "amber" | "red" | "purple";
  subtitle?: string;
}) {
  const colorMap = {
    stone: "bg-stone-50 text-stone-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-stone-800">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-stone-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// ProgressRing
// ──────────────────────────────────────────────

export function ProgressRing({
  percent,
  size = 48,
  strokeWidth = 4,
  label,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent === 100 ? "#10b981" : percent >= 50 ? "#b0453a" : "#f59e0b";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#f0eeea" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="admin-progress-bar"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-stone-700">
        {label ?? `${percent}%`}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────
// ProgressBar (linear)
// ──────────────────────────────────────────────

export function ProgressBar({
  percent,
  className = "",
  showLabel = false,
}: {
  percent: number;
  className?: string;
  showLabel?: boolean;
}) {
  const color = percent === 100 ? "bg-emerald-500" : percent >= 50 ? "bg-[#b0453a]" : "bg-amber-500";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full ${color} admin-progress-bar`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-stone-500">{percent}%</span>}
    </div>
  );
}

// ──────────────────────────────────────────────
// EmptyState
// ──────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-stone-300">{icon}</div>}
      <h3 className="text-base font-medium text-stone-600">{title}</h3>
      {description && <p className="mt-1 text-sm text-stone-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────
// SearchInput
// ──────────────────────────────────────────────

export function SearchInput({
  placeholder = "搜索...",
  value,
  onChange,
  className = "",
}: {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-800 placeholder:text-stone-400"
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// Card
// ──────────────────────────────────────────────

export function Card({
  title,
  children,
  action,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-stone-200 bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          {title && <h3 className="text-sm font-semibold text-stone-700">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────
// StatusBadge (认证状态/关卡状态专用)
// ──────────────────────────────────────────────

export function StageStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    completed: { variant: "success", label: "已完成" },
    in_progress: { variant: "info", label: "进行中" },
    pending: { variant: "neutral", label: "未开始" },
    locked: { variant: "neutral", label: "未解锁" },
    passed: { variant: "success", label: "已通过" },
    failed: { variant: "danger", label: "未通过" },
    active: { variant: "success", label: "正常" },
    disabled: { variant: "danger", label: "已停用" },
    closed: { variant: "neutral", label: "已关闭" },
  };
  const config = map[status] ?? { variant: "neutral" as BadgeVariant, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
