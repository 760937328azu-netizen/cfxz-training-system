import { useState } from "react";
import { Lock, Phone } from "lucide-react";
import { USER_STORAGE_KEYS, saveCurrentUser } from "../hooks/useCurrentUser";
import { isApiMode, authApi, setEmployeeToken, ApiError } from "../lib/api";

interface LoginPageProps {
  onLogin: () => void;
}

/** 后台 Employee 的最小类型（仅用于降级模式登录验证读取） */
type EmployeeRecord = {
  id: string;
  name: string;
  username: string;
  department: string;
  initialPassword: string;
  status: "active" | "disabled";
};

type AdminStoreShape = {
  employees?: EmployeeRecord[];
};

const ADMIN_STORE_KEY = "cfxz-admin-store-v1";

/** 从后台 localStorage 读取员工列表（仅降级模式使用） */
function readEmployeeList(): EmployeeRecord[] {
  try {
    const raw = window.localStorage.getItem(ADMIN_STORE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as AdminStoreShape;
    return data.employees ?? [];
  } catch {
    return [];
  }
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * API 模式登录：调用后端 POST /api/auth/employee/login
   * 后端验证手机号+密码，返回 JWT token + 用户信息
   */
  const handleApiLogin = async (phone: string, pwd: string) => {
    try {
      const res = await authApi.employeeLogin(phone, pwd);
      // 保存 JWT token
      setEmployeeToken(res.token);
      // 保存用户信息到 localStorage 缓存（供 useCurrentUser 同步读取）
      saveCurrentUser(res.user);
      onLogin();
    } catch (err) {
      if (err instanceof ApiError) {
        // 后端返回的具体错误信息
        if (err.status === 401) {
          setError("手机号或密码错误，请重试");
        } else if (err.status === 403) {
          setError("该账号已被停用，请联系管理员");
        } else if (err.status === 404) {
          setError("账号不存在，请确认手机号或联系管理员添加");
        } else {
          setError(err.message || "登录失败，请稍后重试");
        }
      } else {
        setError("网络连接失败，请检查网络后重试");
      }
    }
  };

  /**
   * 降级模式登录：从 localStorage admin store 读取员工列表，明文密码比对
   * 仅当 VITE_API_BASE_URL 未配置时使用
   */
  const handleLocalLogin = (phone: string, pwd: string) => {
    const employees = readEmployeeList();

    if (employees.length === 0) {
      setError("系统尚未配置员工账号，请联系管理员先在后台添加员工");
      return;
    }

    const employee = employees.find((emp) => emp.username === phone);

    if (!employee) {
      setError("账号不存在，请确认账号或联系管理员添加");
      return;
    }

    if (employee.status !== "active") {
      setError("该账号已被停用，请联系管理员");
      return;
    }

    if (pwd !== employee.initialPassword) {
      setError("密码错误，请重试或联系管理员");
      return;
    }

    // 验证通过 — 写入全部身份字段
    try {
      window.localStorage.setItem(USER_STORAGE_KEYS.session, "1");
      window.localStorage.setItem(USER_STORAGE_KEYS.name, employee.name);
      window.localStorage.setItem(USER_STORAGE_KEYS.department, employee.department);
      window.localStorage.setItem(USER_STORAGE_KEYS.username, employee.username);
      window.localStorage.setItem(USER_STORAGE_KEYS.employeeId, employee.id);
    } catch {
      // ignore
    }
    onLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("请输入手机号");
      return;
    }
    if (!password) {
      setError("请输入密码");
      return;
    }

    setLoading(true);

    if (isApiMode()) {
      // API 模式：调用后端验证
      await handleApiLogin(trimmedUsername, password);
    } else {
      // 降级模式：本地 localStorage 验证（模拟 400ms 延迟保持 UX 一致）
      setTimeout(() => {
        handleLocalLogin(trimmedUsername, password);
        setLoading(false);
      }, 400);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Background video */}
      <video
        className="login-page__video"
        autoPlay
        muted
        loop
        playsInline
        poster="/assets/login-bg-poster.jpg"
      >
        <source src="/assets/login-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="login-page__overlay" aria-hidden="true" />

      {/* Content */}
      <div className="login-page__content">
        <div className="login-card">
          <div className="login-card__brand">
            <div className="login-card__logo" aria-hidden="true">
              <img src="/logo/cfxz-logo-brown.png" alt="长发小寨" />
            </div>
            <div className="login-card__titles">
              <h1>长发小寨</h1>
              <p>新员工成长地图</p>
            </div>
          </div>

          <p className="login-card__greeting">
            欢迎加入长发小寨
            <br />
            开启你的入职学习之旅
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-username">手机号</label>
              <div className="login-input-wrap">
                <Phone size={18} className="login-input-icon" />
                <input
                  id="login-username"
                  type="tel"
                  placeholder="请输入手机号"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">密码</label>
              <div className="login-input-wrap">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? "进入中…" : "进入成长地图"}
            </button>
          </form>

          <p className="login-hint">
            请使用管理员登记的手机号登录，如无账号请联系管理员添加
          </p>
        </div>
      </div>
    </div>
  );
}
