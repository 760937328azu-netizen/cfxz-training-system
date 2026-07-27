/**
 * API 客户端层 — 前端与后端通信的唯一入口
 *
 * 设计原则：
 * 1. 所有后端 API 调用都经过此模块，禁止在组件中直接 fetch
 * 2. JWT token 自动管理（Authorization: Bearer 头）
 * 3. 当 VITE_API_BASE_URL 未配置时，isApiMode() 返回 false，前端降级到 localStorage 模式
 * 4. 类型安全：所有请求和响应都有 TypeScript 类型定义
 */

// ═══════════════════════════════════════════════
// 配置 & 常量
// ═══════════════════════════════════════════════

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") || "";

const EMPLOYEE_TOKEN_KEY = "cfxz-auth-token";
const ADMIN_TOKEN_KEY = "cfxz-admin-auth-token";

/** 是否已配置后端 API（决定前端走 API 模式还是 localStorage 降级模式） */
export function isApiMode(): boolean {
  return API_BASE_URL.length > 0;
}

/**
 * 生产环境防护：如果运行在生产构建中但 VITE_API_BASE_URL 未配置，
 * 说明构建时环境变量丢失（常见于 Docker 构建未注入 ENV）。
 * 此时前端会静默降级到 localStorage 模式，导致数据只存在浏览器中，
 * 其他设备无法访问。发出醒目警告以便排查。
 */
if (import.meta.env.PROD && API_BASE_URL.length === 0) {
  console.error(
    "%c⚠️ 生产环境警告：VITE_API_BASE_URL 未配置！\n" +
    "前端已降级到 localStorage 模式，所有数据仅存储在当前浏览器中。\n" +
    "其他设备/用户无法访问这些数据，登录认证也不是真实的。\n" +
    "请检查 Docker 构建时是否注入了 ENV VITE_API_BASE_URL=/api",
    "color: #dc2626; font-size: 14px; font-weight: bold;"
  );
}

/** 获取 API 基础 URL（供调试用） */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// ═══════════════════════════════════════════════
// Token 管理
// ═══════════════════════════════════════════════

/** 员工 token */
export function getEmployeeToken(): string | null {
  try {
    return localStorage.getItem(EMPLOYEE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setEmployeeToken(token: string): void {
  try {
    localStorage.setItem(EMPLOYEE_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearEmployeeToken(): void {
  try {
    localStorage.removeItem(EMPLOYEE_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** 管理员 token */
export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ═══════════════════════════════════════════════
// 错误类型
// ═══════════════════════════════════════════════

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// ═══════════════════════════════════════════════
// 核心请求函数
// ═══════════════════════════════════════════════

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** 使用管理员 token 还是员工 token */
  authType?: "employee" | "admin";
  /** 不自动跳转登录页（用于登录请求本身） */
  skipAuthRedirect?: boolean;
  /** 返回原始 Response（用于下载文件等） */
  rawResponse?: boolean;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, authType = "employee", skipAuthRedirect = false, rawResponse = false } = options;

  const token = authType === "admin" ? getAdminToken() : getEmployeeToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? `网络请求失败: ${err.message}` : "网络请求失败",
      0,
      "NETWORK_ERROR",
    );
  }

  // 处理 401
  if (response.status === 401 && !skipAuthRedirect) {
    if (authType === "admin") {
      clearAdminToken();
    } else {
      clearEmployeeToken();
    }
    throw new ApiError("登录已过期，请重新登录", 401, "UNAUTHORIZED");
  }

  // 原始响应（用于下载）
  if (rawResponse) {
    return response as unknown as T;
  }

  // 解析 JSON
  let data: unknown;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as Record<string, unknown>).error)
        : `请求失败 (${response.status})`;
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}

// ═══════════════════════════════════════════════
// API 类型定义（与后端路由响应对齐）
// ═══════════════════════════════════════════════

// ── Auth ──
export type EmployeeLoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    phone: string;
    department: string | null;
    position: string | null;
    employeeNo: string | null;
    batchId: string | null;
    batchName: string | null;
    entryDate: string | null;
  };
};

export type AdminLoginResponse = {
  token: string;
  admin: {
    id: string;
    name: string;
    username: string;
    role: "super" | "viewer";
  };
};

export type MeResponse =
  | {
      role: "employee";
      user: EmployeeLoginResponse["user"];
    }
  | {
      role: "super" | "viewer";
      admin: AdminLoginResponse["admin"];
    };

// ── Progress ──
export type ProgressResponse = {
  progress: {
    currentStage: string;
    lastSection: string | null;
    lastVisitedAt: string | null;
    learningWorldUnlocked: boolean;
  };
  stages: Record<string, {
    status: string;
    completedExhibits: string[];
    completedAt: string | null;
  }>;
  games: Record<string, {
    completed: boolean;
    completedAt: string | null;
  }>;
  certification: {
    status: string;
    attempts: number;
    bestScore: number;
    passed: boolean;
    lastAttempt: {
      score: number;
      passed: boolean;
      weakAreas: string[];
      submittedAt: string;
    } | null;
  };
  completedCount: number;
  overallPercent: number;
};

export type EmployeeDetailProgress = {
  employee: {
    id: string;
    name: string;
    phone: string;
    department: string | null;
    position: string | null;
    employeeNo: string | null;
    batchName: string | null;
    entryDate: string | null;
    status: string;
    lastLoginAt: string | null;
  };
  progress: {
    currentStage: string;
    lastSection: string | null;
    lastVisitedAt: string | null;
    learningWorldUnlocked: boolean;
  } | null;
  stages: Array<{
    stageId: string;
    status: string;
    completedExhibits: string[];
    completedAt: string | null;
  }>;
  games: Array<{
    gameKey: string;
    completed: boolean;
    completedAt: string | null;
  }>;
  certifications: Array<{
    id: string;
    score: number;
    passed: boolean;
    weakAreas: string[];
    questionVersion: string;
    submittedAt: string;
  }>;
  events: Array<{
    id: string;
    eventType: string;
    stageId: string | null;
    result: string;
    createdAt: string;
  }>;
};

// ── Certification ──
export type CertificationQuestion = {
  id: string;
  question: string;
  options: string[];
  category: string;
};

export type QuestionsResponse = {
  version: string;
  questions: CertificationQuestion[];
};

export type SubmitCertResponse = {
  attemptId: string;
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  weakAreas: string[];
  wrongQuestions: Array<{
    questionId: string;
    question: string;
    selectedOption: number;
    correctIndex: number;
    explanation: string;
  }>;
};

export type CertHistoryResponse = {
  attempts: Array<{
    id: string;
    score: number;
    passed: boolean;
    weakAreas: string[];
    questionVersion: string;
    submittedAt: string;
  }>;
  bestScore: number;
  totalAttempts: number;
  passed: boolean;
};

// ── Employee (admin) ──
export type EmployeeListItem = {
  id: string;
  name: string;
  employeeNo: string | null;
  phone: string;
  department: string | null;
  position: string | null;
  entryDate: string | null;
  batchId: string | null;
  batchName: string | null;
  status: string;
  dataSource: string;
  mokaEmployeeId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

export type EmployeeListResponse = {
  total: number;
  page: number;
  pageSize: number;
  employees: EmployeeListItem[];
};

export type CreateEmployeeResponse = {
  employee: {
    id: string;
    name: string;
    phone: string;
    employeeNo: string | null;
    department: string | null;
    position: string | null;
    entryDate: string | null;
    batchId: string | null;
    status: string;
  };
  initialPassword: string;
};

export type BatchCreateEmployeeResult = {
  name: string;
  phone: string;
  password: string;
  success: boolean;
  error?: string;
};

// ── Batch ──
export type BatchItem = {
  id: string;
  name: string;
  startDate: string;
  deadline: string;
  status: string;
  employeeCount: number;
  createdAt: string;
};

export type BatchListResponse = {
  batches: BatchItem[];
};

// ── Admin user ──
export type AdminUserItem = {
  id: string;
  name: string;
  username: string;
  role: "super" | "viewer";
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
};

// ── Logs & Events ──
export type AdminLog = {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string | null;
  details: string | null;
  createdAt: string;
};

export type AdminLogResponse = {
  total: number;
  page: number;
  pageSize: number;
  logs: AdminLog[];
};

export type LearningEventItem = {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  eventType: string;
  stageId: string | null;
  result: string;
  createdAt: string;
};

export type LearningEventResponse = {
  total: number;
  page: number;
  pageSize: number;
  events: LearningEventItem[];
};

// ── Question bank ──
export type QuestionBankItem = {
  id: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QuestionBankListResponse = {
  banks: QuestionBankItem[];
};

// ── Dashboard ──
export type DashboardStatsResponse = {
  totalEmployees: number;
  learningCount: number;
  completedAllStages: number;
  certifiedCount: number;
  notStartedCount: number;
  overdueCount: number;
  stageDistribution: Array<{
    stageId: string;
    label: string;
    completed: number;
    inProgress: number;
    pending: number;
  }>;
  attentionList: Array<{
    employee: {
      id: string;
      name: string;
      phone: string;
      department: string | null;
    };
    reason: string;
    daysOverdue?: number;
  }>;
};

// ═══════════════════════════════════════════════
// API 模块
// ═══════════════════════════════════════════════

// ── 认证 API ──
export const authApi = {
  /** 员工登录（手机号 + 密码） */
  employeeLogin(phone: string, password: string): Promise<EmployeeLoginResponse> {
    return apiRequest<EmployeeLoginResponse>("/auth/employee/login", {
      method: "POST",
      body: { phone, password },
      skipAuthRedirect: true,
    });
  },

  /** 管理员登录（用户名 + 密码） */
  adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
    return apiRequest<AdminLoginResponse>("/auth/admin/login", {
      method: "POST",
      body: { username, password },
      authType: "admin",
      skipAuthRedirect: true,
    });
  },

  /** 获取当前登录用户信息 */
  getMe(authType: "employee" | "admin" = "employee"): Promise<MeResponse> {
    return apiRequest<MeResponse>("/auth/me", { authType });
  },

  /** 修改密码 */
  changePassword(oldPassword: string, newPassword: string, authType: "employee" | "admin" = "employee"): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: { oldPassword, newPassword },
      authType,
    });
  },
};

// ── 学习进度 API ──
export const progressApi = {
  /** 获取当前员工的完整学习进度 */
  get(): Promise<ProgressResponse> {
    return apiRequest<ProgressResponse>("/progress");
  },

  /** 更新关卡进度 */
  updateStage(stageId: string, action: "start" | "complete" | "complete_exhibit", exhibitId?: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/progress/stage", {
      method: "PUT",
      body: { stageId, action, exhibitId },
    });
  },

  /** 更新游戏进度 */
  updateGame(gameKey: string, gameData?: unknown): Promise<{ message: string; allGamesCompleted?: boolean }> {
    return apiRequest<{ message: string; allGamesCompleted?: boolean }>("/progress/game", {
      method: "PUT",
      body: { gameKey, gameData },
    });
  },

  /** 保存学习位置 */
  savePosition(currentStage?: string, lastSection?: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/progress/position", {
      method: "PUT",
      body: { currentStage, lastSection },
    });
  },

  /** 管理员查看指定员工进度 */
  getByUserId(userId: string): Promise<EmployeeDetailProgress> {
    return apiRequest<EmployeeDetailProgress>(`/progress/${userId}`, {
      authType: "admin",
    });
  },
};

// ── 认证考试 API ──
export const certificationApi = {
  /** 获取当前题库的题目 */
  getQuestions(): Promise<QuestionsResponse> {
    return apiRequest<QuestionsResponse>("/certification/questions");
  },

  /** 提交认证考试 */
  submit(version: string, answers: Array<{ questionId: string; selectedOption: number }>): Promise<SubmitCertResponse> {
    return apiRequest<SubmitCertResponse>("/certification/submit", {
      method: "POST",
      body: { version, answers },
    });
  },

  /** 获取认证历史记录 */
  getHistory(userId?: string): Promise<CertHistoryResponse> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return apiRequest<CertHistoryResponse>(`/certification/history${query}`);
  },

  /** 管理员重置员工认证 */
  reset(userId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/certification/${userId}/reset`, {
      method: "POST",
      authType: "admin",
    });
  },
};

// ── 员工管理 API（管理员） ──
export const employeeApi = {
  /** 获取员工列表（支持筛选/分页） */
  list(params?: { search?: string; batchId?: string; status?: string; page?: number; pageSize?: number }): Promise<EmployeeListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.batchId) query.set("batchId", params.batchId);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const qs = query.toString();
    return apiRequest<EmployeeListResponse>(`/employees${qs ? `?${qs}` : ""}`, {
      authType: "admin",
    });
  },

  /** 获取单个员工详情 */
  get(id: string): Promise<EmployeeListItem> {
    return apiRequest<EmployeeListItem>(`/employees/${id}`, {
      authType: "admin",
    });
  },

  /** 新增员工 */
  create(data: {
    name: string;
    phone: string;
    employeeNo?: string;
    department?: string;
    position?: string;
    entryDate?: string;
    batchId?: string;
    initialPassword?: string;
  }): Promise<CreateEmployeeResponse> {
    return apiRequest<CreateEmployeeResponse>("/employees", {
      method: "POST",
      body: data,
      authType: "admin",
    });
  },

  /** 更新员工信息 */
  update(id: string, data: {
    name?: string;
    phone?: string;
    employeeNo?: string;
    department?: string;
    position?: string;
    entryDate?: string;
    batchId?: string | null;
    status?: "active" | "disabled";
    resetPassword?: string;
  }): Promise<{ employee: CreateEmployeeResponse["employee"]; newPassword?: string }> {
    return apiRequest(`/employees/${id}`, {
      method: "PUT",
      body: data,
      authType: "admin",
    });
  },

  /** 删除员工 */
  delete(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/employees/${id}`, {
      method: "DELETE",
      authType: "admin",
    });
  },

  /** 批量新增员工 */
  batchCreate(employees: Array<{
    name: string;
    phone: string;
    employeeNo?: string;
    department?: string;
    position?: string;
    entryDate?: string;
  }>, batchId?: string): Promise<{ results: BatchCreateEmployeeResult[] }> {
    return apiRequest<{ results: BatchCreateEmployeeResult[] }>("/employees/batch", {
      method: "POST",
      body: { employees, batchId },
      authType: "admin",
    });
  },

  /** 重置员工全部进度 */
  resetProgress(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/employees/${id}/reset-progress`, {
      method: "POST",
      authType: "admin",
    });
  },
};

// ── 培训批次 API ──
export const batchApi = {
  /** 获取批次列表 */
  list(): Promise<BatchListResponse> {
    return apiRequest<BatchListResponse>("/batches", {
      authType: "admin",
    });
  },

  /** 创建批次 */
  create(data: { name: string; startDate: string; deadline: string }): Promise<{ batch: BatchItem }> {
    return apiRequest<{ batch: BatchItem }>("/batches", {
      method: "POST",
      body: data,
      authType: "admin",
    });
  },

  /** 更新批次 */
  update(id: string, data: {
    name?: string;
    startDate?: string;
    deadline?: string;
    status?: "active" | "closed";
  }): Promise<{ batch: BatchItem }> {
    return apiRequest<{ batch: BatchItem }>(`/batches/${id}`, {
      method: "PUT",
      body: data,
      authType: "admin",
    });
  },

  /** 删除批次 */
  delete(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/batches/${id}`, {
      method: "DELETE",
      authType: "admin",
    });
  },
};

// ── 管理员管理 API ──
export const adminApi = {
  /** 获取管理员列表 */
  listUsers(): Promise<{ admins: AdminUserItem[] }> {
    return apiRequest<{ admins: AdminUserItem[] }>("/admin/users", {
      authType: "admin",
    });
  },

  /** 创建管理员 */
  createUser(data: {
    name: string;
    username: string;
    password: string;
    role: "super" | "viewer";
  }): Promise<{ admin: AdminUserItem }> {
    return apiRequest<{ admin: AdminUserItem }>("/admin/users", {
      method: "POST",
      body: data,
      authType: "admin",
    });
  },

  /** 更新管理员 */
  updateUser(id: string, data: {
    name?: string;
    username?: string;
    password?: string;
    role?: "super" | "viewer";
    status?: "active" | "disabled";
  }): Promise<{ admin: AdminUserItem }> {
    return apiRequest<{ admin: AdminUserItem }>(`/admin/users/${id}`, {
      method: "PUT",
      body: data,
      authType: "admin",
    });
  },

  /** 删除管理员 */
  deleteUser(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/admin/users/${id}`, {
      method: "DELETE",
      authType: "admin",
    });
  },

  /** 获取操作日志 */
  getLogs(params?: { page?: number; pageSize?: number; targetType?: string; adminId?: string }): Promise<AdminLogResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.targetType) query.set("targetType", params.targetType);
    if (params?.adminId) query.set("adminId", params.adminId);
    const qs = query.toString();
    return apiRequest<AdminLogResponse>(`/admin/logs${qs ? `?${qs}` : ""}`, {
      authType: "admin",
    });
  },

  /** 获取学习事件 */
  getEvents(params?: { page?: number; pageSize?: number; userId?: string; eventType?: string }): Promise<LearningEventResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.userId) query.set("userId", params.userId);
    if (params?.eventType) query.set("eventType", params.eventType);
    const qs = query.toString();
    return apiRequest<LearningEventResponse>(`/admin/events${qs ? `?${qs}` : ""}`, {
      authType: "admin",
    });
  },

  /** 获取题库列表 */
  getQuestionBanks(): Promise<QuestionBankListResponse> {
    return apiRequest<QuestionBankListResponse>("/admin/questions", {
      authType: "admin",
    });
  },

  /** 上传/更新题库 */
  uploadQuestions(data: {
    version: string;
    questions: Array<{
      id: string;
      question: string;
      options: string[];
      correctIndex: number;
      category: string;
      explanation: string;
    }>;
    activate?: boolean;
  }): Promise<{ bank: { id: string; version: string; isActive: boolean; questionCount: number } }> {
    return apiRequest("/admin/questions", {
      method: "POST",
      body: data,
      authType: "admin",
    });
  },
};

// ── Dashboard 统计 API ──
export const dashboardApi = {
  /** 获取仪表盘统计数据 */
  getStats(): Promise<DashboardStatsResponse> {
    return apiRequest<DashboardStatsResponse>("/dashboard/stats", {
      authType: "admin",
    });
  },
};

// ── 数据导出 API ──
export const exportApi = {
  /** 导出员工进度 CSV（返回 Blob） */
  async employeesCSV(): Promise<Blob> {
    const response = await apiRequest<Response>("/export/employees", {
      authType: "admin",
      rawResponse: true,
    });
    return response.blob();
  },

  /** 导出单个员工详细进度 JSON */
  progressJSON(userId: string): Promise<EmployeeDetailProgress> {
    return apiRequest<EmployeeDetailProgress>(`/export/progress/${userId}`, {
      authType: "admin",
    });
  },
};
