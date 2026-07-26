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

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

EXPOSE 4000

# 启动前先同步数据库表结构 + 初始化种子数据（管理员账号+题库），再启动服务
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/seed.js && node dist/index.js"]
