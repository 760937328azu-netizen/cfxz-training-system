/**
 * 管理后台 — 数据类型定义
 *
 * 所有管理后台的类型、常量统一定义在此文件中。
 * 前端员工进度数据（LearningProgress）通过映射函数转换为 EmployeeProgress。
 */

// ──────────────────────────────────────────────
// 管理员
// ──────────────────────────────────────────────

export type AdminRole = "super" | "viewer";
export type AdminStatus = "active" | "disabled";

export type AdminAccount = {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt?: string;
  createdAt: string;
};

// ──────────────────────────────────────────────
// 员工（新人）
// ──────────────────────────────────────────────

export type EmployeeStatus = "active" | "disabled";

export type Employee = {
  id: string;
  name: string;
  employeeNo: string; // 工号
  username: string; // 登录账号
  department: string; // 部门
  position: string; // 岗位
  phone: string; // 手机号
  entryDate: string; // 入职日期 YYYY-MM-DD
  batchId: string; // 培训批次ID
  initialPassword: string; // 初始密码
  status: EmployeeStatus;
  createdAt: string;
};

// ──────────────────────────────────────────────
// 培训批次
// ──────────────────────────────────────────────

export type BatchStatus = "active" | "closed";

export type Batch = {
  id: string;
  name: string;
  startDate: string;
  deadline: string;
  employeeIds: string[];
  status: BatchStatus;
  createdAt: string;
};

// ──────────────────────────────────────────────
// 员工进度（管理后台读取模型）
// ──────────────────────────────────────────────

export type StageStatus = "pending" | "in_progress" | "completed";

export type EmployeeStageProgress = {
  status: StageStatus;
  completedAt?: string;
};

export type EmployeeCultureProgress = EmployeeStageProgress & {
  completedExhibits: string[];
};

export type EmployeeRulesProgress = {
  status: StageStatus;
  games: {
    regulation: boolean; // 制度守卫战（rocketBoss）
    compliance: boolean; // 合规判断（valueCatch）
    culture: boolean; // 文化对对碰（valueMatch）
    knowledge: boolean; // 知识问答（quiz）
  };
  completedAt?: string;
};

export type CertAttempt = {
  attemptNo: number;
  score: number;
  passed: boolean;
  weakAreas: string[];
  submittedAt: string;
};

export type CertStatus = "locked" | "in_progress" | "passed" | "failed";

export type EmployeeCertificationProgress = {
  status: CertStatus;
  attempts: CertAttempt[];
  bestScore: number;
};

export type EmployeeProgress = {
  employeeId: string;
  welcome: EmployeeStageProgress;
  company: EmployeeStageProgress;
  culture: EmployeeCultureProgress;
  product: EmployeeStageProgress;
  rules: EmployeeRulesProgress;
  certification: EmployeeCertificationProgress;
  lastStage?: string;
  lastSection?: string;
  lastVisitedAt?: string;
  learningWorldUnlocked: boolean;
  /** 已完成关卡数 (0-6) */
  completedCount: number;
  /** 整体进度百分比 0-100 */
  overallPercent: number;
  /** 当前所在关卡 label */
  currentStageLabel: string;
};

// ──────────────────────────────────────────────
// 学习记录
// ──────────────────────────────────────────────

export type LearningEventType =
  | "login"
  | "stage_start"
  | "stage_complete"
  | "game_complete"
  | "cert_submit"
  | "cert_passed"
  | "cert_failed"
  | "world_unlocked"
  | "admin_reset";

export type AdminLearningRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  event: LearningEventType;
  stageId?: string;
  result?: string;
  timestamp: string;
};

// ──────────────────────────────────────────────
// 管理员操作记录
// ──────────────────────────────────────────────

export type AdminActionTargetType = "employee" | "batch" | "admin" | "system";

export type AdminAction = {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: AdminActionTargetType;
  targetId: string;
  targetName?: string;
  details?: string;
  timestamp: string;
};

// ──────────────────────────────────────────────
// Store 整体结构
// ──────────────────────────────────────────────

export type AdminStoreData = {
  admins: AdminAccount[];
  employees: Employee[];
  batches: Batch[];
  records: AdminLearningRecord[];
  actions: AdminAction[];
  version: number;
};

export type StoreSnapshot = {
  admins: AdminAccount[];
  employees: Employee[];
  batches: Batch[];
  records: AdminLearningRecord[];
  actions: AdminAction[];
};

// ──────────────────────────────────────────────
// 常量：关卡信息
// ──────────────────────────────────────────────

export type AdminStageId =
  | "welcome"
  | "company"
  | "culture"
  | "product"
  | "rules"
  | "certification";

export const ADMIN_STAGES: {
  id: AdminStageId;
  label: string;
  short: string;
}[] = [
  { id: "welcome", label: "01 欢迎加入", short: "欢迎加入" },
  { id: "company", label: "02 品牌起源", short: "品牌起源" },
  { id: "culture", label: "03 云游博物馆", short: "云游博物馆" },
  { id: "product", label: "04 认识产品", short: "认识产品" },
  { id: "rules", label: "05 制度闯关", short: "制度闯关" },
  { id: "certification", label: "06 入职认证", short: "入职认证" },
];

export const ADMIN_GAME_INFO: {
  key: "regulation" | "compliance" | "culture" | "knowledge";
  label: string;
  sourceKey: string; // 前端 useLearningProgress 中的 key
}[] = [
  { key: "regulation", label: "制度守卫战", sourceKey: "rocketBoss" },
  { key: "compliance", label: "合规判断", sourceKey: "valueCatch" },
  { key: "culture", label: "文化对对碰", sourceKey: "valueMatch" },
  { key: "knowledge", label: "知识问答", sourceKey: "quiz" },
];

// ──────────────────────────────────────────────
// Dashboard 统计类型
// ──────────────────────────────────────────────

export type DashboardStats = {
  totalEmployees: number;
  learningCount: number; // 正在学习中
  completedAllStages: number; // 已完成六关
  certifiedCount: number; // 已通过认证
  notStartedCount: number; // 尚未开始
  overdueCount: number; // 超期未完成
  stageDistribution: {
    stageId: AdminStageId;
    label: string;
    completed: number;
    inProgress: number;
    pending: number;
  }[];
  attentionList: {
    employee: Employee;
    reason: string;
    daysOverdue?: number;
  }[];
};
