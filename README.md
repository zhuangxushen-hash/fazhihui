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
