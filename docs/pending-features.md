# 法智汇项目待开发功能清单

**生成时间**: 2026/08/07  
**基于审计报告**: audit-report-1786073623234.md

---

## 一、项目现状概览

| 指标 | 数量 | 说明 |
|------|------|------|
| 后端模块 | 41 | NestJS 框架，按业务领域划分 |
| 后端路由 | 837 | 所有 Controller 暴露的 API 端点 |
| 前端路由 | 112 | 页面路由配置 |
| 前端菜单 | 91 | 菜单配置 |
| 前端 API 调用 | 378 | 已实现的 API 调用 |
| 已匹配接口 | 374 | 前后端均已实现 |
| 未匹配接口 | 3 | 前端有但后端缺失的接口 |
| 未对接后端接口 | 200+ | 后端有但前端未调用的接口 |

---

## 二、按优先级分类

### P0 - 必须开发（阻塞核心业务流程）

#### 1. AI 智能助手模块（10 个接口）
- **模块**: AI 中心
- **状态**: 后端完整，前端未对接
- **优先级**: 高
- **业务价值**: 核心差异化功能，提升律师工作效率

| 方法 | 接口路径 | 功能描述 |
|------|----------|----------|
| POST | `/ai/marketing/copy` | AI 营销文案生成 |
| POST | `/ai/marketing/script` | AI 营销话术生成 |
| POST | `/ai/legal/document` | AI 法律文书生成 |
| POST | `/ai/legal/risk-analysis` | AI 风险分析 |
| GET | `/ai/nav` | AI 功能导航列表 |
| POST | `/ai/chat` | AI 智能对话 |
| POST | `/ai/contract-review` | AI 合同审查 |
| POST | `/ai/legal-research` | AI 法律研究 |
| GET | `/ai/similar-cases` | AI 类案搜索 |
| GET | `/ai/laws` | AI 法条查询 |

#### 2. 客户服务模块（14 个接口）
- **模块**: 客户端（Client Portal）
- **状态**: 后端完整，前端未对接
- **优先级**: 高
- **业务价值**: C 端客户自助服务入口

| 方法 | 接口路径 | 功能描述 |
|------|----------|----------|
| POST | `/client/cases` | 客户发起案件 |
| POST | `/client/ai/consult` | 客户 AI 咨询 |
| POST | `/client/complaint` | 客户投诉 |
| POST | `/client/complaints` | 投诉列表 |
| POST | `/client/payments` | 客户支付 |
| POST | `/client/service-fee` | 服务费缴纳 |
| POST | `/client/push-notifications` | 推送通知 |
| POST | `/client/ai/consult-enhanced` | 增强版 AI 咨询 |
| POST | `/client/consultations` | 咨询记录 |
| POST | `/client/online-sign` | 在线签约 |
| POST | `/client/service-ratings` | 服务评价 |
| POST | `/client/service-ratings/list` | 评价列表 |
| POST | `/client/archives` | 档案管理 |
| POST | `/client/archives/list` | 档案列表 |

#### 3. 案件管理核心接口（6 个接口）
- **模块**: 案件管理
- **状态**: 后端完整，前端未对接
- **优先级**: 高
- **业务价值**: 案件全流程管理核心功能

| 方法 | 接口路径 | 功能描述 |
|------|----------|----------|
| GET | `/cases/overdue` | 逾期案件查询 |
| GET | `/cases/high-risk` | 高风险案件查询 |
| POST | `/cases/check-overdue` | 逾期检查 |
| POST | `/cases/batch-assign` | 批量分配案件 |
| POST | `/similar-cases/search` | 类案搜索 |
| GET | `/similar-cases/stats` | 类案统计 |

---

### P1 - 重要开发（提升业务完整性）

#### 4. 合规审查模块（35 个接口）
- **模块**: 合规风控
- **状态**: 后端完整，前端未对接
- **优先级**: 中高
- **业务价值**: 律所合规管理必备功能

| 方法 | 接口路径 | 功能描述 |
|------|----------|----------|
| POST | `/compliance/check` | 合规检查 |
| GET | `/compliance/records` | 合规记录 |
| POST | `/compliance/complaint` | 合规投诉 |
| GET | `/compliance/complaints` | 投诉列表 |
| POST | `/compliance/sales-compliance` | 销售合规 |
| GET | `/compliance/sales-compliance` | 销售合规列表 |
| POST | `/compliance/signing-compliance` | 签约合规 |
| GET | `/compliance/signing-compliance` | 签约合规列表 |
| POST | `/compliance/case-sop` | 案件 SOP |
| GET | `/compliance/case-sop` | SOP 列表 |
| GET | `/compliance/case-sop/stats` | SOP 统计 |
| POST | `/compliance/talk-quality-check` | 谈话质量检查 |
| GET | `/compliance/talk-quality-checks` | 质量检查列表 |
| GET | `/compliance/talk-quality-checks/stats` | 质量检查统计 |
| GET | `/compliance/export-templates` | 导出模板 |
| POST | `/compliance/export` | 合规导出 |
| GET | `/compliance/export-history` | 导出历史 |
| POST | `/compliance/export-archive` | 合规归档 |
| GET | `/compliance/sales-reviews` | 销售审核 |
| GET | `/compliance/sales-reviews/stats` | 审核统计 |
| GET | `/compliance/archive` | 合规档案 |
| GET | `/compliance/archive/export` | 档案导出 |
| POST | `/compliance/finance-check/receivable/batch` | 应收账款批量核对 |
| POST | `/compliance/finance-check/invoice` | 发票核对 |
| POST | `/compliance/finance-check/commission/batch` | 佣金批量核对 |
| GET | `/compliance/finance-check` | 财务核查列表 |
| GET | `/compliance/finance-check/stats` | 财务核查统计 |
| GET | `/compliance/complaint-tickets` | 投诉工单 |
| GET | `/compliance/overdue-risk-ledger` | 逾期风险台账 |
| GET | `/compliance/overdue-risk-stats` | 逾期风险统计 |
| POST | `/compliance/case-inspection/trigger` | 案件检查触发 |
| GET | `/compliance/case-compliance-checks` | 案件合规检查列表 |
| POST | `/compliance/personnel-change` | 人员变动备案 |
| GET | `/compliance/personnel-change` | 人员变动列表 |
| GET | `/compliance/case-archive` | 案件档案查询 |

#### 5. 广告平台同步接口（3 个接口）
- **模块**: 广告投放平台（AD Platforms）
- **状态**: 前端有调用，后端未实现
- **优先级**: 中
- **业务价值**: 多平台广告投放数据同步

| 方法 | 接口路径 | 功能描述 |
|------|----------|----------|
| POST | `/ad-platforms/sync/balance/${platform}` | 同步平台余额 |
| POST | `/ad-platforms/sync/campaigns/${platform}` | 同步广告计划 |
| POST | `/ad-platforms/sync/report/${platform}` | 同步广告报表 |

---

### P2 - 一般开发（完善系统功能）

#### 6. Entity 通用字段补充（4 个实体）
- **状态**: 已发现问题
- **优先级**: 中
- **说明**: 缺少 createTime 字段，可能影响审计和追踪

| 实体文件 | 缺少字段 | 建议操作 |
|----------|----------|----------|
| `evidence.entity.ts` | createTime | 添加 `@CreateDateColumn()` |
| `lead-pool.entity.ts` | createTime | 添加 `@CreateDateColumn()` |
| `chat-archive.entity.ts` | createTime | 添加 `@CreateDateColumn()` |
| `client-tag-relation.entity.ts` | createTime | 添加 `@CreateDateColumn()` |

#### 7. CRUD 接口补充（8 个模块）
- **状态**: 部分接口缺失
- **优先级**: 中低
- **说明**: 某些模块可能仅需只读，需确认业务需求

| 模块 | 缺失接口 | 建议 |
|------|----------|------|
| approval | DELETE | 如审批支持撤销，需补充 |
| archive-volume | DELETE | 档案卷通常不删除，可忽略 |
| audit | POST, PUT, DELETE | 审计日志通常只读，可忽略 |
| case | DELETE | 案件通常归档而非删除 |
| due-diligence | PUT, DELETE | 尽调报告是否允许修改？ |
| lead | DELETE | 线索删除或合并操作 |
| marketing | PUT | 营销素材编辑功能 |
| social | PUT | 社交媒体内容编辑 |

---

## 三、建议开发路线图

### 第一阶段：核心功能对接（2-3 周）

**目标**: 完成 AI 模块和客户服务模块的前端对接

1. **AI 智能助手前端页面**
   - 智能对话界面
   - 合同审查上传与结果展示
   - 类案搜索与结果展示
   - 法条查询界面
   - 法律文书生成界面

2. **客户服务门户**
   - 客户案件列表与发起
   - 在线咨询与 AI 问答
   - 支付与服务费缴纳
   - 服务评价提交
   - 在线签约功能

### 第二阶段：案件管理完善（1-2 周）

**目标**: 完善案件管理核心流程

1. 逾期案件看板
2. 高风险案件预警
3. 批量案件分配
4. 类案搜索集成到案件办理流程

### 第三阶段：合规风控建设（2-3 周）

**目标**: 搭建合规管理体系

1. 合规检查工作流
2. 销售合规审核
3. 签约合规检查
4. SOP 执行与追踪
5. 财务核查功能

### 第四阶段：数据对接与优化（1-2 周）

**目标**: 完成数据同步与系统优化

1. 广告平台同步接口后端实现
2. Entity 通用字段补充
3. 必要的 CRUD 接口完善
4. 性能优化与测试

---

## 四、技术栈参考

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端框架 | NestJS | TypeScript 企业级框架 |
| 数据库 | TypeORM + MySQL | 关系型数据库 |
| 前端框架 | React + TypeScript | SPA 应用 |
| UI 组件 | Ant Design | 企业级 UI 库 |
| 状态管理 | Zustand | 轻量级状态管理 |
| API 通信 | Axios + React Query | 数据获取与缓存 |

---

## 五、相关文件索引

### 后端 Controller 文件
```
backend/src/ai/ai.controller.ts                    # AI 智能服务
backend/src/client/client.controller.ts            # 客户服务
backend/src/case/case.controller.ts                # 案件管理
backend/src/compliance/compliance.controller.ts    # 合规风控
backend/src/ad-platforms/ad-platforms.controller.ts # 广告平台
backend/src/approval/approval.controller.ts        # 审批流程
backend/src/audit/audit.controller.ts              # 审计日志
```

### 前端 API 文件
```
frontend/src/api/ai.ts                             # AI 接口
frontend/src/api/client.ts                         # 客户接口
frontend/src/api/case.ts                          # 案件接口
frontend/src/api/compliance.ts                    # 合规接口
frontend/src/api/ad-platforms.ts                  # 广告平台接口
```

### Entity 文件
```
backend/src/case/evidence.entity.ts               # 证据实体
backend/src/lead/lead-pool.entity.ts              # 线索池实体
backend/src/scrm/chat-archive.entity.ts           # 聊天归档实体
backend/src/scrm/client-tag-relation.entity.ts    # 客户标签关系实体
```

---

## 六、备注

1. 以上清单基于审计工具的静态代码分析，实际业务需求可能有所不同
2. 部分"未调用"的后端接口可能设计为内部调用或定时任务触发，无需前端对接
3. 建议与业务方确认每个接口的实际使用场景后再决定是否开发
4. 开发时请遵循项目的命名规范（参考 `docs/naming-convention.md`）

---

**文档维护**: 技术团队  
**最后更新**: 2026/08/07
