# Checklist

## format.ts 日期解析兼容性
- [x] formatDate 函数能正确解析 SQLite 格式 `2026-07-20 10:30:00`（空格分隔）
- [x] formatDateTime 函数能正确解析 SQLite 格式 `2026-07-20 10:30:00`（空格分隔）
- [x] formatDate 和 formatDateTime 对 null/undefined/空字符串仍返回 `-`
- [x] formatDate 和 formatDateTime 对 ISO 格式 `2026-07-20T10:30:00.000Z` 仍正常工作

## ComplianceCenter.tsx 时间列格式化
- [x] 营销内容表格 created_at 列使用 formatDateTime 格式化
- [x] 销售合规表格 created_at 列使用 formatDateTime 格式化
- [x] 签约合规表格 created_at 列使用 formatDateTime 格式化
- [x] 案件SOP表格 deadline 列使用 formatDate 格式化
- [x] ComplianceCenter.tsx 顶部已导入 formatDateTime 和 formatDate

## ComplianceCenter.tsx 补充缺失时间字段
- [x] 营销内容表格新增"审核时间"列（review_time），使用 formatDateTime
- [x] 销售合规表格新增"风险告知时间"列（risk_disclosure_time），使用 formatDateTime
- [x] 签约合规表格新增"签约时间"列（signed_time），使用 formatDateTime
- [x] 案件SOP表格新增"完成时间"列（completed_time），使用 formatDateTime

## 编译验证
- [x] 前端 `npx tsc -b --noEmit` 退出码为 0
- [x] 前端 `npm run build` 成功
