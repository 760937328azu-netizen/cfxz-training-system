/**
 * Express 应用入口
 * 长发小寨新员工培训系统 — 后端 API 服务
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import path from "path";
import fs from "fs";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { authRouter } from "./routes/auth.routes";
import { employeeRouter } from "./routes/employee.routes";
import { progressRouter } from "./routes/progress.routes";
import { certificationRouter } from "./routes/certification.routes";
import { batchRouter } from "./routes/batch.routes";
import { adminRouter } from "./routes/admin.routes";
import { mokaRouter } from "./routes/moka.routes";
import { exportRouter } from "./routes/export.routes";
import { dashboardRouter } from "./routes/dashboard.routes";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// ── 安全 & 基础中间件 ──
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS 配置
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // 允许没有 origin 的请求（如 curl、Postman）
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS 不允许的来源: ${origin}`));
      }
    },
    credentials: true,
  }),
);

// 请求日志
app.use(morgan("dev"));

// 全局 API 限流
app.use("/api", apiLimiter);

// ── 健康检查 ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 临时诊断：列出 public 目录文件 ──
app.get("/api/debug/files", (_req, res) => {
  const walk = (dir: string, prefix = ""): string[] => {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) return walk(fullPath, relPath);
      return relPath;
    });
  };
  try {
    const files = walk(staticDir);
    res.json({
      staticDir,
      exists: fs.existsSync(staticDir),
      totalFiles: files.length,
      sample: files.slice(0, 50),
      xiaoyaoFiles: files.filter((f) => f.includes("xiaoyao/")),
      logoFiles: files.filter((f) => f.includes("logo/")),
      stageFiles: files.filter((f) => f.includes("stages/")),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 路由挂载 ──
app.use("/api/auth", authRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/progress", progressRouter);
app.use("/api/certification", certificationRouter);
app.use("/api/batches", batchRouter);
app.use("/api/admin", adminRouter);
app.use("/api/moka", mokaRouter);
app.use("/api/export", exportRouter);
app.use("/api/dashboard", dashboardRouter);

// Moka Webhook 标准路径别名（同时保留 /api/moka/webhook 兼容路径）
app.use("/api/integrations/moka/webhooks/employee-onboard", (req, res, next) => {
  req.url = "/webhook";
  mokaRouter(req, res, next);
});

// ── 生产环境：托管前端静态文件 ──
const staticDir = path.join(__dirname, "..", "public");
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  // SPA 回退：所有非 API 路由返回 index.html
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(staticDir, "index.html"));
  });
  console.log(`[Production] 静态文件托管目录: ${staticDir}`);
}

// ── 全局错误处理 ──
app.use(errorHandler);

// ── 启动服务 ──
app.listen(PORT, () => {
  console.log(`\n┌──────────────────────────────────────────────┐`);
  console.log(`│  长发小寨培训系统 API 服务已启动                │`);
  console.log(`│  端口: ${PORT}                                    │`);
  console.log(`│  环境: ${process.env.NODE_ENV || "development"}                          │`);
  console.log(`│  API 文档: http://localhost:${PORT}/api/health       │`);
  console.log(`└──────────────────────────────────────────────┘\n`);
});
