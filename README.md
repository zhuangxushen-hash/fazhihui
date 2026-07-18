# 法智汇 - 全链产品

法智汇是一款面向中小型律所的全链路一体化SaaS管理系统，覆盖公域获客、谈案转化、办案交付、财务分润、合规风控、结案归档全流程。

## 技术栈

### 后端
- **框架**: NestJS 11.x
- **数据库**: SQLite（开发环境）/ PostgreSQL（生产环境）
- **ORM**: TypeORM
- **认证**: JWT
- **语言**: TypeScript

### 前端
- **框架**: React 19.x
- **UI组件**: Ant Design 6.x
- **构建工具**: Vite 6.x
- **路由**: React Router 7.x
- **HTTP客户端**: Axios
- **语言**: TypeScript

## 功能模块

1. **用户认证模块** - 登录、权限验证、多角色管理
2. **线索管理模块** - 线索录入、分配、跟进记录
3. **案件管理模块** - 案件创建、状态变更、律师分配、文档管理
4. **合规管理模块** - 营销内容合规、销售合规、签约合规、案件SOP
5. **财务管理模块** - 费用管理、分润计算、退款管理、发票管理
6. **AI工具模块** - 营销内容生成、法律文书生成、案件风险预警
7. **数据看板** - 经营数据分析、律师绩效统计
8. **C端客户服务** - 案件查询、投诉反馈、AI咨询

## 快速开始

### 环境要求
- Node.js >= 20.x
- npm >= 10.x

### 本地开发

#### 后端启动
```bash
cd backend
npm install
npm run start:dev
```

后端服务运行在 http://localhost:3000

#### 前端启动
```bash
cd frontend
npm install
npm run dev
```

前端服务运行在 http://localhost:5173

### Docker部署（推荐）

```bash
# 构建并启动服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务启动后：
- 前端：http://localhost
- 后端API：http://localhost/api

### 手动部署

#### 后端部署
```bash
cd backend
npm install
npm run build
npm run start:prod
```

#### 前端部署
```bash
cd frontend
npm install
npm run build
# 将dist目录部署到静态服务器（如Nginx）
```

### 腾讯云EdgeOne部署（GitHub同步）

#### 1. EdgeOne配置步骤

**步骤1：添加站点**
- 登录EdgeOne控制台，添加您的域名
- 完成DNS解析配置

**步骤2：配置源站**
1. 添加**前端源站**：选择"GitHub仓库"作为源站类型
   - 仓库地址：`https://github.com/zhuangxushen-hash/fazhihui`
   - 分支：`master`
   - 构建目录：`frontend/dist`
   
2. 添加**后端源站**：选择"IP/域名"作为源站类型
   - 源站地址：您的后端服务器IP或域名（如 `http://your-cvm-ip:3000`）

**步骤3：配置路由规则**

在EdgeOne控制台配置以下规则：

| 优先级 | 匹配路径 | 动作 | 源站 | 重写 |
|--------|----------|------|------|------|
| 1 | `/api/*` | 转发 | 后端源站 | 无 |
| 2 | `/*` | 返回 | 前端源站 | `/index.html` |

**关键配置说明**：
- **规则1（API代理）**：将所有 `/api/*` 请求转发到后端服务器
- **规则2（SPA路由重写）**：将所有非API请求重写到 `/index.html`，解决React路由404问题

**步骤4：配置缓存规则**

| 文件类型 | 缓存策略 | 说明 |
|----------|----------|------|
| `*.html` | 不缓存 | 确保页面及时更新 |
| `*.js`, `*.css` | 缓存7天 | 文件名带hash，可长期缓存 |
| `*.png`, `*.jpg`, `*.svg` | 缓存30天 | 静态资源 |
| `/api/*` | 不缓存 | API请求实时响应 |

#### 2. 后端部署

后端服务需要单独部署在腾讯云CVM或其他服务器上：

```bash
# 登录CVM服务器
ssh your-server-ip

# 克隆项目
git clone https://github.com/zhuangxushen-hash/fazhihui.git
cd fazhihui/backend

# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务（使用PM2管理）
npm install -g pm2
pm2 start dist/main.js --name fazhihui-backend

# 配置PM2开机自启
pm2 startup
pm2 save
```

**服务器配置要点**：
- 安全组开放3000端口
- 配置防火墙允许EdgeOne IP访问（或直接允许所有访问）
- 推荐配置HTTPS（使用Nginx反向代理）

#### 3. Nginx后端配置（可选）

如果后端需要HTTPS，在CVM上配置Nginx：

```nginx
server {
    listen 80;
    server_name your-backend-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # SSL配置（需要申请证书）
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

#### 4. 常见问题排查

**问题1：页面404错误**
- 原因：SPA路由未配置重写
- 解决：在EdgeOne路由规则中添加 `/*` → `/index.html` 重写规则

**问题2：API请求失败**
- 原因：后端服务未启动或端口未开放
- 解决：检查后端服务状态，确保3000端口可访问

**问题3：页面显示空白**
- 原因：前端资源路径错误或缓存问题
- 解决：清除浏览器缓存，检查EdgeOne缓存配置

**问题4：部署后页面未更新**
- 原因：EdgeOne缓存了旧版本
- 解决：在EdgeOne控制台手动清除缓存

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| 13800138000 | 123456 | 超级管理员 |
| 13800138001 | 123456 | 律所管理者 |
| 13800138002 | 123456 | 投放专员 |
| 13800138003 | 123456 | 谈案销售 |
| 13800138004 | 123456 | 办案律师 |
| 13800138007 | 123456 | 测试客户（C端） |

## 项目结构

```
fazhihui/
├── backend/              # NestJS后端
│   ├── src/
│   │   ├── ai/           # AI工具模块
│   │   ├── auth/         # 认证模块
│   │   ├── case/         # 案件管理
│   │   ├── client/       # C端接口
│   │   ├── compliance/   # 合规管理
│   │   ├── dashboard/    # 数据看板
│   │   ├── finance/      # 财务管理
│   │   ├── lead/         # 线索管理
│   │   ├── marketing/    # 营销管理
│   │   ├── seeds/        # 测试数据生成
│   │   ├── user/         # 用户管理
│   │   └── types/        # 类型定义
│   ├── Dockerfile
│   └── package.json
├── frontend/             # React前端
│   ├── src/
│   │   ├── api/          # API请求封装
│   │   ├── components/   # 公共组件
│   │   ├── pages/        # 页面组件
│   │   │   └── client/   # C端页面
│   │   └── types/        # 类型定义
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── shared/               # 共享类型定义
├── docker-compose.yml    # Docker配置
└── .gitignore
```

## API说明

所有API接口都以 `/api` 作为前缀。

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/verify` - 验证token

### 案件接口
- `GET /api/cases` - 获取案件列表
- `POST /api/cases` - 创建案件
- `GET /api/cases/:id` - 获取案件详情
- `PUT /api/cases/:id/status` - 变更案件状态
- `PUT /api/cases/:id/assign` - 分配律师

### 线索接口
- `GET /api/leads` - 获取线索列表
- `POST /api/leads` - 创建线索
- `PUT /api/leads/:id/assign` - 分配销售

### 合规接口
- `GET /api/compliance/records` - 获取合规记录
- `POST /api/compliance/marketing-content` - 创建营销内容
- `GET /api/compliance/case-sop` - 获取案件SOP

### 财务接口
- `GET /api/finance/fees` - 获取费用列表
- `POST /api/finance/invoice` - 创建发票

## 环境变量

后端支持以下环境变量：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 3000 |
| JWT_SECRET | JWT密钥 | 随机生成 |

## 开发注意事项

1. 数据库使用SQLite，数据文件存储在 `backend/data/fazhihui.sqlite`
2. 测试数据会在服务启动时自动生成（仅当数据为空时）
3. 前端开发环境通过Vite代理转发API请求到后端
4. 生产环境需要配置Nginx或其他反向代理

## 许可证

MIT License
