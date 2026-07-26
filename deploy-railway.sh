#!/bin/bash
# Railway 一键部署脚本
# 在用户完成 browserless login 后执行

set -e

RAILWAY="C:/Users/HUAWEI/.workbuddy/binaries/node/workspace/node_modules/@railway/cli/bin/railway.exe"
PROJECT_DIR="C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了"

echo "=========================================="
echo "  长发小寨培训系统 — Railway 部署"
echo "=========================================="

# Step 0: 验证登录
echo ""
echo "[Step 0] 验证 Railway 登录状态..."
"$RAILWAY" whoami
if [ $? -ne 0 ]; then
  echo "ERROR: 未登录，请先执行 railway login --browserless"
  exit 1
fi

# Step 1: 创建项目
echo ""
echo "[Step 1] 创建 Railway 项目..."
cd "$PROJECT_DIR"
"$RAILWAY" init --name "cfxz-training-system" 2>&1 || {
  echo "项目可能已存在，尝试链接..."
  "$RAILWAY" link 2>&1
}

# Step 2: 设置环境变量
echo ""
echo "[Step 2] 配置环境变量..."

# 数据库连接（Session Pooler - 运行时用）
"$RAILWAY" variables set \
  "DATABASE_URL=postgresql://postgres.esjcmzrabwunereuvnfm:fB1ySiLARwQIlcwO@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=training&connection_limit=5&pool_timeout=30"

# 数据库直连（Prisma 迁移用）
"$RAILWAY" variables set \
  "DIRECT_URL=postgresql://postgres.esjcmzrabwunereuvnfm:fB1ySiLARwQIlcwO@aws-1-ap-northeast-2.supabase.com:5432/postgres?schema=training"

# JWT 密钥
"$RAILWAY" variables set \
  "JWT_SECRET=VpY8lKzNRHcOHrPCYe2QpRBYQdeo1keQNFjZMJbd4rVSKt8K71vQhSQB0M8iqTIm"

# 管理员账号
"$RAILWAY" variables set \
  "SEED_ADMIN_NAME=超级管理员"
"$RAILWAY" variables set \
  "SEED_ADMIN_USERNAME=admin"
"$RAILWAY" variables set \
  "SEED_ADMIN_PASSWORD=Cfxz!Prod#2026Secure"

# 系统变量
"$RAILWAY" variables set "NODE_ENV=production"
"$RAILWAY" variables set "PORT=4000"

echo "环境变量配置完成"

# Step 3: 部署代码
echo ""
echo "[Step 3] 上传代码并构建..."
"$RAILWAY" up --detach 2>&1
echo "代码已上传，Railway 正在构建..."

# Step 4: 生成域名
echo ""
echo "[Step 4] 生成 HTTPS 公网域名..."
"$RAILWAY" domain 2>&1
echo "域名已生成"

# Step 5: 等待部署完成
echo ""
echo "[Step 5] 等待部署完成（可能需要 3-5 分钟）..."
echo "可以通过 railway.app 控制台查看构建进度"

echo ""
echo "=========================================="
echo "  部署脚本执行完毕"
echo "  请在 Railway 控制台确认构建状态"
echo "=========================================="
