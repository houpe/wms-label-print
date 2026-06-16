#!/bin/bash
set -e

PROJECT_DIR="/Users/houpe/Documents/我的开发项目/wms面单打印/wms-label"
SERVER="root@www.houpe.top"
DEPLOY_DIR="/opt/wms-label"

cd "$PROJECT_DIR"

echo " 本地构建..."
npm run build

echo "📦 同步文件到服务器..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dev.db' \
  --exclude='.git' \
  --exclude='*.db-journal' \
  ./ ${SERVER}:${DEPLOY_DIR}/

echo " 服务器上重建..."
ssh ${SERVER} "
  cd ${DEPLOY_DIR}
  chmod 666 dev.db 2>/dev/null || true
  npm install
  npm run build
  pm2 delete wms-label 2>/dev/null || true
  PORT=3008 pm2 start npm --name wms-label -- start
  pm2 save
"

echo "✅ 部署完成！"
echo "访问: https://houpe.top/print"
