# 新人培训管理后台 建设规划

## 技术架构

### 数据层（第一阶段 localStorage，第二阶段对接统一服务）

**存储键**：`cfxz-admin-store-v1`

**数据模型**：
```typescript
// 管理员
type AdminAccount = {
  id: string;
  name: string;
  username: string;
  passwordHash: string;     // 简单 SHA-256
  role: 'super' | 'viewer'; // 超级管理员 / 查看管理员
  status: 'active' | 'disabled';
  lastLoginAt?: string;
  createdAt: string;
};

// 员工（新人）
type Employee = {
  id: string;                  // 员工ID
  name: string;                // 姓名
  employeeNo: string;          // 工号
  username: string;            // 登录账号
  department: string;          // 部门
  position: string;            // 岗位
  phone: string;               // 手机号
  entryDate: string;           // 入职日期
  batchId: string;             // 培训批次ID
  initialPassword: string;     // 初始密码
  status: 'active' | 'disabled';
  createdAt: string;
};

// 培训批次
type Batch = {
  id: string;
  name: string;                // "2026年8月第一批新员工"
  startDate: string;
  deadline: string;
  employeeIds: string[];
  status: 'active' | 'closed';
  createdAt: string;
};

// 进度（聚合自 localStorage 数据）
type EmployeeProgress = {
  employeeId: string;
  welcome: { status: 'pending' | 'in_progress' | 'completed'; completedAt?: string };
  company: { status: ... };
  culture: { status: ...; completedExhibits: string[]; completedAt?: string };
  product: { status: ...; completedAt?: string };
  rules: { status: ...; games: { regulation, compliance, culture, knowledge }; completedAt?: string };
  certification: { status: 'locked' | 'in_progress' | 'passed' | 'failed'; attempts: CertAttempt[] };
  lastStage?: string;
  lastSection?: string;
  lastVisitedAt?: string;
};

// 学习记录
type LearningRecord = {
  id: string;
  employeeId: string;
  event: 'login' | 'stage_start' | 'stage_complete' | 'game_complete'
      | 'cert_submit' | 'cert_passed' | 'cert_failed' | 'world_unlocked'
      | 'admin_reset';
  stageId?: string;
  result?: string;
  timestamp: string;
};

// 管理员操作记录
type AdminAction = {
  id: string;
  adminId: string;
  adminName: string;
  action: string;            // "reset_progress" | "disable_employee" | "create_batch" ...
  targetType: 'employee' | 'batch' | 'admin';
  targetId: string;
  details?: string;
  timestamp: string;
};
```

### 路由结构

```
/admin/login         → 管理员登录
/admin/dashboard     → 总览
/admin/employees     → 新人管理
/admin/batches       → 培训批次
/admin/progress      → 学习进度
/admin/certification → 认证管理
/admin/history       → 学习记录
/admin/reports       → 数据导出
/admin/settings      → 管理员设置
```

### 视觉规范

- 延续暖白浅色风格（#F9F6F0 / #FFFFFF / 圆角 16-20px）
- **不**含：小瑶、成长地图、游戏徽章、大型 Hero、卡片套卡片、黑色侧边栏
- 左侧 240px 浅色导航，灰白文字
- 顶部 64px 工具栏（搜索 + 用户菜单）
- 主区域：表格为主，配合右侧抽屉显示详情
- 危险操作：弹窗二次确认

## 建设顺序

### 第一批：基础架构
1. 数据模型 + 存储层 (`src/admin/store.ts`)
2. 种子数据 + 模拟进度数据生成器
3. AdminShell 布局 + AdminSidebar
4. AdminLogin 登录页

### 第二批：核心页面
5. 总览 Dashboard（数据统计 + 六关分布）
6. 新人管理（列表 + 筛选 + 抽屉详情）
7. 培训批次（列表 + 创建）
8. 学习进度（列表 + 时间线）
9. 认证管理（列表 + 详情）
10. 学习记录（列表 + 筛选）
11. 数据导出（CSV 导出）
12. 管理员设置（账号管理）

### 第三批：完善
13. 路由集成到 App.tsx
14. 退出登录 + 会话管理
15. CSS 样式
16. 构建验证 + Playwright 验收

## 关键文件

- `src/admin/types.ts` - 数据类型
- `src/admin/store.ts` - localStorage CRUD
- `src/admin/seed.ts` - 种子数据（管理员 + 员工 + 批次）
- `src/admin/auth.ts` - 简单登录会话
- `src/admin/components/AdminShell.tsx` - 布局
- `src/admin/components/AdminSidebar.tsx`
- `src/admin/components/AdminHeader.tsx`
- `src/admin/components/AdminTable.tsx`
- `src/admin/components/AdminDrawer.tsx`
- `src/admin/components/ConfirmModal.tsx`
- `src/admin/pages/LoginPage.tsx`
- `src/admin/pages/DashboardPage.tsx`
- `src/admin/pages/EmployeesPage.tsx`
- `src/admin/pages/BatchesPage.tsx`
- `src/admin/pages/ProgressPage.tsx`
- `src/admin/pages/CertificationPage.tsx`
- `src/admin/pages/HistoryPage.tsx`
- `src/admin/pages/ReportsPage.tsx`
- `src/admin/pages/SettingsPage.tsx`
- `src/index.css` 新增 `.admin-*` 样式段

## 第一阶段交付标准

按顺序实现上述 16 步：
- 所有路由可达
- 默认管理员 admin/admin123 可登录
- 总览显示真实统计（基于种子数据）
- 新人列表支持搜索/筛选
- 员工详情抽屉可查看
- 培训批次可创建
- 学习进度时间线正确显示
- 认证记录详情可查
- 学习记录可筛选
- 数据导出 CSV 可下载
- 管理员账号可增删改
- 所有危险操作有确认弹窗