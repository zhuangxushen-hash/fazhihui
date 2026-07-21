# 全链路测试与数据流转打通 Spec

## Why
本项目（法律咨询全链产品）是一个覆盖 C 端客户、销售、律师、管理后台的完整业务系统，涉及登录、线索、案件、合规、财务、AI 工具、客户端等多个业务环节。前期修复中已发现并解决了 7 类严重的前后端不一致问题（路由冲突、路由顺序、字段名不匹配、查询逻辑错误等），但仍有若干业务流程未真正打通：客户端签约付款流程未调用后端、Dashboard 数据加载冗余、ClientCaseDetail 路径拼接方式不正确等。需要系统化地走完一遍完整测试流程，定位并打通所有剩余的数据流转断点，确保从 C 端客户签约到后台管理的全链路通畅。

## What Changes
- 修复客户端签约付款流程（Payment.tsx）缺失的后端调用：签约时创建 Case + SigningCompliance，付款时创建 PaymentRecord
- 修复 ClientCaseDetail.tsx 中使用 `'/client/cases/:id'.replace(':id', caseId)` 的不正确路径拼接方式（应使用模板字符串）
- 修复 ComplianceCenter.tsx 中 Promise.all 内冗余且被忽略的 `/compliance/marketing-content` 调用
- 验证 Dashboard 各统计接口的数据结构一致性（`/leads`、`/cases` 返回 `{data, total}`，其他接口返回数组）
- 验证 Login → 各业务模块 → 数据展示的完整闭环
- 验证客户端（client 角色登录）从首页 → 案件列表 → 案件详情 → 在线咨询 → 投诉 → 签约付款的完整闭环
- 验证管理后台从 Dashboard → 线索管理 → 案件管理 → 合规管理 → 财务管理 → 用户管理的完整闭环

## Impact
- Affected specs: 客户端业务流程、管理后台业务流程、前后端数据一致性
- Affected code:
  - `frontend/src/pages/client/Payment.tsx`（签约付款流程打通）
  - `frontend/src/pages/client/ClientCaseDetail.tsx`（路径拼接修复）
  - `frontend/src/pages/ComplianceCenter.tsx`（冗余调用清理）
  - `frontend/src/pages/Dashboard.tsx`（数据结构验证）
  - `backend/src/finance/finance.controller.ts`（可能需要新增客户端付款接口）
  - `backend/src/case/case.controller.ts`（验证客户端创建案件流程）

## ADDED Requirements

### Requirement: 客户端签约付款流程闭环
系统 SHALL 在客户端用户完成签约和付款流程时，将签约信息和付款记录持久化到后端，而不是仅在前端展示成功状态。

#### Scenario: 客户完成签约
- **WHEN** 客户在 Payment.tsx 页面完成签约步骤（点击"确认签约"）
- **THEN** 系统应调用后端接口创建一条 Case 记录（status=pending_assign）和一条 SigningCompliance 记录
- **AND** 前端应显示真实的后端响应结果（成功/失败）

#### Scenario: 客户完成付款
- **WHEN** 客户在 Payment.tsx 页面点击"确认支付"
- **THEN** 系统应调用后端接口创建一条 PaymentRecord 记录（status=paid）
- **AND** 前端应根据后端返回结果显示支付成功/失败

### Requirement: 客户端案件详情接口调用正确
系统 SHALL 使用正确的 HTTP 路径调用客户端案件详情接口，而非使用字符串 replace 的不安全方式。

#### Scenario: 查看案件详情
- **WHEN** 客户从案件列表点击"查看详情"进入案件详情页
- **THEN** 前端应使用模板字符串 `\`/client/cases/${caseId}\`` 构造请求路径
- **AND** 后端应正确返回该案件的详情（含 lawyer_name 关联字段）

## MODIFIED Requirements

### Requirement: 合规中心数据加载
ComplianceCenter.tsx 在初始化加载统计数据时，SHALL 移除 Promise.all 中被忽略的冗余 `/compliance/marketing-content` 调用，避免无意义的网络请求。

### Requirement: Dashboard 数据结构一致性
Dashboard.tsx 中各统计接口的响应处理 SHALL 与后端实际返回的数据结构一致：
- `/leads`、`/cases` 接口返回 `{ data: [], total: N }`，应使用 `res.total` 读取总数
- `/dashboard/*` 系列接口返回数组或对象，应使用对应的数据结构

## REMOVED Requirements
（无移除项）
