# 修复 seeds.module.ts 中 4 处 TypeScript 错误

## 概述
修复 `backend/src/seeds/seeds.module.ts` 中 3 个种子数据方法的字段名、枚举值和查询条件，使其与对应实体定义匹配。

---

## 修改 1：补充 Import 语句（第 99 行、第 102 行）

### 1a. DigitalHumanLive 枚举导入
**文件**: `backend/src/seeds/seeds.module.ts:99`
- `import { DigitalHumanLive } from '../marketing/digital-human-live.entity';`
- → `import { DigitalHumanLive, DigitalHumanLiveStatus } from '../marketing/digital-human-live.entity';`

### 1b. Reconciliation 枚举导入
**文件**: `backend/src/seeds/seeds.module.ts:102`
- `import { Reconciliation } from '../finance/reconciliation.entity';`
- → `import { Reconciliation, ReconciliationStatus } from '../finance/reconciliation.entity';`

---

## 修改 2：DigitalHumanLive 种子数据（第 4618-4676 行）

### 数据对象字段变更（3 条记录）

每条记录需要应用以下变更：

| 操作 | 旧字段 | 新字段 / 说明 |
|------|--------|--------------|
| 删除 | `anchor_avatar` | 实体无此字段 |
| 重命名 | `planned_start_time` | → `scheduled_start` |
| 重命名 | `started_at` | → `actual_start`（仅第 2、3 条记录） |
| 重命名 | `ended_at` | → `actual_end`（仅第 3 条记录） |
| 删除 | `topic_tags` | 实体无此字段 |
| 删除 | `description` | 实体无此字段 |
| 重命名 | `audience_count` | → `viewer_count` |
| 重命名 | `creator_id` | → `created_by` |
| 枚举化 | `status: 'draft'` | → `status: DigitalHumanLiveStatus.DRAFT` |
| 枚举化 | `status: 'live'` | → `status: DigitalHumanLiveStatus.LIVE` |
| 枚举化 | `status: 'ended'` | → `status: DigitalHumanLiveStatus.ENDED` |
| 删除 | `replay_url` | 实体无此字段（仅第 3 条记录） |
| 新增 | - | `script_content: ''` |
| 新增 | - | `cover_url: ''` |
| 新增 | - | `live_url: ''` |
| 新增 | - | `case_type: ''` |

### 查询与保存逻辑（第 4670-4675 行）
- `findOne({ where: { title: data.title } })` → `findOne({ where: { title: data.title, organization_id: orgId } })`
- `save(data)` → `save(data as any)`

---

## 修改 3：LegalDocument 种子数据（第 4679-4771 行）

### 数据对象字段变更（8 条记录）

| 操作 | 旧字段 | 新字段 / 说明 |
|------|--------|--------------|
| 重命名 | `name` | → `template_name` |
| 重命名 | `category` | → `case_type` |
| 重命名 | `doc_type` | → `document_type` |
| 重命名 | `content` | → `content_template` |
| 拆分 | `is_active: true` | → `is_system: true` + `status: 'active'` |
| 重命名 | `created_by_id` | → `created_by` |

### 查询与保存逻辑（第 4765-4770 行）
- `findOne({ where: { name: data.name } })` → `findOne({ where: { template_name: data.template_name, organization_id: orgId } })`
- `save(data)` → `save(data as any)`

---

## 修改 4：Reconciliation 种子数据（第 4902-4947 行）

### 数据对象字段变更（2 条记录）

| 操作 | 旧字段 | 新字段 / 说明 |
|------|--------|--------------|
| 删除 | `case_id` | 实体无此字段 |
| 删除 | `period` | 改为 `reconciliation_no` |
| 新增 | - | `reconciliation_no`（唯一编号） |
| 新增 | - | `period_start: new Date('2026-06-01')` 或 `new Date('2026-07-01')` |
| 新增 | - | `period_end: new Date('2026-06-30')` 或 `new Date('2026-07-31')` |
| 重命名 | `total_pending` | → `total_overdue` |
| 枚举化 | `status: 'matched'` | → `status: ReconciliationStatus.CONFIRMED` |
| 枚举化 | `status: 'pending'` | → `status: ReconciliationStatus.DRAFT` |
| 删除 | `details` | 实体无此字段 |
| 删除 | `matched_at` | 实体无此字段（仅第 1 条记录） |
| 重命名 | `operator_id` | → `created_by` |
| 新增 | - | `match_count: 1` / `match_count: 0` |
| 新增 | - | `mismatch_count: 0` / `mismatch_count: 1` |

### 查询与保存逻辑（第 4938-4946 行）
- 移除 `if (!data.case_id) continue;` 守卫
- `findOne({ where: { case_id: data.case_id, period: data.period } })` → `findOne({ where: { reconciliation_no: data.reconciliation_no } })`
- `save(data)` → `save(data as any)`

---

## 验证
- 运行 `cd /Users/season/AI编程/法律咨询/全链产品/backend && npx nest build 2>&1`
- 确认构建通过，无 TypeScript 错误
