#!/bin/bash
# wms-label 部署脚本（PM2 + Nginx）
#
# 关键改进（修复 ChunkLoadError / 404）：
#   1. 构建 + 自检通过后才重启进程，进程运行期间 .next/static/chunks 始终完整。
#   2. 使用 pm2 reload（graceful），先起新进程再关旧进程，零停机。
#   3. 构建前备份旧 .next，便于回滚。
set -e

PROJECT_DIR="/Users/houpe/Documents/我的开发项目/wms面单打印/wms-label"
SERVER="root@www.houpe.top"
DEPLOY_DIR="/opt/wms-label"

cd "$PROJECT_DIR"

echo "🧹 本地清理旧构建产物..."
rm -rf .next

echo "🏗️  本地构建（webpack）..."
npm run build

echo "📦 同步源码到服务器（不含 .next / node_modules / db）..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dev.db' \
  --exclude='*.db' \
  --exclude='*.db-journal' \
  --exclude='.git' \
  --exclude='logs' \
  ./ "${SERVER}:${DEPLOY_DIR}/"

echo "🖥️  服务器：安装依赖并构建..."
ssh "${SERVER}" bash -s <<'REMOTE'
set -e
cd /opt/wms-label

echo "   [服务器] npm install..."
# 注意：不能用 --omit=dev，webpack 构建时解析 tsconfig 路径别名
# 依赖 typescript 等 devDependencies，省略会导致 "Module not found"
npm install

# 备份当前构建产物，便于回滚
if [ -d .next ]; then
  rm -rf .next.prev
  mv .next .next.prev
fi

echo "   [服务器] next build..."
npm run build

# 确保日志目录存在
mkdir -p logs

echo "   [服务器] 校验构建产物..."
test -f .next/BUILD_ID || { echo "❌ 构建失败：缺少 .next/BUILD_ID"; exit 1; }
test -d .next/static    || { echo "❌ 构建失败：缺少 .next/static";   exit 1; }

# 数据库权限（SQLite 需要写权限）
chmod 666 dev.db 2>/dev/null || true
chmod 666 prisma/dev.db 2>/dev/null || true

echo "   [服务器] pm2 reload（零停机）..."
if pm2 describe wms-label > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "   [服务器] 清理上一版构建备份..."
rm -rf .next.prev

echo "✅ 服务器部署完成"
REMOTE

echo ""
echo "🎉 全部完成！访问: https://houpe.top/print"
