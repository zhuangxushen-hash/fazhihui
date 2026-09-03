#!/bin/bash
# 腾讯云部署脚本（Linux Ubuntu）
# 使用方式: 在服务器项目根目录执行 bash deploy/deploy.sh
#
# 功能:
#   1. 安装依赖（如未安装）
#   2. 构建前后端
#   3. 启动/重启 PM2 后端服务
#   4. 复制 Nginx 配置
#   5. 重启 Nginx
#   6. 验证部署

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========== 腾讯云部署开始 ==========${NC}"

# 项目根目录（脚本所在目录的上级）
PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
echo -e "${GREEN}项目目录: ${PROJECT_DIR}${NC}"

# ============ 1. 检查依赖 ============
echo -e "${YELLOW}[1/6] 检查环境依赖...${NC}"

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}错误: $1 未安装${NC}"
        echo "请先运行: bash deploy/install-env.sh"
        exit 1
    fi
}

check_command node
check_command npm
check_command pm2
check_command nginx

NODE_VERSION=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}错误: Node.js 版本需 >= 20，当前 $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}Node.js $(node -v) - OK${NC}"

# ============ 2. 安装项目依赖 ============
echo -e "${YELLOW}[2/6] 安装项目依赖...${NC}"

cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ]; then
    npm install --registry=https://registry.npmmirror.com
    echo -e "${GREEN}后端依赖安装完成${NC}"
else
    echo -e "${GREEN}后端依赖已存在，跳过${NC}"
fi

cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install --registry=https://registry.npmmirror.com
    echo -e "${GREEN}前端依赖安装完成${NC}"
else
    echo -e "${GREEN}前端依赖已存在，跳过${NC}"
fi

# ============ 3. 构建产物 ============
echo -e "${YELLOW}[3/6] 构建前后端...${NC}"

cd "$PROJECT_DIR/backend"
npm run build
echo -e "${GREEN}后端构建完成${NC}"

cd "$PROJECT_DIR/frontend"
# 根据当前分支决定前端产物目录，实现 test / prod 双构建分离：
#   test 分支        -> frontend/dist-test  （对应 nginx 中 test 环境 root）
#   production 分支  -> frontend/dist-prod  （对应 nginx 中 prod 环境 root）
# 其余分支默认按 test 处理，避免误写共享的 dist 影响 prod。
BRANCH=$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "test" ]; then
  OUTDIR=dist-test
elif [ "$BRANCH" = "production" ] || [ "$BRANCH" = "master" ]; then
  OUTDIR=dist-prod
else
  echo -e "${YELLOW}未知分支 $BRANCH，前端默认构建到 dist-test${NC}"
  OUTDIR=dist-test
fi
echo -e "${GREEN}当前分支 $BRANCH，前端将构建到 $OUTDIR${NC}"
rm -rf "$OUTDIR"
BUILD_OUTDIR="$OUTDIR" npm run build
echo -e "${GREEN}前端构建完成 -> $OUTDIR${NC}"

# ============ 4. 启动 PM2 后端服务 ============
echo -e "${YELLOW}[4/6] 启动后端服务...${NC}"

cd "$PROJECT_DIR/backend"
mkdir -p logs

# 删除旧进程（如存在）
pm2 delete fazhihui-prod 2>/dev/null || true
pm2 delete fazhihui-test 2>/dev/null || true

# 用 ecosystem.config.js 启动
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}PM2 后端服务启动完成${NC}"
pm2 status

# ============ 5. 配置 Nginx ============
echo -e "${YELLOW}[5/6] 配置 Nginx...${NC}"

NGINX_CONF_SRC="$PROJECT_DIR/deploy/nginx/fazhihui.conf"
NGINX_CONF_DEST="/etc/nginx/conf.d/fazhihui.conf"

if [ -d "/etc/nginx/conf.d" ]; then
    sudo cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"
    sudo nginx -t
    sudo systemctl reload nginx
    echo -e "${GREEN}Nginx 配置完成${NC}"
else
    echo -e "${YELLOW}警告: /etc/nginx/conf.d 目录不存在，请手动复制 Nginx 配置${NC}"
    echo -e "${YELLOW}配置文件位置: ${NGINX_CONF_SRC}${NC}"
fi

# ============ 6. 验证部署 ============
echo -e "${YELLOW}[6/6] 验证部署...${NC}"

sleep 3

# 验证生产后端
PROD_RES=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"phone":"15820275356","password":"zxs123456"}')
if [ "$PROD_RES" = "200" ]; then
    echo -e "${GREEN}生产后端(3001) - 正常${NC}"
else
    echo -e "${RED}生产后端(3001) - 异常(HTTP ${PROD_RES})${NC}"
fi

# 验证测试后端
TEST_RES=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"phone":"13800138000","password":"GDgk6688"}')
if [ "$TEST_RES" = "200" ]; then
    echo -e "${GREEN}测试后端(3000) - 正常${NC}"
else
    echo -e "${RED}测试后端(3000) - 异常(HTTP ${TEST_RES})${NC}"
fi

echo ""
echo -e "${GREEN}========== 部署完成 ==========${NC}"
echo -e "测试环境: http://test.meichuangmenye.com"
echo -e "生产环境: http://fazhihui.meichuangmenye.com"
echo -e "生产超管: 15820275356 / zxs123456"
echo -e "测试超管: 13800138000 / GDgk6688"
echo ""
echo -e "${YELLOW}后续更新: cd ${PROJECT_DIR} && git pull && bash deploy/deploy.sh${NC}"
