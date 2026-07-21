# Tasks

- [x] Task 1: 修复 ClientCaseDetail.tsx 案件详情接口路径拼接
  - [x] SubTask 1.1: 将 `'/client/cases/:id'.replace(':id', caseId)` 改为模板字符串 `` `/client/cases/${caseId}` ``
  - [x] SubTask 1.2: 验证修改后请求路径正确（POST /client/cases/{caseId}）

- [x] Task 2: 打通客户端签约付款流程（Payment.tsx）
  - [x] SubTask 2.1: 在 handleSign 完成签约后，调用 `POST /cases` 创建案件记录（status=pending_assign，包含 client_id、case_type、description、organization_id、client_name、client_phone、fee_amount）
  - [x] SubTask 2.2: 在 handlePayment 完成付款后，调用 `POST /finance/fee` 创建 PaymentRecord 记录（status=paid，method 对应所选支付方式）
  - [x] SubTask 2.3: 付款成功后根据后端返回结果更新 UI，失败时显示错误信息
  - [x] SubTask 2.4: 验证签约后案件是否出现在客户端"我的案件"列表中

- [x] Task 3: 清理 ComplianceCenter.tsx 冗余 API 调用
  - [x] SubTask 3.1: 移除 fetchStats 中 Promise.all 第二项 `/compliance/marketing-content`（结果被忽略）
  - [x] SubTask 3.2: 保留 Promise.all 中实际使用的 stats 和 salesCompliance 两项

- [x] Task 4: 验证 Dashboard 数据结构一致性
  - [x] SubTask 4.1: 检查 `/leads`、`/cases` 接口返回 `{ data, total }` 结构，前端使用 `res.total` 读取线索/案件总数
  - [x] SubTask 4.2: 检查 `/dashboard/compliance-stats`、`/dashboard/revenue-stats` 等接口返回的数据结构，前端正确解析
  - [x] SubTask 4.3: 修复任何数据结构不匹配导致的 undefined 或 NaN 显示问题（修复了 case_count → cases_count）

- [x] Task 5: 验证客户端完整业务闭环
  - [x] SubTask 5.1: 验证 client 角色登录后跳转至 `/client`（不进入管理后台）
  - [x] SubTask 5.2: 验证 ClientHome → ClientCaseList → ClientCaseDetail 跳转链路
  - [x] SubTask 5.3: 验证 ClientHome → AIConsult 在线咨询可正常提交并显示回复
  - [x] SubTask 5.4: 验证 ClientHome → Complaint 投诉可正常提交（字段 type 而非 complaint_type）
  - [x] SubTask 5.5: 验证 ClientHome → Payment 签约付款流程能创建案件和支付记录

- [x] Task 6: 验证管理后台完整业务闭环
  - [x] SubTask 6.1: 验证 super_admin/org_admin 角色登录后跳转至 `/`（Dashboard）
  - [x] SubTask 6.2: 验证 Dashboard 各统计卡片和图表数据正常加载
  - [x] SubTask 6.3: 验证 LeadManagement 线索创建、分配、状态更新、跟进记录流程
  - [x] SubTask 6.4: 验证 CaseManagement 案件创建、分配律师、状态更新、文档上传流程
  - [x] SubTask 6.5: 验证 ComplianceManagement 投诉列表显示（type 字段）、受理、处理、关闭流程
  - [x] SubTask 6.6: 验证 ComplianceCenter 合规检查、营销内容审核、案件 SOP 流程
  - [x] SubTask 6.7: 验证 FinanceManagement 费用、分润、退款、发票流程
  - [x] SubTask 6.8: 验证 UserManagement 用户创建、编辑、删除、重置密码流程（角色字段 super_admin 等）

- [x] Task 7: 编译与构建验证
  - [x] SubTask 7.1: 前端 `npx tsc -b --noEmit` 无错误
  - [x] SubTask 7.2: 后端 `npx tsc --noEmit` 无错误
  - [x] SubTask 7.3: 前端 `npm run build` 成功
  - [x] SubTask 7.4: 后端 `npm run build` 成功

- [x] Task 8: 修复验证发现的问题（新增任务）
  - [x] SubTask 8.1: 修复 App.tsx 的 ProtectedRoute 添加角色校验（仅非 client 角色可访问管理后台）
  - [x] SubTask 8.2: 修复 App.tsx 的 ClientRoute 添加角色校验（仅 client 角色可访问客户端）
  - [x] SubTask 8.3: 修复 Layout.tsx 顶部用户角色显示，覆盖后端 8 个角色（super_admin→超级管理员, org_admin→律所管理者, marketing→投放专员, sales→谈案销售, lawyer→办案律师, assistant→律师助理, finance→财务人员, client→客户）
  - [x] SubTask 8.4: 修复 UserManagement.tsx 用户列表姓名列字段名 name → real_name（与 User 实体一致）

# Task Dependencies
- Task 2 依赖 Task 1（案件详情接口路径正确后才能验证签约后案件出现）
- Task 5 依赖 Task 1、Task 2（客户端闭环需要路径修复和签约付款流程打通）
- Task 6 依赖 Task 3、Task 4（后台闭环需要清理冗余调用和数据结构一致）
- Task 7 依赖 Task 1、Task 2、Task 3、Task 4（所有代码修改完成后才能编译验证）
- Task 5、Task 6 可并行执行
