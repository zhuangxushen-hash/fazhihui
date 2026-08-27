#!/bin/bash
# 服务器端：为测试环境(fazhihui-test)启用法大大 UAT 电子签并部署
# 步骤：上传源码→追加.env→构建→停旧root孤儿进程→重启PM2 fazhihui-test
set -e
DEPLOY=/home/ubuntu/fazhihui-test/backend
cd "$DEPLOY"

echo "=== 1. 确认源码已含 uat 模式 ==="
if ! grep -q "'uat'" src/fadada/fadada.service.ts; then
  echo "错误: 源码未包含 uat 模式，请先上传 fadada.service.ts"
  exit 1
fi
echo "OK: 源码已含 uat"

echo "=== 2. 追加 .env 法大大 UAT 配置（幂等） ==="
if ! grep -q 'FADADA_UAT_APP_ID' .env; then
cat >> .env <<'EOF'

# ========== 法大大电子签（UAT 测试环境） ==========
FADADA_ENABLED=true
FADADA_MODE=uat
FADADA_UAT_APP_ID=80005605
FADADA_UAT_APP_SECRET=AKVRICNYZ1BPHOMSB7NPFGJWOPJ6EKI4
FADADA_UAT_API_URL=https://uat-api.fadada.com/api/v5
FADADA_API_URL=https://openapi.fadada.com
FADADA_REDIRECT_URL=http://test.meichuangmenye.com/client/service-hall
FADADA_INITIATOR_OPEN_ID=LAWFIRM
EOF
echo "已追加 FADADA_UAT 配置"
else
  echo "配置已存在，跳过追加"
fi

echo "=== 3. 构建后端 ==="
npm run build 2>&1 | tail -5

echo "=== 4. 停掉占用 3000 端口的 root 孤儿进程（若存在） ==="
# 找到监听 3000 的进程（排除 PM2）
LEGACY_PID=$(sudo lsof -i:3000 -sTCP:LISTEN -t 2>/dev/null | head -1 || true)
CURRENT_PM2_PID=$(pm2 pid fazhihui-test 2>/dev/null || true)
if [ -n "$LEGACY_PID" ] && [ "$LEGACY_PID" != "$CURRENT_PM2_PID" ]; then
  echo "杀掉旧进程 PID=$LEGACY_PID（占用3000）"
  sudo kill "$LEGACY_PID" 2>/dev/null || sudo kill -9 "$LEGACY_PID" 2>/dev/null || echo "kill 失败（可能已退出）"
  sleep 2
else
  echo "无冲突进程，或端口已被 PM2 自身占用，跳过"
fi

echo "=== 5. 重启 PM2 测试后端 ==="
pm2 restart fazhihui-test --update-env
pm2 save >/dev/null 2>&1 || true
sleep 3

echo "=== 6. 端口确认 ==="
sudo ss -tlnp 2>/dev/null | grep -E ':3000|:3001'

echo "=== 7. 健康检查：测试登录接口 ==="
curl -s -o /dev/null -w '测试登录HTTP:%{http_code}\n' --max-time 10 -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"phone":"13800138000","password":"GDgk6688"}'

echo "=== 8. PM2 状态 ==="
pm2 status | grep -E 'fazhihui-(test|prod)'