/**
 * 管理后台 — 登录页
 *
 * 居中卡片式登录，暖白背景，无小瑶
 */

import { useState, useEffect } from "react";
import { useAdminAuth } from "../auth";
import { ensureStoreInitialized, isStoreInitialized } from "../store";
import { createSeedData } from "../seed";
import { isApiMode } from "../../lib/api";
import { Button } from "../components/UI";

export function LoginPage() {
  const { login } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 初始化 store（仅 localStorage 降级模式需要）
  useEffect(() => {
    if (!isApiMode() && !isStoreInitialized()) {
      ensureStoreInitialized(createSeedData);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(username.trim(), password);
      if (!result.success) {
        setError(result.error ?? "登录失败");
        setLoading(false);
      }
      // 成功则由外层路由检测 isAuthenticated 变化自动跳转
    } catch {
      setError("登录失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F6F0] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b0453a] text-xl font-bold text-white shadow-lg shadow-[#b0453a]/20">
            长
          </div>
          <h1 className="text-xl font-semibold text-stone-800">长发小寨 · 培训管理后台</h1>
          <p className="mt-1 text-sm text-stone-400">管理员登录</p>
        </div>

        {/* 登录卡片 */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-stone-600">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
              className="admin-input w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-stone-600">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
              className="admin-input w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={loading || !username || !password}
            className="w-full"
          >
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>

        {/* 默认账号提示（仅 localStorage 降级模式显示） */}
        {!isApiMode() && (
          <div className="mt-4 rounded-xl bg-stone-100/80 px-4 py-3 text-xs text-stone-500">
            <p className="mb-1 font-medium text-stone-600">默认账号</p>
            <p>超级管理员：admin / admin123</p>
            <p>查看管理员：viewer / viewer123</p>
          </div>
        )}
      </div>
    </div>
  );
}
