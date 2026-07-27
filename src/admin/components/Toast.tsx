/**
 * 管理后台 — 轻量 Toast 通知系统
 *
 * 使用方式：
 *   import { showToast, Toaster } from "./components/Toast";
 *   showToast("操作成功", "success");
 *   showToast("网络错误，请重试", "error");
 *
 * 在 AdminShell 中放置 <Toaster /> 即可自动渲染。
 * 无需 Context Provider，基于模块级事件订阅。
 */

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

// ── 模块级 store ──
let nextId = 0;
let toasts: ToastItem[] = [];
const listeners = new Set<(items: ToastItem[]) => void>();

function emit() {
  const snapshot = [...toasts];
  listeners.forEach((fn) => fn(snapshot));
}

function removeToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** 显示一条 Toast 通知 */
export function showToast(message: string, type: ToastType = "info"): void {
  const id = ++nextId;
  toasts = [...toasts, { id, message, type }];
  emit();
  // 3.5 秒后自动消失
  setTimeout(() => removeToast(id), 3500);
}

/** 从 Error 对象中提取用户可读的错误消息 */
export function getErrorMessage(err: unknown, fallback = "操作失败，请重试"): string {
  if (err instanceof Error) {
    // 常见网络错误
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      return "网络连接失败，请检查网络后重试";
    }
    return err.message;
  }
  if (typeof err === "string") return err;
  return fallback;
}

// ── Toaster 组件 ──

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  const handleDismiss = useCallback((id: number) => {
    removeToast(id);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => handleDismiss(item.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const config = {
    success: { icon: CheckCircle, bg: "bg-green-50", border: "border-green-200", text: "text-green-700", iconColor: "text-green-500" },
    error: { icon: XCircle, bg: "bg-red-50", border: "border-red-200", text: "text-red-700", iconColor: "text-red-500" },
    info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", iconColor: "text-blue-500" },
  }[item.type];

  const Icon = config.icon;

  return (
    <div
      className={`admin-toast-enter flex items-start gap-2.5 rounded-xl border ${config.border} ${config.bg} px-4 py-3 shadow-lg`}
      style={{ minWidth: "280px", maxWidth: "420px" }}
    >
      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${config.iconColor}`} />
      <p className={`flex-1 text-sm leading-relaxed ${config.text}`}>{item.message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 rounded p-0.5 text-stone-400 hover:text-stone-600"
        aria-label="关闭"
      >
        <X size={15} />
      </button>
    </div>
  );
}
