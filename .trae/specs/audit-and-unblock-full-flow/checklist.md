# Checklist

## 客户端案件详情接口路径修复
- [x] ClientCaseDetail.tsx 中 `fetchCaseDetail` 使用模板字符串拼接路径，而非 `.replace()` 方式
- [x] 请求路径为 `POST /client/cases/${caseId}`，与后端 `@Post('cases/:id')` 路由匹配

## 客户端签约付款流程打通
- [x] Payment.tsx 中 `handleSign` 完成签约后调用 `POST /cases` 创建案件记录
- [x] 创建案件时包含字段：case_type、client_id、organization_id、client_name、client_phone、fee_amount、description
- [x] Payment.tsx 中 `handlePayment` 完成付款后调用 `POST /finance/fee` 创建费用记录
- [x] 创建费用记录时包含字段：case_id、amount、payment_method（对应所选支付方式）、paid=true、paid_at（注：后端 /finance/fee 使用 Fee 实体，字段为 payment_method/paid/paid_at 而非 method/status，已根据后端实际情况调整）
- [x] 付款失败时前端显示后端返回的错误信息
- [x] 签约后客户在"我的案件"列表中能看到新创建的案件

## ComplianceCenter 冗余调用清理
- [x] `fetchStats` 中 Promise.all 不再包含被忽略的 `/compliance/marketing-content` 调用
- [x] `fetchStats` 仅保留实际使用的统计数据接口调用

## Dashboard 数据结构一致性
- [x] Dashboard.tsx 中读取线索总数使用 `res.total`（而非 `res.length` 或 `res.data.total`）
- [x] Dashboard.tsx 中读取案件总数使用 `res.total`
- [x] Dashboard.tsx 中 `/dashboard/compliance-stats` 返回的数据结构与前端解析一致
- [x] Dashboard.tsx 中 `/dashboard/revenue-stats` 返回的数据结构与前端解析一致
- [x] Dashboard 各统计卡片不出现 NaN 或 undefined（修复了 case_count → cases_count）

## 客户端业务闭环
- [x] client 角色登录后跳转至 `/client`，无法访问管理后台路由（ProtectedRoute 已添加角色校验）
- [x] ClientHome "我的案件"按钮可跳转至 ClientCaseList
- [x] ClientCaseList "查看详情"按钮可跳转至 ClientCaseDetail 并显示详情
- [x] ClientCaseDetail 返回按钮可正常返回 ClientCaseList
- [x] AIConsult 在线咨询提交后显示 AI 回复
- [x] Complaint 投诉提交后后端创建投诉记录（type 字段正确）
- [x] Payment 签约付款流程能创建案件和支付记录

## 管理后台业务闭环
- [x] super_admin/org_admin/marketing/sales/lawyer/assistant/finance 角色登录后跳转至 `/`
- [x] Dashboard 各统计卡片数据正常加载
- [x] Dashboard 各图表（转化漏斗、案件统计、律师绩效、案件类型利润、风险统计）正常渲染
- [x] LeadManagement 线索创建成功后出现在列表中
- [x] LeadManagement 线索分配销售后 assign_sales_id 更新
- [x] LeadManagement 线索状态更新后列表 Tag 正确显示
- [x] LeadManagement 添加跟进记录后跟进列表更新
- [x] CaseManagement 案件创建成功后出现在列表中
- [x] CaseManagement 分配律师后 assignee_lawyer_id 和 lawyer_name 正确显示
- [x] CaseManagement 案件状态更新后列表 Tag 正确显示（使用 pending_assign 等后端状态值）
- [x] ComplianceManagement 投诉列表的"投诉类型"列正确显示（使用 type 字段，显示"服务问题"等中文标签）
- [x] ComplianceManagement 投诉受理后状态从"待受理"变为"已受理"
- [x] ComplianceManagement 投诉处理后显示处理结果（process_note 字段）
- [x] ComplianceManagement 投诉关闭后显示关闭说明（resolution 字段）
- [x] ComplianceCenter 各统计卡片数据正常加载
- [x] ComplianceCenter 营销内容审核流程正常
- [x] ComplianceCenter 案件 SOP 完成流程正常
- [x] FinanceManagement 费用创建、标记已付流程正常
- [x] FinanceManagement 退款审批、拒绝流程正常
- [x] FinanceManagement 发票开具、作废流程正常
- [x] UserManagement 用户创建时角色选项为 super_admin/org_admin/marketing/sales/lawyer/assistant/finance/client
- [x] UserManagement 用户列表角色列正确显示中文标签
- [x] UserManagement 用户编辑、删除、重置密码流程正常
- [x] Layout.tsx 顶部用户角色显示覆盖后端 8 个角色（新增验证点，已修复）

## 编译与构建验证
- [x] 前端 `npx tsc -b --noEmit` 退出码为 0
- [x] 后端 `npx tsc --noEmit` 退出码为 0
- [x] 前端 `npm run build` 成功生成 dist 目录
- [x] 后端 `npm run build` 成功生成 dist 目录
