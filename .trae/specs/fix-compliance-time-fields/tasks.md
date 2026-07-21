# Tasks

- [x] Task 1: 增强 format.ts 日期解析兼容性
  - [x] SubTask 1.1: 在 formatDate 和 formatDateTime 函数中增加对 SQLite 空格分隔格式（`YYYY-MM-DD HH:mm:ss`）的解析支持（将空格替换为 `T` 后再传入 `new Date()`）
  - [x] SubTask 1.2: 确保对 null/undefined/空字符串仍返回 `-`

- [x] Task 2: 修复 ComplianceCenter.tsx 时间列格式化
  - [x] SubTask 2.1: 导入 formatDateTime 和 formatDate 工具函数
  - [x] SubTask 2.2: 营销内容表格 created_at 列添加 `render: (val: string) => formatDateTime(val)`
  - [x] SubTask 2.3: 销售合规表格 created_at 列添加 `render: (val: string) => formatDateTime(val)`
  - [x] SubTask 2.4: 签约合规表格 created_at 列添加 `render: (val: string) => formatDateTime(val)`
  - [x] SubTask 2.5: 案件SOP表格 deadline 列添加 `render: (val: string) => formatDate(val)`

- [x] Task 3: 补充 ComplianceCenter.tsx 缺失的时间字段
  - [x] SubTask 3.1: 营销内容表格新增"审核时间"列（review_time），使用 formatDateTime
  - [x] SubTask 3.2: 销售合规表格新增"风险告知时间"列（risk_disclosure_time），使用 formatDateTime
  - [x] SubTask 3.3: 签约合规表格新增"签约时间"列（signed_time），使用 formatDateTime
  - [x] SubTask 3.4: 案件SOP表格新增"完成时间"列（completed_time），使用 formatDateTime

- [x] Task 4: 编译验证
  - [x] SubTask 4.1: 前端 `npx tsc -b --noEmit` 无错误
  - [x] SubTask 4.2: 前端 `npm run build` 成功

# Task Dependencies
- Task 2 依赖 Task 1（先确保格式化函数兼容 SQLite 格式，再在页面中使用）
- Task 3 依赖 Task 2（先修复现有列，再补充新列）
- Task 4 依赖 Task 1、Task 2、Task 3（所有修改完成后编译验证）
