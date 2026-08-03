#!/bin/bash
# 腾讯云服务器环境初始化脚本（Linux Ubuntu 22.04）
# 使用方式: bash deploy/install-env.sh
#
# 功能: 安装 Node.js 20 + npm镜像 + PM2 + Nginx + Git

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========== 环境初始化开始 ==========${NC}"

# ============ 1. 安装 Node.js 20.x ============
echo -e "${YELLOW}[1/5] 安装 Node.js 20.x...${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'.' -f1 | tr -d 'v')
    if [ "$NODE_VERSION" -ge 20 ]; then
        echo -e "${GREEN}Node.js $(node -v) 已安装，跳过${NC}"
    else
        echo -e "${YELLOW}Node.js 版本过低，升级到 20.x...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo -e "${GREEN}Node.js: $(node -v)${NC}"
echo -e "${GREEN}npm: $(npm -v)${NC}"

# ============ 2. 配置 npm 国内镜像 ============
echo -e "${YELLOW}[2/5] 配置 npm 国内镜像...${NC}"
npm config set registry https://registry.npmmirror.com
echo -e "${GREEN}npm 镜像已设置为 npmmirror.com${NC}"

# ============ 3. 安装 PM2 ============
echo -e "${YELLOW}[3/5] 安装 PM2...${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}PM2 已安装，跳过${NC}"
else
    sudo npm install -g pm2
fi
echo -e "${GREEN}PM2: $(pm2 -v)${NC}"

# ============ 4. 安装 Nginx ============
echo -e "${YELLOW}[4/5] 安装 Nginx...${NC}"
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}Nginx 已安装，跳过${NC}"
else
    sudo apt-get update
    sudo apt-get install -y nginx
fi
echo -e "${GREEN}Nginx: $(nginx -v 2>&1)${NC}"

# ============ 5. 安装 Git ============
echo -e "${YELLOW}[5/5] 安装 Git...${NC}"
if command -v git &> /dev/null; then
    echo -e "${GREEN}Git 已安装，跳过${NC}"
else
    sudo apt-get install -y git
fi
echo -e "${GREEN}Git: $(git --version)${NC}"

# ============ 配置 PM2 开机自启 ============
echo -e "${YELLOW}配置 PM2 开机自启...${NC}"
sudo pm2 startup systemd -u $(whoami) --hp $HOME
echo -e "${GREEN}PM2 开机自启已配置${NC}"

# ============ 配置 Nginx 开机自启 ============
echo -e "${YELLOW}配置 Nginx 开机自启...${NC}"
sudo systemctl enable nginx
echo -e "${GREEN}Nginx 开机自启已配置${NC}"

echo ""
echo -e "${GREEN}========== 环境初始化完成 ==========${NC}"
echo -e "${YELLOW}下一步:${NC}"
echo -e "  1. 克隆代码: git clone https://github.com/zhuangxushen-hash/fazhihui.git"
echo -e "  2. 切换分支: cd fazhihui && git checkout test"
echo -e "  3. 执行部署: bash deploy/deploy.sh"
