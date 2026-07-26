# 长发小寨培训系统 — 上线部署指南

> 本文档指导你从零完成系统部署，预计耗时 30-60 分钟（不含 Supabase 注册）。

---

## 前置条件

- Node.js 22+（已安装）
- npm 或 pnpm
- Supabase 免费账号（https://supabase.com）

---

## Step 1: 创建 Supabase 项目

1. 访问 https://supabase.com 注册/登录
2. 点击 **New Project**，填写项目名称（如 `cfxz-training`）
3. 设置数据库密码（**请牢记此密码**）
4. 选择区域：Southeast Asia (Singapore) 或 East Asia
5. 等待项目创建完成（约 2 分钟）

### 获取 Database URL

1. 进入项目 → 左侧菜单 **Settings** → **Database**
2. 找到 **Connection string** → 选择 **URI** 格式
3. 复制连接字符串，格式如下：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
4. 将 `[YOUR-PASSWORD]` 替换为你设置的数据库密码

---

## Step 2: 配置后端环境变量

```bash
cd server
cp .env.example .env
```

编辑 `server/.env`，填入以下内容：

```env
# 服务端口
PORT=4000

# Supabase PostgreSQL 连接字符串（替换为你的实际值）
DATABASE_URL=postgresql://postgres:你的密码@db.你的项目ref.supabase.co:5432/postgres

# JWT 密钥（生成随机字符串，可用：openssl rand -base64 64）
JWT_SECRET=在这里填入一个64位随机字符串
JWT_EXPIRES_IN=7d

# CORS 允许的前端来源
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# 管理员初始账号
SEED_ADMIN_NAME=超级管理员
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=ChangeMe!2026
```

> **重要**：上线前务必修改 `SEED_ADMIN_PASSWORD` 为强密码！

---

## Step 3: 创建数据库表

```bash
cd server
npx prisma db push
```

这会在 Supabase PostgreSQL 中创建全部 11 张表：
- `users` — 员工表
- `admin_users` — 管理员表
- `training_batches` — 培训批次
- `learning_progress` — 学习进度总表
- `stage_progress` — 关卡进度
- `game_progress` — 游戏进度
- `certification_attempts` — 认证考试记录
- `learning_events` — 学习事件
- `moka_sync_events` — Moka 同步事件
- `admin_operation_logs` — 管理员操作日志
- `question_bank` — 认证题库

验证：到 Supabase Dashboard → Table Editor 查看是否出现 11 张表。

---

## Step 4: 初始化种子数据

```bash
cd server
npm run seed
```

这将创建：
- 1 个超级管理员账号（`admin` / `ChangeMe!2026`）
- 1 套认证题库（v1.0，20 道题）

> **安全提示**：seed 完成后请立即登录管理后台修改管理员密码！

---

## Step 5: 配置前端环境变量

在项目根目录创建 `.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

> 生产环境部署时，将此地址改为后端服务的实际域名。

---

## Step 6: 启动后端服务

```bash
cd server
npm run dev
```

看到以下输出表示启动成功：
```
┌──────────────────────────────────────────────┐
│  长发小寨培训系统 API 服务已启动                │
│  端口: 4000                                    │
│  环境: development                             │
│  API 文档: http://localhost:4000/api/health    │
└──────────────────────────────────────────────┘
```

验证：浏览器访问 http://localhost:4000/api/health，应返回：
```json
{"status":"ok","timestamp":"2026-..."}
```

---

## Step 7: 启动前端服务

```bash
npm run dev
```

前端将在 http://localhost:5173 启动。

---

## Step 8: 端到端验证

### 8.1 管理后台验证

1. 访问 http://localhost:5173/#/admin
2. 使用 `admin` / `ChangeMe!2026` 登录
3. 验证以下功能：
   - [ ] 仪表盘显示统计数据
   - [ ] 员工管理 → 新增员工 → 填写手机号 → 创建成功
   - [ ] 员工列表显示新创建的员工
   - [ ] 批次管理 → 创建批次
   - [ ] 认证管理 → 查看题库
   - [ ] 学习记录 → 查看事件日志
   - [ ] 操作日志 → 查看管理员操作记录
   - [ ] 报表导出 → 下载 CSV
   - [ ] 系统设置 → 查看管理员列表

### 8.2 员工前台验证

1. 在管理后台创建一个测试员工（记住手机号和初始密码）
2. 访问 http://localhost:5173
3. 使用员工手机号 + 密码登录
4. 验证以下功能：
   - [ ] 登录成功，显示首页
   - [ ] 进入第一关「欢迎加入」→ 标记完成
   - [ ] 第二关解锁
   - [ ] 进度跨刷新保持
   - [ ] 进入第六关 → 参加认证考试
   - [ ] 认证通过后「学习天地」解锁

### 8.3 跨设备验证

1. 用手机浏览器访问（确保与电脑在同一网络或使用 ngrok）
2. 用同一员工账号登录
3. 验证进度与电脑端同步

---

## Step 9: 上线前检查清单

- [ ] 修改管理员默认密码（`ChangeMe!2026` → 强密码）
- [ ] 清除所有测试员工数据
- [ ] 审核 20 道认证题目内容准确性
- [ ] 检查所有图片素材是否完整（`public/` 目录）
- [ ] 修改报告文字中的「演示」「测试」等字样
- [ ] 配置生产环境 CORS_ORIGINS（改为实际前端域名）
- [ ] 配置生产环境 VITE_API_BASE_URL（改为实际后端域名）
- [ ] 如果使用 Moka 接口，配置 Moka 相关环境变量

---

## 生产环境部署建议

### 后端部署

推荐使用以下平台之一：
- **Railway** (https://railway.app) — 简单易用，支持 Node.js
- **Render** (https://render.com) — 免费层可用
- **Vercel** (https://vercel.com) — 支持 Serverless Functions

部署步骤：
1. 将 `server/` 目录推送到 Git 仓库
2. 在部署平台创建新项目，连接 Git 仓库
3. 配置环境变量（同 Step 2）
4. 构建命令：`npm install && npx prisma generate && npm run build`
5. 启动命令：`npm start`
6. 验证健康检查接口可访问

### 前端部署

推荐使用：
- **Vercel** — Vite 项目原生支持
- **Netlify** — 静态站点托管
- **CloudStudio** — WorkBuddy 内置部署

部署步骤：
1. 配置生产环境变量 `VITE_API_BASE_URL` 指向后端域名
2. 构建命令：`npm run build`
3. 输出目录：`dist/`
4. 部署后验证页面可访问

---

## 常见问题

### Q: prisma db push 报错连接超时？
A: 检查 DATABASE_URL 中的密码是否正确，项目 ref 是否匹配。Supabase 免费层可能有连接数限制，重试即可。

### Q: 前端登录提示「手机号或密码错误」？
A: 确认员工是在管理后台创建的（而非 localStorage 演示数据）。API 模式下只验证数据库中的员工记录。

### Q: 管理后台显示空数据？
A: 检查浏览器控制台是否有 CORS 错误。确认 `server/.env` 中 `CORS_ORIGINS` 包含前端地址。

### Q: 前端仍然走 localStorage 模式？
A: 检查前端 `.env.local` 是否存在且 `VITE_API_BASE_URL` 已正确配置。重启 `npm run dev`。

### Q: 如何切换回纯本地演示模式？
A: 删除或清空 `.env.local` 中的 `VITE_API_BASE_URL`，前端会自动降级到 localStorage 模式。

---

## 技术架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (React + Vite)                       │
│  http://localhost:5173                                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  员工前台     │  │  管理后台     │  │  API 客户端层     │  │
│  │  (6关+认证)  │  │  (8个页面)   │  │  src/lib/api.ts  │  │
│  └──────────────┘  └──────────────┘  └────────┬─────────┘  │
│                                               │              │
│                    isApiMode() ──→ true: API  │              │
│                                  ──→ false: localStorage     │
└───────────────────────────────────────────────┼──────────────┘
                                                │ HTTPS
┌───────────────────────────────────────────────┼──────────────┐
│                 后端 (Express + TS)            │              │
│  http://localhost:4000                        ▼              │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  认证    │  │  员工管理 │  │  进度管理 │  │  认证考试   │  │
│  │  JWT     │  │  CRUD    │  │  关卡+游戏│  │  题库+评分  │  │
│  └─────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  批次    │  │  管理员   │  │  导出     │  │  Moka       │  │
│  │  管理    │  │  管理     │  │  CSV     │  │  Webhook    │  │
│  └─────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  中间件: authenticate → requireAdmin/requireSuper     │   │
│  │  安全: helmet + cors + bcrypt(12轮) + JWT(7天)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │ Prisma ORM                        │
└──────────────────────────┼───────────────────────────────────┘
                           │ TCP
┌──────────────────────────┼───────────────────────────────────┐
│                 Supabase (PostgreSQL)                         │
│                                                               │
│  11 张表: users, admin_users, training_batches,              │
│  learning_progress, stage_progress, game_progress,            │
│  certification_attempts, learning_events,                     │
│  moka_sync_events, admin_operation_logs, question_bank        │
└───────────────────────────────────────────────────────────────┘
```

---

## 文件结构

```
项目根目录/
├── src/                          # 前端源码
│   ├── lib/api.ts                # API 客户端层（双模式入口）
│   ├── hooks/useCurrentUser.ts   # 用户身份管理（JWT + 降级）
│   ├── hooks/useLearningProgress.ts # 学习进度（API 同步 + 降级）
│   ├── pages/LoginPage.tsx       # 员工登录页（双模式）
│   ├── admin/
│   │   ├── auth.ts               # 管理员认证（双模式）
│   │   ├── store.ts              # 管理后台数据层（双模式）
│   │   ├── types.ts              # 类型定义
│   │   ├── components/           # UI 组件
│   │   └── pages/                # 8 个管理页面
│   └── ...
├── server/                       # 后端源码
│   ├── src/
│   │   ├── index.ts              # Express 入口
│   │   ├── lib/                  # auth.ts, prisma.ts, logger.ts
│   │   ├── middleware/           # auth.ts, requireRole.ts, errorHandler.ts
│   │   ├── routes/               # 9 个路由模块
│   │   └── seed.ts               # 种子数据初始化
│   ├── prisma/schema.prisma      # 11 张表定义
│   ├── .env.example              # 后端环境变量模板
│   └── package.json
├── .env.example                  # 前端环境变量模板
├── .env.local                    # 前端实际环境变量（需创建）
└── DEPLOYMENT-GUIDE.md           # 本文档
```
