# 合规风控中心时间字段修复与全面字段检查 Spec

## Why
合规风控中心（ComplianceCenter.tsx）的 4 个时间列直接显示后端返回的原始 ISO/SQLite 日期字符串（如 `2026-07-20 10:30:00` 或 `2026-07-20T10:30:00.000Z`），未使用 formatDateTime/formatDate 进行格式化，导致时间显示不友好且格式不一致。此外，SQLite 的 `CURRENT_TIMESTAMP` 默认值返回空格分隔的日期格式（`YYYY-MM-DD HH:mm:ss`），`new Date()` 在部分浏览器中解析失败，需增强格式化函数的兼容性。还需检查合规风控中心各表格是否遗漏了重要的时间字段（如 review_time、signed_time、completed_time 等）。

## What Changes
- 修复 ComplianceCenter.tsx 中 4 个时间列的格式化：营销内容 `created_at`、销售合规 `created_at`、签约合规 `created_at`、案件SOP `deadline`
- 增强 format.ts 中 formatDate/formatDateTime 的日期解析兼容性，支持 SQLite 的空格分隔格式（`YYYY-MM-DD HH:mm:ss`）
- 补充合规风控中心缺失的重要时间字段显示：营销内容 `review_time`、销售合规 `risk_disclosure_time`、签约合规 `signed_time`、案件SOP `completed_time`
- 全面检查所有页面中 datetime 类型字段的显示一致性

## Impact
- Affected specs: 合规风控中心数据展示、时间格式化工具
- Affected code:
  - `frontend/src/pages/ComplianceCenter.tsx`（时间列格式化 + 补充缺失字段）
  - `frontend/src/utils/format.ts`（日期解析兼容性增强）

## ADDED Requirements

### Requirement: 时间字段格式化显示
合规风控中心所有时间列 SHALL 使用 formatDateTime 或 formatDate 函数进行格式化显示，不得直接输出后端返回的原始字符串。

#### Scenario: 营销内容列表显示创建时间
- **WHEN** 用户查看营销内容列表
- **THEN** 创建时间列应显示为 `YYYY-MM-DD HH:mm:ss` 格式（使用 formatDateTime）
- **AND** 审核时间列（review_time）也应显示为 `YYYY-MM-DD HH:mm:ss` 格式

#### Scenario: 案件SOP列表显示截止日期
- **WHEN** 用户查看案件SOP列表
- **THEN** 截止日期列应显示为 `YYYY-MM-DD` 格式（使用 formatDate）
- **AND** 完成时间列（completed_time）也应显示为 `YYYY-MM-DD HH:mm:ss` 格式

### Requirement: 日期解析兼容性
formatDate 和 formatDateTime 函数 SHALL 能正确解析以下日期格式：
- ISO 标准格式：`2026-07-20T10:30:00.000Z`
- SQLite CURRENT_TIMESTAMP 格式：`2026-07-20 10:30:00`（空格分隔）
- 仅日期格式：`2026-07-20`

#### Scenario: 解析 SQLite 格式日期
- **WHEN** 后端返回 `2026-07-20 10:30:00` 格式的日期字符串
- **THEN** formatDateTime 应正确解析并输出 `2026-07-20 10:30:00`
- **AND** 不应返回 `-`（解析失败时的默认值）

## MODIFIED Requirements

### Requirement: 合规风控中心字段完整性
合规风控中心各表格 SHALL 展示完整的时间信息，包括：
- 营销内容表格：创建时间（created_at）+ 审核时间（review_time）
- 销售合规表格：创建时间（created_at）+ 风险告知时间（risk_disclosure_time）
- 签约合规表格：创建时间（created_at）+ 签约时间（signed_time）
- 案件SOP表格：截止日期（deadline）+ 完成时间（completed_time）

## REMOVED Requirements
（无移除项）
