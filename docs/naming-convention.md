# NestJS 后端命名规范

本文档旨在统一项目中 Controller 和 Service 的命名规范，确保代码结构清晰、易于维护。

## 1. 核心原则

Controller 和 Service 必须遵循 **一一对应** 的命名关系，便于团队协作和自动化工具识别。

## 2. 文件命名规范

### 2.1 基本格式

```
{feature-name}.{layer}.ts
```

### 2.2 具体示例

| 组件类型 | 文件命名 | 说明 |
|---------|---------|------|
| Controller | `user.controller.ts` | 用户管理控制器 |
| Service | `user.service.ts` | 用户业务逻辑服务 |
| Module | `user.module.ts` | 用户模块定义 |
| Entity | `user.entity.ts` | 用户数据库实体 |
| DTO | `user.dto.ts` | 数据传输对象 |

### 2.3 命名规则

- **使用小写**：所有文件名使用小写字母
- **连字符分隔**：多单词使用连字符 `-` 分隔（kebab-case）
- **功能前缀**：以功能模块名称作为文件前缀
- **层级后缀**：以层级类型作为文件后缀

## 3. 类命名规范

### 3.1 基本格式

```
{FeatureName}{Layer}
```

### 3.2 具体示例

| 组件类型 | 类命名 | 说明 |
|---------|--------|------|
| Controller | `UserController` | 用户管理控制器类 |
| Service | `UserService` | 用户业务逻辑服务类 |
| Module | `UserModule` | 用户模块类 |
| Entity | `UserEntity` 或 `User` | 用户数据库实体类 |
| DTO | `CreateUserDto` / `UpdateUserDto` | 数据传输对象类 |

### 3.3 命名规则

- **大驼峰**：使用 PascalCase 命名法
- **功能前缀**：与文件名保持一致的功能前缀
- **层级后缀**：添加对应层级的后缀标识

## 4. 装饰器规范

### 4.1 Controller 装饰器

```typescript
@Controller('feature-name')
export class FeatureNameController {}
```

**规则**：
- 路由路径使用 **kebab-case**（小写连字符）
- 与文件名中的功能前缀保持一致

### 4.2 Service 装饰器

```typescript
@Injectable()
export class FeatureNameService {}
```

**规则**：
- 使用 `@Injectable()` 装饰器
- Service 类名必须与 Controller 类名前缀匹配

## 5. Controller-Service 对应关系

### 5.1 匹配规则

```
{FeatureName}Controller <-> {FeatureName}Service
```

**示例**：

| Controller | Service | 状态 |
|-----------|---------|------|
| `UserController` | `UserService` | ✅ 正确匹配 |
| `LawToolController` | `LawToolService` | ✅ 正确匹配 |
| `OrderController` | `OrderService` | ✅ 正确匹配 |

### 5.2 不匹配示例

| Controller | Service | 问题 |
|-----------|---------|------|
| `UserController` | `UserBusinessService` | ❌ 名称不一致 |
| `LawToolController` | `LawToolHelper` | ❌ 后缀不规范 |

## 6. 特殊情况处理

### 6.1 特殊 Controller 类型

以下 Controller 可以不强制要求同名 Service：

| 类型关键词 | 说明 | 示例 |
|-----------|------|------|
| `webhook` | Webhook 回调接口 | `PaymentWebhookController` |
| `oauth` | OAuth 授权接口 | `OAuthController` |
| `callback` | 第三方回调 | `WechatCallbackController` |
| `notify` | 通知接收 | `NotifyController` |
| `sync` | 数据同步 | `DataSyncController` |
| `internal` | 内部接口 | `InternalController` |
| `system` | 系统管理 | `SystemController` |
| `ai` | AI 服务 | `AIController` |

### 6.2 协调者模式

当一个 Controller 协调多个 Service 时，仍建议创建同名 Service 来封装协调逻辑：

```typescript
// payment.controller.ts
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
  ) {}
  // ...
}
```

## 7. 完整示例

### 7.1 用户管理模块

**文件结构**：
```
src/user/
├── user.controller.ts    # 控制器
├── user.service.ts       # 服务
├── user.module.ts        # 模块
├── user.entity.ts        # 实体
└── user.dto.ts           # DTO
```

**代码示例**：

```typescript
// user.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }
}
```

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  async create(createUserDto: any) {
    // 业务逻辑实现
    return { success: true, data: createUserDto };
  }

  async findAll() {
    // 业务逻辑实现
    return [];
  }

  async findOne(id: number) {
    // 业务逻辑实现
    return { id };
  }
}
```

```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

## 8. 检查清单

创建新模块时，请确认以下事项：

- [ ] 文件名使用 kebab-case（小写连字符）
- [ ] 类名使用 PascalCase（大驼峰）
- [ ] Controller 和 Service 类名前缀一致
- [ ] Controller 路由路径与文件名前缀匹配
- [ ] Service 使用 @Injectable() 装饰器
- [ ] Module 正确注册 Controller 和 Service
- [ ] 业务逻辑封装在 Service 中，Controller 只处理路由

## 9. 常见问题

### Q1: 一个 Controller 可以对应多个 Service 吗？
A: 可以。Controller 可以注入多个 Service，但建议仍创建一个同名的 Service 作为主入口。

### Q2: Service 必须和 Controller 同名吗？
A: 建议保持一致。对于特殊类型（Webhook、OAuth 等），可以不强制要求。

### Q3: 如何处理遗留代码？
A: 新代码严格遵守规范，遗留代码在重构时逐步对齐。

---

**文档维护者**：团队前端/后端负责人  
**最后更新**：2026-08-07
