#!/bin/bash
# ──────────────────────────────────────────────
# 生产环境统一构建脚本
# 1. 构建前端 (Vite build) → dist/
# 2. 构建后端 (tsc) → server/dist/
# 3. 复制前端产物到 server/public/
# 4. 复制 Prisma 相关文件
# ──────────────────────────────────────────────
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "========================================"
echo "  长发小寨培训系统 — 生产构建"
echo "========================================"

# Step 1: 构建前端
echo ""
echo "[1/4] 构建前端..."
cd "$ROOT_DIR"
npm run build
echo "  ✅ 前端构建完成 → dist/"

# Step 2: 构建后端
echo ""
echo "[2/4] 构建后端..."
cd "$ROOT_DIR/server"
npm run build
echo "  ✅ 后端构建完成 → server/dist/"

# Step 3: 复制前端产物到 server/public/
echo ""
echo "[3/4] 复制前端产物到 server/public/..."
PUBLIC_DIR="$ROOT_DIR/server/public"
rm -rf "$PUBLIC_DIR"
cp -r "$ROOT_DIR/dist" "$PUBLIC_DIR"
echo "  ✅ 前端产物已复制到 server/public/"

# Step 4: 确保 Prisma schema 可用
echo ""
echo "[4/4] 检查 Prisma 配置..."
if [ -f "$ROOT_DIR/server/prisma/schema.prisma" ]; then
  echo "  ✅ schema.prisma 存在"
else
  echo "  ❌ schema.prisma 不存在!"
  exit 1
fi

# 检查生成的 Prisma Client
if [ -d "$ROOT_DIR/server/node_modules/.prisma" ]; then
  echo "  ✅ Prisma Client 已生成"
else
  echo "  ⚠️  Prisma Client 未找到，正在生成..."
  cd "$ROOT_DIR/server"
  npx prisma generate
  echo "  ✅ Prisma Client 已生成"
fi

echo ""
echo "========================================"
echo "  ✅ 构建完成！"
echo "========================================"
echo ""
echo "启动生产服务:"
echo "  cd server"
echo "  NODE_ENV=production node dist/index.js"
echo ""
echo "部署目录结构:"
echo "  server/"
echo "    ├── dist/          (后端编译输出)"
echo "    ├── public/        (前端静态文件)"
echo "    ├── prisma/        (数据库 schema)"
echo "    ├── node_modules/  (依赖)"
echo "    └── package.json"
echo ""
