# 全链产品业务数据流转文档

> 文档版本：v1.0  
> 生成日期：2026-08-10  
> 适用范围：全链产品后端核心业务模块数据流转分析

---

## 一、数据流转总览

```
[外部输入] → [线索模块] → [案件模块] → [合同模块] → [财务模块] → [分润模块]
                    ↓                        ↓
               [客户模块]              [合规模块]
                    ↓                        ↓
               [营销模块]              [审批模块]
```

---

## 二、各模块数据流转详情

### 2.1 线索模块（Lead）

#### 2.1.1 数据来源

| 来源方式 | 说明 | 对应实体 |
|---------|------|---------|
| 广告平台Webhook | 巨量引擎/腾讯广告等平台回调 | `webhook.controller.ts` |
| 手动录入 | 销售手动创建线索 | `lead.controller.ts` |
| 公共线索池 | 来自公共池的公开线索 | `lead-pool.service.ts` |

#### 2.1.2 核心流转

```
创建线索(create)
    ↓
自动分配(lead-assignment.service.ts)
    ↓
跟进记录(follow-up)
    ↓
转化为案件(convertToCase)
    ↓
┌─────────────────────────────────────────────────┐
│ 事务内同步操作:                                    │
│  1. 创建 Case 记录                                │
│  2. 利冲检索(conflict-check.service.ts)          │
│  3. 创建 ClientProfile 客户档案                   │
│  4. 创建 Receivable 应收台账                      │
│  5. 更新 Lead 状态为 converted                    │
└─────────────────────────────────────────────────┘
```

#### 2.1.3 输出数据

| 输出目标 | 说明 | 目标实体/模块 |
|---------|------|-------------|
| 案件创建 | 转化成功后生成 Case 记录 | `case.entity.ts` |
| 客户档案 | 自动创建客户信息 | `client-profile.entity.ts` |
| 应收台账 | 根据服务费创建 | `receivable.entity.ts` |
| 分配日志 | 记录分配过程 | `lead-assignment-log.entity.ts` |

---

### 2.2 案件模块（Case）

#### 2.2.1 数据来源

| 来源方式 | 说明 | 对应Service |
|---------|------|------------|
| 线索转化 | 由 LeadService.convertToCase 触发 | `lead.service.ts` |
| 直接创建 | 用户通过API直接创建案件 | `case.service.ts` |

#### 2.2.2 核心流转

```
创建案件(create)
    ↓
┌─────────────────────────────────────────────────┐
│ 事务内操作:                                        │
│  1. 自动生成案件编号(AJ-YYYYMMDD-XXXX)             │
│  2. 风险评估(analyzeRisk)                         │
│  3. 利冲检索(conflict-check.service.ts)           │
└─────────────────────────────────────────────────┘
    ↓
事务外异步处理:
    ├─ 类案匹配(similar-case.service.ts) → 回写description
    └─ SOP生成(compliance.service.ts) → 创建CaseTask
    ↓
分配律师(assignLawyer)
    ↓
办理中(PROCESSING)
    ↓
审批流程(Approval)
    ↓
┌─────────────────────────────────────────────────┐
│ 审批通过操作:                                      │
│  1. 更新 approval_status 为 approved             │
│  2. 若阶段为intake → 自动转为processing          │
│  3. 同步合同主办律师                              │
└─────────────────────────────────────────────────┘
    ↓
案件办理(上传文档、跟进进度)
    ↓
结案(closeCase)
    ↓
┌─────────────────────────────────────────────────┐
│ 结案事务操作:                                      │
│  1. 更新案件状态为 CLOSED                         │
│  2. 同步合同阶段为 completed                      │
│  3. 检查是否满足结算条件                          │
│  4. 触发分润检查(commission.service.ts)          │
│  5. 触发客户评价(client.service.ts)               │
│  6. 审计日志(audit.service.ts)                    │
│  7. 生成结案报告(legal-document.service.ts)       │
└─────────────────────────────────────────────────┘
```

#### 2.2.3 输出数据

| 输出目标 | 说明 | 目标实体/模块 |
|---------|------|-------------|
| 合同同步 | 案件关联合同信息 | `contract.entity.ts` |
| SOP任务 | 案件办理节点清单 | `case-task.entity.ts` |
| 客户评价 | 结案后触发评价推送 | `client.service.ts` |
| 分润计算 | 结算完成后触发 | `commission.service.ts` |
| 审计日志 | 关键操作审计记录 | `audit.entity.ts` |

---

### 2.3 合同模块（Contract）

#### 2.3.1 数据来源

| 来源方式 | 说明 | 对应Service |
|---------|------|------------|
| 案件关联创建 | 案件创建时可关联合同 | `case.service.ts` |
| 独立创建 | 用户通过API直接创建合同 | `contract.service.ts` |

#### 2.3.2 核心流转

```
创建合同(create)
    ↓
┌─────────────────────────────────────────────────┐
│ 事务内操作:                                        │
│  1. 自动生成合同编号(HT-YYYYMMDD-XXXXXX)           │
│  2. 记录初始阶段(drafting)                        │
│  3. 回写关联Case(双向关联)                        │
└─────────────────────────────────────────────────┘
    ↓
合同阶段流转:
    drafting → reviewing → signed → performing → completed
                                                        ↘
                                                    terminated / voided
    ↓
合同审批(Approval)
    ↓
┌─────────────────────────────────────────────────┐
│ 审批通过操作:                                      │
│  1. 更新 approval_status 为 approved             │
│  2. 发起用印申请(seal.service.ts)                 │
│  3. 自动生成委托合同(legal-document.service.ts)   │
│  4. 审计日志(audit.service.ts)                    │
└─────────────────────────────────────────────────┘
    ↓
用印状态流转:
    unused → pending → used
    ↓
交回管理:
    not_returned → returned
```

#### 2.3.3 输出数据

| 输出目标 | 说明 | 目标实体/模块 |
|---------|------|-------------|
| 用印申请 | 审批通过后自动发起 | `seal-application.entity.ts` |
| 法律文书 | 审批通过后自动生成 | `legal-document.service.ts` |
| 审计日志 | 关键操作审计记录 | `audit.entity.ts` |
| 案件回写 | 双向关联信息同步 | `case.entity.ts` |

---

### 2.4 财务模块（Finance）

#### 2.4.1 数据来源

| 来源方式 | 说明 | 对应Service |
|---------|------|------------|
| 线索转化 | LeadService.convertToCase 创建应收 | `lead.service.ts` |
| 案件关联 | 案件创建时关联费用 | `case.service.ts` |
| 手动创建 | 财务人员手动创建应收 | `finance.service.ts` |

#### 2.4.2 核心流转

```
应收台账(Receivable)创建
    ↓
登记收款(recordPayment)
    ↓
┌─────────────────────────────────────────────────┐
│ 事务内操作:                                        │
│  1. 创建 PaymentRecord 支付记录                   │
│  2. 更新 Receivable(已收+待收)                    │
│  3. 汇总案件已收金额 → 回写 Case                  │
│  4. 若收清 → 触发分润检查                         │
└─────────────────────────────────────────────────┘
    ↓
应收状态流转:
    PENDING → PARTIAL → COMPLETED
    ↓
分润计算(commission.service.ts)
    ↓
┌─────────────────────────────────────────────────┐
│ 分润规则匹配:                                      │
│  1. 机构分成                                       │
│  2. 律师分成                                       │
│  3. 销售分成                                       │
│  4. 市场分成                                       │
│  5. 助理分成                                       │
└─────────────────────────────────────────────────┘
    ↓
退款流程:
    创建退款 → 审核 → 打款 → 更新应收
    ↓
发票管理:
    创建发票 → 开票 → 标记已付 → 作废
```

#### 2.4.3 输出数据

| 输出目标 | 说明 | 目标实体/模块 |
|---------|------|-------------|
| 分润记录 | 生成各角色分润记录 | `commission-record.entity.ts` |
| 利润表 | 计算案件利润分析 | `profit-share.entity.ts` |
| 审计日志 | 关键操作审计记录 | `audit.entity.ts` |
| 合规检查 | 财务数据合规校验 | `finance-compliance-check.entity.ts` |

---

### 2.5 客户模块（Client）

#### 2.5.1 数据来源

| 来源方式 | 说明 | 对应Service |
|---------|------|------------|
| 线索转化 | LeadService.convertToCase 自动创建 | `lead.service.ts` |
| 客户注册 | 客户自助注册 | `client-profile.service.ts` |
| 后台录入 | 管理员手动创建 | `client-profile.service.ts` |

#### 2.5.2 核心流转

```
客户档案创建(ClientProfile)
    ↓
客户服务门户:
    ├─ 案件查询(getClientCases)
    ├─ 文档上传(uploadDocument)
    ├─ AI咨询(aiConsultEnhanced)
    │   └─ 复杂问题 → 自动转人工工单
    ├─ 线上签约(onlineSign)
    ├─ 电子发票下载(downloadInvoice)
    ├─ 证据材料上传(uploadEvidence)
    └─ 云归档管理(getClientArchives)
    ↓
客户投诉(createComplaint)
    ↓
┌─────────────────────────────────────────────────┐
│ 投诉联动操作:                                      │
│  1. 保存 Complaint 记录                            │
│  2. 同步生成 ComplaintTicket 工单                 │
│  3. 进入合规处理通道                               │
└─────────────────────────────────────────────────┘
    ↓
服务评价(createServiceRating)
    ↓
┌─────────────────────────────────────────────────┐
│ 评价联动操作:                                      │
│  1. 评分≥4星 → 可沉淀为营销素材                   │
│  2. 评分≤2星 → 自动触发客诉预警                    │
│  3. 结案自动触发评价推送                           │
└─────────────────────────────────────────────────┘
```

#### 2.5.3 输出数据

| 输出目标 | 说明 | 目标实体/模块 |
|---------|------|-------------|
| 投诉工单 | 客户投诉生成合规工单 | `complaint-ticket.entity.ts` |
| 营销素材 | 好评沉淀为素材 | `ad-material.entity.ts` |
| 客诉预警 | 低分评价预警工单 | `complaint-ticket.entity.ts` |
| 证据材料 | 上传的证据关联案件 | `evidence.entity.ts` |

---

### 2.6 合规模块（Compliance）

#### 2.6.1 数据来源

| 来源方式 | 说明 | 对应Service |
|---------|------|------------|
| 营销素材检查 | MarketingService.checkMaterialCompliance | `marketing.service.ts` |
| 合同内容检查 | ContractService 合同审查 | `contract.service.ts` |
| 谈话质检 | 谈案AI质检 | `talk-quality-check.entity.ts` |
| 客户投诉 | ClientService.createComplaint | `client.service.ts` |
| 线索SOP | CaseService.create 自动生成 | `case.service.ts` |

#### 2.6.2 核心流转

```
合规检查(checkCompliance)
    ↓
┌─────────────────────────────────────────────────┐
│ 违规关键词检测:                                      │
│  1. 绝对化用语(最、第一、唯一...)                   │
│  2. 违规承诺(包赢、必赢...)                         │
│  3. 夸大宣传(秒批、神速...)                         │
└─────────────────────────────────────────────────┘
    ↓
检查结果分类:
    PASS → 通过
    REJECT → 驳回
    WARNING → 警告
    ↓
合规规则管理(ComplianceRule)
    ↓
巡检检查(triggerInspection)
    ↓
投诉工单处理(ComplaintTicket)
    ↓
┌─────────────────────────────────────────────────┐
│ 工单状态流转:                                        │
│  PENDING → PROCESSING → RESOLVED → CLOSED          │
└─────────────────────────────────────────────────┘
    ↓
合规档案导出(exportComplianceArchive)
```

#### 2.6.3 输出数据

| 输出目标 | 说明 | 目标实体/模块 |
|---------|------|-------------|
| SOP任务 | 案件办理节点清单 | `case-task.entity.ts` |
| 质检记录 | 谈案质检结果 | `talk-quality-check.entity.ts` |
| 合规检查结果 | 各模块合规检查记录 | `compliance-check-result.entity.ts` |
| 财务合规 | 财务数据合规校验 | `finance-compliance-check.entity.ts` |

---

### 2.7 营销模块（Marketing）

#### 2.7.1 数据来源

| 来源方式 | 说明 | 对应Service |
|---------|------|------------|
| 素材上传 | 运营人员上传 | `marketing.service.ts` |
| AI生成 | AI内容生成 | `marketing.service.ts` |
| 好评沉淀 | 客户评价转化 | `client.service.ts` |

#### 2.7.2 核心流转

```
素材上传(uploadMaterial)
    ↓
合规检查(checkMaterialCompliance)
    ↓
素材入库(AdMaterial)
    ↓
素材类型:
    ARTICLE / IMAGE / VIDEO / SCRIPT
    ↓
素材状态:
    DRAFT → 待发布 → 已发布 → 已归档
    ↓
素材标签(tags):
    AI生成 / 客户好评 / 营销素材
```

#### 2.7.3 输出数据

| 输出目标 | 说明 | 目标实体/模块 |
|---------|------|-------------|
| 合规记录 | 素材合规检查结果 | `compliance-record.entity.ts` |
| 客户服务 | 客户评价转化素材 | `client.service.ts` |

---

### 2.8 审批模块（Approval）

#### 2.8.1 数据来源

| 来源方式 | 说明 | 对应Service |
|---------|------|------------|
| 案件审批 | CaseService.submitApproval | `case.service.ts` |
| 合同审批 | ContractService.submitApproval | `contract.service.ts` |
| 其他审批 | 退款审批等 | `finance.service.ts` |

#### 2.8.2 核心流转

```
发起审批(create)
    ↓
┌─────────────────────────────────────────────────┐
│ 步骤初始化:                                          │
│  1. 创建 ApprovalRequest 主表                      │
│  2. 创建 ApprovalStep 步骤记录                     │
│  3. 支持多步审批(串行)                              │
└─────────────────────────────────────────────────┘
    ↓
审批通过(approve)
    ↓
┌─────────────────────────────────────────────────┐
│ 步骤流转:                                            │
│  step0(PENDING) → step0(APPROVED) → step1(PENDING) │
│  → ... → 所有步骤完成 → ApprovalRequest(APPROVED)  │
└─────────────────────────────────────────────────┘
    ↓
审批结果联动:
    ├─ 案件: approval_status → approved, stage → processing
    ├─ 合同: approval_status → approved, 自动发起用印
    └─ 退款: 退款流程推进
```

#### 2.8.3 输出数据

| 输出目标 | 说明 | 目标实体/模块 |
|---------|------|-------------|
| 案件状态 | 更新案件审批状态 | `case.entity.ts` |
| 合同用印 | 自动发起用印申请 | `seal.service.ts` |
| 退款流程 | 推进退款审批 | `finance.service.ts` |

---

## 三、模块间联动关系图

```
                         ┌─────────────┐
                         │  外部输入    │
                         │ (Webhook等) │
                         └──────┬──────┘
                                ↓
                    ┌─────────────────────┐
                    │   线索模块(Lead)     │
                    │  ┌─────────────────┐│
                    │  │创建 → 分配 → 跟进││
                    │  └────────┬────────┘│
                    └───────────┼──────────┘
                                ↓ convertToCase
              ┌──────────────────────────────┐
              │       案件模块(Case)          │
              │  ┌────────────────────────┐  │
              │  │创建                     │  │
              │  │  ├─ 利冲检索            │  │
              │  │  ├─ 类案匹配            │  │
              │  │  └─ SOP生成            │  │
              │  └────────┬───────────────┘  │
              │           ↓                   │
              │  ┌────────────────────────┐  │
              │  │分配律师                 │  │
              │  │  ├─ 反向回写合同主办    │  │
              │  └────────┬───────────────┘  │
              │           ↓                   │
              │  ┌────────────────────────┐  │
              │  │办理中                   │  │
              │  │  ├─ 文档上传            │  │
              │  │  ├─ 进度更新            │  │
              │  │  └─ 合规检查            │  │
              │  └────────┬───────────────┘  │
              │           ↓                   │
              │  ┌────────────────────────┐  │
              │  │结案                     │  │
              │  │  ├─ 分润触发            │  │
              │  │  ├─ 客户评价           │  │
              │  │  └─ 结案文书           │  │
              │  └────────────────────────┘  │
              └───────────┼──────────────────┘
                          ↓
          ┌───────────────┼───────────────┐
          ↓               ↓               ↓
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ 客户模块    │  │ 合同模块    │  │ 财务模块    │
  │ (Client)    │  │ (Contract)  │  │ (Finance)   │
  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
         ↓                ↓                ↓
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ 投诉工单    │  │ 用印申请    │  │ 分润计算    │
  │ → 合规模块  │  │ → 用印模块  │  │ → 审计日志  │
  └─────────────┘  └─────────────┘  └─────────────┘
         ↓                ↓                ↓
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ 评价沉淀    │  │ 法律文书    │  │ 合规检查    │
  │ → 营销模块  │  │ → 文书模块  │  │ → 合规模块  │
  └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 四、数据实体关系摘要

### 4.1 核心实体关联

| 实体 | 关联关系 | 说明 |
|------|---------|------|
| Lead | 1:N → Case | 一个线索可转化为一个案件 |
| Lead | 1:N → FollowUp | 一个线索有多条跟进记录 |
| Case | N:1 → ClientProfile | 案件关联客户档案 |
| Case | N:1 → Contract | 案件关联合同 |
| Case | 1:N → Receivable | 案件有多条应收台账 |
| Case | 1:N → CaseTask | 案件有多条SOP任务 |
| Case | 1:N → Document | 案件有多份文档 |
| Contract | 1:N → ContractStage | 合同有多阶段记录 |
| Contract | 1:N → SealApplication | 合同可多次申请用印 |
| Receivable | 1:N → PaymentRecord | 应收对应多条支付记录 |
| Receivable | 1:N → Refund | 应收对应多条退款记录 |
| User | 1:N → CommissionRecord | 用户有多条分润记录 |
| Complaint | N:1 → ComplaintTicket | 投诉关联工单 |
| ServiceRating | N:1 → AdMaterial | 评分可沉淀为素材 |

### 4.2 关键字段映射

| 源字段 | 目标字段 | 流转路径 |
|-------|---------|---------|
| Lead.phone | ClientProfile.phone | 线索→客户档案 |
| Lead.service_fee | Case.fee_amount → Receivable.contract_amount | 线索→案件→应收 |
| Lead.source_channel | Case.case_source | 线索→案件来源 |
| Lead.contact_name | Case.client_name | 线索→案件客户名 |
| Case.case_no | Contract.case_id | 案件→合同 |
| Case.fee_amount | Contract.amount | 案件→合同金额 |
| Case.client_id | ClientProfile.id | 案件→客户档案 |
| Contract.amount | Receivable.contract_amount | 合同→应收 |
| Receivable.contract_amount → PaymentRecord.amount | Case.fee_collected | 收款→案件已收 |

---

## 五、事务边界说明

### 5.1 使用事务的操作

| 操作 | 事务范围 | 说明 |
|------|---------|------|
| 线索转案件 | Lead + Case + ClientProfile + Receivable | 保证数据一致性 |
| 案件创建 | Case + 利冲状态更新 | 保证案件创建原子性 |
| 案件结案 | Case + Contract + Commission | 保证结案数据完整 |
| 合同创建 | Contract + ContractStage + Case回写 | 保证双向关联一致 |
| 合同审批 | Contract + SealApplication + LegalDocument | 保证审批联动完整 |
| 登记收款 | PaymentRecord + Receivable + Case | 保证收款数据准确 |
| 退款审批 | Refund + Receivable | 保证退款影响准确 |

### 5.2 事务外异步操作

| 操作 | 说明 |
|------|------|
| 类案匹配 | 失败不影响案件创建主流程 |
| SOP生成 | 失败不影响案件创建主流程 |
| 分润触发 | 异常静默处理，不影响主流程 |
| 客户评价 | 异常静默处理，不影响结案主流程 |
| 审计日志 | 失败静默不影响主业务 |
| 法律文书 | 异常静默处理，不影响结案/审批主流程 |

---

## 六、数据流转状态机

### 6.1 线索状态流转

```
NEW → PENDING_FOLLOW → FOLLOWING → PENDING_SIGN → CONVERTED
                                                   ↓
                                               LOST(超时回收)
```

### 6.2 案件状态流转

```
INTAKE → PROCESSING → CLOSED
                        ↓              ↓
                    TERMINATED      VOIDED
```

### 6.3 应收状态流转

```
PENDING → PARTIAL → COMPLETED
              ↓
          (退款回退) → PENDING
```

### 6.4 合同阶段流转

```
DRAFTING → REVIEWING → SIGNED → PERFORMING → COMPLETED
                                 ↓            ↓
                             TERMINATED    VOIDED
```

### 6.5 审批状态流转

```
PENDING → APPROVED
            ↓
         REJECTED
            ↓
         CANCELLED(发起人撤销)
```

### 6.6 合规工单状态流转

```
PENDING → PROCESSING → RESOLVED → CLOSED
            ↓
         ESCALATED
```

---

## 七、外部系统数据交互

### 7.1 广告平台Webhook

| 数据方向 | 说明 | 对应接口 |
|---------|------|---------|
| 平台 → 系统 | 线索留资回调 | `POST /ad-platforms/webhook/:platform/lead` |
| 平台 → 系统 | 转化数据回调 | `POST /ad-platforms/webhook/:platform/conversion` |
| 系统 → 平台 | 数据同步 | `ad-platforms/data-sync.controller.ts` |

### 7.2 AI服务对接

| 数据方向 | 说明 | 对应Service |
|---------|------|------------|
| 系统 → AI | 营销文案生成 | `ai.service.ts` |
| 系统 → AI | 风险分析 | `ai.service.ts` |
| 系统 → AI | 智能对话 | `ai.service.ts` |
| 系统 → AI | 类案检索 | `similar-case.service.ts` |

### 7.3 通知推送

| 数据方向 | 说明 | 对应Service |
|---------|------|------------|
| 系统 → 客户 | 案件进度推送 | `client.service.ts` |
| 系统 → 内部 | 合规预警通知 | `compliance.service.ts` |
| 系统 → 内部 | 待审批通知 | `approval.service.ts` |

---

## 附录：关键Service文件索引

| 模块 | Service文件 | 核心职责 |
|------|------------|---------|
| 线索 | `lead.service.ts` | 线索CRUD、转化案件 |
| 线索 | `lead-assignment.service.ts` | 线索分配规则匹配 |
| 线索 | `lead-pool.service.ts` | 公共线索池管理 |
| 案件 | `case.service.ts` | 案件CRUD、状态流转 |
| 案件 | `case-task.service.ts` | SOP任务管理 |
| 案件 | `similar-case.service.ts` | 类案匹配 |
| 案件 | `conflict-check.service.ts` | 利冲检索 |
| 案件 | `legal-document.service.ts` | 法律文书生成 |
| 客户 | `client.service.ts` | 客户门户、评价、投诉 |
| 客户 | `client-profile.service.ts` | 客户档案管理 |
| 财务 | `finance.service.ts` | 费用、收款、退款、发票 |
| 财务 | `commission.service.ts` | 分润规则与记录 |
| 财务 | `invoice.service.ts` | 发票管理 |
| 合同 | `contract.service.ts` | 合同CRUD、审批、用印 |
| 合规 | `compliance.service.ts` | 合规检查、投诉工单 |
| 营销 | `marketing.service.ts` | 素材管理、合规检查 |
| 审批 | `approval.service.ts` | 多步审批流程 |
| 用印 | `seal.service.ts` | 电子/纸质用印管理 |
| 审计 | `audit.service.ts` | 操作审计日志 |
| AI | `ai.service.ts` | AI功能封装 |
| 广告 | `data-sync.service.ts` | 广告平台数据同步 |
