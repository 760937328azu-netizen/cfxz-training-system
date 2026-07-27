# ──────────────────────────────────────────────
# 长发小寨培训系统 — 生产 Docker 镜像
# 统一部署：前端静态文件 + 后端 API
# ──────────────────────────────────────────────

# ---- Stage 1: 构建前端 ----
FROM node:22-slim AS frontend-builder

WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci
COPY . .

# 显式注入前端 API 地址（同源 /api），确保生产构建中 isApiMode() 返回 true
# 不依赖 .env.production 文件（可能被 .gitignore 排除导致 Railway 拉取时缺失）
ENV VITE_API_BASE_URL=/api
RUN npm run build

# ---- Stage 2: 构建后端 ----
FROM node:22-slim AS backend-builder

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npx prisma generate
RUN npm run build

# ---- Stage 3: 生产运行时 ----
FROM node:22-slim AS production

WORKDIR /app

# 安装最小运行时依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# 复制后端 package.json
COPY server/package*.json ./

# 复制 Prisma schema（prisma generate 需要它）
COPY --from=backend-builder /app/server/prisma ./prisma

# 安装生产依赖 + 生成 Prisma Client
RUN npm ci --only=production && npx prisma generate

# 复制后端编译输出
COPY --from=backend-builder /app/server/dist ./dist

# 复制前端静态文件（前端构建产物在 /app/frontend/dist）
COPY --from=frontend-builder /app/frontend/dist ./public

# 复制种子数据文件
COPY --from=backend-builder /app/server/handbook-kb.json ./handbook-kb.json

# 环境变量
ENV NODE_ENV=production
ENV PORT=4000

# 健康检查（start-period 设为 120s，给 prisma db push + seed + server 启动留足时间）
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

EXPOSE 4000

# 启动流程：1) 同步数据库表结构  2) 初始化种子数据  3) 启动 Express 服务
# 使用 ./node_modules/.bin/prisma（而非 npx prisma）避免运行时下载开销
# db push 和 seed 设为非致命（|| true），即使失败也启动服务器，以便通过日志诊断
CMD ["sh", "-c", "echo '=== [1/3] Running prisma db push ===' && (./node_modules/.bin/prisma db push --accept-data-loss 2>&1 || echo 'WARNING: prisma db push failed, continuing...') && echo '=== [2/3] Running seed ===' && (node dist/seed.js 2>&1 || echo 'WARNING: seed failed, continuing...') && echo '=== [3/3] Starting Express server ===' && node dist/index.js"]
