# 网推律所全链路一体化SaaS产品需求文档V2.1

| 属性 | 值 |
|---|---|
| 文档版本 | V2.1 |
| 撰写日期 | 2026-07-31 |
| 文档状态 | 已发布 |
| 作者 | 法智汇产品团队 |
| 适用范围 | 网推律所全链路一体化SaaS平台 |
| 密级 | 内部公开 |

---

## 文档目录

- [第1章 文档概述](#第1章-文档概述)
  - 1.1 文档目的
  - 1.2 适用范围
  - 1.3 目标读者
  - 1.4 产品核心定位
  - 1.5 术语表
  - 1.6 版本历史
- [第2章 角色权限矩阵](#第2章-角色权限矩阵)
  - 2.1 角色定义
  - 2.2 RACI 责任矩阵
  - 2.3 数据隔离规则
- [第3章 业务全链路总览](#第3章-业务全链路总览)
  - 3.1 全链路业务流程
  - 3.2 8大模块协同关系
  - 3.3 数据流转闭环
- [第4章 9大核心模块详细需求](#第4章-9大核心模块详细需求)
  - 模块1：全域投放与获客营销系统
  - 模块2：公私域连接器与SCRM私域运营系统
  - 模块3：线索中台与谈案转化CRM
  - 模块4：标准化案件办案管理系统
  - 模块5：全节点AI合规风控体系
  - 模块6：财务分润与收支管理系统
  - 模块7：C端客户服务与口碑运营体系
  - 模块8：全链路经营数据决策中台
  - 模块9：系统配置与组织管理
- [第5章 非功能性需求](#第5章-非功能性需求)
  - 5.1 性能需求
  - 5.2 安全需求
  - 5.3 可用性需求
  - 5.4 可扩展性需求
  - 5.5 兼容性需求
  - 5.6 可维护性需求
- [第6章 数据规范](#第6章-数据规范)
  - 6.1 核心实体关系图
  - 6.2 数据字典
  - 6.3 数据流转规则
  - 6.4 数据脱敏规则
- [第7章 接口规范](#第7章-接口规范)
  - 7.1 RESTful 设计规范
  - 7.2 统一响应格式
  - 7.3 错误码定义
  - 7.4 鉴权方式
  - 7.5 限流策略
- [第8章 UI/UX规范](#第8章-uiux规范)
  - 8.1 设计系统
  - 8.2 交互规范
  - 8.3 响应式设计要求
  - 8.4 无障碍要求
- [第9章 集成与部署规范](#第9章-集成与部署规范)
  - 9.1 第三方平台对接规范
  - 9.2 部署架构
  - 9.3 环境配置
  - 9.4 监控告警
- [第10章 测试规范](#第10章-测试规范)
  - 10.1 测试策略
  - 10.2 核心验收用例
  - 10.3 性能测试要求
- [第11章 全链路衔接性详细校验](#第11章-全链路衔接性详细校验)
  - 11.1 前端获客-销转链路字段映射
  - 11.2 销转-办案交付链路字段映射
  - 11.3 业务-财务链路字段映射
  - 11.4 全链路合规覆盖校验
  - 11.5 数据中台数据源校验
  - 11.6 整体衔接性最终结论
- [第12章 附录](#第12章-附录)
  - 附录A 典型业务场景剧本
  - 附录B 常见问题FAQ

---

## 第4章 9大核心模块详细需求

本章详细描述产品的9大核心业务模块，每个模块包含功能描述、用户故事、业务规则、输入/输出规范、数据模型、API接口规范、交互流程、异常场景与验收标准。9大模块覆盖"获客—销转—办案—合规—财务—服务—配置"全链路闭环。

---

## 第1章 文档概述

#### 1.1 文档目的

本文档为《网推律所全链路一体化SaaS产品需求文档V2.0》（以下简称"V2.0文档"），在V1.0功能层面需求的基础上，补充详细用户故事、数据模型字段定义、API接口规范、交互流程、异常场景、验收标准、非功能性需求、数据规范、UI/UX规范、集成部署规范、测试规范及全链路衔接性字段级映射，作为产品研发、测试、实施交付三方共用的唯一权威依据。

V2.0文档的核心价值在于：将V1.0中"功能描述+业务规则"的两段式描述，细化到研发可直接落地的颗粒度——研发人员可对照"数据模型"创建数据库表，对照"API接口规范"实现Controller，对照"验收标准"编写测试用例，无需再向产品经理确认任何实现细节；测试人员可对照"验收标准"与"异常场景"设计测试用例覆盖正常/边界/异常路径；实施交付团队可对照"集成与部署规范"完成环境搭建与第三方平台对接。

#### 1.2 适用范围

本需求覆盖产品全部8大核心业务模块与2类支撑底座，适配以广告投放驱动、实行"邀谈分离"流水线作业模式的网推律所，兼容10-500人规模的中小团队与规模化连锁律所。

- **8大核心业务模块**：全域投放与获客营销系统、公私域连接器与SCRM私域运营系统、线索中台与谈案转化CRM、标准化案件办案管理系统、全节点AI合规风控体系、财务分润与收支管理系统、C端客户服务与口碑运营体系、全链路经营数据决策中台。
- **2类支撑底座**：法律垂类AI能力中台、系统集成与部署底座。
- **覆盖业务闭环**："获客-销转-办案-合规-财务-服务"全链路闭环，无业务断点、无数据孤岛、无合规盲区。
- **不适用范围**：非网推模式（如纯口碑型、纯转介绍型）的传统律所、个人执业律师的轻量级案管需求，可作为参考但不作为本产品交付对象。

#### 1.3 目标读者

| 读者角色 | 阅读重点 | 使用方式 |
|---|---|---|
| 产品研发团队 | 数据模型、API接口规范、交互流程、异常场景 | 作为开发实现的直接依据，对照实现Controller与前端页面 |
| 测试团队 | 验收标准、异常场景、测试规范 | 作为测试用例设计的输入，覆盖正常/边界/异常路径 |
| 律所运营负责人 | 业务规则、角色权限矩阵、全链路总览 | 作为业务流程落地的参考，确认系统能力与运营流程匹配 |
| 销售团队 | 产品核心定位、8大模块能力概览、术语表 | 作为对外宣讲与客户答疑的资料 |
| 实施交付团队 | 集成与部署规范、第三方对接、环境配置 | 作为项目交付的SOP，指导环境搭建与平台对接 |

#### 1.4 产品核心定位

**法智汇**是面向网推律所的全链路一体化合规SaaS平台，以营销获客为入口、销转提效为核心、办案标准化为支撑、合规风控为底线、财务核算为闭环、客户服务为延伸，打造法律服务行业唯一覆盖"公域获客→私域沉淀→销转签约→办案交付→财务分润→客户服务"全流程的数字化系统。

产品融合三类行业最佳实践：蘑菇投的前端获客销转能力、金助理的后端案管财务能力、Alpha法律专业工具能力，并补全全竞品缺失的网推专属合规风控体系，形成差异化壁垒。核心价值主张：

- **获客提效**：打通广告投放与后端转化，全链路ROI可核算，投放决策有据可依。
- **销转标准化**：邀谈分离流水线作业，SOP强制节点管控，销转过程全留痕。
- **办案规范化**：标准化办案SOP模板，关键节点自动预警，电子卷宗集中管理。
- **合规风控**：全节点AI合规质检，营销预审+谈案质检+办案管控+财务校验，无合规盲区。
- **财务自动化**：立案自动生成应收台账，结案自动核算分润，账实一致。
- **服务透明化**：C端客户专属端口，案件进度主动推送，AI答疑降低人力占用。

#### 1.5 术语表

| 术语 | 英文/缩写 | 定义说明 |
|---|---|---|
| 网推律所 | Network-Driven Law Firm | 以互联网广告投放为核心获客手段，实行邀谈分离流水线作业模式的律师事务所，区别于传统口碑型律所。 |
| 邀谈分离 | Invite-Talk Separation | 线索邀约与谈案签约由不同岗位承担的分工模式：邀约岗负责电话邀约到所，谈案岗负责接待签约，提升专业度与转化率。 |
| 利冲 | Conflict of Interest | 利益冲突检索，比对客户姓名/企业名称与系统内历史客户、对方当事人库，规避同一律所代理对立方的合规风险。 |
| 销转 | Sales Conversion | 销售转化，从线索到签约的全过程，包含邀约、到所、谈案、签约等环节，是网推律所的核心商业链路。 |
| SOP | Standard Operating Procedure | 标准作业流程，预置高频案由的标准化办案/谈案节点，强制节点未完成无法推进，保证服务质量一致性。 |
| SCRM | Social Customer Relationship Management | 社交化客户关系管理，基于企业微信/个人微信的私域客户运营体系，含活码、标签、触达、存档等能力。 |
| 活码 | Live Code | 动态引流二维码，支持按轮询/负载/地域/案由分配对应销售或邀约账号，每个活码绑定唯一渠道标识可追溯来源。 |
| 公海池 | Public Lead Pool | 未跟进或无效线索统一回收的线索池，支持重新分配或员工主动领取，避免线索资源浪费。 |
| 商机 | Opportunity | 谈案岗跟进的潜在签约机会，从首次接触到签约/流失的阶段流转，对应Opportunity实体。 |
| 立案 | Case Filing | 签约后案件正式进入办案系统的流程，需完成正式利冲检索、合同上传、律师指派，生成唯一案件编号。 |
| 卷宗 | Case File | 案件证据与文书的电子化集中存储，按阶段分类、支持版本管理与权限管控，可一键导出归档。 |
| 分润 | Profit Sharing | 案件结案且全款到账后，按预设规则核算投放岗/邀约岗/谈案岗/办案律师/助理等多角色提成的机制。 |
| 合规预审 | Compliance Pre-check | 营销内容发布前的强制合规审核，识别夸大宣传、包胜诉承诺、绝对化用语、违规收费等违规点，未通过无法发布。 |
| 质检 | Quality Inspection | 对谈案通话与聊天记录的全量AI合规质检，自动识别违规表述并生成预警，覆盖销售全流程。 |
| 留痕 | Audit Trail | 业务操作全程记录，包含操作人、操作时间、操作内容、操作结果，支持追溯与监管核查导出。 |
| 沉淀 | Knowledge Precipitation | 将客户评价、办案经验、合规案例等数据沉淀为可复用的知识资产，反向优化业务流程与营销内容。 |
| 触达 | Reach | 私域客户的批量触达工具，含1V1定时群发、朋友圈统一发布、社群SOP运营三类触达方式。 |
| RACI | Responsible/Accountable/Consulted/Informed | 权限矩阵模型，R负责执行、A负责审批、C被咨询、I被告知，用于明确每项任务的责任归属。 |
| SLA | Service Level Agreement | 服务等级协议，量化系统可用性承诺，本产品要求系统可用性 ≥ 99.5%。 |
| RTO | Recovery Time Objective | 恢复时间目标，故障发生后系统恢复可用所需的最长时间，本产品要求 RTO ≤ 4小时。 |
| RPO | Recovery Point Objective | 恢复点目标，故障发生后可能丢失的数据时间窗口，本产品要求 RPO ≤ 1小时。 |
| JWT | JSON Web Token | 一种基于JSON的开放标准，用于在各方之间安全传输信息的令牌格式，本产品用于用户身份鉴权。 |
| RESTful | Representational State Transfer | 一种API设计风格，基于HTTP方法语义（GET查询/POST创建/PUT更新/DELETE删除）与资源路径组织接口。 |
| SQLite | SQLite | 一种轻量级嵌入式关系型数据库，不支持enum类型（用varchar替代）、不支持timestamp类型（用datetime替代），适用于中小规模数据存储。 |
| NestJS | NestJS | 基于TypeScript的Node.js后端框架，采用模块化架构，本产品后端基于NestJS构建，全局API前缀为`/api`。 |
| AntD | Ant Design | 蚂蚁金服开源的React企业级UI组件库，本产品前端基于Ant Design 6.x，Modal使用`open`属性、Tabs使用`items`配置。 |

#### 1.6 版本变更记录

| 版本 | 日期 | 变更类型 | 变更内容概述 |
|---|---|---|---|
| V1.0 | 2026-07 | 新建 | 完成产品功能层面需求描述，覆盖8大核心模块的业务规则、前置条件、输出；明确产品核心定位、7大角色定义、核心业务全流程总链路；完成全链路需求衔接性整体校验。 |
| V2.0 | 2026-07-25 | 补充细化 | 在V1.0基础上补充以下内容：①术语表（25+核心术语）；②角色权限RACI矩阵（8大模块×7角色）；③业务全链路时序图（8阶段字段级流转）；④每个功能点细化为9个子项（用户故事/数据模型/API规范/交互流程/异常场景/验收标准等）；⑤新增非功能性需求章节（性能/安全/可用性/可扩展性/兼容性/可维护性，含量化指标）；⑥新增数据规范章节（ER关系/数据字典/流转规则/脱敏规则）；⑦新增接口规范章节（RESTful规范/统一响应/错误码/鉴权/限流）；⑧新增UI/UX规范章节（设计系统/交互规范/响应式）；⑨新增集成与部署规范章节（第三方对接/部署架构/环境配置/监控告警）；⑩新增测试规范章节（策略/验收用例/性能要求）；⑪新增全链路衔接性字段级映射（源实体.字段→目标实体.字段）；⑫新增附录（典型场景剧本/FAQ）。 |
| V2.1 | 2026-07-31 | 代码对齐更新 | 根据backend/frontend/shared实际代码实现对齐文档，包括：①修正数据字典中实体字段与实际代码不一致处（Opportunity、Case、Lead、AdPlan等实体字段按代码实际定义修正）；②补充数据字典缺失的40+实体定义（Role、Permission、Menu、FollowUp、HandoverLog、InviteTask、LeadAssignment、LeadAssignmentLog、LeadPool、TalkSOP、OpportunitySOPProgress、OpportunityQuoteItem、OpportunityStageLog、AdAccount、AdMaterial、ContentTemplate、AdAccountWarning、AdPlanLog、DigitalHumanLive、MarketingMaterial、ClientTag、ClientTagRelation、ReachTask、ScriptLibrary、CaseSOPTemplate、CaseWarning、Document、LegalDocument、CaseTaskComment、LawyerQualification、ComplianceRule、ComplaintTicket、SalesCompliance、CaseComplianceCheck、RiskDisclosure、TalkQualityCheck、CasePersonnelChange、ContractTemplate、FinanceComplianceCheck、CaseArchive、SigningCompliance、MarketingContent(compliance)、CaseSOP、Complaint、ComplianceRecord、Fee、Invoice、Refund、CommissionRule、CaseCost、OverdueWarning、Reconciliation、ProfitShare、CasePushNotification、ClientArchive、ReportTemplate、ReportExportLog、BrandConfig、DeploymentConfig、Integration等）；③修正枚举值定义与代码对齐（CaseStatus、OpportunityStage、LeadSource、ComplaintType、InviteResult、RecycleReason、WarningType等）；④补充系统配置模块（品牌配置、部署配置、第三方集成）；⑤补充前端路由架构说明（B端路由、C端路由、路由守卫、主题配置）；⑥修正接口响应格式说明（按NestJS实际默认行为：成功直接返回实体/分页对象，异常返回标准{statusCode,message,error}格式）。 |

---

## 第2章 角色权限矩阵

#### 2.1 角色职责定义表

本产品覆盖8类系统角色，对应后端`UserRole`枚举的8个值（`SUPER_ADMIN`为平台超管、`ORG_ADMIN`对应律所管理者、其余为业务角色）。各角色核心职责定义如下：

| 角色 | 角色标识（UserRole） | 核心职责 |
|---|---|---|
| 平台超管 | `super_admin` | 平台级超级管理员，可跨组织查询与管理，负责组织创建/启用/禁用、系统全局配置。 |
| 投放岗 | `marketing` | ①广告账户统一管理，监控账户余额与消耗；②投放计划批量管控，执行启停/预算调整/出价修改/复制迁移；③投放素材效能管理，统计素材转化效果；④AI营销内容生成与合规预审，配合素材库管理；⑤公域账号矩阵管理，调度内容发布与数据统计。 |
| 邀约岗 | `sales`（邀约方向） | ①接收分配线索，执行电话邀约与微信触达；②一键外呼通话录音，通话自动存档至客户档案；③创建到所预约，填写预约时间/案由/客户需求，同步至谈案岗；④邀约数据统计，关注接通率/邀约率/到所率核心指标；⑤无效线索退回公海池，填写退回原因。 |
| 谈案岗 | `sales`（谈案方向） | ①接收邀约岗流转的到所客户，执行谈案签约；②录入谈案记录、商机阶段更新、报价方案管理；③执行谈案标准化SOP，完成风险告知等强制节点；④签约后一键发起立案申请，客户与商机信息同步至办案系统；④商机数据分析，关注签约率/签约金额/人均业绩。 |
| 办案律师/助理 | `lawyer` / `assistant` | ①接收立案案件，执行办案SOP任务节点；②证据与电子卷宗管理，批量上传、分类标注；③法律大数据检索与法律文书智能生成；④案件关键节点跟进，响应预警通知；⑤与客户沟通案件进度，配合结案归档。 |
| 行政/财务岗 | `finance` | ①审批流程处理（用印/所函/合同/退费/立案审批）；②案件收费、开票、收款登记全流程管理；③多角色分润核算与提成明细生成；④退费全流程审批与核算；⑤财务报表生成与对账管理。 |
| 律所管理者 | `org_admin` | ①全链路经营数据查看与决策；②分润规则、SOP模板、审批流等基础配置；③合规风险全局管控与高风险事项处理；④员工账号与权限管理；⑤客户资产交接审批与离职处理。 |
| C端客户 | `client` | ①实名认证绑定本人案件；②查看本人案件进度与节点推送；③AI智能答疑与人工咨询；④线上服务大厅办理业务（签约/支付/发票/材料/投诉）；⑤结案后服务评价。 |

#### 2.2 RACI权限矩阵

RACI权限矩阵覆盖8大业务模块与7大角色，单元格填写规则：**R**=Responsible负责执行、**A**=Accountable负责审批、**C**=Consulted被咨询、**I**=Informed被告知、**-**=无权限。

| 模块 \ 角色 | 投放岗 | 邀约岗 | 谈案岗 | 办案律师/助理 | 行政/财务岗 | 律所管理者 | C端客户 |
|---|---|---|---|---|---|---|---|
| **模块1 投放营销** | R | I | I | - | - | A | - |
| **模块2 SCRM私域** | R | R | R | - | - | A | - |
| **模块3 线索CRM** | - | R（邀约） | R（谈案） | - | C | A | - |
| **模块4 案件办案** | - | - | R（立案发起） | R | C（审批） | A | I |
| **模块5 合规风控** | C | C | C | C | C | R/A | - |
| **模块6 财务分润** | I | I | I | I | R | A | I |
| **模块7 C端服务** | - | - | - | C | C | A | R |
| **模块8 数据中台** | I | I | I | I | I | R/A | - |

**矩阵说明**：

1. **模块1 投放营销**：投放岗负责执行投放计划与素材管理，邀约岗与谈案岗被告知转化数据用于跟进决策，律所管理者审批预算与策略调整。
2. **模块2 SCRM私域**：投放岗、邀约岗、谈案岗均可执行私域触达与客户运营，律所管理者审批触达策略与话术库配置。
3. **模块3 线索CRM**：邀约岗执行线索跟进与邀约，谈案岗执行商机跟进与签约，行政/财务岗被咨询退费线索处理，律所管理者审批分配规则与公海池策略。
4. **模块4 案件办案**：谈案岗发起立案申请，办案律师/助理执行办案任务，行政/财务岗审批用印/所函/合同等行政流程，律所管理者审批立案与结案，C端客户被告知案件进度。
5. **模块5 合规风控**：各业务岗位配合合规校验（被咨询），律所管理者负责合规风险处理与审批，是合规风控的主要责任人。
6. **模块6 财务分润**：行政/财务岗执行收费/开票/分润核算/退费处理，各业务岗位被告知提成与收款信息，律所管理者审批分润规则与异常退费，C端客户被告知收款与发票信息。
7. **模块7 C端服务**：C端客户是主要执行人，办案律师/助理与行政/财务岗被咨询处理客户咨询与投诉，律所管理者审批口碑沉淀与客诉升级。
8. **模块8 数据中台**：律所管理者是主要查看与决策人，各业务岗位被告知相关经营数据用于业绩复盘。

#### 2.3 数据权限规则

#### 2.3.1 律所间数据隔离原则

系统采用多租户数据隔离架构，**`req.user.organization_id` 作为全局数据隔离键**，所有业务实体的查询、创建、更新、删除操作均需附加 `organization_id` 过滤条件。

- **隔离范围**：线索（Lead）、案件（Case）、客户、商机（Opportunity）、财务记录、合规记录等所有业务数据均按 `organization_id` 隔离。
- **隔离实现**：后端Service层在所有查询中强制附加 `where organization_id = req.user.organization_id` 条件；创建实体时强制写入 `organization_id`。
- **例外情况**：`SUPER_ADMIN`（平台超管）可跨组织查询，用于平台运维与全局监控；`ORG_ADMIN`仅可查询本组织全部数据。
- **数据导入**：批量导入线索/案件时，自动附加当前用户的 `organization_id`，禁止手动指定其他组织。

#### 2.3.2 角色间数据可见性差异

| 角色 | 数据可见范围 |
|---|---|
| 投放岗（marketing） | 本组织全部投放账户、计划、素材、转化数据；不可见线索详情与客户联系方式。 |
| 邀约岗（sales-邀约） | 本组织分配给自己的线索、邀约任务、通话记录；可见客户联系方式与基础档案；不可见其他邀约岗的线索详情。 |
| 谈案岗（sales-谈案） | 本组织分配给自己的商机、谈案记录、签约案件；可见客户全景档案；不可见其他谈案岗的商机详情。 |
| 办案律师/助理（lawyer/assistant） | 本组织分配给自己的案件、任务、证据、卷宗；可见对应客户档案；不可见其他律师的案件详情与财务数据。 |
| 行政/财务岗（finance） | 本组织全部财务数据（应收/收款/发票/分润/退费）、审批流；不可见客户聊天记录与通话录音原文。 |
| 律所管理者（org_admin） | 本组织全部业务数据、财务数据、合规数据；可查看所有员工绩效与客户档案。 |
| C端客户（client） | 仅本人关联的案件、进度、通知、咨询记录；严格隔离，不可见其他客户任何数据。 |

#### 2.3.3 C端客户数据隔离规则

C端客户数据隔离是最高优先级安全规则，必须严格执行：

- **数据范围限制**：C端客户仅可查看本人作为当事人关联的案件，查询条件为 `where client_phone = req.user.phone AND organization_id = req.user.organization_id`。
- **接口隔离**：C端所有接口路径以 `/api/client/` 为前缀，Controller层强制校验 `req.user.role === 'client'`，且所有查询附加客户身份过滤条件。
- **敏感字段屏蔽**：C端客户不可见律所内部字段（如办案律师内部备注、分润信息、合规预警、投放成本等）。
- **接口方法约束**：C端接口统一使用 HTTP POST 方法（符合项目工程约束），避免GET参数泄露与CDN缓存敏感数据。
- **登录重定向**：`client` 角色登录后前端自动重定向至 `/client` 路径，与其他角色路由隔离。

#### 2.3.4 敏感字段脱敏规则

| 字段类型 | 脱敏算法 | 展示示例 | 备注 |
|---|---|---|---|
| 手机号 | 保留前3位与后4位，中间4位替换为`****` | `138****5678` | 投放岗、行政/财务岗查看时脱敏；邀约岗/谈案岗/办案律师/管理者可见明文。 |
| 身份证号 | 保留前6位与后4位，中间8位替换为`********` | `110101********1234` | 仅律所管理者与办案律师可见明文；其他角色脱敏。 |
| 银行卡号 | 保留后4位，其余替换为`****` | `**** **** 5678` | 仅行政/财务岗与律所管理者可见明文。 |
| 微信号 | 保留前2位与后2位，中间替换为`****` | `wx****ab` | 邀约岗/谈案岗可见明文；其他角色脱敏。 |
| 客户姓名 | 保留姓氏，名字替换为`*` | `张*`、`李**` | 投放岗、数据看板展示时脱敏；负责员工与管理者可见明文。 |

脱敏规则在后端Service层统一实现，根据 `req.user.role` 动态返回脱敏或明文字段，前端无需额外处理。

---

## 第3章 业务全链路总览

#### 3.1 核心业务流程文字描述

法智汇产品的核心业务流程围绕"获客-销转-办案-合规-财务-服务"全闭环展开，完整链路如下：

**公域广告投放** → 投放岗在巨量引擎、百度营销、腾讯广告、快手广告四大平台管理广告账户与投放计划，AI生成营销内容并经合规预审后发布，吸引潜在客户点击留资。

**线索自动留资入库** → 广告平台表单、私信、直播间留资线索自动同步至线索中台，按手机号/微信号自动去重合并，入库自动生成唯一客户ID，并触发前置利益冲突初查。

**加微引流私域** → 通过多场景活码（企微活码/个微活码/群活码）将公域线索引流至私域，按轮询/负载/地域/案由分配对应销售或邀约账号，每个活码绑定唯一渠道标识可追溯来源。

**线索分配邀约岗** → 通过智能线索分配引擎，按地域/案由/岗位负载/人员专业标签自动分配至邀约岗，邀约岗在工作台查看待跟进线索、执行一键外呼、通话自动录音存档。

**电话邀约到所** → 邀约岗邀约客户到所，创建到所预约（填写预约时间/案由/客户需求），预约信息自动同步至对应谈案岗；未跟进线索超时自动回收至公海池二次分配。

**谈案岗接待签约** → 谈案岗接收邀约岗流转的到所客户，自动同步客户信息与需求记录无需重复录入；执行谈案标准化SOP（风险告知/需求确认/方案讲解/报价/签约），谈案AI实时合规辅助识别违规表述。

**立案进入办案系统** → 签约后谈案岗一键发起立案申请，完成正式利益冲突检索、委托合同上传、办案律师指派；立案审批通过后生成唯一案件编号，正式进入办案流程。

**标准化办案流程** → 案件创建时自动匹配对应案由SOP模板生成全流程任务，多级任务拆解指派主办律师/协办律师/助理；关键节点（举证期/上诉期/开庭时间/保全到期/时效到期）自动预警。

**结案归档** → 案件办理完成后提交结案申请，必须完成全部卷宗材料上传与SOP节点闭环；电子卷宗按监管要求标准化归档，支持一键导出；结案状态自动同步至财务、客户、数据模块。

**财务分润核算** → 案件结案且全款到账后，自动触发多角色分润引擎，按预设规则核算投放岗/邀约岗/谈案岗/办案律师/助理提成，生成提成明细报表；财务报表自动生成。

**客户服务与口碑沉淀** → 案件结案后自动触发服务评价推送，客户打分评价；好评内容经审核后沉淀至素材库用于营销宣传；低分评价自动生成客诉预警同步至合规风控模块。

**全链路数据回流优化投放** → 经营数据决策中台汇总8大模块数据，展示投放转化漏斗、销售绩效、办案效能、财务经营、合规风险等多维度看板；转化数据T+1回传广告平台优化投放模型。

#### 3.2 全链路时序图描述

按8阶段描述业务全链路时序，每阶段明确触发事件、参与角色、核心动作、产出数据、流转目标：

#### 阶段1：投放获客阶段

| 维度 | 说明 |
|---|---|
| **触发事件** | 投放岗创建广告计划并启动投放；AI生成营销内容并经合规预审通过。 |
| **参与角色** | 投放岗（执行）、律所管理者（审批预算）。 |
| **核心动作** | ①广告账户授权绑定；②投放计划配置（预算/出价/定向/素材）；③AI营销内容生成与合规预审；④素材绑定投放计划；⑤启动投放。 |
| **产出数据** | AdAccount（广告账户）、AdPlan（投放计划）、AdMaterial（投放素材）、ConversionEvent（曝光/点击事件）、MarketingContent（营销内容+合规审核结果）。 |
| **流转目标** | 转化事件（曝光/点击）回传广告平台优化模型；留资线索流转至阶段2线索中台。 |

#### 阶段2：私域沉淀阶段

| 维度 | 说明 |
|---|---|
| **触发事件** | 潜在客户扫描活码或点击推广链接加微。 |
| **参与角色** | 投放岗（活码配置）、邀约岗（接收加微）。 |
| **核心动作** | ①活码生成与分流规则配置；②客户加微自动通过；③客户信息绑定已有线索档案（按手机号匹配）；④客户标签自动打标（来源渠道/广告素材/咨询案由）；⑤聊天记录全量存档。 |
| **产出数据** | LiveCode（活码）、ChannelTracking（渠道追踪）、ChatArchive（聊天记录）、ClientTag+ClientTagRelation（客户标签）。 |
| **流转目标** | 客户加微成功后，线索状态更新为"已加微"，流转至阶段3线索分配邀约。 |

#### 阶段3：线索分配邀约阶段

| 维度 | 说明 |
|---|---|
| **触发事件** | 线索入库并通过前置利冲初查。 |
| **参与角色** | 邀约岗（执行邀约）、律所管理者（配置分配规则）。 |
| **核心动作** | ①线索自动归集去重生成唯一客户ID；②前置利冲检索（无冲突/疑似冲突/明确冲突）；③智能分配引擎按规则分配至邀约岗；④邀约岗一键外呼通话录音；⑤创建到所预约同步至谈案岗；⑥未跟进超时自动回收公海池。 |
| **产出数据** | Lead（线索）、LeadAssignment+LeadAssignmentLog（分配记录）、InviteTask（邀约任务）、FollowUp（跟进记录）、LeadPool（公海池线索）。 |
| **流转目标** | 邀约成功到所后，客户档案与需求记录自动流转至阶段4谈案岗。 |

#### 阶段4：谈案签约阶段

| 维度 | 说明 |
|---|---|
| **触发事件** | 客户到所，邀约岗创建到所预约。 |
| **参与角色** | 谈案岗（执行谈案签约）、律所管理者（审批SOP模板）。 |
| **核心动作** | ①谈案岗工作台接收到所客户；②自动同步客户信息与需求记录；③执行谈案标准化SOP（风险告知/需求确认/方案讲解/报价/签约）；④谈案AI实时合规辅助识别违规表述；⑤商机阶段更新（首次接触→签约/流失）；⑥签约后一键发起立案申请。 |
| **产出数据** | Opportunity（商机）、TalkSOP节点完成记录、TalkQualityCheck（谈案质检）、SigningCompliance（签约合规）、RiskDisclosure（风险告知签署）。 |
| **流转目标** | 签约成功且立案申请审批通过后，案件信息流转至阶段5立案办案。 |

#### 阶段5：立案办案阶段

| 维度 | 说明 |
|---|---|
| **触发事件** | 谈案岗发起立案申请，律所管理者审批通过。 |
| **参与角色** | 办案律师/助理（执行办案）、行政/财务岗（OA审批）、律所管理者（审批立案）。 |
| **核心动作** | ①正式利冲检索；②委托合同上传与合规校验；③办案律师指派；④生成唯一案件编号；⑤自动匹配案由SOP模板生成任务清单；⑥多级任务拆解指派；⑦证据与电子卷宗管理；⑧法律检索与文书生成；⑨关键节点自动预警。 |
| **产出数据** | Case（案件）、CaseSOP（办案SOP）、CaseTask+CaseTaskComment（任务与评论）、Evidence+Document（证据与卷宗）、CaseWarning（节点预警）、CaseComplianceCheck（办案合规校验）。 |
| **流转目标** | 案件办理完成后，流转至阶段6结案归档；同时案件数据实时同步至财务系统（应收台账）与C端客户（进度推送）。 |

#### 阶段6：结案归档阶段

| 维度 | 说明 |
|---|---|
| **触发事件** | 案件办理完成，办案律师提交结案申请。 |
| **参与角色** | 办案律师/助理（提交结案）、律所管理者（审批结案）。 |
| **核心动作** | ①结案校验（全部SOP节点闭环、卷宗材料齐全）；②电子卷宗标准化归档；③结案审批；④结案状态同步至财务、客户、数据模块；⑤触发客户服务评价推送。 |
| **产出数据** | CaseArchive（结案归档记录）、Case状态更新为`closed`。 |
| **流转目标** | 结案状态触发阶段7财务分润核算；同时触发阶段8客户服务评价。 |

#### 阶段7：财务分润阶段

| 维度 | 说明 |
|---|---|
| **触发事件** | 案件结案且全款到账。 |
| **参与角色** | 行政/财务岗（执行核算）、律所管理者（审批分润）。 |
| **核心动作** | ①立案时已自动生成应收款台账；②收款登记与发票开具；③结案全款到账后自动触发分润引擎；④按预设规则核算多角色提成；⑤生成提成明细报表；⑥退费全流程审批与核算（如有）。 |
| **产出数据** | Receivable（应收台账）、PaymentRecord（收款记录）、Invoice（发票）、CommissionRecord（提成记录）、Refund（退费记录）、FinanceComplianceCheck（财务合规校验）。 |
| **流转目标** | 财务数据回流至数据中台，支撑经营数据分析；分润明细通知各业务岗位。 |

#### 阶段8：客户服务阶段

| 维度 | 说明 |
|---|---|
| **触发事件** | 案件结案归档完成。 |
| **参与角色** | C端客户（评价服务）、办案律师/助理（处理咨询）、律所管理者（审批口碑沉淀）。 |
| **核心动作** | ①结案自动触发服务评价推送；②客户打分评价；③好评内容审核后沉淀至素材库；④低分评价生成客诉预警同步合规模块；⑤客户咨询AI答疑或转人工工单；⑥投诉提交与闭环处理。 |
| **产出数据** | ServiceRating（服务评价）、ClientConsultation（客户咨询）、Complaint+ComplaintTicket（投诉工单）。 |
| **流转目标** | 客户口碑数据回流至营销系统优化投放素材；客诉数据回流至合规风控模块反向优化业务流程；全链路数据汇总至数据中台支撑经营决策。 |

#### 3.3 数据流向总览

法智汇产品8大模块间的数据流向基于**唯一客户ID**（Lead.id生成时确定，全系统通用）与**唯一案件ID**（Case.id立案时生成）两大主键关联，确保全链路数据可追溯、无孤岛。数据流向总览如下：

**投放系统 → 线索中台**：广告平台留资线索（表单/私信/直播间）通过ConversionEvent异步同步至Lead实体，生成唯一客户ID；转化事件（曝光/点击/加微/邀约/签约）回传广告平台优化投放模型。数据关联键：ConversionEvent.lead_id → Lead.id；ConversionEvent.ad_plan_id → AdPlan.id。

**线索中台 → SCRM私域**：线索加微后，客户微信信息绑定至已有Lead档案（按手机号匹配）；活码扫码记录写入ChannelTracking；聊天记录写入ChatArchive并关联Lead.id。数据关联键：ChatArchive.lead_id → Lead.id；ChannelTracking.live_code_id → LiveCode.id。

**SCRM私域 → CRM谈案**：客户标签（ClientTagRelation）全系统同步，CRM、SCRM、办案系统共享标签数据；邀约岗创建的到所预约（InviteTask）自动流转至谈案岗，商机（Opportunity）基于Lead.id创建。数据关联键：Opportunity.lead_id → Lead.id；InviteTask.lead_id → Lead.id。

**CRM谈案 → 办案系统**：谈案签约后一键发起立案，客户信息、案由、合同金额自动带入Case实体，利冲检索结果复用；案件指派律师后生成唯一案件编号。数据关联键：Case.lead_id → Lead.id；Case.opportunity_id → Opportunity.id。

**办案系统 → 财务系统**：立案后自动生成应收款台账（Receivable），合同金额同步；收款记录（PaymentRecord）更新案件缴费状态；结案且全款到账后触发分润核算（CommissionRecord）。数据关联键：Receivable.case_id → Case.id；CommissionRecord.case_id → Case.id。

**办案系统 → 合规系统**：案件SOP节点（CaseSOP）状态同步至合规模块；关键节点预警（CaseWarning）超期升级至合规风险台账；案件人员变更（CasePersonnelChange）需合规审批。数据关联键：CaseComplianceCheck.case_id → Case.id；CaseWarning.case_id → Case.id。

**办案系统 → C端服务**：案件节点更新触发CasePushNotification推送至C端客户；客户上传证据材料自动同步至Evidence实体；C端咨询（ClientConsultation）转人工工单同步至办案律师。数据关联键：CasePushNotification.case_id → Case.id；ClientConsultation.case_id → Case.id；Evidence.case_id → Case.id。

**全模块 → 数据中台**：8大模块数据基于唯一客户ID与唯一案件ID关联汇总至数据中台，数据源唯一无重复统计；经营看板数据自动更新，无需手动汇总，数据口径全系统统一。数据关联键：所有报表均通过Lead.id与Case.id跨模块关联，支撑投放转化漏斗、销售绩效、办案效能、财务经营、合规风险等多维度分析。

**数据回流闭环**：客户服务阶段的口碑数据（ServiceRating好评）回流至营销系统沉淀为投放素材；客诉数据（Complaint）回流至合规风控模块反向优化业务流程；全链路转化数据回流至投放系统优化投放模型，形成"获客-销转-办案-合规-财务-服务"的完整数据闭环。

### 模块1：全域投放与获客营销系统

#### 1.1 广告账户统一管理

**1. 功能描述**

支持巨量引擎、百度营销、腾讯广告、快手广告四大主流广告平台账户的统一接入、分组管控与余额预警，无需切换多平台后台即可完成全账户运维。

**2. 用户故事**

- 作为投放岗运营人员，我希望在系统中绑定并管理多个广告平台账户，以便在一个后台统一查看账户余额、消耗和授权状态。
- 作为律所管理员，我希望按部门或案由对广告账户进行分组并分配权限，以便控制只有投放岗或管理员可操作账户、其他角色仅可查看数据。

**3. 业务规则**

1. 仅支持原生对接 `douyin`（巨量引擎）、`baidu`（百度营销）、`tencent`（腾讯广告）、`kuaishou`（快手广告）四大平台，平台字段取值必须为上述四者之一。
2. 同一平台支持绑定多个账户，但同一组织内 `platform + account_id` 组合必须唯一，避免重复绑定。
3. 角色权限：仅 `super_admin`、`org_admin`、`marketing` 三类角色可对账户进行创建、更新、删除、余额/阈值/状态修改及分组操作；其他角色仅可调用查询接口查看账户列表与数据。
4. 余额预警：当账户 `balance < threshold` 时系统自动生成一条预警记录（状态 `pending`），可通过 `manual-check` 接口手动触发检查；预警可被标记为 `notified`（已通知）或 `resolved`（已处理，需填写 remarks）。
5. 账户状态包含 `active`（启用）、`disabled`（停用）、`unauthorized`（未授权/授权失效），状态切换需通过专用接口 `PUT /api/ad-accounts/:id/status` 完成。
6. 账户删除为物理删除，删除前需确认无关联的进行中投放计划（由调用方业务侧保证）。

**4. 输入/输出规范**

创建账户（POST /api/ad-accounts）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| platform | varchar | 是 | 枚举：douyin/baidu/tencent/kuaishou |
| account_name | string | 是 | 长度 1-64，非空 |
| account_id | string | 是 | 平台返回的唯一ID，组织内同平台唯一 |
| group_name | string | 否 | 长度 ≤ 32 |
| balance | number | 否 | ≥ 0，默认 0，单位元 |
| threshold | number | 否 | ≥ 0，默认 0，单位元 |
| status | varchar | 否 | 枚举：active/disabled/unauthorized，默认 active |
| auth_token | text | 否 | OAuth 令牌 JSON 字符串 |

输出结果：返回创建/更新后的账户完整对象（含 id、organization_id、creator_id、created_at、updated_at）。查询接口返回账户数组及分组列表、预警列表。

**5. 数据模型**

实体名：`AdAccount`，表名 `ad_accounts`，与后端 `backend/src/marketing/ad-account.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| platform | varchar(20) | NOT NULL | 投放平台：douyin/baidu/tencent/kuaishou |
| account_name | varchar(64) | NOT NULL | 账户名称（展示用） |
| account_id | varchar(128) | NOT NULL | 平台账户ID |
| group_name | varchar(32) | NULL | 分组名称 |
| balance | real | DEFAULT 0 | 账户余额（元） |
| threshold | real | DEFAULT 0 | 余额预警阈值（元） |
| status | varchar(20) | DEFAULT 'active' | 账户状态 |
| auth_token | text | NULL | 授权令牌 JSON |
| authorized_at | datetime | NULL | 授权时间 |
| organization_id | varchar(36) | NOT NULL | 组织ID（索引） |
| creator_id | varchar(36) | NULL | 创建人ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

联合索引：`(organization_id, platform)`、`(organization_id, group_name)`、`(organization_id, status)`。

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/ad-accounts | 创建广告账户 | JWT + 投放岗/管理员 |
| GET | /api/ad-accounts | 查询账户列表（支持 platform/group_name/status/keyword 筛选） | JWT |
| GET | /api/ad-accounts/groups | 查询分组列表 | JWT |
| GET | /api/ad-accounts/warnings | 查询余额预警列表 | JWT |
| POST | /api/ad-accounts/warnings/manual-check | 手动触发预警检查 | JWT + 投放岗/管理员 |
| PUT | /api/ad-accounts/warnings/:id/notified | 标记预警已通知 | JWT + 投放岗/管理员 |
| PUT | /api/ad-accounts/warnings/:id/resolved | 标记预警已处理 | JWT + 投放岗/管理员 |
| GET | /api/ad-accounts/:id | 查询单个账户详情 | JWT |
| PUT | /api/ad-accounts/:id | 更新账户信息 | JWT + 投放岗/管理员 |
| PUT | /api/ad-accounts/:id/balance | 更新账户余额 | JWT + 投放岗/管理员 |
| PUT | /api/ad-accounts/:id/threshold | 更新预警阈值 | JWT + 投放岗/管理员 |
| PUT | /api/ad-accounts/:id/status | 更新账户状态 | JWT + 投放岗/管理员 |
| DELETE | /api/ad-accounts/:id | 删除账户 | JWT + 投放岗/管理员 |
| POST | /api/ad-accounts/groups | 创建分组（含账户IDs） | JWT + 投放岗/管理员 |
| PUT | /api/ad-accounts/groups/change | 修改账户所属分组 | JWT + 投放岗/管理员 |

请求示例（创建账户）：

```http
POST /api/ad-accounts
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "platform": "douyin",
  "account_name": "律所-抖音主账户",
  "account_id": "tt_16888",
  "group_name": "婚姻组",
  "balance": 5000.00,
  "threshold": 500.00,
  "status": "active",
  "auth_token": "{\"access_token\":\"xxx\",\"refresh_token\":\"yyy\"}"
}
```

成功响应（201）：

```json
{
  "id": "f3b1c2d4-...",
  "platform": "douyin",
  "account_name": "律所-抖音主账户",
  "account_id": "tt_16888",
  "group_name": "婚姻组",
  "balance": 5000.00,
  "threshold": 500.00,
  "status": "active",
  "organization_id": "org-001",
  "creator_id": "user-001",
  "authorized_at": null,
  "created_at": "2026-07-25T10:00:00.000Z",
  "updated_at": "2026-07-25T10:00:00.000Z"
}
```

失败响应（403，权限不足）：

```json
{
  "statusCode": 403,
  "message": "无操作权限，仅投放岗或管理员可操作广告账户",
  "error": "Forbidden"
}
```

**7. 交互流程**

1. 用户在前端「广告账户」页点击「新增账户」→ 填写 platform、account_name、account_id、group_name、balance、threshold 等字段并提交。
2. 前端携带 JWT 调用 `POST /api/ad-accounts`。
3. 后端 `AdAccountController.create` 校验角色权限（仅 super_admin/org_admin/marketing 放行）→ 注入 organization_id 与 creator_id → 调用 `AdAccountService.create`。
4. Service 层校验 `platform + account_id` 唯一性，写入 `ad_accounts` 表，触发余额预警检查（balance < threshold 时生成预警）。
5. 后端返回创建后的账户对象，前端刷新账户列表并展示成功 toast。

**8. 异常场景**

1. **权限不足**：非投放岗/管理员角色调用写接口 → 后端抛 403 Forbidden，前端提示「无操作权限，仅投放岗或管理员可操作广告账户」。
2. **重复绑定**：同组织同平台下 account_id 已存在 → 后端返回 409 Conflict，前端提示「该平台账户ID已存在，请勿重复绑定」。
3. **余额预警触发失败**：创建账户时 threshold 大于 balance 但预警服务异常 → 账户创建成功，预警记录回退到手动检查队列，前端提示「账户已创建，余额预警将在下次同步时生成」。
4. **JWT 失效**：Token 过期或缺失 → 后端返回 401 Unauthorized，前端跳转登录页。

**9. 验收标准**

- **正常场景**：Given 投放岗用户已登录且组织下无重复账户，When 用户填写完整平台与账户信息并提交，Then 系统创建账户成功返回 201，账户列表中可见新账户且余额、阈值正确显示。
- **边界场景**：Given 账户余额为 200 元、阈值为 500 元，When 用户创建该账户，Then 系统在创建账户的同时生成一条状态为 pending 的预警记录，预警列表可查。
- **异常场景**：Given 普通销售岗用户已登录，When 用户尝试调用 `POST /api/ad-accounts` 创建账户，Then 系统返回 403 并提示「无操作权限，仅投放岗或管理员可操作广告账户」，账户表无新增记录。

---

#### 1.2 投放计划批量管控

**1. 功能描述**

跨平台批量管理广告投放计划的启停、预算、出价、复制与迁移，并完整留存操作日志以便追溯。

**2. 用户故事**

- 作为投放岗运营人员，我希望按案由或平台筛选广告计划，并对多条计划批量启停或调整预算，以便高效应对投放节奏变化。
- 作为律所管理者，我希望查看每条计划的历史操作日志，以便追溯操作人与操作时间，明确责任归属。

**3. 业务规则**

1. 计划必须关联一个已存在的广告账户（`account_id`），案由 `case_type` 取值限定为 `marriage`/`traffic`/`labor`/`debt`/`other` 五类。
2. 计划状态包括 `running`（投放中）、`paused`（暂停）、`ended`（已结束），新建计划默认状态为 `paused`。
3. 批量操作：`POST /api/ad-plans/batch/status` 支持批量启停，`POST /api/ad-plans/batch/budget` 支持批量预算调整；`plan_ids` 数组最大 100 条，超出拒绝。
4. 复制计划 `POST /api/ad-plans/:id/copy` 会创建一条新计划，新计划默认状态为 `paused`，名称默认追加「_副本」后缀，可由 `new_plan_name` 覆盖。
5. 迁移计划 `PUT /api/ad-plans/:id/migrate` 将计划迁至 `target_account_id` 指定的账户下，仅当目标账户与原账户属于同一组织时允许。
6. 所有写操作（创建、更新、删除、启停、预算/出价调整、复制、迁移）均写入 `ad_plan_logs` 操作日志表，记录操作人、操作类型、操作时间、变更前后值。
7. 预算与出价必须为非负数，预算单位为元/天，出价单位为元。

**4. 输入/输出规范**

创建计划（POST /api/ad-plans）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| account_id | string | 是 | 必须为当前组织内有效账户ID |
| plan_name | string | 是 | 长度 1-128 |
| case_type | varchar | 是 | 枚举：marriage/traffic/labor/debt/other |
| budget | number | 否 | ≥ 0，默认 0 |
| bid | number | 否 | ≥ 0，默认 0 |
| status | varchar | 否 | 枚举：running/paused/ended，默认 paused |
| platform_plan_id | string | 否 | 平台返回的计划ID |
| start_date | string | 否 | ISO 日期 |
| end_date | string | 否 | ISO 日期，须晚于 start_date |

输出结果：返回计划对象，含 `id`、`organization_id`、`creator_id`、`created_at`、`updated_at`。批量操作返回 `{ success: true, affected: number }`。`GET /api/ad-plans/:id/logs` 返回该计划的操作日志数组。

**5. 数据模型**

实体名：`AdPlan`，表名 `ad_plans`，与 `backend/src/marketing/ad-plan.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| account_id | varchar(36) | NOT NULL | 关联广告账户ID |
| plan_name | varchar(128) | NOT NULL | 计划名称 |
| case_type | varchar(20) | NOT NULL | 案由 |
| budget | real | DEFAULT 0 | 预算（元/天） |
| bid | real | DEFAULT 0 | 出价（元） |
| status | varchar(20) | DEFAULT 'paused' | 计划状态 |
| platform_plan_id | varchar(128) | NULL | 平台计划ID |
| start_date | date | NULL | 投放开始日期 |
| end_date | date | NULL | 投放结束日期 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| creator_id | varchar(36) | NULL | 创建人ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

联合索引：`(organization_id, status)`、`(organization_id, account_id)`、`(organization_id, case_type)`。关联日志表 `ad_plan_logs` 记录操作类型、操作人、变更前后值、操作时间。

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/ad-plans | 创建投放计划 | JWT + 投放岗/管理员 |
| GET | /api/ad-plans | 查询计划列表（支持 account_id/case_type/status/keyword/platform 筛选） | JWT |
| GET | /api/ad-plans/:id | 查询计划详情 | JWT |
| GET | /api/ad-plans/:id/logs | 查询计划操作日志 | JWT |
| PUT | /api/ad-plans/:id | 更新计划 | JWT + 投放岗/管理员 |
| DELETE | /api/ad-plans/:id | 删除计划 | JWT + 投放岗/管理员 |
| PUT | /api/ad-plans/:id/budget | 调整预算 | JWT + 投放岗/管理员 |
| PUT | /api/ad-plans/:id/bid | 调整出价 | JWT + 投放岗/管理员 |
| PUT | /api/ad-plans/:id/status | 更新状态 | JWT + 投放岗/管理员 |
| POST | /api/ad-plans/batch/status | 批量启停 | JWT + 投放岗/管理员 |
| POST | /api/ad-plans/batch/budget | 批量预算调整 | JWT + 投放岗/管理员 |
| POST | /api/ad-plans/:id/copy | 复制计划 | JWT + 投放岗/管理员 |
| PUT | /api/ad-plans/:id/migrate | 迁移计划至目标账户 | JWT + 投放岗/管理员 |

请求示例（批量启停）：

```http
POST /api/ad-plans/batch/status
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "plan_ids": ["p-001", "p-002", "p-003"],
  "status": "paused"
}
```

成功响应（200）：

```json
{
  "success": true,
  "affected": 3
}
```

失败响应（400，状态值非法）：

```json
{
  "statusCode": 400,
  "message": "status 取值必须为 running/paused/ended",
  "error": "Bad Request"
}
```

**7. 交互流程**

1. 用户在「投放计划」页通过案由、平台、状态筛选计划列表 → 前端调用 `GET /api/ad-plans` 携带查询参数。
2. 用户勾选多条计划，点击「批量暂停」→ 前端弹出确认框，确认后调用 `POST /api/ad-plans/batch/status`。
3. 后端 `AdPlanController.batchUpdateStatus` 校验权限与 `plan_ids` 长度 → 调用 `AdPlanService.batchUpdateStatus(ids, status, userId)`。
4. Service 层开启事务，逐条更新 `ad_plans.status` 并写入 `ad_plan_logs`（操作类型 start/pause/end）。
5. 后端返回受影响条数，前端刷新列表并展示「已批量暂停 3 条计划」。

**8. 异常场景**

1. **批量超过上限**：`plan_ids` 长度 > 100 → 后端返回 400，前端提示「单次批量操作最多 100 条计划，请分批操作」。
2. **目标账户不属于本组织**：迁移计划时 `target_account_id` 跨组织 → 后端返回 403，前端提示「目标账户不属于当前组织，无法迁移」。
3. **计划不存在**：操作的 plan_id 已被删除 → 后端返回 404，前端提示「计划不存在或已被删除」。
4. **日期非法**：end_date 早于 start_date → 后端返回 400，前端提示「结束日期不能早于开始日期」。

**9. 验收标准**

- **正常场景**：Given 投放岗用户已登录且组织下存在 3 条 running 状态计划，When 用户勾选这 3 条并点击「批量暂停」，Then 系统返回 affected=3，3 条计划状态变更为 paused，操作日志表新增 3 条 pause 记录。
- **边界场景**：Given 用户提交了 101 个 plan_ids 的批量请求，When 调用 `POST /api/ad-plans/batch/status`，Then 系统返回 400 并拒绝执行，提示「单次批量操作最多 100 条计划」。
- **异常场景**：Given 用户调用复制计划接口但目标 plan_id 已被删除，When 提交复制请求，Then 系统返回 404，操作日志无新增记录。

---

#### 1.3 全链路转化归因

**1. 功能描述**

打通广告投放与后端 CRM 转化数据，实现「线索 → 加微 → 邀约 → 签约」四级转化事件的回传与多维度 ROI 核算。

**2. 用户故事**

- 作为投放岗运营人员，我希望按渠道、账户、计划、创意、关键词维度查看消耗、线索量、加微率、签约率与 ROI，以便评估每条投放链路的真实效益。
- 作为律所管理者，我希望系统能 T+1 自动更新转化数据并支持手动触发素材 ROI 刷新，以便基于最新数据调整投放策略。

**3. 业务规则**

1. 转化事件类型 `event_type` 限定为四级：`lead`（线索）、`wechat_add`（加微）、`invite`（邀约到所）、`sign`（签约回款），其中 `sign` 事件必须携带 `amount`（回款金额）。
2. 渠道 `channel` 取值：`douyin`/`baidu`/`kuaishou`/`wechat`/`other`，与投放平台松耦合关联。
3. 多维度归因：通过 `channel`/`account_id`/`plan_id`/`material_id`/`keyword` 五个字段实现归因，任一字段可为空但不可全部为空。
4. ROI 统计维度 `dimension` 支持 `channel`/`account`/`plan`/`material`/`keyword` 五类，默认 `channel`。
5. 转化数据 T+1 自动更新；提供 `POST /api/conversions/refresh-material-roi` 接口手动触发素材 ROI 重算。
6. `client_id`、`lead_id`、`case_id` 由 CRM/案件系统自动回填，前端不允许直接修改。

**4. 输入/输出规范**

创建转化事件（POST /api/conversions/events）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| channel | varchar | 是 | 枚举：douyin/baidu/kuaishou/wechat/other |
| account_id | string | 否 | 关联投放账户 |
| plan_id | string | 否 | 关联投放计划 |
| material_id | string | 否 | 关联投放素材 |
| event_type | varchar | 是 | 枚举：lead/wechat_add/invite/sign |
| amount | number | 否 | sign 事件必填，≥ 0 |
| keyword | string | 否 | 触发关键词 |
| client_id | string | 否 | 关联客户ID |
| lead_id | string | 否 | 关联线索ID |
| case_id | string | 否 | 关联案件ID（sign 可携带） |
| organization_id | string | 是 | 组织ID |

输出结果：返回转化事件对象。`GET /api/conversions/funnel` 返回各级转化量与转化率。`GET /api/conversions/roi-stats` 返回按维度的消耗、线索量、加微率、签约率、ROI 聚合数组。

**5. 数据模型**

实体名：`ConversionEvent`，表名 `conversion_events`，与 `backend/src/marketing/conversion-event.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| channel | varchar(20) | NOT NULL | 渠道 |
| account_id | varchar(36) | NULL | 投放账户ID |
| plan_id | varchar(36) | NULL | 投放计划ID |
| material_id | varchar(36) | NULL | 投放素材ID |
| event_type | varchar(20) | NOT NULL | 事件类型 |
| amount | real | DEFAULT 0 | 回款金额（sign 用） |
| keyword | varchar(128) | NULL | 触发关键词 |
| client_id | varchar(36) | NULL | 客户ID |
| lead_id | varchar(36) | NULL | 线索ID |
| case_id | varchar(36) | NULL | 案件ID |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间（事件入库时间） |

联合索引：`(organization_id, channel)`、`(organization_id, account_id)`、`(organization_id, plan_id)`、`(organization_id, material_id)`、`(organization_id, created_at)`。

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/conversions/events | 通用创建转化事件 | JWT |
| POST | /api/conversions/lead | 线索事件回传 | JWT |
| POST | /api/conversions/wechat-add | 加微事件回传 | JWT |
| POST | /api/conversions/invite | 邀约到所事件回传 | JWT |
| POST | /api/conversions/sign | 签约回款事件回传 | JWT |
| GET | /api/conversions/events | 查询转化事件列表 | JWT |
| GET | /api/conversions/funnel | 转化漏斗统计 | JWT |
| GET | /api/conversions/roi-stats | 多维度 ROI 统计 | JWT |
| POST | /api/conversions/refresh-material-roi | 手动触发 T+1 素材 ROI 更新 | JWT |

请求示例（签约回款回传）：

```http
POST /api/conversions/sign
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "channel": "douyin",
  "account_id": "acc-001",
  "plan_id": "p-001",
  "material_id": "m-001",
  "event_type": "sign",
  "amount": 8000.00,
  "keyword": "离婚律师",
  "client_id": "c-001",
  "lead_id": "l-001",
  "case_id": "case-001",
  "organization_id": "org-001"
}
```

成功响应（201）：

```json
{
  "id": "ev-001",
  "channel": "douyin",
  "event_type": "sign",
  "amount": 8000.00,
  "organization_id": "org-001",
  "created_at": "2026-07-25T11:00:00.000Z"
}
```

失败响应（400，sign 缺少 amount）：

```json
{
  "statusCode": 400,
  "message": "签约事件必须携带 amount（回款金额）",
  "error": "Bad Request"
}
```

**7. 交互流程**

1. CRM 系统在客户完成签约回款后，由后端定时任务或事件回调调用 `POST /api/conversions/sign`。
2. 后端 `ConversionController.reportSign` 调用 `ConversionService.reportSign`，校验 `event_type=sign` 且 `amount≥0`。
3. Service 层写入 `conversion_events` 表，并触发广告平台 API 的转化回传（如有授权）。
4. 用户在前端「转化归因」页选择维度（如 plan）→ 前端调用 `GET /api/conversions/roi-stats?dimension=plan`。
5. Service 层按 plan_id 聚合消耗、各级转化量、ROI，前端渲染表格与图表。

**8. 异常场景**

1. **归因字段全空**：account_id/plan_id/material_id/keyword 全部为空 → 后端返回 400，提示「至少需提供一项归因维度（账户/计划/素材/关键词）」。
2. **sign 事件缺 amount**：event_type=sign 但未传 amount → 后端返回 400，提示「签约事件必须携带 amount」。
3. **平台回传失败**：写入数据库成功但广告平台 API 回传超时 → 系统记录回传失败日志，由补偿任务重试，前端展示「事件已入库，平台回传将异步重试」。
4. **时间范围非法**：roi-stats 查询时 start_date > end_date → 后端返回 400，提示「开始日期不能晚于结束日期」。

**9. 验收标准**

- **正常场景**：Given 组织 org-001 下存在一条 douyin 渠道的 sign 事件（amount=8000），When 用户调用 `GET /api/conversions/roi-stats?dimension=channel`，Then 返回结果中 douyin 渠道的签约回款金额为 8000，ROI = 8000 / 消耗金额。
- **边界场景**：Given 用户调用 `POST /api/conversions/refresh-material-roi` 手动触发刷新，When 任务执行完成，Then 所有素材的 roi 字段被重新计算并更新，无重复计算。
- **异常场景**：Given 调用 sign 接口但未提供 amount，When 提交请求，Then 系统返回 400 并提示「签约事件必须携带 amount」，conversion_events 表无新增记录。

---

#### 1.4 投放素材效能管理

**1. 功能描述**

统一管理全平台投放素材（图文、短视频、文章、脚本），自动关联投放计划，统计曝光、点击、转化、ROI 数据并产出素材效果排行榜。

**2. 用户故事**

- 作为投放岗运营人员，我希望为素材打标签并按效果指标（如 ROI）排序，以便快速识别高转化素材与低效素材。
- 作为律所管理者，我希望查看素材的曝光、点击、转化、消耗、ROI 全维效果数据，以便决定素材的复用或下架。

**3. 业务规则**

1. 素材类型 `type` 限定为 `image`（图文）、`video`（短视频）、`article`（文章）、`script`（脚本）四类。
2. 素材状态 `status` 包括 `draft`（草稿）、`active`（启用）、`paused`（暂停）、`archived`（归档），默认 `draft`。
3. 标签 `tags` 为 JSON 数组（如 `['离婚','抚养权','高转化']`），支持通过 `POST /api/ad-materials/:id/tags` 增删标签。
4. 效果数据（impressions/clicks/conversions/cost/roi）通过 `PUT /api/ad-materials/:id/effect` 更新，ROI 由 T+1 任务或 `POST /api/conversions/refresh-material-roi` 自动计算。
5. 排行榜 `GET /api/ad-materials/ranking` 支持按 `metric`（默认 `roi`，可选 impressions/clicks/conversions/roi/cost）排序，支持 `high_threshold`/`low_threshold` 自动标记高低效素材。
6. 素材绑定投放计划 `PUT /api/ad-materials/:id/bind-plan` 前置校验合规状态，`compliance_status` 非 `passed` 的素材禁止绑定。

**4. 输入/输出规范**

创建素材（POST /api/ad-materials）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| name | string | 是 | 长度 1-128 |
| type | varchar | 是 | 枚举：image/video/article/script |
| tags | array | 否 | 字符串数组 |
| file_path | string | 否 | 文件路径或URL |
| account_id | string | 否 | 关联账户 |
| plan_id | string | 否 | 关联计划 |
| channel | varchar | 否 | 投放渠道 |
| content_text | text | 否 | 内容文本（AI 生成入库） |
| case_type | varchar | 否 | 案由 |
| organization_id | string | 是 | 组织ID |
| uploaded_by_id | string | 是 | 上传人ID |

输出结果：返回素材对象。`GET /api/ad-materials/ranking` 返回排序后的素材数组及高低效标记。

**5. 数据模型**

实体名：`AdMaterial`，表名 `ad_materials`，与 `backend/src/marketing/ad-material.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| name | varchar(128) | NOT NULL | 素材名称 |
| type | varchar(20) | NOT NULL | 素材类型 |
| tags | text | NULL | 标签 JSON 数组（simple-json） |
| file_path | varchar(255) | NULL | 文件路径 |
| account_id | varchar(36) | NULL | 关联账户ID |
| plan_id | varchar(36) | NULL | 关联计划ID |
| channel | varchar(20) | NULL | 投放渠道 |
| impressions | integer | DEFAULT 0 | 曝光数 |
| clicks | integer | DEFAULT 0 | 点击数 |
| conversions | integer | DEFAULT 0 | 转化数 |
| cost | real | DEFAULT 0 | 消耗金额 |
| roi | real | DEFAULT 0 | ROI |
| status | varchar(20) | DEFAULT 'draft' | 素材状态 |
| compliance_status | varchar(30) | DEFAULT 'pending' | 合规状态 |
| compliance_detail | text | NULL | 合规审核详情 JSON |
| compliance_checked_at | datetime | NULL | 合规审核时间 |
| content_text | text | NULL | 内容文本 |
| case_type | varchar(20) | NULL | 案由 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| uploaded_by_id | varchar(36) | NOT NULL | 上传人ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

联合索引：`(organization_id, status)`、`(organization_id, type)`。

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/ad-materials | 创建素材 | JWT |
| POST | /api/ad-materials/save-generated | AI 生成内容一键入库 | JWT |
| GET | /api/ad-materials | 查询素材列表（支持 type/tag/status/channel/account_id/plan_id/compliance_status 筛选） | JWT |
| GET | /api/ad-materials/tags | 查询全组织标签集 | JWT |
| GET | /api/ad-materials/ranking | 素材效果排行榜 | JWT |
| GET | /api/ad-materials/:id | 查询素材详情 | JWT |
| PUT | /api/ad-materials/:id | 更新素材 | JWT |
| PUT | /api/ad-materials/:id/effect | 更新效果数据 | JWT |
| PUT | /api/ad-materials/:id/bind-plan | 绑定投放计划（前置校验合规） | JWT |
| POST | /api/ad-materials/:id/tags | 新增标签 | JWT |
| DELETE | /api/ad-materials/:id/tags/:tag | 删除标签 | JWT |
| DELETE | /api/ad-materials/:id | 删除素材 | JWT |

请求示例（绑定投放计划）：

```http
PUT /api/ad-materials/m-001/bind-plan
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "plan_id": "p-001"
}
```

成功响应（200）：

```json
{
  "id": "m-001",
  "plan_id": "p-001",
  "compliance_status": "passed",
  "updated_at": "2026-07-25T12:00:00.000Z"
}
```

失败响应（409，合规未通过）：

```json
{
  "statusCode": 409,
  "message": "素材合规状态为 need_modification，禁止绑定投放计划",
  "error": "Conflict"
}
```

**7. 交互流程**

1. 用户在「素材库」点击「上传素材」→ 选择 type、填写 name、tags、关联 account_id/plan_id、上传文件 → 前端调用 `POST /api/ad-materials`。
2. 后端 `MaterialController.create` → `MaterialService.create` 写入 `ad_materials` 表，状态为 draft，compliance_status 为 pending。
3. 用户点击「绑定计划」→ 前端调用 `PUT /api/ad-materials/:id/bind-plan`。
4. Service 层 `bindToPlan` 校验 `compliance_status === 'passed'`，若不通过抛 Conflict；通过则更新 plan_id。
5. T+1 定时任务或用户手动触发 `POST /api/conversions/refresh-material-roi` → 聚合 conversion_events 计算 roi 并更新 impressions/clicks/conversions/cost。
6. 用户在「效果排行」页查看 `GET /api/ad-materials/ranking?metric=roi`，前端渲染排行表并标记高低效素材。

**8. 异常场景**

1. **合规未通过绑定**：素材 compliance_status 为 need_modification 或 forbidden → 后端返回 409，前端提示「素材合规状态为 X，请先修改后重新提交合规审核」。
2. **标签重复**：新增标签已存在 → 后端去重处理，返回原标签集，前端提示「该标签已存在」。
3. **排行榜无数据**：组织下无素材或效果数据全为 0 → 后端返回空数组，前端展示「暂无排行数据，请先上传素材或同步效果数据」。
4. **删除被引用素材**：素材已被投放计划引用 → 后端返回 409，提示「素材已被 N 个计划引用，请先解绑后再删除」。

**9. 验收标准**

- **正常场景**：Given 素材 m-001 的 compliance_status 为 passed，When 用户调用 `PUT /api/ad-materials/m-001/bind-plan` 绑定计划 p-001，Then 系统返回 200，素材 plan_id 更新为 p-001。
- **边界场景**：Given 素材 m-002 的 ROI 为 5.0、high_threshold 为 3.0，When 用户调用 `GET /api/ad-materials/ranking?metric=roi&high_threshold=3.0`，Then 返回结果中 m-002 被标记为「高转化素材」。
- **异常场景**：Given 素材 m-003 的 compliance_status 为 forbidden，When 用户尝试绑定计划，Then 系统返回 409，提示「素材合规状态为 forbidden，禁止绑定投放计划」，plan_id 不变。

---

#### 1.5 AI营销内容生成

**1. 功能描述**

基于案由、卖点与内容模板，AI 批量生成短视频脚本、朋友圈文案、直播话术、科普图文等营销内容，并一键入库至素材库。

**2. 用户故事**

- 作为投放岗运营人员，我希望输入案由（如婚姻）和核心卖点，AI 自动生成多种形式的营销文案，以便快速产出投放与私域运营素材。
- 作为律所管理者，我希望系统内置网推律所高频案由（婚姻、劳动、债务、交通事故）的内容模板，并对模板进行版本管理，以便保证生成内容的标准化与可复用。

**3. 业务规则**

1. AI 生成接口 `POST /api/marketing/content/ai-generate` 接收 `prompt` 与可选 `case_type`，调用法律 AI 中台生成内容。
2. 内容模板 `ContentTemplate` 包含 `case_type`（marriage/traffic/labor/debt/other）、`content_type`（video_script/copywriting/live_script/article）、`title`、`content`、`version`、`is_active` 字段，仅 `is_active=true` 的模板参与生成。
3. AI 生成内容可通过 `POST /api/ad-materials/save-generated` 一键入库素材库，自动打标签（基于案由与内容类型），入库后素材 status=draft、compliance_status=pending。
4. 模板支持版本管理：同 `case_type + content_type` 可存在多版本，仅一个 is_active=true。
5. 生成失败（AI 中台不可用）时返回 503，并记录失败日志，不影响素材库现有数据。

**4. 输入/输出规范**

AI 生成（POST /api/marketing/content/ai-generate）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| prompt | string | 是 | 长度 1-2000，描述生成需求 |
| case_type | varchar | 否 | 枚举：marriage/traffic/labor/debt/other |

入库（POST /api/ad-materials/save-generated）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| title | string | 是 | 长度 1-128 |
| content | text | 是 | 非空 |
| case_type | varchar | 是 | 案由枚举 |
| content_type | varchar | 是 | video_script/copywriting/live_script/article |
| tags | array | 否 | 标签数组 |
| organization_id | string | 是 | 组织ID |
| uploaded_by_id | string | 是 | 上传人ID |
| channel | varchar | 否 | 渠道 |

输出结果：AI 生成接口返回生成的内容文本与建议标签；入库接口返回新创建的素材对象（含 id、status=draft）。

**5. 数据模型**

实体名：`ContentTemplate`，表名 `content_templates`，与 `backend/src/marketing/content-template.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| case_type | varchar(20) | NOT NULL | 案由 |
| content_type | varchar(20) | NOT NULL | 内容类型 |
| title | varchar(128) | NOT NULL | 模板标题 |
| content | text | NOT NULL | 模板内容 |
| version | integer | DEFAULT 1 | 版本号 |
| is_active | integer | DEFAULT 1 | 是否启用（0/1） |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

联合索引：`(case_type, content_type, is_active)`。生成内容入库时写入 `ad_materials` 表（详见 1.4 数据模型）。

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/marketing/content/ai-generate | AI 生成营销内容 | JWT |
| POST | /api/ad-materials/save-generated | AI 内容一键入库素材库 | JWT |
| POST | /api/marketing/materials | 上传素材（含 AI 生成标记） | JWT |
| GET | /api/marketing/materials | 查询素材（支持 is_ai_generated 筛选） | JWT |

请求示例（AI 生成）：

```http
POST /api/marketing/content/ai-generate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "prompt": "生成一条针对离婚抚养权纠纷的短视频脚本，突出律师团队专业经验，时长30秒",
  "case_type": "marriage"
}
```

成功响应（200）：

```json
{
  "title": "离婚抚养权纠纷-30秒短视频脚本",
  "content": "【开场】您好，我是XX律师...",
  "content_type": "video_script",
  "case_type": "marriage",
  "suggested_tags": ["离婚", "抚养权", "短视频"]
}
```

失败响应（503，AI 中台不可用）：

```json
{
  "statusCode": 503,
  "message": "AI 中台暂不可用，请稍后重试",
  "error": "Service Unavailable"
}
```

**7. 交互流程**

1. 用户在「AI 内容生成」页选择案由、输入 prompt → 前端调用 `POST /api/marketing/content/ai-generate`。
2. 后端 `MarketingController.generateAIContent` → `MarketingService.generateAIContent` 加载 `case_type + content_type` 对应的 is_active 模板，组装 prompt 调用 AI 中台。
3. AI 中台返回生成内容，后端返回前端展示。
4. 用户预览内容并点击「保存到素材库」→ 前端调用 `POST /api/ad-materials/save-generated`。
5. `MaterialController.saveGeneratedContent` → `MaterialService.saveGeneratedContent` 写入 ad_materials（status=draft、compliance_status=pending），自动打标签。
6. 前端跳转素材库并展示新素材。

**8. 异常场景**

1. **AI 中台超时**：调用 AI 中台超过 30 秒未响应 → 后端返回 503，前端提示「AI 生成超时，请缩短 prompt 后重试」。
2. **prompt 过长**：prompt 超过 2000 字符 → 后端返回 400，提示「prompt 长度不能超过 2000 字符」。
3. **入库失败**：AI 生成成功但 save-generated 接口数据库写入失败 → 后端返回 500，前端提示「内容已生成但入库失败，请手动复制内容后重试」。
4. **模板未启用**：对应案由与内容类型的模板全部 is_active=0 → 后端使用默认 prompt 生成，前端提示「未启用专属模板，使用通用模板生成」。

**9. 验收标准**

- **正常场景**：Given 组织下存在 case_type=marriage、content_type=video_script 的 is_active 模板，When 用户输入 prompt 调用 AI 生成，Then 系统返回符合婚姻案由的短视频脚本内容与建议标签。
- **边界场景**：Given AI 生成内容后用户点击「保存到素材库」，When 调用 `POST /api/ad-materials/save-generated`，Then 素材库新增一条 status=draft、compliance_status=pending 的素材，标签自动填充为 suggested_tags。
- **异常场景**：Given AI 中台服务宕机，When 用户提交生成请求，Then 系统返回 503 并提示「AI 中台暂不可用」，素材库无新增数据。

---

#### 1.6 营销内容合规预审

**1. 功能描述**

所有对外发布的营销内容前置合规审核，自动识别夸大宣传、包胜诉承诺、绝对化用语、违规收费承诺等违规点，拦截违规内容绑定投放与私域发布。

**2. 用户故事**

- 作为合规风控人员，我希望系统能自动识别营销内容中的违规点并标注位置与修改建议，以便投放岗及时修正。
- 作为律所管理者，我希望审核不通过的素材无法绑定投放计划、无法发布至私域，以便规避监管风险。

**3. 业务规则**

1. 合规状态 `compliance_status` 包括 `pending`（待审）、`passed`（通过）、`need_modification`（需修改）、`forbidden`（禁止发布）四类，新素材默认 `pending`。
2. 触发审核：调用 `POST /api/marketing/materials/:id/compliance` 对指定素材执行合规检查，结果写入 `compliance_status`、`compliance_detail`、`compliance_checked_at`。
3. `compliance_detail` 为 JSON 字符串，包含 `violations` 数组（每项含 `type` 违规类型、`position` 位置、`suggestion` 修改建议）。
4. 拦截规则：`compliance_status` 非 `passed` 的素材禁止调用 `PUT /api/ad-materials/:id/bind-plan` 绑定投放计划；私域发布前同样需校验。
5. 自动识别违规类型：`exaggeration`（夸大宣传）、`guarantee_win`（包胜诉承诺）、`absolute_terms`（绝对化用语）、`fee_promise`（违规收费承诺）。
6. 合规检查支持重复触发，每次检查更新 compliance_checked_at 与 compliance_detail。

**4. 输入规范**

合规检查（POST /api/marketing/materials/:id/compliance）输入：路径参数 `id`（素材ID），无请求体。

输出结果：返回更新后的素材合规信息，含 `compliance_status`、`compliance_detail`、`compliance_checked_at`。

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| id | string | 是 | 路径参数，须为有效素材ID |

**5. 数据模型**

合规字段存储于 `AdMaterial` 实体（详见 1.4 数据模型），核心合规字段：

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| compliance_status | varchar(30) | DEFAULT 'pending' | 合规状态 |
| compliance_detail | text | NULL | 违规详情 JSON |
| compliance_checked_at | datetime | NULL | 合规审核时间 |

`compliance_detail` JSON 结构示例：

```json
{
  "violations": [
    { "type": "guarantee_win", "position": "第3段第2句", "snippet": "保证胜诉", "suggestion": "改为「提升胜诉可能性」" },
    { "type": "absolute_terms", "position": "标题", "snippet": "最专业", "suggestion": "删除「最」字或改为「专业」" }
  ]
}
```

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/marketing/materials/:id/compliance | 触发素材合规预审 | JWT |
| GET | /api/ad-materials | 查询素材（支持 compliance_status 筛选） | JWT |
| PUT | /api/ad-materials/:id/bind-plan | 绑定计划（前置校验合规） | JWT |
| POST | /api/ad-materials/save-generated | AI 内容入库（默认 compliance_status=pending） | JWT |

请求示例（触发合规检查）：

```http
POST /api/marketing/materials/m-001/compliance
Authorization: Bearer <jwt-token>
```

成功响应（200，需修改）：

```json
{
  "id": "m-001",
  "compliance_status": "need_modification",
  "compliance_detail": "{\"violations\":[{\"type\":\"guarantee_win\",\"position\":\"第3段第2句\",\"snippet\":\"保证胜诉\",\"suggestion\":\"改为「提升胜诉可能性」\"}]}",
  "compliance_checked_at": "2026-07-25T13:00:00.000Z"
}
```

失败响应（404，素材不存在）：

```json
{
  "statusCode": 404,
  "message": "素材不存在",
  "error": "Not Found"
}
```

**7. 交互流程**

1. 用户在「素材库」选中素材 m-001，点击「合规预审」→ 前端调用 `POST /api/marketing/materials/m-001/compliance`。
2. 后端 `MarketingController.checkMaterialCompliance` → `MarketingService.checkMaterialCompliance(id)` 加载素材 `content_text` / `file_path`。
3. Service 层调用合规风控引擎（识别四类违规点），生成 violations 数组。
4. 根据违规严重程度判定 `compliance_status`：无违规→passed、有可修改违规→need_modification、严重违规→forbidden；写入 compliance_detail 与 compliance_checked_at。
5. 前端展示违规点列表（位置、原文、修改建议），用户修改后再次触发检查。
6. 用户尝试绑定投放计划 → 后端校验 compliance_status=passed 放行，否则抛 Conflict。

**8. 异常场景**

1. **素材不存在**：传入的 id 无效 → 后端返回 404，前端提示「素材不存在」。
2. **合规引擎不可用**：合规风控模块异常 → 后端返回 503，前端提示「合规引擎暂不可用，请稍后重试」，compliance_status 保持 pending。
3. **素材内容为空**：content_text 与 file_path 均为空 → 后端返回 400，提示「素材内容为空，无法执行合规检查」。
4. **forbidden 素材重复提交**：compliance_status=forbidden 的素材再次提交检查 → 系统允许重新检查，但若仍命中严重违规则维持 forbidden。

**9. 验收标准**

- **正常场景**：Given 素材 m-001 内容包含「保证胜诉」，When 用户调用合规检查接口，Then 系统返回 compliance_status=need_modification，compliance_detail 中包含 type=guarantee_win 的违规点与修改建议。
- **边界场景**：Given 素材 m-002 内容无违规点，When 调用合规检查，Then 系统返回 compliance_status=passed，用户可成功调用 bind-plan 绑定投放计划。
- **异常场景**：Given 素材 m-003 的 compliance_status=forbidden，When 用户尝试调用 `PUT /api/ad-materials/m-003/bind-plan`，Then 系统返回 409 并提示「素材合规状态为 forbidden，禁止绑定投放计划」。

---

#### 1.7 公域账号矩阵管理

**1. 功能描述**

统一管理律所在抖音、快手、视频号、公众号等公域平台的账号矩阵，支持内容排期、定时发布、多账号同步发布与发布数据统计。

**2. 用户故事**

- 作为投放岗运营人员，我希望绑定并分组管理多个公域账号，以便统一调度内容发布。
- 作为律所管理者，我希望查看各账号粉丝、点赞、咨询数据与内容发布趋势，以便评估账号矩阵运营效果。

**3. 业务规则**

1. 公域平台 `platform` 取值：`douyin`（抖音）、`kuaishou`（快手）、`wechat_video`（视频号）、`wechat_official`（公众号）。
2. 授权状态 `auth_status` 包括 `authorized`（已授权）、`unauthorized`（未授权）、`expired`（授权过期），新账号默认 unauthorized。
3. 授权流程：调用 `PUT /api/social-accounts/:id/authorize` 传入 auth_token 完成授权，授权状态置为 authorized 并记录 authorized_at；调用 `PUT /api/social-accounts/:id/revoke` 撤销授权，状态置为 unauthorized。
4. 内容排期：通过 `POST /api/social-posts` 创建单账号发布任务，通过 `POST /api/social-posts/multi-account` 创建多账号同步发布任务（同一 `sync_batch_id`）；scheduled_time 不为空时状态为 scheduled。
5. 发布状态 `status` 包括 `draft`（草稿）、`scheduled`（已排期）、`published`（已发布）、`failed`（失败）；调用 `PUT /api/social-posts/:id/publish` 执行发布，调用 `PUT /api/social-posts/:id/cancel-schedule` 取消排期。
6. 发布失败须填写 `fail_reason`，调用 `PUT /api/social-posts/:id/failed` 标记。
7. 互动数据（likes/comments/shares）通过 `PUT /api/social-posts/:id/interactions` 更新；账号统计数据（followers/likes/consultations）通过 `PUT /api/social-accounts/:id/stats` 更新。
8. 权限：仅 super_admin/org_admin/marketing 可操作账号与发布任务。

**4. 输入/输出规范**

创建账号（POST /api/social-accounts）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| platform | varchar | 是 | 枚举：douyin/kuaishou/wechat_video/wechat_official |
| account_name | string | 是 | 长度 1-64 |
| account_id | string | 是 | 平台账号唯一标识 |
| group_name | string | 否 | 分组名 |
| followers | integer | 否 | ≥ 0，默认 0 |
| likes | integer | 否 | ≥ 0，默认 0 |
| consultations | integer | 否 | ≥ 0，默认 0 |
| auth_token | text | 否 | 授权令牌 |
| avatar_url | string | 否 | 头像URL |
| bio | text | 否 | 简介 |

创建发布任务（POST /api/social-posts）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| account_id | string | 是 | 有效账号ID |
| title | string | 否 | 长度 ≤ 128 |
| content | text | 是 | 非空 |
| media_files | array | 否 | 媒体文件URL数组 |
| hashtags | string | 否 | 逗号分隔的话题标签 |
| scheduled_time | string | 否 | ISO 时间，须晚于当前时间 |

输出结果：账号/发布任务对象。统计接口返回按平台/分组/状态聚合的数据。

**5. 数据模型**

实体名1：`SocialAccount`，表名 `social_accounts`，与 `backend/src/marketing/social-account.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| platform | varchar(20) | NOT NULL | 平台 |
| account_name | varchar(64) | NOT NULL | 账号名称 |
| account_id | varchar(128) | NOT NULL | 平台账号ID |
| group_name | varchar(32) | NULL | 分组名 |
| followers | integer | DEFAULT 0 | 粉丝数 |
| likes | integer | DEFAULT 0 | 点赞数 |
| consultations | integer | DEFAULT 0 | 咨询数 |
| auth_status | varchar(20) | DEFAULT 'unauthorized' | 授权状态 |
| authorized_at | datetime | NULL | 授权时间 |
| auth_token | text | NULL | 授权令牌 JSON |
| avatar_url | varchar(255) | NULL | 头像URL |
| bio | text | NULL | 简介 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| creator_id | varchar(36) | NULL | 创建人ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

实体名2：`SocialPost`，表名 `social_posts`，与 `backend/src/marketing/social-post.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| account_id | varchar(36) | NOT NULL | 关联账号ID |
| title | varchar(128) | NULL | 标题 |
| content | text | NOT NULL | 文案内容 |
| media_files | text | NULL | 媒体文件 JSON 数组 |
| hashtags | varchar(255) | NULL | 话题标签 |
| scheduled_time | datetime | NULL | 排期时间 |
| published_at | datetime | NULL | 实际发布时间 |
| status | varchar(20) | DEFAULT 'draft' | 发布状态 |
| fail_reason | text | NULL | 失败原因 |
| likes | integer | DEFAULT 0 | 点赞数 |
| comments | integer | DEFAULT 0 | 评论数 |
| shares | integer | DEFAULT 0 | 分享数 |
| sync_batch_id | varchar(36) | NULL | 同步发布批次号 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| creator_id | varchar(36) | NULL | 创建人ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

联合索引：SocialAccount `(organization_id, platform)`、`(organization_id, group_name)`、`(organization_id, auth_status)`；SocialPost `(organization_id, status)`、`(organization_id, scheduled_time)`、`(account_id, status)`。

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/social-accounts | 创建公域账号 | JWT + 投放岗/管理员 |
| GET | /api/social-accounts | 查询账号列表 | JWT |
| GET | /api/social-accounts/groups | 查询分组 | JWT |
| GET | /api/social-accounts/stats/overview | 账号总览统计 | JWT |
| GET | /api/social-accounts/stats/by-platform | 按平台统计 | JWT |
| GET | /api/social-accounts/stats/by-group | 按分组统计 | JWT |
| GET | /api/social-accounts/:id | 账号详情 | JWT |
| PUT | /api/social-accounts/:id | 更新账号 | JWT + 投放岗/管理员 |
| PUT | /api/social-accounts/:id/stats | 更新账号统计数据 | JWT + 投放岗/管理员 |
| PUT | /api/social-accounts/:id/auth-status | 更新授权状态 | JWT + 投放岗/管理员 |
| PUT | /api/social-accounts/:id/authorize | 授权账号 | JWT + 投放岗/管理员 |
| PUT | /api/social-accounts/:id/revoke | 撤销授权 | JWT + 投放岗/管理员 |
| DELETE | /api/social-accounts/:id | 删除账号 | JWT + 投放岗/管理员 |
| POST | /api/social-accounts/groups | 创建分组 | JWT + 投放岗/管理员 |
| PUT | /api/social-accounts/groups/change | 修改分组 | JWT + 投放岗/管理员 |
| POST | /api/social-posts | 创建单账号发布任务 | JWT + 投放岗/管理员 |
| POST | /api/social-posts/multi-account | 多账号同步发布 | JWT + 投放岗/管理员 |
| GET | /api/social-posts | 查询发布任务列表 | JWT |
| GET | /api/social-posts/stats/by-status | 按状态统计 | JWT |
| GET | /api/social-posts/stats/by-platform | 按平台统计 | JWT |
| GET | /api/social-posts/stats/daily-trend | 每日发布趋势 | JWT |
| GET | /api/social-posts/:id | 发布任务详情 | JWT |
| PUT | /api/social-posts/:id | 更新发布任务 | JWT + 投放岗/管理员 |
| PUT | /api/social-posts/:id/publish | 执行发布 | JWT + 投放岗/管理员 |
| PUT | /api/social-posts/:id/failed | 标记失败 | JWT + 投放岗/管理员 |
| PUT | /api/social-posts/:id/cancel-schedule | 取消排期 | JWT + 投放岗/管理员 |
| PUT | /api/social-posts/:id/interactions | 更新互动数据 | JWT + 投放岗/管理员 |
| DELETE | /api/social-posts/:id | 删除发布任务 | JWT + 投放岗/管理员 |

请求示例（多账号同步发布）：

```http
POST /api/social-posts/multi-account
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "account_ids": ["sa-001", "sa-002"],
  "title": "婚姻法科普-第1期",
  "content": "今天为大家解读离婚抚养权问题...",
  "media_files": ["https://cdn.example.com/v1.mp4"],
  "hashtags": "婚姻法,抚养权,律师科普",
  "scheduled_time": "2026-07-26T10:00:00.000Z"
}
```

成功响应（200）：

```json
{
  "sync_batch_id": "batch-2026-07-25-001",
  "created": [
    { "id": "sp-001", "account_id": "sa-001", "status": "scheduled" },
    { "id": "sp-002", "account_id": "sa-002", "status": "scheduled" }
  ]
}
```

失败响应（400，账号未授权）：

```json
{
  "statusCode": 400,
  "message": "账号 sa-002 未授权，无法创建发布任务",
  "error": "Bad Request"
}
```

**7. 交互流程**

1. 用户在「公域账号」页点击「绑定账号」→ 填写 platform、account_name、account_id → 前端调用 `POST /api/social-accounts` 创建账号。
2. 用户点击「授权」→ 在弹窗中粘贴 auth_token → 前端调用 `PUT /api/social-accounts/:id/authorize` → 后端更新 auth_status=authorized、authorized_at=now。
3. 用户在「内容排期」页选择多个账号、填写 content/media_files/scheduled_time → 前端调用 `POST /api/social-posts/multi-account`。
4. 后端 `SocialPostController.createMultiAccount` 校验账号授权状态 → 为每个账号创建一条 social_posts 记录，共享 sync_batch_id，状态为 scheduled。
5. 到达 scheduled_time 时，定时任务调用 `PUT /api/social-posts/:id/publish` 执行发布 → 成功置 published 并记录 published_at，失败调用 `PUT /api/social-posts/:id/failed` 记录 fail_reason。
6. 用户在「数据统计」页查看 `GET /api/social-accounts/stats/by-platform` 与 `GET /api/social-posts/stats/daily-trend`。

**8. 异常场景**

1. **账号未授权**：创建发布任务时 account_id 对应账号 auth_status != authorized → 后端返回 400，前端提示「账号 X 未授权，请先完成授权」。
2. **排期时间已过**：scheduled_time 早于当前时间 → 后端返回 400，提示「排期时间不能早于当前时间」。
3. **发布失败**：平台 API 返回错误 → 后端调用 markFailed 记录 fail_reason，状态置 failed，前端提示「发布失败：{fail_reason}」。
4. **取消已发布任务**：状态为 published 的任务调用 cancel-schedule → 后端返回 409，提示「已发布的任务无法取消排期」。
5. **重复绑定账号**：同组织同平台 account_id 已存在 → 后端返回 409，提示「该平台账号已绑定」。

**9. 验收标准**

- **正常场景**：Given 用户已绑定并授权 sa-001、sa-002 两个账号，When 用户调用 multi-account 接口创建同步发布任务并设置 scheduled_time，Then 系统创建 2 条 scheduled 状态的 social_posts 记录，共享同一 sync_batch_id。
- **边界场景**：Given 一条已发布（published）的发布任务，When 用户尝试调用 cancel-schedule 取消排期，Then 系统返回 409 并提示「已发布的任务无法取消排期」，状态保持 published。
- **异常场景**：Given sa-002 的 auth_status 为 unauthorized，When 用户将其加入 multi-account 发布，Then 系统返回 400 并提示「账号 sa-002 未授权」，无任何 social_posts 记录被创建。

---

### 模块2：公私域连接器与SCRM私域运营系统

#### 2.1 多场景活码管理

**1. 功能描述**

生成企微活码、个微活码、群活码三类引流活码，支持轮询、负载、地域、案由四种分流规则，每个活码绑定唯一渠道标识以便追溯来源。

**2. 用户故事**

- 作为私域运营人员，我希望为不同投放渠道创建对应活码并配置分流规则，以便将公域线索精准分配至对应销售或邀约账号。
- 作为律所管理者，我希望每个活码绑定唯一渠道ID，以便后续统计该渠道的扫码量与加微量。

**3. 业务规则**

1. 活码类型 `code_type` 限定为 `wework`（企微）、`personal`（个微）、`group`（群活码）三类。
2. 分流规则 `dispatch_rule` 包括 `poll`（轮询）、`load`（负载）、`region`（地域）、`case_type`（案由），默认 `poll`。
3. `dispatch_config` 为 JSON 字符串，按规则承载不同配置：poll/load 模式存 `{weights: {user_id: weight}}`；region 模式存 `{regions: [{region, user_id}]}`；case_type 模式存 `{case_types: [{case_type, user_id}]}`。
4. 每个活码可绑定一个 `channel_id`（关联 channel_trackings 表），用于全链路追踪；二维码图片路径存于 `qr_code_path`。
5. 活码状态 `status` 包括 `active`（启用）、`inactive`（停用），停用后扫码跳转至失效提示页。
6. 分流接口 `POST /api/scrm/live-codes/:id/dispatch` 根据 dispatch_rule 与请求参数（region/case_type）返回分配的员工ID；分配记录写入日志便于排查。

**4. 输入/输出规范**

创建活码（POST /api/scrm/live-codes）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| code_type | varchar | 是 | 枚举：wework/personal/group |
| name | string | 是 | 长度 1-64 |
| dispatch_rule | varchar | 否 | 枚举：poll/load/region/case_type，默认 poll |
| dispatch_config | object | 否 | 分流配置（JSON） |
| channel_id | string | 否 | 关联渠道ID |
| bound_users | array | 否 | 绑定员工/群ID数组 |
| qr_code_path | string | 否 | 二维码图片路径 |
| status | varchar | 否 | active/inactive，默认 active |
| organization_id | string | 是 | 组织ID |

输出结果：返回活码对象。dispatch 接口返回分配的员工ID与对应二维码URL。

**5. 数据模型**

实体名：`LiveCode`，表名 `scrm_live_codes`，与 `backend/src/scrm/live-code.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| code_type | varchar(20) | NOT NULL | 活码类型 |
| name | varchar(64) | NOT NULL | 活码名称 |
| dispatch_rule | varchar(20) | DEFAULT 'poll' | 分流规则 |
| dispatch_config | text | NULL | 分流配置 JSON |
| channel_id | varchar(36) | NULL | 关联渠道ID |
| bound_users | text | NULL | 绑定员工/群ID JSON 数组 |
| qr_code_path | varchar(255) | NULL | 二维码图片路径 |
| status | varchar(20) | DEFAULT 'active' | 状态 |
| organization_id | varchar(36) | NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/scrm/live-codes | 创建活码 | JWT |
| GET | /api/scrm/live-codes | 查询活码列表（支持 code_type/status/channel_id 筛选） | JWT |
| GET | /api/scrm/live-codes/:id | 活码详情 | JWT |
| PUT | /api/scrm/live-codes/:id | 更新活码 | JWT |
| DELETE | /api/scrm/live-codes/:id | 删除活码 | JWT |
| PUT | /api/scrm/live-codes/:id/dispatch-rule | 更新分流规则与配置 | JWT |
| POST | /api/scrm/live-codes/:id/dispatch | 执行分流（返回分配员工） | JWT |

请求示例（执行分流）：

```http
POST /api/scrm/live-codes/lc-001/dispatch
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "region": "上海",
  "case_type": "marriage"
}
```

成功响应（200）：

```json
{
  "live_code_id": "lc-001",
  "assigned_user_id": "u-005",
  "qr_code_path": "https://cdn.example.com/qrcode/lc-001-u005.png",
  "dispatch_rule": "region"
}
```

失败响应（409，活码已停用）：

```json
{
  "statusCode": 409,
  "message": "活码已停用，无法执行分流",
  "error": "Conflict"
}
```

**7. 交互流程**

1. 用户在「活码管理」页点击「新建活码」→ 选择 code_type、填写 name、选择 dispatch_rule、配置 dispatch_config、绑定员工、关联 channel_id → 前端调用 `POST /api/scrm/live-codes`。
2. 后端 `LiveCodeController.create` → `LiveCodeService.create` 写入 scrm_live_codes，生成二维码并保存 qr_code_path。
3. 终端用户扫码 → 公域落地页调用 `POST /api/scrm/live-codes/:id/dispatch` 携带 region/case_type。
4. Service 层 `dispatch(id, {region, case_type})` 按 dispatch_rule 选员工，返回员工ID与对应二维码。
5. 前端展示对应员工二维码，终端用户长按加好友；同时 channel_trackings.scan_count +1。
6. 用户可在列表页编辑分流规则 `PUT /api/scrm/live-codes/:id/dispatch-rule` 或停用活码。

**8. 异常场景**

1. **活码停用**：status=inactive 时调用 dispatch → 后端返回 409，提示「活码已停用，无法执行分流」。
2. **无可用员工**：bound_users 为空或对应员工全部不在线 → 后端返回 503，提示「暂无可用员工，请稍后重试或联系管理员」。
3. **分流规则与参数不匹配**：dispatch_rule=region 但未传 region → 后端返回 400，提示「地域分流规则需提供 region 参数」。
4. **二维码生成失败**：创建活码时二维码服务异常 → 活码记录创建成功但 qr_code_path 为空，前端提示「活码已创建，二维码稍后可在详情页重新生成」。

**9. 验收标准**

- **正常场景**：Given 活码 lc-001 的 dispatch_rule=region、配置了上海→u-001、北京→u-002，When 终端用户扫码并传入 region=上海调用 dispatch，Then 系统返回 assigned_user_id=u-001 与对应二维码URL。
- **边界场景**：Given 活码 lc-002 的 dispatch_rule=poll 且 bound_users 含 3 个员工，When 连续调用 dispatch 3 次，Then 3 次返回的 assigned_user_id 按轮询顺序覆盖全部 3 个员工。
- **异常场景**：Given 活码 lc-003 已被设置为 inactive，When 调用 dispatch，Then 系统返回 409 并提示「活码已停用」，不分配员工。

---

#### 2.2 引流渠道全链路追踪

**1. 功能描述**

为每个活码/推广链接对应独立渠道，统计扫码量、加微量、邀约量、签约量，支持渠道分组对比，并自动关联对应广告计划。

**2. 用户故事**

- 作为私域运营人员，我希望按渠道分组对比扫码量、加微率、邀约率、签约率，以便识别高转化渠道与低效渠道。
- 作为律所管理者，我希望渠道数据与投放系统打通，自动关联对应广告计划，以便核算渠道 ROI。

**3. 业务规则**

1. 每个渠道记录通过 `ChannelTracking` 表维护，包含 `channel_name`、`live_code_id`（关联活码）、`channel_group`（分组）。
2. 全链路四级计数：`scan_count`（扫码量）、`add_count`（加微量）、`invite_count`（邀约量）、`sign_count`（签约量），各字段默认 0。
3. 计数接口：`POST /api/scrm/channels/:id/scan` 扫码 +1，`/add` 加微 +1，`/invite` 邀约 +1，`/sign` 签约 +1；计数操作幂等（同一 lead_id 24 小时内重复请求不重复计数，由调用方传 lead_id 控制）。
4. 统计接口：`GET /api/scrm/channels/statistics/list` 返回渠道明细含转化率（add_count/scan_count、invite_count/add_count、sign_count/invite_count）；`GET /api/scrm/channels/statistics/groups` 返回分组对比数据。
5. 渠道与广告计划关联：通过 `live_code_id → live_codes.channel_id` 链路，结合 conversion_events 表的 plan_id 实现 ROI 核算。
6. 自动标记：转化率超过组织平均 1.5 倍的渠道自动标记为「高转化渠道」，低于平均 0.5 倍的标记为「低效渠道」。

**4. 输入/输出规范**

创建渠道（POST /api/scrm/channels）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| channel_name | string | 是 | 长度 1-64 |
| live_code_id | string | 否 | 关联活码ID |
| channel_group | string | 否 | 分组名 |
| organization_id | string | 是 | 组织ID |

计数接口（POST /api/scrm/channels/:id/scan 等）输入：路径参数 id，可选请求体携带 lead_id 用于幂等。

输出结果：渠道对象含四级计数字段。统计接口返回渠道数组及转化率、高低效标记。

**5. 数据模型**

实体名：`ChannelTracking`，表名 `scrm_channel_trackings`，与 `backend/src/scrm/channel-tracking.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| channel_name | varchar(64) | NOT NULL | 渠道名称 |
| live_code_id | varchar(36) | NULL | 关联活码ID |
| channel_group | varchar(32) | NULL | 渠道分组 |
| scan_count | integer | DEFAULT 0 | 扫码量 |
| add_count | integer | DEFAULT 0 | 加微量 |
| invite_count | integer | DEFAULT 0 | 邀约量 |
| sign_count | integer | DEFAULT 0 | 签约量 |
| organization_id | varchar(36) | NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/scrm/channels | 创建渠道 | JWT |
| GET | /api/scrm/channels | 查询渠道列表（支持 channel_group/live_code_id 筛选） | JWT |
| GET | /api/scrm/channels/statistics/list | 渠道明细统计 | JWT |
| GET | /api/scrm/channels/statistics/groups | 渠道分组对比 | JWT |
| GET | /api/scrm/channels/:id | 渠道详情 | JWT |
| PUT | /api/scrm/channels/:id | 更新渠道 | JWT |
| DELETE | /api/scrm/channels/:id | 删除渠道 | JWT |
| POST | /api/scrm/channels/:id/scan | 扫码计数 +1 | JWT |
| POST | /api/scrm/channels/:id/add | 加微计数 +1 | JWT |
| POST | /api/scrm/channels/:id/invite | 邀约计数 +1 | JWT |
| POST | /api/scrm/channels/:id/sign | 签约计数 +1 | JWT |

请求示例（扫码计数）：

```http
POST /api/scrm/channels/ch-001/scan
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "lead_id": "lead-20260725-001"
}
```

成功响应（200）：

```json
{
  "id": "ch-001",
  "scan_count": 156,
  "add_count": 89,
  "invite_count": 34,
  "sign_count": 8,
  "updated_at": "2026-07-25T14:00:00.000Z"
}
```

失败响应（404，渠道不存在）：

```json
{
  "statusCode": 404,
  "message": "渠道不存在",
  "error": "Not Found"
}
```

**7. 交互流程**

1. 私域运营人员在「渠道管理」页点击「新建渠道」→ 填写 channel_name、关联 live_code_id、设置 channel_group → 前端调用 `POST /api/scrm/channels`。
2. 终端用户扫码并加微后，企微回调或前端 SDK 上报调用 `POST /api/scrm/channels/ch-001/scan` 与 `/add`。
3. 后端 `ChannelTrackingController.recordScan` → `ChannelTrackingService.recordScan(id)` 校验渠道存在性 → scan_count +1 写入。
4. 后续邀约到所、签约回款时 CRM 调用 `/invite`、`/sign` 接口累加计数。
5. 用户在「渠道分析」页调用 `GET /api/scrm/channels/statistics/list` 查看明细，调用 `/statistics/groups` 查看分组对比。
6. 前端根据转化率自动高亮高低效渠道。

**8. 异常场景**

1. **渠道不存在**：计数接口传入的 id 无效 → 后端返回 404，提示「渠道不存在」。
2. **重复计数**：同一 lead_id 24 小时内重复调用 scan → 后端识别幂等键命中，scan_count 不增加，返回当前计数值，前端无错误提示。
3. **关联活码已删除**：渠道关联的 live_code_id 已被删除 → 统计接口仍可返回渠道数据，但 live_code 关联字段标记为「活码已删除」。
4. **统计无数据**：组织下无渠道 → 统计接口返回空数组，前端展示「暂无渠道数据，请先创建渠道」。

**9. 验收标准**

- **正常场景**：Given 渠道 ch-001 当前 scan_count=155、add_count=89，When 调用 `POST /api/scrm/channels/ch-001/scan` 携带新 lead_id，Then 返回 scan_count=156，数据库对应记录更新。
- **边界场景**：Given 同一 lead_id 在 24 小时内已调用过 scan，When 再次调用 scan 接口，Then 系统返回当前 scan_count 但不增加，体现幂等性。
- **异常场景**：Given 调用 `POST /api/scrm/channels/ch-999/scan` 但 ch-999 不存在，Then 系统返回 404 并提示「渠道不存在」，计数无变化。

---

#### 2.3 客户标签体系管理

**1. 功能描述**

建立自动标签与手动标签两类标签体系，按来源渠道、案由、意向等级、跟进阶段等维度自动打标，并支持手动添加客户特征标签，全系统共享标签数据。

**2. 用户故事**

- 作为私域运营人员，我希望配置自动打标规则（如来源渠道=抖音自动打「抖音来源」标签），以便减少人工打标工作量。
- 作为销售/律师，我希望查看客户的全量标签画像，以便快速了解客户特征与意向等级。

**3. 业务规则**

1. 标签类型 `tag_type` 包括 `auto`（自动）、`manual`（手动），默认 manual。
2. 标签分类 `category` 包括 `source`（来源）、`case_type`（案由）、`intention`（意向等级）、`stage`（跟进阶段）、`custom`（自定义），默认 custom。
3. 自动标签的 `rule_config` 为 JSON 字符串，格式如 `{trigger: 'source_channel', value: 'douyin'}` 或 `{trigger: 'case_type', value: 'marriage'}`，由 `POST /api/scrm/client-tags/auto-tag/:clientId` 触发执行。
4. 客户-标签关系通过 `POST /api/scrm/client-tags/relations`（单条）与 `POST /api/scrm/client-tags/relations/batch`（批量）建立；通过 `DELETE /api/scrm/client-tags/relations/:clientId/:tagId` 解除。
5. 查询：`GET /api/scrm/client-tags/relations/client/:clientId` 返回客户的所有标签；`GET /api/scrm/client-tags/relations/tag/:tagId` 返回某标签下的所有客户。
6. 标签全系统同步：CRM、SCRM、办案系统共享 scrm_client_tags 与关系表数据。
7. 删除标签时同步解除所有客户-标签关系。

**4. 输入/输出规范**

创建标签（POST /api/scrm/client-tags）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| tag_name | string | 是 | 长度 1-32，组织内唯一 |
| tag_type | varchar | 否 | auto/manual，默认 manual |
| category | varchar | 否 | source/case_type/intention/stage/custom，默认 custom |
| rule_config | object | 否 | tag_type=auto 时必填 |
| organization_id | string | 是 | 组织ID |

打标（POST /api/scrm/client-tags/relations）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| client_id | string | 是 | 有效客户ID |
| tag_id | string | 是 | 有效标签ID |

输出结果：标签对象；关系接口返回建立关系的记录。批量打标返回 `{success: true, affected: number}`。

**5. 数据模型**

实体名：`ClientTag`，表名 `scrm_client_tags`，与 `backend/src/scrm/client-tag.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| tag_name | varchar(32) | NOT NULL | 标签名称 |
| tag_type | varchar(10) | DEFAULT 'manual' | 标签类型 |
| category | varchar(20) | DEFAULT 'custom' | 标签分类 |
| rule_config | text | NULL | 自动打标规则 JSON |
| organization_id | varchar(36) | NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

客户-标签关系存储于关联表（如 `scrm_client_tag_relations`），含 client_id、tag_id、organization_id、created_at 字段。

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/scrm/client-tags | 创建标签 | JWT |
| GET | /api/scrm/client-tags | 查询标签列表（支持 tag_type/category 筛选） | JWT |
| GET | /api/scrm/client-tags/:id | 标签详情 | JWT |
| PUT | /api/scrm/client-tags/:id | 更新标签 | JWT |
| DELETE | /api/scrm/client-tags/:id | 删除标签（同步解除关系） | JWT |
| POST | /api/scrm/client-tags/relations | 为客户打标 | JWT |
| POST | /api/scrm/client-tags/relations/batch | 批量打标 | JWT |
| DELETE | /api/scrm/client-tags/relations/:clientId/:tagId | 解除打标 | JWT |
| GET | /api/scrm/client-tags/relations/client/:clientId | 查询客户标签 | JWT |
| GET | /api/scrm/client-tags/relations/tag/:tagId | 查询标签下客户 | JWT |
| POST | /api/scrm/client-tags/auto-tag/:clientId | 触发自动打标 | JWT |

请求示例（批量打标）：

```http
POST /api/scrm/client-tags/relations/batch
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "client_ids": ["c-001", "c-002", "c-003"],
  "tag_id": "t-010"
}
```

成功响应（200）：

```json
{
  "success": true,
  "affected": 3
}
```

失败响应（404，标签不存在）：

```json
{
  "statusCode": 404,
  "message": "标签不存在",
  "error": "Not Found"
}
```

**7. 交互流程**

1. 管理员在「标签管理」页点击「新建标签」→ 填写 tag_name、选择 tag_type 与 category、配置 rule_config（auto 类型）→ 前端调用 `POST /api/scrm/client-tags`。
2. 客户入库或行为触发时，后端调用 `POST /api/scrm/client-tags/auto-tag/:clientId` 携带客户上下文（source_channel、case_type 等）。
3. `ClientTagService.autoTagClient` 加载所有 tag_type=auto 的标签，逐条匹配 rule_config，命中即建立客户-标签关系。
4. 销售在客户详情页手动勾选标签 → 前端调用 `POST /api/scrm/client-tags/relations`。
5. 用户在「客户分群」页选择标签 → 前端调用 `GET /api/scrm/client-tags/relations/tag/:tagId` 查询客户列表。
6. 删除标签时后端级联删除关系表记录。

**8. 异常场景**

1. **标签名重复**：组织内 tag_name 已存在 → 后端返回 409，提示「标签名已存在，请更换名称」。
2. **auto 标签缺 rule_config**：tag_type=auto 但未提供 rule_config → 后端返回 400，提示「自动标签必须配置 rule_config」。
3. **打标关系已存在**：同一 client_id + tag_id 重复打标 → 后端去重处理，返回成功但 affected=0，前端提示「该客户已存在此标签」。
4. **删除被引用标签**：标签下仍有客户 → 后端级联解除关系后删除标签，前端提示「标签已删除，已解除 N 条客户关系」。

**9. 验收标准**

- **正常场景**：Given 存在自动标签 t-001（rule_config={trigger:'source_channel', value:'douyin'}），When 客户 c-001 来源渠道为 douyin 且触发 auto-tag，Then 系统为 c-001 自动建立与 t-001 的关系，`GET /api/scrm/client-tags/relations/client/c-001` 返回结果包含 t-001。
- **边界场景**：Given 批量打标请求包含 3 个客户ID，其中 1 个已存在该标签，When 调用 `POST /api/scrm/client-tags/relations/batch`，Then 系统返回 affected=2（去重），3 个客户最终均拥有该标签。
- **异常场景**：Given 调用 `DELETE /api/scrm/client-tags/t-999` 但 t-999 不存在，Then 系统返回 404 并提示「标签不存在」，无关系记录被删除。

---

#### 2.4 企微侧边运营助手

**1. 功能描述**

在企微聊天侧边栏展示客户全景档案、历史跟进记录、标签信息与来源渠道，内置合规话术库与素材库支持一键发送，并可创建跟进任务同步至 CRM。

**2. 用户故事**

- 作为销售/邀约人员，我希望在企微聊天侧边栏直接看到客户的全景档案与历史跟进记录，以便在沟通前快速了解客户背景。
- 作为合规风控人员，我希望侧边栏内置标准化合规话术库，销售一键发送的话术均经过合规审核，以便规避沟通违规风险。

**3. 业务规则**

1. 侧边栏概览 `GET /api/scrm/sidebar` 返回当前组织的话术分类、素材分类、待办跟进任务数等聚合信息。
2. 客户全景档案 `GET /api/scrm/sidebar/clients/:clientId/profile` 聚合客户基本信息、标签、来源渠道、历史跟进记录、聊天记录摘要，支持通过 phone 备选查询。
3. 话术库 `ScriptLibrary` 按 `category` 分类：`greeting`（开场白）、`case_consult`（案由咨询）、`objection`（异议处理）、`closing`（促单成交）、`follow_up`（跟进）、`other`，默认 other。
4. 发送话术 `POST /api/scrm/scripts/:id/send` 携带 client_id 与 employee_id，记录发送日志并触发聊天存档入库。
5. 创建跟进任务 `POST /api/scrm/sidebar/follow-up-tasks` 同步至 CRM 任务系统，包含任务内容、计划时间、负责人。
6. 话术内容 `content` 必填，关联素材 material_ids 为 JSON 数组字符串。
7. 话术发送受合规校验：发送前自动检查话术合规状态（默认所有入库话术为已审核）。

**4. 输入/输出规范**

创建话术（POST /api/scrm/scripts）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| category | varchar | 否 | greeting/case_consult/objection/closing/follow_up/other，默认 other |
| title | string | 是 | 长度 1-128 |
| content | text | 是 | 非空 |
| material_ids | array | 否 | 关联素材ID数组 |
| organization_id | string | 是 | 组织ID |
| created_by | string | 是 | 创建人ID |

发送话术（POST /api/scrm/scripts/:id/send）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| client_id | string | 是 | 有效客户ID |
| employee_id | string | 是 | 有效员工ID |

创建跟进任务（POST /api/scrm/sidebar/follow-up-tasks）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| client_id | string | 是 | 客户ID |
| employee_id | string | 是 | 负责人ID |
| content | text | 是 | 任务内容 |
| plan_time | datetime | 是 | 计划跟进时间，须晚于当前时间 |

输出结果：话术对象、发送结果（含 chat_archive_id）、跟进任务对象。

**5. 数据模型**

实体名：`ScriptLibrary`，表名 `scrm_script_libraries`，与 `backend/src/scrm/script-library.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| category | varchar(20) | DEFAULT 'other' | 话术分类 |
| title | varchar(128) | NOT NULL | 标题 |
| content | text | NOT NULL | 话术内容 |
| material_ids | text | NULL | 关联素材ID JSON 数组 |
| organization_id | varchar(36) | NULL | 组织ID |
| created_by | varchar(36) | NULL | 创建人ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

侧边栏依赖的客户端数据通过 `SidebarService` 聚合客户表、标签关系表、跟进记录表、聊天存档表（不单独建实体）。

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| GET | /api/scrm/sidebar | 侧边栏概览 | JWT |
| GET | /api/scrm/sidebar/clients/:clientId/profile | 客户全景档案 | JWT |
| POST | /api/scrm/sidebar/follow-up-tasks | 创建跟进任务 | JWT |
| POST | /api/scrm/scripts | 创建话术 | JWT |
| GET | /api/scrm/scripts | 查询话术列表（支持 category 筛选） | JWT |
| GET | /api/scrm/scripts/:id | 话术详情 | JWT |
| PUT | /api/scrm/scripts/:id | 更新话术 | JWT |
| DELETE | /api/scrm/scripts/:id | 删除话术 | JWT |
| POST | /api/scrm/scripts/:id/send | 发送话术至客户 | JWT |

请求示例（发送话术）：

```http
POST /api/scrm/scripts/s-001/send
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "client_id": "c-001",
  "employee_id": "u-005"
}
```

成功响应（200）：

```json
{
  "success": true,
  "script_id": "s-001",
  "client_id": "c-001",
  "employee_id": "u-005",
  "chat_archive_id": "ca-20260725-001",
  "sent_at": "2026-07-25T15:00:00.000Z"
}
```

失败响应（404，话术不存在）：

```json
{
  "statusCode": 404,
  "message": "话术不存在",
  "error": "Not Found"
}
```

**7. 交互流程**

1. 销售在企微打开客户聊天 → 侧边栏前端调用 `GET /api/scrm/sidebar/clients/:clientId/profile`。
2. 后端 `SidebarController.getClientProfile` → `SidebarService.getClientProfile` 聚合客户基础信息、标签（调用 client-tags relations）、来源渠道、最近 10 条跟进记录、最近聊天摘要。
3. 前端在侧边栏渲染客户档案卡片、标签云、跟进时间轴。
4. 销售点击「话术库」选择分类 → 前端调用 `GET /api/scrm/scripts?category=greeting` 加载开场白话术。
5. 销售点击某条话术的「发送」按钮 → 前端调用 `POST /api/scrm/scripts/:id/send` 携带 client_id、employee_id。
6. 后端 `ScriptLibraryController.sendScript` → `ScriptLibraryService.sendScript` 调用企微 API 发送话术内容，同时写入 chat_archives 表（message_type=text）。
7. 销售在侧边栏点击「创建跟进任务」→ 填写内容与计划时间 → 前端调用 `POST /api/scrm/sidebar/follow-up-tasks` → 后端同步至 CRM 任务系统。

**8. 异常场景**

1. **客户不存在**：getClientProfile 传入的 clientId 无效 → 后端返回 404，侧边栏展示「客户信息加载失败」。
2. **话术发送失败**：企微 API 返回错误（如客户未加好友）→ 后端返回 502，前端提示「话术发送失败：客户未添加企微好友」。
3. **跟进任务时间非法**：plan_time 早于当前时间 → 后端返回 400，提示「计划跟进时间不能早于当前时间」。
4. **话术内容为空**：创建话术时 content 为空 → 后端返回 400，提示「话术内容不能为空」。

**9. 验收标准**

- **正常场景**：Given 客户 c-001 已有标签与 5 条跟进记录，When 销售在企微打开 c-001 聊天并触发侧边栏加载，Then 侧边栏展示客户档案、标签云与最近 5 条跟进记录。
- **边界场景**：Given 销售选择话术 s-001 并点击发送，When 调用 `POST /api/scrm/scripts/s-001/send`，Then 系统调用企微 API 发送成功，chat_archives 表新增一条 message_type=text 的记录，返回 chat_archive_id。
- **异常场景**：Given 客户 c-999 不存在，When 调用 `GET /api/scrm/sidebar/clients/c-999/profile`，Then 系统返回 404，侧边栏展示「客户信息加载失败」。

---

#### 2.5 私域触达工具集

**1. 功能描述**

提供 1V1 定时群发、朋友圈统一发布、社群 SOP 运营三类触达工具，支持按标签筛选目标客户，发送记录全留存并统计触达数据。

**2. 用户故事**

- 作为私域运营人员，我希望按标签筛选目标客户并创建 1V1 定时群发任务，以便在合适时间精准触达潜在客户。
- 作为律所管理者，我希望朋友圈支持多账号同步排期发布并统计互动数据，以便统一管理律所私域内容输出。

**3. 业务规则**

1. 任务类型 `task_type` 限定为 `1v1`（1V1私聊）、`moments`（朋友圈）、`group_sop`（社群SOP）三类。
2. 目标筛选：`target_tags` 为标签ID的 JSON 数组，通过 `POST /api/scrm/reach-tasks/target-count` 预估目标客户数；`target_count` 字段记录最终目标数。
3. 内容字段：`content`（必填，文本内容）、`media_paths`（朋友圈/社群配图 JSON 数组）、`publish_accounts`（多账号同步发布的账号ID JSON 数组）。
4. 排期：`schedule_time` 不为空时任务状态为 pending，到达时间后由定时任务调用 `POST /api/scrm/reach-tasks/:id/send` 执行发送。
5. 状态机：`draft`（草稿）→ `pending`（待发送）→ `sending`（发送中）→ `sent`（已发送）/`failed`（失败）；状态不可逆（sent 不能回到 draft）。
6. 发送计数：`sent_count` 实时累加，发送完成后 `sent_count <= target_count`。
7. 朋友圈排期查询：`GET /api/scrm/reach-tasks/moments-schedule` 按日期范围返回排期日历数据。
8. 触达记录全留存：每次发送写入发送日志表（含客户ID、账号ID、发送时间、状态）。

**4. 输入/输出规范**

创建触达任务（POST /api/scrm/reach-tasks）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| task_type | varchar | 是 | 枚举：1v1/moments/group_sop |
| target_tags | array | 否 | 标签ID数组 |
| content | text | 是 | 非空 |
| media_paths | array | 否 | 媒体文件路径数组 |
| publish_accounts | array | 否 | 多账号同步发布的账号ID数组 |
| schedule_time | datetime | 否 | 排期时间，须晚于当前时间 |
| organization_id | string | 是 | 组织ID |
| created_by | string | 是 | 创建人ID |

输出结果：任务对象含 `id`、`status`、`target_count`、`sent_count`。`GET /api/scrm/reach-tasks/moments-schedule` 返回排期数组。

**5. 数据模型**

实体名：`ReachTask`，表名 `scrm_reach_tasks`，与 `backend/src/scrm/reach-task.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| task_type | varchar(20) | NOT NULL | 任务类型 |
| target_tags | text | NULL | 目标标签 JSON 数组 |
| content | text | NOT NULL | 内容 |
| media_paths | text | NULL | 媒体路径 JSON 数组 |
| publish_accounts | text | NULL | 发布账号 JSON 数组 |
| schedule_time | datetime | NULL | 排期时间 |
| status | varchar(20) | DEFAULT 'draft' | 状态 |
| sent_count | integer | DEFAULT 0 | 已发送数 |
| target_count | integer | DEFAULT 0 | 目标数 |
| organization_id | varchar(36) | NULL | 组织ID |
| created_by | varchar(36) | NULL | 创建人ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/scrm/reach-tasks | 创建触达任务 | JWT |
| GET | /api/scrm/reach-tasks | 查询任务列表（支持 task_type/status 筛选） | JWT |
| GET | /api/scrm/reach-tasks/moments-schedule | 朋友圈排期日历 | JWT |
| GET | /api/scrm/reach-tasks/:id | 任务详情 | JWT |
| PUT | /api/scrm/reach-tasks/:id | 更新任务（仅 draft 状态可更新） | JWT |
| DELETE | /api/scrm/reach-tasks/:id | 删除任务 | JWT |
| POST | /api/scrm/reach-tasks/:id/send | 执行发送 | JWT |
| POST | /api/scrm/reach-tasks/target-count | 按标签预估目标数 | JWT |

请求示例（创建 1V1 群发任务）：

```http
POST /api/scrm/reach-tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "task_type": "1v1",
  "target_tags": ["t-001", "t-005"],
  "content": "您好，关于您之前咨询的婚姻问题，我们近期有相关法律讲座...",
  "schedule_time": "2026-07-26T10:00:00.000Z",
  "organization_id": "org-001",
  "created_by": "u-005"
}
```

成功响应（201）：

```json
{
  "id": "rt-001",
  "task_type": "1v1",
  "status": "pending",
  "target_count": 156,
  "sent_count": 0,
  "schedule_time": "2026-07-26T10:00:00.000Z",
  "created_at": "2026-07-25T16:00:00.000Z"
}
```

失败响应（409，状态不可逆）：

```json
{
  "statusCode": 409,
  "message": "任务状态为 sent，不可修改",
  "error": "Conflict"
}
```

**7. 交互流程**

1. 运营人员在「触达工具」页选择 task_type=1v1 → 选择目标标签 → 前端调用 `POST /api/scrm/reach-tasks/target-count` 预估目标数。
2. 运营人员填写 content、设置 schedule_time → 前端调用 `POST /api/scrm/reach-tasks` 创建任务，状态为 pending。
3. 后端 `ReachTaskController.create` → `ReachTaskService.create` 写入 scrm_reach_tasks，target_count 由标签筛选结果填充。
4. 到达 schedule_time 时，定时任务调用 `POST /api/scrm/reach-tasks/:id/send` → Service 层置状态 sending，逐个客户调用企微 API 发送，sent_count 累加。
5. 发送完成置 sent（全部成功）或 failed（部分失败），写入发送日志。
6. 运营人员在「触达记录」页查看任务列表与 sent_count/target_count，朋友圈任务在「排期日历」页通过 `GET /api/scrm/reach-tasks/moments-schedule` 查看。

**8. 异常场景**

1. **目标客户为空**：target_tags 筛选后无客户 → 后端返回 400，提示「目标客户数为 0，请重新选择标签」。
2. **状态不可逆**：更新已 sent 的任务 → 后端返回 409，提示「任务状态为 sent，不可修改」。
3. **排期时间已过**：schedule_time 早于当前时间 → 后端返回 400，提示「排期时间不能早于当前时间」。
4. **部分发送失败**：企微 API 对部分客户返回错误 → 任务状态置 failed，sent_count 记录成功数，失败客户ID写入失败日志，前端提示「任务部分失败，成功 N 条，失败 M 条」。

**9. 验收标准**

- **正常场景**：Given 标签 t-001 下有 156 个客户，When 运营人员创建 task_type=1v1、target_tags=[t-001] 的任务，Then 系统创建任务 target_count=156、status=pending，到达 schedule_time 后执行发送，sent_count 累加至 156。
- **边界场景**：Given 任务 rt-002 已 sent，When 运营人员尝试调用 `PUT /api/scrm/reach-tasks/rt-002` 修改内容，Then 系统返回 409 并提示「任务状态为 sent，不可修改」。
- **异常场景**：Given 运营人员选择的 target_tags 筛选后目标客户数为 0，When 调用 `POST /api/scrm/reach-tasks`，Then 系统返回 400 并提示「目标客户数为 0」，无任务被创建。

---

#### 2.6 聊天全量存档管理

**1. 功能描述**

企微/个微聊天记录全程留存，支持文字、图片、语音、视频、文件全类型存档，按客户、员工、时间、关键词检索，并自动同步至合规风控模块触发智能质检。

**2. 用户故事**

- 作为合规风控人员，我希望按关键词检索员工与客户的聊天记录，以便发现违规承诺或不当沟通。
- 作为律所管理者，我希望员工离职后聊天记录仍可完整导出，以便客户交接与历史追溯。

**3. 业务规则**

1. 消息类型 `message_type` 包括 `text`（文字）、`image`（图片）、`voice`（语音）、`video`（视频）、`file`（文件），默认 text。
2. 存档字段：`client_id`、`employee_id`（均必填）、`content`（text 类型存文字内容）、`file_path`（非 text 类型存文件路径）、`sent_at`（消息发送时间）、`archived_at`（归档时间，自动生成）。
3. 合规同步：`compliance_synced` 默认 false，调用 `POST /api/scrm/chat-archives/:id/sync-compliance` 同步至合规风控模块并置 true，回填 `compliance_result`（pass/warning/reject）。
4. 批量同步：`POST /api/scrm/chat-archives/batch-sync-compliance` 支持 limit 参数限制单次处理量，按组织批量同步未同步记录。
5. 检索：`GET /api/scrm/chat-archives/search` 支持按 client_id、employee_id、message_type、keyword、start_time、end_time、page、limit 多条件分页检索。
6. 员工离职无法删除聊天记录：删除接口 `DELETE /api/scrm/chat-archives/:id` 仅限管理员角色调用，普通员工无权限。
7. 聊天记录永久存档，不因员工离职或客户删除而丢失。

**4. 输入/输出规范**

创建存档（POST /api/scrm/chat-archives）输入字段：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| client_id | string | 是 | 有效客户ID |
| employee_id | string | 是 | 有效员工ID |
| message_type | varchar | 否 | text/image/voice/video/file，默认 text |
| content | text | 否 | text 类型必填 |
| file_path | string | 否 | 非 text 类型必填 |
| sent_at | datetime | 是 | 消息发送时间 |
| organization_id | string | 是 | 组织ID |

检索（GET /api/scrm/chat-archives/search）查询参数：

| 字段名 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| org_id | string | 否 | 组织ID |
| client_id | string | 否 | 客户ID |
| employee_id | string | 否 | 员工ID |
| message_type | varchar | 否 | 消息类型 |
| keyword | string | 否 | 关键词（模糊匹配 content） |
| start_time | datetime | 否 | 起始时间 |
| end_time | datetime | 否 | 结束时间 |
| page | integer | 否 | 默认 1 |
| limit | integer | 否 | 默认 20，最大 100 |

输出结果：存档对象。检索接口返回分页结构 `{ data: [], total: number, page: number, limit: number }`。

**5. 数据模型**

实体名：`ChatArchive`，表名 `scrm_chat_archives`，与 `backend/src/scrm/chat-archive.entity.ts` 对齐。

| 字段名 | 类型（SQLite 兼容） | 约束 | 说明 |
| --- | --- | --- | --- |
| id | varchar(36) | PK | UUID 主键 |
| client_id | varchar(36) | NOT NULL | 客户ID |
| employee_id | varchar(36) | NOT NULL | 员工ID |
| message_type | varchar(20) | DEFAULT 'text' | 消息类型 |
| content | text | NULL | 文字内容 |
| file_path | varchar(255) | NULL | 文件路径 |
| sent_at | datetime | NULL | 消息发送时间 |
| archived_at | datetime | NOT NULL | 归档时间（自动） |
| organization_id | varchar(36) | NULL | 组织ID |
| compliance_synced | integer | DEFAULT 0 | 是否已同步合规（0/1） |
| compliance_result | varchar(20) | NULL | 合规质检结果 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/scrm/chat-archives | 创建聊天存档 | JWT |
| GET | /api/scrm/chat-archives | 查询存档列表（支持 client_id/employee_id/message_type 筛选） | JWT |
| GET | /api/scrm/chat-archives/search | 多条件分页检索 | JWT |
| GET | /api/scrm/chat-archives/:id | 存档详情 | JWT |
| PUT | /api/scrm/chat-archives/:id | 更新存档 | JWT |
| DELETE | /api/scrm/chat-archives/:id | 删除存档（仅管理员） | JWT + 管理员 |
| POST | /api/scrm/chat-archives/:id/sync-compliance | 同步单条至合规质检 | JWT |
| POST | /api/scrm/chat-archives/batch-sync-compliance | 批量同步合规质检 | JWT |

请求示例（关键词检索）：

```http
GET /api/scrm/chat-archives/search?org_id=org-001&keyword=保证胜诉&start_time=2026-07-01T00:00:00.000Z&end_time=2026-07-25T23:59:59.000Z&page=1&limit=20
Authorization: Bearer <jwt-token>
```

成功响应（200）：

```json
{
  "data": [
    {
      "id": "ca-001",
      "client_id": "c-001",
      "employee_id": "u-005",
      "message_type": "text",
      "content": "我们保证胜诉，放心委托吧",
      "sent_at": "2026-07-15T10:30:00.000Z",
      "archived_at": "2026-07-15T10:30:05.000Z",
      "compliance_synced": 1,
      "compliance_result": "reject"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

失败响应（403，无删除权限）：

```json
{
  "statusCode": 403,
  "message": "无操作权限，仅管理员可删除聊天存档",
  "error": "Forbidden"
}
```

**7. 交互流程**

1. 企微/个微会话产生消息 → 企微会话存档 SDK 或前端 SDK 上报调用 `POST /api/scrm/chat-archives` 携带 client_id、employee_id、message_type、content/file_path、sent_at。
2. 后端 `ChatArchiveController.create` → `ChatArchiveService.create` 写入 scrm_chat_archives，archived_at 自动填充。
3. 定时任务或管理员手动触发 `POST /api/scrm/chat-archives/batch-sync-compliance` 携带 org_id 与 limit → Service 层查询 compliance_synced=0 的记录，逐条调用合规风控模块。
4. 合规风控模块返回 pass/warning/reject → 后端回填 compliance_result 与 compliance_synced=1。
5. 合规风控人员在「聊天质检」页通过 `GET /api/scrm/chat-archives/search` 输入关键词（如「保证胜诉」）检索违规话术。
6. 员工离职时，管理员调用 `GET /api/scrm/chat-archives?employee_id=u-xxx` 导出该员工全部聊天记录。

**8. 异常场景**

1. **删除权限不足**：非管理员角色调用 DELETE → 后端返回 403，提示「无操作权限，仅管理员可删除聊天存档」。
2. **合规同步失败**：合规风控模块异常 → 单条同步接口返回 503，记录保持 compliance_synced=0，由批量任务后续重试，前端提示「合规同步失败，将稍后重试」。
3. **检索结果为空**：keyword 无匹配 → 后端返回空数组与 total=0，前端展示「未找到匹配的聊天记录」。
4. **必填字段缺失**：创建存档时 client_id 或 employee_id 为空 → 后端返回 400，提示「客户ID与员工ID均为必填」。
5. **文件类型缺 file_path**：message_type=image 但未提供 file_path → 后端返回 400，提示「非文本消息必须提供 file_path」。

**9. 验收标准**

- **正常场景**：Given 员工 u-005 与客户 c-001 有一条包含「保证胜诉」的文字消息，When 合规风控人员调用 `GET /api/scrm/chat-archives/search?keyword=保证胜诉`，Then 返回结果包含该条记录，total=1。
- **边界场景**：Given 一条 compliance_synced=0 的存档记录，When 管理员调用 `POST /api/scrm/chat-archives/:id/sync-compliance`，Then 系统调用合规风控模块并回填 compliance_result（如 reject），compliance_synced 置为 1。
- **异常场景**：Given 普通销售角色用户已登录，When 调用 `DELETE /api/scrm/chat-archives/ca-001`，Then 系统返回 403 并提示「无操作权限，仅管理员可删除聊天存档」，存档记录保留。

### 模块3：线索中台与谈案转化CRM

#### 3.1 全渠道线索归集

#### **1. 功能描述**
统一汇集抖音、百度、快手、企微、直播间、线下转介绍等多渠道线索至唯一线索池，自动去重并生成全局唯一客户ID，为后续分配、邀约、谈案、办案提供数据底座。

#### **2. 用户故事**
- 作为营销主管，我希望各广告平台表单线索能自动同步入库，以便我无需人工搬运数据即可统一查看全渠道线索质量。
- 作为邀约岗员工，我希望手动收到的转介绍线索也能通过Excel批量导入，以便线下线索不流失。

#### **3. 业务规则**
1. **自动归集**：广告平台表单、私信、企微加微、直播间留资线索通过对接回调自动入库，来源字段 `source_channel` 必须取自枚举 `douyin|baidu|kuaishou|wechat|other`。
2. **手动归集**：支持单条手动录入与Excel批量导入转介绍/线下线索，导入时必填字段为 `phone`、`source_channel`，其余字段可选。
3. **自动去重**：按 `phone` 去重（手机号为唯一客户标识），重复线索入库时合并至已有Lead记录，保留全部来源信息（`source_keyword`、`landing_page` 累加），不重复生成客户ID。
4. **状态流转**：线索入库默认 `status=new`，自动流转为 `pending_follow`，进入待分配队列。
5. **组织归属**：每条线索必须绑定 `organization_id`，跨组织线索不可见。
6. **来源留痕**：`source_keyword`、`landing_page` 字段用于广告ROI归因，不可为空时必须记录原始投放关键词与落地页URL。
7. **例外**：手机号格式非法（非11位数字、非1开头）的线索进入"无效线索"队列，不计入客户档案，但保留原始数据用于审计。

#### **4. 输入/输出规范**

**输入字段（POST /api/leads）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| source_channel | varchar | 是 | 枚举：douyin/baidu/kuaishou/wechat/other |
| source_keyword | varchar | 否 | 最大长度128，广告关键词 |
| case_type | varchar | 否 | 枚举：marriage/traffic/labor/debt/other |
| phone | varchar | 是 | 11位数字，1开头，全系统唯一 |
| contact_name | varchar | 否 | 最大长度32 |
| case_description | text | 否 | 最大长度2000 |
| landing_page | varchar | 否 | 合法URL格式 |
| organization_id | varchar | 是 | UUID格式，必须为有效组织ID |

**输出结果**：
- 成功：返回完整Lead对象（含生成的 `id`、`status=new`、`created_at`）
- 失败：返回错误码与具体错误信息

#### **5. 数据模型**

**实体：Lead（leads表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| source_channel | varchar(20) | NOT NULL | 来源渠道枚举值 |
| source_keyword | varchar(128) | NULL | 来源关键词 |
| case_type | varchar(20) | NULL | 案由枚举值 |
| status | varchar(20) | NOT NULL, DEFAULT 'new' | 线索状态枚举 |
| assign_sales_id | varchar(36) | NULL | 分配的销售/邀约人ID |
| phone | varchar(20) | NOT NULL | 客户手机号 |
| contact_name | varchar(32) | NULL | 联系人姓名 |
| case_description | text | NULL | 案情描述 |
| landing_page | varchar(500) | NULL | 落地页URL |
| service_fee | real | NULL | 报价金额（decimal 12,2） |
| organization_id | varchar(36) | NOT NULL, FK | 所属组织ID |
| follow_up_time | datetime | NULL | 下次跟进时间 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/leads | 创建线索（手动/自动归集入口） | JWT |
| GET | /api/leads | 分页查询线索列表（支持status/case_type/source_channel筛选） | JWT |
| GET | /api/leads/:id | 查询线索详情 | JWT |
| PUT | /api/leads/:id/status | 更新线索状态 | JWT |
| PUT | /api/leads/:id/assign | 分配线索给销售 | JWT |
| POST | /api/leads/:id/follow-up | 创建跟进记录 | JWT |
| GET | /api/leads/:id/follow-ups | 查询线索跟进记录列表 | JWT |
| PUT | /api/leads/:id/fee | 更新报价金额 | JWT |

**请求示例（POST /api/leads）**：
```json
{
  "source_channel": "douyin",
  "source_keyword": "离婚律师",
  "case_type": "marriage",
  "phone": "13800138000",
  "contact_name": "王女士",
  "case_description": "咨询离婚财产分割，结婚5年，有一子",
  "landing_page": "https://ad.lawfirm.com/douyin-marriage",
  "organization_id": "org-uuid-001"
}
```

**成功响应（201 Created）**：
```json
{
  "id": "lead-uuid-001",
  "source_channel": "douyin",
  "source_keyword": "离婚律师",
  "case_type": "marriage",
  "status": "new",
  "assign_sales_id": null,
  "phone": "13800138000",
  "contact_name": "王女士",
  "case_description": "咨询离婚财产分割，结婚5年，有一子",
  "landing_page": "https://ad.lawfirm.com/douyin-marriage",
  "service_fee": null,
  "organization_id": "org-uuid-001",
  "follow_up_time": null,
  "created_at": "2026-07-25T10:00:00.000Z",
  "updated_at": "2026-07-25T10:00:00.000Z"
}
```

**失败响应（400 Bad Request）**：
```json
{
  "statusCode": 400,
  "message": "手机号格式不正确，需为11位数字且1开头",
  "error": "Bad Request"
}
```

#### **7. 交互流程**
1. **用户操作**：邀约岗在"线索录入"页填写手机号、来源、案由等字段，点击"保存"。
2. **前端**：React表单校验手机号格式后，POST `/api/leads` 携带JSON体。
3. **后端**：LeadController.create → LeadService.create → 校验手机号唯一性 → 若已存在则合并来源信息更新Lead，否则新增Lead。
4. **数据**：写入 `leads` 表，`status` 默认 `new`，`created_at`/`updated_at` 自动填充。
5. **响应**：返回完整Lead对象，前端跳转至线索详情页并提示"线索入库成功"。

#### **8. 异常场景**
1. **手机号重复**：后端检测到 `phone` 已存在时，合并来源信息（`source_keyword` 拼接、`landing_page` 取最新），返回已有Lead ID，前端提示"该手机号已存在线索，已合并来源信息"。
2. **手机号格式非法**：前端校验失败直接拦截；若绕过前端，后端返回400，前端Toast提示"手机号格式不正确，需为11位数字且1开头"。
3. **来源渠道枚举非法**：后端返回400，提示"来源渠道取值非法，仅支持douyin/baidu/kuaishou/wechat/other"。
4. **organization_id 不存在**：后端返回400，提示"组织ID不存在，请联系管理员"。
5. **批量导入Excel字段缺失**：导入任务标记失败行，下载错误报告，提示"第X行手机号为空，已跳过"。

#### **9. 验收标准**
- **场景1（正常）**：Given 邀约岗已登录且填写完整信息，When 提交手机号为13800138000的抖音线索，Then 系统返回201状态码，`leads` 表新增一条记录，`status=new`，`source_channel=douyin`。
- **场景2（边界-去重）**：Given 系统中已存在手机号13800138000的线索，When 再次提交同手机号但source_channel=baidu的线索，Then 系统返回已有Lead ID，`source_keyword` 字段合并为"douyin离婚律师;baidu离婚咨询"，不重复生成客户ID。
- **场景3（异常）**：Given 提交手机号为"abc1234567"，When 后端校验失败，Then 返回400状态码，错误信息包含"手机号格式不正确"，`leads` 表无新增记录。

---

#### 3.2 线索前置利益冲突初查

#### **1. 功能描述**
线索入库时自动触发利益冲突检索，比对客户姓名、企业名称与系统内历史客户、对方当事人库，输出"无冲突/疑似冲突/明确冲突"三类结果，规避接案合规风险。

#### **2. 用户故事**
- 作为合规专员，我希望线索入库即自动完成利冲初查，以便我能在分配前识别风险，避免违规接案。
- 作为律所主任，我希望明确冲突的线索被自动拦截，以便律所不触碰执业纪律红线。

#### **3. 业务规则**
1. **自动触发**：Lead创建成功后立即异步触发利冲检索，不阻塞主流程返回。
2. **比对维度**：按 `contact_name`（姓名/企业名称）、`phone` 与系统内 `leads`、`cases`（含 `client_name`、`client_phone`）、对方当事人库进行匹配。
3. **结果分级**：
   - 无冲突：未命中任何历史客户/对方当事人。
   - 疑似冲突：姓名相同但手机号不同，或手机号相同但姓名不同。
   - 明确冲突：姓名+手机号均相同，且历史案件该客户为对方当事人。
4. **处置策略**：
   - 明确冲突：线索锁定，`status` 不可流转为 `following`，仅 `org_admin`/`super_admin` 可查看并人工裁定。
   - 疑似冲突：标记后可继续分配，但分配通知中提示"存在疑似冲突，请核实"。
   - 无冲突：正常进入分配流程。
5. **检索时效**：检索结果缓存24小时，超时重新检索。
6. **审计留痕**：每次检索记录检索时间、命中记录ID、结果分级，写入审计日志。

#### **4. 输入/输出规范**

**输入字段（POST /api/leads/:id/conflict-check）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| id | varchar | 是 | URL参数，UUID格式 |
| force_recheck | boolean | 否 | 是否强制重新检索（默认false，跳过缓存） |

**输出结果**：
```json
{
  "lead_id": "lead-uuid-001",
  "conflict_level": "no_conflict|suspected|confirmed",
  "matched_records": [
    { "type": "lead|case", "id": "xxx", "matched_field": "phone", "existing_role": "client|opposing_party" }
  ],
  "checked_at": "2026-07-25T10:00:00.000Z"
}
```

#### **5. 数据模型**

**实体：LeadConflictCheck（lead_conflict_checks表，新增）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| lead_id | varchar(36) | NOT NULL, FK | 关联线索ID |
| conflict_level | varchar(20) | NOT NULL | 枚举：no_conflict/suspected/confirmed |
| matched_records | text | NULL | JSON数组，命中记录详情 |
| checked_at | datetime | NOT NULL | 检索时间 |
| checked_by | varchar(36) | NULL | 检索触发者（系统自动为system） |
| created_at | datetime | NOT NULL | 创建时间 |

> 说明：本表为新增表，与现有 `leads` 表通过 `lead_id` 关联，不修改现有Lead实体。

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/leads/:id/conflict-check | 触发线索利冲检索 | JWT |
| GET | /api/leads/:id/conflict-check | 查询线索最新利冲结果 | JWT |
| GET | /api/leads/conflicts/list | 查询冲突线索列表（仅管理员） | JWT（org_admin/super_admin） |

**请求示例（POST /api/leads/lead-uuid-001/conflict-check）**：
```json
{
  "force_recheck": false
}
```

**成功响应（200 OK）**：
```json
{
  "lead_id": "lead-uuid-001",
  "conflict_level": "suspected",
  "matched_records": [
    {
      "type": "case",
      "id": "case-uuid-009",
      "matched_field": "contact_name",
      "existing_role": "opposing_party"
    }
  ],
  "checked_at": "2026-07-25T10:00:00.000Z"
}
```

**失败响应（403 Forbidden）**：
```json
{
  "statusCode": 403,
  "message": "线索处于明确冲突状态，仅管理员可操作",
  "error": "Forbidden"
}
```

#### **7. 交互流程**
1. **用户操作**：线索入库后系统自动触发；管理员可在线索详情页点击"重新检索"。
2. **前端**：调用 POST `/api/leads/:id/conflict-check`。
3. **后端**：ConflictCheckService执行 → 比对 `leads`、`cases`、对方当事人库 → 写入 `lead_conflict_checks` 表 → 若confirmed则更新 `leads.status` 为锁定状态。
4. **数据**：检索结果写入 `lead_conflict_checks`，匹配记录ID写入 `matched_records` JSON字段。
5. **响应**：返回检索结果，前端在线索卡片右上角展示红/黄/绿色冲突标识。

#### **8. 异常场景**
1. **检索服务超时**：3秒未返回则异步重试，前端展示"检索中..."，3次重试失败后提示"利冲检索服务暂不可用，请稍后重试或联系管理员"。
2. **明确冲突线索被非管理员访问**：后端返回403，前端跳转至提示页"该线索存在明确利益冲突，仅管理员可查看，请联系合规专员"。
3. **线索无 contact_name**：仅按 phone 检索，结果可能为"疑似冲突"或"无冲突"，前端提示"未填写姓名，仅按手机号检索，建议补充客户姓名"。
4. **缓存失效**：超过24小时再次访问时自动重新检索，前端展示最新结果。

#### **9. 验收标准**
- **场景1（正常-无冲突）**：Given 新线索手机号13800000001、姓名"测试客户"在系统中无任何匹配，When 触发利冲检索，Then 返回 `conflict_level=no_conflict`，`matched_records=[]`，线索正常进入分配流程。
- **场景2（边界-疑似冲突）**：Given 系统中已有案件case-009，对方当事人姓名"张三"，When 新线索contact_name="张三"但phone不同，Then 返回 `conflict_level=suspected`，`matched_records` 包含case-009记录。
- **场景3（异常-明确冲突）**：Given 系统中已有案件case-008，客户phone=13800138000且该客户为对方当事人，When 新线索phone=13800138000入库，Then 返回 `conflict_level=confirmed`，线索被锁定，非管理员访问该线索详情返回403。

---

#### 3.3 智能线索分配引擎

#### **1. 功能描述**
基于地域、案由、岗位负载、人员专业标签的自定义分配规则，自动将线索分配至邀约岗或谈案岗，原生适配邀谈分离模式，分配结果实时通知并支持手动改派。

#### **2. 用户故事**
- 作为运营管理员，我希望配置"抖音婚姻家事线索优先分配给邀约岗A"的规则，以便线索能精准匹配专业邀约人。
- 作为邀约岗员工，我希望新分配的线索能实时推送给我，以便我30分钟内响应跟进。

#### **3. 业务规则**
1. **规则类型**：支持三类规则（`AssignmentRuleType` 枚举）：
   - `region`：按地域分配（基于手机号归属地或线索填写地）
   - `case_type`：按案由分配
   - `load_balance`：按岗位负载（当前未跟进线索数）轮询分配
2. **规则优先级**：`priority` 字段为整数，数字越小优先级越高，同优先级按创建时间先后。
3. **规则条件**：`conditions` 为JSON字符串，存储规则匹配条件，例如 `{"case_type":"marriage","source_channel":"douyin"}`。
4. **目标用户**：`target_user_id` 指定命中规则后分配的员工，规则启用时该员工必须在职且角色为 `sales`/`marketing`。
5. **邀谈分离流转**：线索先分配邀约岗，邀约成功（`invite_task.status=arrived`）后自动流转至谈案岗（创建Opportunity并分配 `negotiator_id`）。
6. **手动改派**：支持 `PUT /api/leads/:id/assign` 手动改派，改派日志写入 `lead_assignments` 关联表与操作日志。
7. **规则启停**：`enabled=false` 的规则不参与匹配，管理员可临时禁用。
8. **兜底规则**：所有规则均不命中时，分配给组织内负载最低的 `sales` 角色员工；若无可用员工，线索停留在 `pending_follow` 状态并通知管理员。

#### **4. 输入/输出规范**

**输入字段（POST /api/lead-assignments 创建规则）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| rule_name | varchar | 是 | 最大长度64，组织内唯一 |
| rule_type | varchar | 是 | 枚举：region/case_type/load_balance |
| conditions | text | 是 | 合法JSON字符串 |
| target_user_id | varchar | 否 | UUID，必须为组织内有效sales/marketing用户 |
| priority | integer | 否 | 默认0，0-999 |
| enabled | boolean | 否 | 默认true |

**输出结果**：返回完整LeadAssignment对象，含自动生成的 `organization_id`。

#### **5. 数据模型**

**实体：LeadAssignment（lead_assignments表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| rule_name | varchar(64) | NOT NULL | 规则名称 |
| rule_type | varchar(20) | NOT NULL | 规则类型枚举 |
| conditions | text | NOT NULL | JSON规则条件 |
| target_user_id | varchar(36) | NULL, FK | 目标分配用户ID |
| priority | integer | NOT NULL, DEFAULT 0 | 优先级（数字越小越优先） |
| enabled | boolean | NOT NULL, DEFAULT 1 | 是否启用（SQLite用integer存布尔） |
| organization_id | varchar(36) | NOT NULL, FK | 所属组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/lead-assignments | 创建分配规则 | JWT |
| GET | /api/lead-assignments | 查询组织内所有规则 | JWT |
| GET | /api/lead-assignments/:id | 查询单个规则详情 | JWT |
| PUT | /api/lead-assignments/:id | 更新规则 | JWT |
| DELETE | /api/lead-assignments/:id | 删除规则 | JWT |
| PUT | /api/lead-assignments/:id/toggle?enabled=true | 启停规则 | JWT |
| GET | /api/lead-assignments/users/available | 查询可分配员工列表 | JWT |
| GET | /api/lead-assignments/logs/:leadId | 查询线索分配日志 | JWT |
| PUT | /api/leads/:id/assign | 手动改派线索 | JWT |

**请求示例（POST /api/lead-assignments）**：
```json
{
  "rule_name": "抖音婚姻线索分配规则",
  "rule_type": "case_type",
  "conditions": "{\"case_type\":\"marriage\",\"source_channel\":\"douyin\"}",
  "target_user_id": "user-uuid-001",
  "priority": 10,
  "enabled": true
}
```

**成功响应（201 Created）**：
```json
{
  "id": "rule-uuid-001",
  "rule_name": "抖音婚姻线索分配规则",
  "rule_type": "case_type",
  "conditions": "{\"case_type\":\"marriage\",\"source_channel\":\"douyin\"}",
  "target_user_id": "user-uuid-001",
  "priority": 10,
  "enabled": true,
  "organization_id": "org-uuid-001",
  "created_at": "2026-07-25T10:00:00.000Z",
  "updated_at": "2026-07-25T10:00:00.000Z"
}
```

**失败响应（400 Bad Request）**：
```json
{
  "statusCode": 400,
  "message": "规则名称已存在，请更换",
  "error": "Bad Request"
}
```

#### **7. 交互流程**
1. **用户操作**：管理员在"分配规则"页点击"新建规则"，填写规则名称、类型、条件、目标用户、优先级。
2. **前端**：POST `/api/lead-assignments`，`conditions` 字段前端序列化为JSON字符串。
3. **后端**：LeadAssignmentController.createRule → 校验规则名唯一性 → 自动填充 `organization_id`（取自 `req.user.organization_id`）→ 持久化。
4. **数据**：写入 `lead_assignments` 表；新线索入库时LeadService按 `priority` 升序遍历启用的规则，命中即分配。
5. **响应**：返回规则对象，前端规则列表新增一行；分配后通过WebSocket/IM推送给目标用户。

#### **8. 异常场景**
1. **目标用户已离职**：规则创建时校验 `target_user_id` 状态，若已禁用返回400，提示"目标用户已离职，请重新选择"。
2. **规则条件JSON格式错误**：后端解析失败返回400，提示"规则条件格式错误，需为合法JSON"。
3. **同优先级规则冲突**：多条规则同优先级且都命中时，按创建时间先后取第一条，日志记录"命中多条同优先级规则，取最早创建的rule-uuid-001"。
4. **兜底无可用员工**：组织内无在职 `sales` 角色员工时，线索停留 `pending_follow`，管理员收到系统通知"线索lead-uuid-001无可用分配人员，请尽快补充邀约岗人员"。

#### **9. 验收标准**
- **场景1（正常-规则命中）**：Given 存在规则"抖音婚姻线索→user-001"，priority=10，When 新线索 source_channel=douyin、case_type=marriage 入库，Then 线索 `assign_sales_id` 自动设为user-001，user-001收到分配通知。
- **场景2（边界-规则不命中走兜底）**：Given 组织内仅有1名sales员工user-002且负载最低，When 新线索case_type=labor入库且无labor类规则，Then 兜底分配给user-002，`assign_sales_id=user-002`。
- **场景3（异常-目标用户离职）**：Given 规则target_user_id指向已禁用账号，When 创建规则时，Then 返回400，错误信息"目标用户已离职，请重新选择"，规则未创建。

---

#### 3.4 线索公海池管理

#### **1. 功能描述**
对未跟进超时或主动退回的线索统一回收到公海池，支持重新分配、员工主动领取、批量操作，实现线索二次利用，提升线索转化率。

#### **2. 用户故事**
- 作为邀约岗员工，我希望超时未跟进的线索能自动回到公海池，以便其他同事可以领取跟进，避免线索浪费。
- 作为运营管理员，我希望公海池支持批量分配给指定员工，以便我快速消化积压线索。

#### **3. 业务规则**
1. **超时回收**：线索分配后超过预设时长（默认24小时，组织可自定义）未创建任何FollowUp记录，自动回收至公海池，`recycle_reason=timeout`。
2. **主动退回**：员工可主动 `POST /api/lead-pool/recycle/:leadId` 退回线索，必须填写 `note` 退回原因，`recycle_reason=manual`。
3. **领取限制**：`take_count` 字段记录该线索被领取次数，组织可配置单个员工单日领取上限（默认10条），超过上限不可再领取。
4. **领取时效**：公海池线索被领取后 `status=taken`，若领取后24小时未跟进，再次回收到公海池且 `take_count+1`。
5. **批量操作**：管理员可批量领取（`batch-take`）与批量分配（`batch-assign`），单次最多50条。
6. **状态过滤**：公海池列表支持按 `status`（available/taken/discarded）、`case_type`、`recycle_reason`、回收时间区间筛选，支持按 `recycle_time`/`take_count` 排序。
7. **丢弃处理**：`recycle_reason=invalid`（如号码空号）的线索可标记为 `discarded`，不再参与分配。
8. **定时任务**：系统每日凌晨2点执行 `recycleTimeoutLeads`，默认超时阈值为7天（可配置），返回回收数量。

#### **4. 输入/输出规范**

**输入字段（POST /api/lead-pool/recycle/:leadId）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| leadId | varchar | 是 | URL参数，UUID |
| note | text | 是 | 退回原因，最大长度500 |

**输入字段（GET /api/lead-pool 查询）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| status | varchar | 否 | 枚举：available/taken/discarded |
| case_type | varchar | 否 | 枚举：marriage/traffic/labor/debt/other |
| recycle_reason | varchar | 否 | 枚举：timeout/manual |
| start_date | datetime | 否 | ISO8601格式 |
| end_date | datetime | 否 | ISO8601格式 |
| page | integer | 否 | 默认1 |
| limit | integer | 否 | 默认20，最大100 |
| sortBy | varchar | 否 | recycle_time/take_count，默认recycle_time |
| sortOrder | varchar | 否 | ASC/DESC，默认DESC |

**输出结果**：分页对象 `{ data: LeadPool[], total: number, page: number, limit: number }`。

#### **5. 数据模型**

**实体：LeadPool（lead_pool表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| lead_id | varchar(36) | NOT NULL, FK | 关联线索ID |
| original_owner_id | varchar(36) | NOT NULL, FK | 原归属人ID |
| recycle_reason | varchar(20) | NOT NULL | 回收原因枚举：timeout/manual |
| recycle_note | text | NULL | 退回原因备注 |
| recycle_time | datetime | NOT NULL | 回收时间（CreateDateColumn） |
| status | varchar(20) | NOT NULL, DEFAULT 'available' | 公海池状态枚举 |
| taken_by_id | varchar(36) | NULL, FK | 领取人ID |
| taken_at | datetime | NULL | 领取时间 |
| take_count | integer | NOT NULL, DEFAULT 0 | 累计被领取次数 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/lead-pool | 分页查询公海池列表 | JWT |
| GET | /api/lead-pool/statistics | 公海池统计（按状态/案由分组） | JWT |
| POST | /api/lead-pool/recycle/:leadId | 手动退回线索至公海池 | JWT |
| POST | /api/lead-pool/take/:id | 领取线索 | JWT |
| POST | /api/lead-pool/assign/:id | 管理员分配公海池线索 | JWT |
| POST | /api/lead-pool/batch-take | 批量领取线索（body: {ids: string[]}） | JWT |
| POST | /api/lead-pool/batch-assign | 批量分配线索（body: {ids, userId}） | JWT |
| POST | /api/lead-pool/trigger-recycle | 手动触发超时回收（测试用） | JWT |

**请求示例（POST /api/lead-pool/recycle/lead-uuid-001）**：
```json
{
  "note": "客户长期不接电话，无法继续跟进"
}
```

**成功响应（201 Created）**：
```json
{
  "id": "pool-uuid-001",
  "lead_id": "lead-uuid-001",
  "original_owner_id": "user-uuid-002",
  "recycle_reason": "manual",
  "recycle_note": "客户长期不接电话，无法继续跟进",
  "recycle_time": "2026-07-25T10:00:00.000Z",
  "status": "available",
  "taken_by_id": null,
  "taken_at": null,
  "take_count": 0
}
```

**失败响应（400 Bad Request）**：
```json
{
  "statusCode": 400,
  "message": "退回原因不能为空",
  "error": "Bad Request"
}
```

#### **7. 交互流程**
1. **用户操作**：邀约岗在"我的线索"页选择某条线索，点击"退回公海"，填写退回原因。
2. **前端**：POST `/api/lead-pool/recycle/:leadId`，body含note。
3. **后端**：LeadPoolController.manualRecycle → 校验note非空 → 创建LeadPool记录（`recycle_reason=manual`）→ 更新 `leads.assign_sales_id=null`、`status=pending_follow`。
4. **数据**：`lead_pool` 表新增记录，`leads` 表更新归属人为空。
5. **响应**：返回LeadPool对象，前端从"我的线索"列表移除该条，提示"已退回公海池"。

#### **8. 异常场景**
1. **退回非自己负责的线索**：后端校验 `original_owner_id` 必须为当前用户，否则返回403，提示"无权退回他人线索"。
2. **领取超过单日上限**：用户当日领取数已达10条，再次领取返回400，提示"今日领取已达上限（10条），请明日再试或联系管理员"。
3. **线索已被他人领取**：`status=taken` 时再领取返回409，提示"该线索刚被他人领取，请选择其他线索"。
4. **批量操作超过50条**：返回400，提示"单次批量操作最多50条，请分批处理"。

#### **9. 验收标准**
- **场景1（正常-超时回收）**：Given 线索lead-001分配给user-002已超过24小时无FollowUp，When 定时任务执行，Then `lead_pool` 表新增记录 `recycle_reason=timeout`，`leads.assign_sales_id` 置空。
- **场景2（边界-主动退回）**：Given user-002在职且为lead-001的归属人，When 提交退回请求body含note，Then 返回201，`lead_pool.status=available`，user-002的"我的线索"列表不再显示该线索。
- **场景3（异常-领取上限）**：Given user-003今日已领取10条公海线索，When 再次领取第11条，Then 返回400，错误信息"今日领取已达上限（10条）"，`lead_pool.status` 仍为available。

---

#### 3.5 客户全景档案管理

#### **1. 功能描述**
以客户ID为核心，整合基础信息、来源渠道、广告素材、通话录音、聊天记录、跟进记录、历史案件、标签信息等全维度数据，形成唯一全景档案，权限管控确保数据安全。

#### **2. 用户故事**
- 作为谈案岗员工，我希望打开客户档案即可看到全部历史跟进、通话录音、邀约记录，以便我快速了解客户背景，无需重复询问。
- 作为律所主任，我希望档案权限严格控制，仅负责员工与管理员可查看完整档案，以便保护客户隐私。

#### **3. 业务规则**
1. **客户ID生成**：线索入库时按 `phone` 去重生成全局唯一客户ID（即Lead ID），全系统通用。
2. **档案内容**：包含以下Tab页：
   - 基础信息：contact_name、phone、case_type、case_description
   - 来源渠道：source_channel、source_keyword、landing_page、created_at
   - 跟进记录：FollowUp列表（按 `created_at` 倒序）
   - 通话录音：InviteTask中的 `recording_url`、`call_duration`
   - 邀约记录：InviteTask列表
   - 商机记录：Opportunity列表（含 `stage`、`quote_amount`、`actual_amount`）
   - 历史案件：Case列表（`client_phone` 匹配）
   - 标签信息：自定义标签（如"高意向"、"VIP"、"投诉风险"）
3. **权限管控**：
   - 负责员工（`assign_sales_id` 或 `negotiator_id` 或 `assignee_lawyer_id`）：可查看完整档案
   - `org_admin`/`super_admin`：可查看完整档案
   - 其他员工：仅可查看基础信息与来源渠道，不可查看通话录音与跟进记录
4. **数据同步**：办案、财务、合规模块的客户数据变更实时同步至档案（通过事件总线或定时同步）。
5. **标签管理**：支持管理员自定义标签字典，员工可为客户打多个标签。
6. **档案导出**：支持导出PDF档案，含时间轴与关键节点，导出操作需管理员审批。

#### **4. 输入/输出规范**

**输入字段（GET /api/leads/:id/profile）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| id | varchar | 是 | URL参数，UUID |

**输出结果**：
```json
{
  "basic_info": { "contact_name": "...", "phone": "...", "case_type": "..." },
  "source_info": { "source_channel": "...", "source_keyword": "...", "landing_page": "...", "created_at": "..." },
  "follow_ups": [ { "id": "...", "content": "...", "operator_id": "...", "created_at": "..." } ],
  "invite_tasks": [ { "id": "...", "invite_method": "...", "status": "...", "recording_url": "..." } ],
  "opportunities": [ { "id": "...", "stage": "...", "quote_amount": 0, "actual_amount": 0 } ],
  "cases": [ { "id": "...", "case_no": "...", "case_type": "...", "status": "..." } ],
  "tags": [ "高意向", "VIP" ]
}
```

#### **5. 数据模型**

复用现有实体：**Lead**（leads表）、**FollowUp**（follow_ups表）、**InviteTask**（invite_tasks表）、**Opportunity**（opportunities表）、**Case**（cases表）。

**实体：FollowUp（follow_ups表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| content | text | NOT NULL | 跟进内容 |
| next_action | varchar(200) | NULL | 下次动作 |
| next_action_time | datetime | NULL | 下次动作时间 |
| lead_id | varchar(36) | NOT NULL, FK | 关联线索ID |
| operator_id | varchar(36) | NOT NULL, FK | 操作人ID |
| created_at | datetime | NOT NULL | 创建时间 |

**新增实体：ClientTag（client_tags表，用于标签管理）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| lead_id | varchar(36) | NOT NULL, FK | 关联线索ID |
| tag_name | varchar(32) | NOT NULL | 标签名称 |
| tagged_by | varchar(36) | NOT NULL, FK | 标记人ID |
| created_at | datetime | NOT NULL | 创建时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/leads/:id/profile | 获取客户全景档案 | JWT |
| GET | /api/leads/:id/follow-ups | 查询跟进记录列表 | JWT |
| POST | /api/leads/:id/follow-up | 新增跟进记录 | JWT |
| GET | /api/leads/:id/tags | 查询客户标签 | JWT |
| POST | /api/leads/:id/tags | 添加客户标签 | JWT |
| DELETE | /api/leads/:id/tags/:tagId | 移除客户标签 | JWT |
| GET | /api/leads/:id/timeline | 获取客户时间轴（聚合所有事件） | JWT |

**请求示例（POST /api/leads/lead-uuid-001/follow-up）**：
```json
{
  "content": "电话沟通，客户对离婚财产分割较关注，预算5万左右",
  "operator_id": "user-uuid-002",
  "next_action": "邀约到所面谈",
  "next_action_time": "2026-07-26T10:00:00.000Z"
}
```

**成功响应（201 Created）**：
```json
{
  "id": "followup-uuid-001",
  "content": "电话沟通，客户对离婚财产分割较关注，预算5万左右",
  "next_action": "邀约到所面谈",
  "next_action_time": "2026-07-26T10:00:00.000Z",
  "lead_id": "lead-uuid-001",
  "operator_id": "user-uuid-002",
  "created_at": "2026-07-25T10:30:00.000Z"
}
```

**失败响应（403 Forbidden）**：
```json
{
  "statusCode": 403,
  "message": "无权查看该客户档案，仅负责员工与管理员可访问",
  "error": "Forbidden"
}
```

#### **7. 交互流程**
1. **用户操作**：谈案岗在"客户档案"页输入手机号或点击商机详情中的"查看档案"。
2. **前端**：GET `/api/leads/:id/profile`。
3. **后端**：LeadController.findById → 校验当前用户是否为 `assign_sales_id`/`negotiator_id`/`assignee_lawyer_id` 或管理员 → 聚合Lead+FollowUp+InviteTask+Opportunity+Case数据。
4. **数据**：从 `leads`、`follow_ups`、`invite_tasks`、`opportunities`、`cases` 多表联查。
5. **响应**：返回聚合档案JSON，前端按Tab页渲染。

#### **8. 异常场景**
1. **无权访问**：非负责员工访问返回403，前端跳转提示页"无权查看该客户档案，如需协助请联系负责人"。
2. **客户ID不存在**：返回404，提示"客户档案不存在或已删除"。
3. **聚合查询超时**：单档案查询超过5秒，返回部分数据并标记"通话录音加载超时，请刷新重试"。
4. **通话录音文件丢失**：`recording_url` 文件404时，前端展示"录音文件丢失"占位图标，不影响其他字段展示。

#### **9. 验收标准**
- **场景1（正常-完整档案）**：Given user-002为lead-001的邀约人且有3条FollowUp、1条InviteTask、1条Opportunity，When user-002请求档案，Then 返回JSON包含所有6个Tab数据，`follow_ups` 数组长度为3。
- **场景2（边界-权限隔离）**：Given user-003非lead-001的任何负责人，When user-003请求档案，Then 返回403，仅可见基础信息Tab，`follow_ups`/`invite_tasks`/`opportunities` 不可见。
- **场景3（异常-客户不存在）**：Given 查询ID为不存在的UUID，When 请求档案，Then 返回404，错误信息"客户档案不存在或已删除"。

---

#### 3.6 邀约岗专属管理

#### **1. 功能描述**
邀约岗专属工作台，集中展示待跟进线索、今日邀约任务、已邀约列表，支持一键外呼、通话自动录音存档、创建到所预约，并统计邀约量、接通率、邀约率、到所率核心指标。

#### **2. 用户故事**
- 作为邀约岗员工，我希望每天打开工作台即可看到今日待邀约任务清单，以便我按优先级批量外呼。
- 作为邀约主管，我希望看到团队成员的邀约率与到所率，以便我评估绩效并优化话术。

#### **3. 业务规则**
1. **工作台数据来源**：
   - 待跟进线索：`GET /api/invite-tasks/pending-leads` 返回 `assign_sales_id=当前用户` 且 `status=pending_follow` 的Lead
   - 今日邀约任务：`GET /api/invite-tasks/today-tasks` 返回 `inviter_id=当前用户` 且 `scheduled_time` 为今天的InviteTask
   - 已邀约列表：`GET /api/invite-tasks/invited-tasks` 返回 `status=invited` 的任务
   - 历史任务：`GET /api/invite-tasks/history-tasks`
2. **一键外呼**：点击线索手机号触发外呼（通过营销手机SDK或WebRTC），通话结束后自动上传录音至 `recording_url`，记录 `call_duration`。
3. **邀约方式**：`invite_method` 取自枚举 `phone|wechat`，电话邀约与微信邀约均可创建任务。
4. **任务状态流转**：`pending` → `invited`（已邀约成功）→ `arrived`（到所）/ `not_arrived`（未到所）。
5. **到所预约**：邀约成功后填写 `scheduled_time`、案由、客户需求，预约信息自动同步至谈案岗工作台（创建Opportunity）。
6. **邀约结果**：`result` 枚举 `success|invalid`，无效线索（空号、停机）标记后自动回收到公海池。
7. **录音上传**：`POST /api/invite-tasks/upload-recording` 接收multipart/form-data文件，单文件最大100MB。
8. **核心指标统计**：邀约量（创建任务数）、接通率（有通话记录数/外呼数）、邀约率（status=invited/总任务数）、到所率（status=arrived/status=invited）。

#### **4. 输入/输出规范**

**输入字段（POST /api/invite-tasks/create）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| leadId | varchar | 是 | UUID格式 |
| inviteMethod | varchar | 是 | 枚举：phone/wechat |
| scheduledTime | datetime | 否 | ISO8601，必须晚于当前时间 |
| result | varchar | 否 | 枚举：success/invalid |
| resultNote | text | 否 | 最大长度500 |
| recordingUrl | varchar | 否 | URL格式，外呼录音地址 |
| callDuration | integer | 否 | 通话时长（秒），≥0 |

**输出结果**：返回完整InviteTask对象。

#### **5. 数据模型**

**实体：InviteTask（invite_tasks表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| lead_id | varchar(36) | NOT NULL, FK | 关联线索ID |
| inviter_id | varchar(36) | NOT NULL, FK | 邀约人ID |
| invite_method | varchar(20) | NOT NULL | 邀约方式：phone/wechat |
| scheduled_time | datetime | NULL | 预约到所时间 |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 任务状态枚举 |
| result | varchar(20) | NULL | 邀约结果：success/invalid |
| result_note | text | NULL | 结果备注 |
| recording_url | varchar(500) | NULL | 录音文件URL |
| call_duration | integer | NULL | 通话时长（秒） |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/invite-tasks | 分页查询邀约任务（支持status/invite_method/inviter_id筛选） | JWT |
| GET | /api/invite-tasks/my-tasks | 查询我的任务（可按status过滤） | JWT |
| GET | /api/invite-tasks/pending-leads | 待跟进线索列表 | JWT |
| GET | /api/invite-tasks/today-tasks | 今日邀约任务 | JWT |
| GET | /api/invite-tasks/invited-tasks | 已邀约列表 | JWT |
| GET | /api/invite-tasks/history-tasks | 历史任务 | JWT |
| POST | /api/invite-tasks/create | 创建邀约任务 | JWT |
| PUT | /api/invite-tasks/:taskId/status | 更新任务状态 | JWT |
| POST | /api/invite-tasks/upload-recording | 上传通话录音（multipart） | JWT |

**请求示例（POST /api/invite-tasks/create）**：
```json
{
  "leadId": "lead-uuid-001",
  "inviteMethod": "phone",
  "scheduledTime": "2026-07-26T14:00:00.000Z",
  "result": "success",
  "resultNote": "客户同意明日14点到所面谈",
  "recordingUrl": "https://oss.example.com/recordings/lead-001-20260725.wav",
  "callDuration": 180
}
```

**成功响应（201 Created）**：
```json
{
  "id": "invitetask-uuid-001",
  "lead_id": "lead-uuid-001",
  "inviter_id": "user-uuid-002",
  "invite_method": "phone",
  "scheduled_time": "2026-07-26T14:00:00.000Z",
  "status": "invited",
  "result": "success",
  "result_note": "客户同意明日14点到所面谈",
  "recording_url": "https://oss.example.com/recordings/lead-001-20260725.wav",
  "call_duration": 180,
  "created_at": "2026-07-25T10:00:00.000Z",
  "updated_at": "2026-07-25T10:00:00.000Z"
}
```

**失败响应（404 Not Found）**：
```json
{
  "statusCode": 404,
  "message": "线索不存在",
  "error": "Not Found"
}
```

#### **7. 交互流程**
1. **用户操作**：邀约岗在工作台点击"待跟进"列表中的线索，点击"一键外呼"。
2. **前端**：调用营销手机SDK发起外呼，通话结束后自动调用 POST `/api/invite-tasks/create` 创建任务。
3. **后端**：InviteTaskController.createInviteTask → 校验leadId存在 → 创建InviteTask（status默认pending，若result=success则status=invited）→ 上传录音文件至OSS → 同步更新Lead.status=inviting。
4. **数据**：`invite_tasks` 表新增记录，`leads.status` 流转为 `inviting`，若scheduled_time已填则谈案岗工作台同步显示"明日到所客户"。
5. **响应**：返回InviteTask对象，前端弹出"邀约成功，已通知谈案岗"。

#### **8. 异常场景**
1. **线索不存在**：返回404，提示"线索不存在，请刷新列表"。
2. **录音文件超过100MB**：上传返回413，提示"录音文件过大（超过100MB），请检查录音设备"。
3. **预约时间早于当前**：返回400，提示"预约时间必须晚于当前时间"。
4. **录音上传失败**：先创建任务（`recording_url=null`），后台异步重试上传，前端提示"录音暂存本地，将在网络恢复后上传"。

#### **9. 验收标准**
- **场景1（正常-邀约成功）**：Given user-002为邀约岗且lead-001已分配，When 创建邀约任务inviteMethod=phone、result=success、scheduledTime=明日14:00，Then 返回201，`invite_tasks.status=invited`，`leads.status=inviting`，谈案岗工作台次日14:00时段显示该客户。
- **场景2（边界-无效线索）**：Given 邀约时发现phone为空号，When 创建任务result=invalid，Then `invite_tasks.status=pending`，自动触发线索回收到公海池（`recycle_reason=manual`，note="空号"）。
- **场景3（异常-录音上传失败）**：Given 网络异常，When 上传录音超时，Then 任务仍创建成功，`recording_url=null`，前端展示"录音上传失败，已暂存本地"，后台24小时内重试上传。

---

#### 3.7 谈案岗专属管理

#### **1. 功能描述**
谈案岗专属工作台，展示今日到所客户、待跟进商机、签约列表，自动同步邀约岗填写的客户信息，支持录入谈案记录、商机阶段更新、报价方案管理，签约后一键发起立案申请。

#### **2. 用户故事**
- 作为谈案岗员工，我希望邀约岗的预约信息能自动同步到我的工作台，以便我提前准备谈案材料，无需重复录入。
- 作为谈案岗员工，我希望签约后一键发起立案，以便客户与商机信息自动带入案件系统。

#### **3. 业务规则**
1. **工作台数据来源**：
   - 今日到所：`GET /api/opportunities/today-arrivals` 返回 `negotiator_id=当前用户` 且今日 `scheduled_time` 的Opportunity
   - 待跟进商机：`GET /api/opportunities/pending` 返回 `status=active` 且 `stage=first_contact` 的商机
   - 已签约：`GET /api/opportunities/signed`
   - 已流失：`GET /api/opportunities/lost`
2. **商机阶段**：`OpportunityStage` 枚举 `first_contact|signed|lost`，阶段变更需记录 `OpportunityStageLog`。
3. **商机状态**：`OpportunityStatus` 枚举 `active|completed`，签约或流失后置为 `completed`。
4. **报价管理**：每个Opportunity可包含多个 `OpportunityQuoteItem`（报价项），支持增删改，`quote_amount` 自动汇总所有报价项 `amount*quantity` 之和。
5. **谈案记录**：`requirement_note`（需求记录）与 `plan_note`（方案记录）为text字段，支持多次更新。
6. **一键立案**：`POST /api/opportunities/:id/convert-to-case` 签约后创建Case，自动带入 `lead_id`、`client_id`、`case_type`、`service_fee`，调用CaseService.create。
7. **商机创建**：邀约任务 `status=arrived` 后自动创建Opportunity，`negotiator_id` 由规则分配或管理员指定。
8. **流失标记**：`POST /api/opportunities/:id/mark-lost` 需填写流失原因，`stage=lost`、`status=completed`。

#### **4. 输入/输出规范**

**输入字段（POST /api/opportunities 创建商机）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| lead_id | varchar | 是 | UUID，必须为有效Lead ID |
| requirement_note | text | 否 | 最大长度2000 |
| plan_note | text | 否 | 最大长度2000 |

**输入字段（POST /api/opportunities/:id/convert-to-case 一键立案）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_type | varchar | 否 | 枚举，默认取lead的case_type |
| case_description | text | 否 | 最大长度2000，默认取lead的case_description |
| service_fee | real | 否 | ≥0，默认取opportunity.actual_amount |

**输出结果**：返回Opportunity对象或Case对象（一键立案）。

#### **5. 数据模型**

**实体：Opportunity（opportunities表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| lead_id | varchar(36) | NOT NULL, FK | 关联线索ID |
| negotiator_id | varchar(36) | NOT NULL, FK | 谈案人ID |
| stage | varchar(20) | NOT NULL, DEFAULT 'first_contact' | 商机阶段枚举 |
| quote_amount | real | NULL | 报价总额（decimal 12,2） |
| actual_amount | real | NULL | 实际签约金额 |
| status | varchar(20) | NOT NULL, DEFAULT 'active' | 商机状态枚举 |
| requirement_note | text | NULL | 需求记录 |
| plan_note | text | NULL | 方案记录 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**实体：OpportunityQuoteItem（opportunity_quote_items表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| opportunity_id | varchar(36) | NOT NULL, FK | 关联商机ID |
| item_name | varchar(100) | NOT NULL | 报价项名称 |
| item_description | text | NULL | 报价项描述 |
| amount | real | NOT NULL | 单价（decimal 12,2） |
| quantity | integer | NOT NULL, DEFAULT 1 | 数量 |
| remark | text | NULL | 备注 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**实体：OpportunityStageLog（opportunity_stage_logs表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| opportunity_id | varchar(36) | NOT NULL, FK | 关联商机ID |
| from_stage | varchar(20) | NOT NULL | 变更前阶段 |
| to_stage | varchar(20) | NOT NULL | 变更后阶段 |
| remark | text | NULL | 变更备注 |
| operator_id | varchar(36) | NOT NULL, FK | 操作人ID |
| created_at | datetime | NOT NULL | 创建时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/opportunities | 分页查询商机 | JWT |
| GET | /api/opportunities/today-arrivals | 今日到所列表 | JWT |
| GET | /api/opportunities/pending | 待跟进商机 | JWT |
| GET | /api/opportunities/signed | 已签约列表 | JWT |
| GET | /api/opportunities/lost | 已流失列表 | JWT |
| GET | /api/opportunities/:id | 商机详情 | JWT |
| POST | /api/opportunities | 创建商机 | JWT |
| PUT | /api/opportunities/:id/stage | 更新商机阶段 | JWT |
| PUT | /api/opportunities/:id/info | 更新商机信息（需求/方案） | JWT |
| POST | /api/opportunities/:id/quote-items | 添加报价项 | JWT |
| PUT | /api/opportunities/:id/quote-items/:itemId | 更新报价项 | JWT |
| DELETE | /api/opportunities/:id/quote-items/:itemId | 删除报价项 | JWT |
| POST | /api/opportunities/:id/convert-to-case | 一键立案（签约转化） | JWT |
| POST | /api/opportunities/:id/mark-lost | 标记流失 | JWT |

**请求示例（POST /api/opportunities/opp-uuid-001/convert-to-case）**：
```json
{
  "case_type": "marriage",
  "case_description": "离婚财产分割案件，结婚5年，有一子，财产涉及房产1套、车辆1辆",
  "service_fee": 50000
}
```

**成功响应（201 Created）**：
```json
{
  "case_id": "case-uuid-001",
  "case_no": "MARRIAGE-2026-0001",
  "opportunity_id": "opp-uuid-001",
  "lead_id": "lead-uuid-001",
  "client_id": "lead-uuid-001",
  "case_type": "marriage",
  "service_fee": 50000,
  "status": "pending_assign",
  "created_at": "2026-07-25T11:00:00.000Z"
}
```

**失败响应（400 Bad Request）**：
```json
{
  "statusCode": 400,
  "message": "商机当前阶段非signed，无法立案",
  "error": "Bad Request"
}
```

#### **7. 交互流程**
1. **用户操作**：谈案岗在工作台点击"今日到所"客户，进入商机详情页，谈案完成后点击"一键立案"。
2. **前端**：POST `/api/opportunities/:id/convert-to-case`，body含case_type、case_description、service_fee。
3. **后端**：OpportunityController.convertToCase → 校验 `stage=signed` → 调用CaseService.create创建Case → 更新 `opportunity.status=completed` → 同步立案通知至财务、合规系统。
4. **数据**：`cases` 表新增记录（client_id=lead_id，service_fee=50000），`opportunities.status=completed`。
5. **响应**：返回case_id与case_no，前端跳转至案件详情页，提示"立案成功，案件编号MARRIAGE-2026-0001"。

#### **8. 异常场景**
1. **商机未签约即立案**：返回400，提示"商机当前阶段非signed，请先完成签约动作"。
2. **重复立案**：同一Opportunity已转化过Case，返回409，提示"该商机已立案，不可重复操作"。
3. **报价项金额为负**：返回400，提示"报价项金额必须≥0"。
4. **谈案人非当前用户**：返回403，提示"无权操作他人商机"。

#### **9. 验收标准**
- **场景1（正常-一键立案）**：Given opp-001的stage=signed、actual_amount=50000，When 谈案人提交一键立案，Then 返回201，`cases` 表新增记录 `service_fee=50000`，`opportunities.status=completed`，`case_no` 自动生成。
- **场景2（边界-报价汇总）**：Given opp-001有2个报价项（amount=30000/quantity=1, amount=10000/quantity=2），When 查询商机详情，Then `quote_amount=50000`（30000+10000*2）。
- **场景3（异常-未签约立案）**：Given opp-001的stage=first_contact，When 提交一键立案，Then 返回400，错误信息"商机当前阶段非signed，无法立案"，`cases` 表无新增。

---

#### 3.8 谈案标准化SOP

#### **1. 功能描述**
预置高频案由谈案SOP模板，包含风险告知、需求确认、方案讲解、报价、签约等强制节点，未完成强制节点无法推进至签约，规范谈案动作、降低合规风险。

#### **2. 用户故事**
- 作为合规专员，我希望"诉讼风险告知"为强制节点，以便谈案人员必须完成风险告知才能签约，规避执业风险。
- 作为谈案主管，我希望按案由配置不同的SOP模板，以便婚姻家事与交通事故的谈案流程差异化。

#### **3. 业务规则**
1. **SOP模板字段**：`TalkSOP` 含 `name`、`case_type`、`nodes`（JSON数组）、`is_default`、`enabled`。
2. **节点结构**：`TalkSOPNode` 包含 `node_id`、`node_name`、`node_type`、`is_required`、`order`、`description`。
3. **节点类型**：`TalkSOPNodeType` 枚举 `info_input|material_upload|compliance_check|signature_confirm`。
4. **强制节点**：`is_required=true` 的节点必须完成才能推进至签约阶段（`stage=signed`）。
5. **默认模板**：每个 `case_type` 仅允许1个 `is_default=true` 模板，新商机创建时按案由自动匹配默认模板。
6. **节点完成状态**：`OpportunitySOPProgress` 记录每个节点的 `status`（pending/completed）、`completed_at`、`completed_by`。
7. **完成百分比**：`GET /api/talk-sop/opportunity/:opportunityId/completion` 返回已完成节点数/总节点数百分比。
8. **节点回退**：支持 `uncomplete` 取消完成，但签约后不可回退。
9. **模板启停**：`enabled=false` 的模板不参与匹配，已有商机的SOP进度不受影响。

#### **4. 输入/输出规范**

**输入字段（POST /api/talk-sop 创建SOP模板）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| name | varchar | 是 | 最大长度64 |
| case_type | varchar | 否 | 案由枚举 |
| nodes | array | 是 | 至少1个节点 |
| nodes[].node_id | varchar | 否 | UUID，未填则自动生成 |
| nodes[].node_name | varchar | 是 | 最大长度64 |
| nodes[].node_type | varchar | 否 | 枚举，默认info_input |
| nodes[].is_required | boolean | 否 | 默认false |
| nodes[].order | integer | 否 | 默认按数组顺序 |
| nodes[].description | text | 否 | 最大长度500 |
| is_default | boolean | 否 | 默认false |

**输出结果**：返回完整TalkSOP对象，含nodes JSON解析后的数组。

#### **5. 数据模型**

**实体：TalkSOP（talk_sops表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| name | varchar(64) | NOT NULL | 模板名称 |
| case_type | varchar(20) | NULL | 适用案由 |
| nodes | text | NOT NULL | JSON节点列表 |
| is_default | boolean | NOT NULL, DEFAULT 0 | 是否默认模板 |
| enabled | boolean | NOT NULL, DEFAULT 1 | 是否启用 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**实体：OpportunitySOPProgress（opportunity_sop_progress表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| opportunity_id | varchar(36) | NOT NULL, FK | 关联商机ID |
| node_id | varchar(36) | NOT NULL | 节点ID |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 节点状态枚举 |
| completed_at | datetime | NULL | 完成时间 |
| completed_by | varchar(36) | NULL, FK | 完成操作人ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/talk-sop | 创建SOP模板 | JWT |
| PUT | /api/talk-sop/:id | 编辑SOP模板 | JWT |
| DELETE | /api/talk-sop/:id | 删除SOP模板 | JWT |
| GET | /api/talk-sop | 查询SOP模板列表（支持case_type/enabled筛选） | JWT |
| GET | /api/talk-sop/:id | SOP详情 | JWT |
| POST | /api/talk-sop/:id/set-default | 设置默认SOP | JWT |
| POST | /api/talk-sop/:id/toggle-enabled | 启停SOP | JWT |
| GET | /api/talk-sop/opportunity/:opportunityId/progress | 商机SOP进度 | JWT |
| POST | /api/talk-sop/opportunity/:opportunityId/node/:nodeId/complete | 完成节点 | JWT |
| POST | /api/talk-sop/opportunity/:opportunityId/node/:nodeId/uncomplete | 取消完成节点 | JWT |
| GET | /api/talk-sop/opportunity/:opportunityId/completion | SOP完成百分比 | JWT |

**请求示例（POST /api/talk-sop）**：
```json
{
  "name": "婚姻家事标准谈案SOP",
  "case_type": "marriage",
  "nodes": [
    { "node_name": "诉讼风险告知", "node_type": "compliance_check", "is_required": true, "order": 1, "description": "必须告知客户诉讼风险，并签字确认" },
    { "node_name": "需求确认", "node_type": "info_input", "is_required": true, "order": 2 },
    { "node_name": "方案讲解", "node_type": "info_input", "is_required": false, "order": 3 },
    { "node_name": "报价", "node_type": "info_input", "is_required": true, "order": 4 },
    { "node_name": "签约", "node_type": "signature_confirm", "is_required": true, "order": 5 }
  ],
  "is_default": true
}
```

**成功响应（201 Created）**：
```json
{
  "id": "sop-uuid-001",
  "name": "婚姻家事标准谈案SOP",
  "case_type": "marriage",
  "nodes": "[{\"node_id\":\"node-001\",\"node_name\":\"诉讼风险告知\",\"node_type\":\"compliance_check\",\"is_required\":true,\"order\":1,\"description\":\"必须告知客户诉讼风险，并签字确认\"},...]",
  "is_default": true,
  "enabled": true,
  "created_at": "2026-07-25T10:00:00.000Z",
  "updated_at": "2026-07-25T10:00:00.000Z"
}
```

**失败响应（400 Bad Request）**：
```json
{
  "statusCode": 400,
  "message": "该案由已存在默认SOP，请先取消原默认",
  "error": "Bad Request"
}
```

#### **7. 交互流程**
1. **用户操作**：管理员在"SOP模板"页点击"新建模板"，填写名称、案由、节点列表。
2. **前端**：POST `/api/talk-sop`，nodes数组前端序列化为JSON字符串。
3. **后端**：TalkSOPController.createSOP → 校验案由下默认SOP唯一性 → 自动生成node_id → 持久化。
4. **数据**：`talk_sops` 表新增记录，新商机创建时按 `case_type` 匹配默认SOP，初始化 `opportunity_sop_progress` 记录。
5. **响应**：返回TalkSOP对象，谈案岗在商机详情页看到SOP节点checklist。

#### **8. 异常场景**
1. **强制节点未完成尝试签约**：`PUT /api/opportunities/:id/stage` 校验SOP进度，未完成返回400，提示"未完成强制节点：诉讼风险告知，无法签约"。
2. **重复设置默认**：案由下已有默认SOP时再设置默认返回400，提示"该案由已存在默认SOP，请先取消原默认"。
3. **节点ID不存在**：complete操作时nodeId无效返回404，提示"节点不存在，请刷新SOP模板"。
4. **签约后回退节点**：返回403，提示"商机已签约，不可回退已完成节点"。

#### **9. 验收标准**
- **场景1（正常-完成节点）**：Given opp-001的SOP有5个节点（3个强制），When 谈案人完成所有强制节点，Then `opportunity_sop_progress` 表3条记录 `status=completed`，`completion=100%`，可推进至signed阶段。
- **场景2（边界-强制节点未完成）**：Given opp-001有1个强制节点未完成，When 谈案人尝试 `PUT stage=signed`，Then 返回400，错误信息"未完成强制节点：诉讼风险告知，无法签约"，`stage` 仍为 `first_contact`。
- **场景3（异常-重复默认）**：Given marriage案由已有默认SOP-001，When 创建新SOP-002并is_default=true，Then 返回400，错误信息"该案由已存在默认SOP，请先取消原默认"。

---

#### 3.9 谈案AI合规辅助

#### **1. 功能描述**
谈案过程中（通话/聊天）实时识别违规表述（包胜诉、100%成功、违规承诺），即时弹窗提醒；自动匹配合规话术与风险告知模板；违规记录同步至合规风控模块生成预警。

#### **2. 用户故事**
- 作为谈案岗员工，我希望通话中说错话时能立即收到提醒，以便我及时纠正，避免违规承诺客户。
- 作为合规专员，我希望所有违规表述自动记录并预警，以便我事后审查与培训改进。

#### **3. 业务规则**
1. **实时识别**：通话进行中通过ASR流式转写，每3秒推送一次转写文本至合规AI服务，识别违规关键词。
2. **违规关键词库**：预置违规词分类（包胜诉类、100%成功类、违规承诺类、贬低同行类、虚假宣传类），管理员可维护。
3. **弹窗提醒**：识别到违规时500ms内弹窗，提示"⚠️ 检测到违规表述：包胜诉，建议改为：根据案件情况评估胜诉可能性"。
4. **合规话术推荐**：根据案由自动匹配合规话术模板，谈案人可一键引用至聊天框。
5. **风险告知模板**：按案由预置风险告知模板，谈案人点击"发送风险告知"自动生成PDF并发送客户。
6. **违规记录同步**：每次违规记录写入 `compliance_records` 表（关联lead_id/opportunity_id），同步至合规风控模块生成预警。
7. **离线模式**：网络异常时本地缓存转写文本，网络恢复后批量上传识别。
8. **隐私保护**：通话录音与转写文本加密存储，仅负责员工与合规专员可访问。

#### **4. 输入/输出规范**

**输入字段（POST /api/talk-compliance/realtime-check 实时识别）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| opportunity_id | varchar | 是 | UUID |
| text | text | 是 | 待识别文本，最大长度2000 |
| talk_type | varchar | 是 | 枚举：call/chat |

**输出结果**：
```json
{
  "violations": [
    { "keyword": "包胜诉", "category": "包胜诉类", "suggestion": "根据案件情况评估胜诉可能性", "position": 12 }
  ],
  "compliance_phrases": [
    { "phrase_id": "p001", "content": "根据您描述的情况，案件胜诉率约为60%-70%", "case_type": "marriage" }
  ],
  "checked_at": "2026-07-25T10:00:00.000Z"
}
```

#### **5. 数据模型**

**新增实体：ComplianceRecord（compliance_records表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| opportunity_id | varchar(36) | NULL, FK | 关联商机ID |
| lead_id | varchar(36) | NULL, FK | 关联线索ID |
| violation_keyword | varchar(64) | NOT NULL | 违规关键词 |
| violation_category | varchar(32) | NOT NULL | 违规分类 |
| original_text | text | NULL | 原始文本片段 |
| suggestion | text | NULL | 合规建议 |
| talk_type | varchar(20) | NOT NULL | call/chat |
| talk_time | datetime | NOT NULL | 通话/聊天时间 |
| handler_id | varchar(36) | NULL | 谈案人ID |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 处理状态：pending/resolved |
| created_at | datetime | NOT NULL | 创建时间 |

> 说明：本表为新增表，与合规风控模块共享，不修改现有TalkSOP实体。

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/talk-compliance/realtime-check | 实时合规识别 | JWT |
| GET | /api/talk-compliance/records | 查询违规记录列表 | JWT |
| GET | /api/talk-compliance/records/:id | 违规记录详情 | JWT |
| PUT | /api/talk-compliance/records/:id/resolve | 标记违规已处理 | JWT |
| GET | /api/talk-compliance/phrases | 查询合规话术库（支持case_type筛选） | JWT |
| POST | /api/talk-compliance/risk-notice/:opportunityId | 生成并发送风险告知PDF | JWT |

**请求示例（POST /api/talk-compliance/realtime-check）**：
```json
{
  "opportunity_id": "opp-uuid-001",
  "text": "您放心，这个案件我们包胜诉，100%能赢",
  "talk_type": "call"
}
```

**成功响应（200 OK）**：
```json
{
  "violations": [
    { "keyword": "包胜诉", "category": "包胜诉类", "suggestion": "根据案件情况评估胜诉可能性", "position": 12 },
    { "keyword": "100%能赢", "category": "100%成功类", "suggestion": "根据现有证据，案件胜诉率较高", "position": 18 }
  ],
  "compliance_phrases": [
    { "phrase_id": "p001", "content": "根据您描述的情况和现有证据，案件胜诉率约为60%-70%", "case_type": "marriage" }
  ],
  "checked_at": "2026-07-25T10:00:00.000Z"
}
```

**失败响应（503 Service Unavailable）**：
```json
{
  "statusCode": 503,
  "message": "合规AI服务暂不可用，已缓存文本待重试",
  "error": "Service Unavailable"
}
```

#### **7. 交互流程**
1. **用户操作**：谈案岗与客户通话中，ASR实时转写并每3秒推送文本。
2. **前端**：WebRTC通话SDK集成合规插件，每3秒POST `/api/talk-compliance/realtime-check`。
3. **后端**：TalkComplianceService → 调用合规AI（关键词匹配+语义模型）→ 命中违规则写入 `compliance_records` 表 → 同步触发合规风控模块预警。
4. **数据**：`compliance_records` 表新增记录，前端弹窗展示违规关键词与建议话术。
5. **响应**：返回违规列表与合规话术，前端弹窗+话术推荐面板。

#### **8. 异常场景**
1. **AI服务超时**：3秒未返回则前端继续通话，文本进入本地缓存队列，每30秒重试一次，提示"合规AI暂不可用，文本已缓存"。
2. **违规关键词命中但谈案人忽略**：违规记录仍写入数据库，事后合规专员可在违规列表中查看并标记"已处理/需培训"。
3. **风险告知PDF生成失败**：返回500，提示"风险告知PDF生成失败，请稍后重试或手动下载模板填写"。
4. **通话录音丢失**：转写文本仍可识别，但 `original_text` 字段标记"录音丢失，仅文本存档"。

#### **9. 验收标准**
- **场景1（正常-识别违规）**：Given 谈案人通话中说"包胜诉"，When 实时识别接口收到文本，Then 返回violations数组含1条"包胜诉"记录，`compliance_records` 表新增1条记录，前端500ms内弹窗。
- **场景2（边界-无违规）**：Given 谈案人通话内容为合规表述，When 实时识别，Then 返回violations=[]，不写入compliance_records。
- **场景3（异常-AI服务不可用）**：Given 合规AI服务宕机，When 实时识别请求，Then 返回503，文本缓存至本地，通话不中断，30秒后自动重试。

---

#### 3.10 客户资产交接管理

#### **1. 功能描述**
员工离职或调岗时，管理员一键移交其名下全部客户、线索、商机、案件资产，移交内容包括客户档案、聊天记录、通话录音、跟进记录、待办任务，移交后原员工失去客户查看权限，操作日志全留存。

#### **2. 用户故事**
- 作为律所主任，我希望员工离职时能一键将其名下客户转交给接替人，以便客户服务不中断。
- 作为合规专员，我希望交接后原员工立即失去客户访问权限，以便保护客户隐私与商业资产。

#### **3. 业务规则**
1. **权限限制**：仅 `super_admin`/`org_admin` 可发起交接（`POST /api/handover/initiate`）与批量移交（`POST /api/handover/batch-transfer`）。
2. **交接类型**：`HandoverType` 枚举 `transfer`（调岗）/ `resignation`（离职）/ `batch`（批量）。
3. **交接范围**：可选 `lead_ids`、`opportunity_ids`、`case_ids` 数组，留空则移交全部资产。
4. **交接状态**：`HandoverStatus` 枚举 `pending`（待确认）/ `completed`（已完成）/ `rejected`（已拒绝）。
5. **两步确认**：initiate后状态为 `pending`，接收人 `PUT /api/handover/:id/confirm` 确认后状态为 `completed`，原员工权限即时收回。
6. **批量直接移交**：`batch-transfer` 由管理员直接执行，无需接收人确认，立即完成。
7. **资产查询**：`GET /api/handover/user-assets/:userId` 查询用户名下所有资产清单（线索数、商机数、案件数）。
8. **权限回收**：交接完成后，原员工的 `assign_sales_id`、`negotiator_id`、`assignee_lawyer_id` 字段全部更新为接收人ID。
9. **审计日志**：交接记录含 `from_user_id`、`to_user_id`、`handover_note`、`completed_at`，永久留存不可删除。

#### **4. 输入/输出规范**

**输入字段（POST /api/handover/initiate 发起交接）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| from_user_id | varchar | 是 | UUID，必须为同组织内有效用户 |
| to_user_id | varchar | 是 | UUID，必须为同组织内有效用户，且≠from_user_id |
| handover_type | varchar | 是 | 枚举：transfer/resignation/batch |
| lead_ids | array | 否 | UUID数组，留空则全部 |
| opportunity_ids | array | 否 | UUID数组，留空则全部 |
| case_ids | array | 否 | UUID数组，留空则全部 |
| handover_note | text | 否 | 最大长度1000 |

**输出结果**：返回HandoverLog对象，含交接范围与状态。

#### **5. 数据模型**

**实体：HandoverLog（handover_logs表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| from_user_id | varchar(36) | NOT NULL, FK | 原归属人ID |
| to_user_id | varchar(36) | NOT NULL, FK | 接收人ID |
| handover_type | varchar(20) | NOT NULL | 交接类型枚举 |
| lead_ids | text | NULL | simple-json，线索ID数组 |
| opportunity_ids | text | NULL | simple-json，商机ID数组 |
| case_ids | text | NULL | simple-json，案件ID数组 |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 交接状态枚举 |
| handover_note | text | NULL | 交接备注 |
| completed_at | datetime | NULL | 完成时间 |
| created_at | datetime | NOT NULL | 创建时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/handover/initiate | 发起交接（仅管理员） | JWT（org_admin/super_admin） |
| PUT | /api/handover/:id/confirm | 确认交接 | JWT |
| PUT | /api/handover/:id/reject | 拒绝交接 | JWT |
| GET | /api/handover | 查询交接记录列表 | JWT |
| GET | /api/handover/:id | 查询单个交接记录 | JWT |
| GET | /api/handover/user-assets/:userId | 查询用户资产清单 | JWT（org_admin/super_admin或本人） |
| POST | /api/handover/batch-transfer | 批量直接移交（仅管理员） | JWT（org_admin/super_admin） |

**请求示例（POST /api/handover/initiate）**：
```json
{
  "from_user_id": "user-uuid-002",
  "to_user_id": "user-uuid-003",
  "handover_type": "resignation",
  "handover_note": "员工离职，全部客户移交接替人"
}
```

**成功响应（201 Created）**：
```json
{
  "id": "handover-uuid-001",
  "from_user_id": "user-uuid-002",
  "to_user_id": "user-uuid-003",
  "handover_type": "resignation",
  "lead_ids": ["lead-uuid-001", "lead-uuid-002"],
  "opportunity_ids": ["opp-uuid-001"],
  "case_ids": ["case-uuid-001"],
  "status": "pending",
  "handover_note": "员工离职，全部客户移交接替人",
  "completed_at": null,
  "created_at": "2026-07-25T10:00:00.000Z"
}
```

**失败响应（403 Forbidden）**：
```json
{
  "statusCode": 403,
  "message": "只有管理员可以发起交接",
  "error": "Forbidden"
}
```

#### **7. 交互流程**
1. **用户操作**：管理员在"客户交接"页选择离职员工与接收人，填写交接备注，点击"发起交接"。
2. **前端**：POST `/api/handover/initiate`，body含from_user_id、to_user_id、handover_type。
3. **后端**：HandoverController.initiateHandover → 校验当前用户角色为管理员 → 查询from_user名下全部资产 → 创建HandoverLog记录（status=pending）→ 推送通知给接收人。
4. **数据**：`handover_logs` 表新增记录，资产ID序列化为simple-json存储。
5. **响应**：返回HandoverLog对象，接收人在工作台收到"待确认交接"通知。

#### **8. 异常场景**
1. **非管理员发起交接**：返回403，提示"只有管理员可以发起交接"。
2. **from_user与to_user相同**：返回400，提示"原归属人与接收人不能为同一人"。
3. **接收人拒绝交接**：`status=rejected`，原归属人权限不变，管理员收到通知"接收人user-003拒绝交接，请重新指定"。
4. **跨组织交接**：from_user与to_user不同组织返回400，提示"仅支持同组织内交接"。
5. **查看他人资产无权限**：非管理员且非本人查询返回403，提示"无权查看该用户资产"。

#### **9. 验收标准**
- **场景1（正常-确认交接）**：Given 管理员发起user-002→user-003的离职交接（含2条线索1条商机1条案件），When user-003确认交接，Then `handover_logs.status=completed`，`leads.assign_sales_id`、`opportunities.negotiator_id`、`cases.assignee_lawyer_id` 全部更新为user-003，user-002失去访问权限。
- **场景2（边界-批量直接移交）**：Given 管理员调用batch-transfer，When 提交from=user-002、to=user-003，Then 无需接收人确认，立即完成，`status=completed`，`completed_at` 自动填充。
- **场景3（异常-非管理员发起）**：Given 普通sales角色用户调用initiate，When 后端校验角色，Then 返回403，错误信息"只有管理员可以发起交接"，`handover_logs` 表无新增。

---

#### 3.11 AI营销工作手机适配

#### **1. 功能描述**
配套硬件营销手机与系统原生打通，手机端微信聊天、通话记录自动回传系统且员工无法删除；支持敏感操作（删除好友、私发联系方式、转账）实时预警；手机端可查看线索、跟进客户、外呼，数据与PC端实时同步。

#### **2. 用户故事**
- 作为邀约岗员工，我希望在营销手机上直接查看分配给我的线索并外呼，以便我离开工位时也能跟进客户。
- 作为律所主任，我希望员工删除微信好友或私发联系方式能实时预警，以便我防止客户资产流失。

#### **3. 业务规则**
1. **手机绑定**：每台营销手机绑定一个员工账号，手机IMEI与 `user_id` 一一对应，绑定关系存储在 `device_bindings` 表。
2. **数据回传**：
   - 微信聊天记录：每5分钟增量同步至系统，存储在 `chat_logs` 表，员工不可删除。
   - 通话记录：通话结束即回传，含号码、时长、录音URL。
   - 通讯录变更：好友增删实时回传。
3. **敏感操作预警**：
   - 删除微信好友：立即推送预警至管理员，含好友微信号、客户手机号。
   - 私发联系方式（手机号、微信号、邮箱）：消息发送前AI识别，命中则拦截+预警。
   - 转账/红包：发送前需管理员审批，未经审批直接拦截。
4. **手机端功能**：
   - 线索列表：复用 `/api/leads` 接口，按 `assign_sales_id=当前用户` 筛选。
   - 跟进客户：复用 `/api/leads/:id/follow-up` 接口。
   - 外呼：调用手机原生拨号+录音SDK，通话结束调用 `/api/invite-tasks/create`。
5. **数据同步**：手机端与PC端数据通过WebSocket实时双向同步，离线时本地SQLite缓存，联网后增量同步。
6. **远程管控**：管理员可远程锁定手机（禁用微信、拨号），锁定后手机仅可查看不可操作。
7. **隐私合规**：手机使用前需员工签署《数据采集知情同意书》，存储在 `device_bindings.consent_file_url`。

#### **4. 输入/输出规范**

**输入字段（POST /api/devices/bind 绑定手机）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| imei | varchar | 是 | 15位数字，全系统唯一 |
| user_id | varchar | 是 | UUID，必须为有效员工 |
| device_model | varchar | 否 | 最大长度64 |
| consent_file_url | varchar | 是 | URL格式，知情同意书PDF |

**输入字段（POST /api/devices/sensitive-alert 敏感操作预警）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| device_id | varchar | 是 | UUID |
| alert_type | varchar | 是 | 枚举：delete_friend/send_contact/transfer |
| alert_detail | text | 是 | JSON详情 |
| occurred_at | datetime | 是 | ISO8601 |

**输出结果**：返回绑定结果或预警处理结果。

#### **5. 数据模型**

**新增实体：DeviceBinding（device_bindings表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| imei | varchar(15) | NOT NULL, UNIQUE | 手机IMEI |
| user_id | varchar(36) | NOT NULL, FK | 绑定员工ID |
| device_model | varchar(64) | NULL | 设备型号 |
| consent_file_url | varchar(500) | NOT NULL | 知情同意书URL |
| is_locked | boolean | NOT NULL, DEFAULT 0 | 是否锁定 |
| last_sync_at | datetime | NULL | 最后同步时间 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**新增实体：ChatLog（chat_logs表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| device_id | varchar(36) | NOT NULL, FK | 设备ID |
| user_id | varchar(36) | NOT NULL, FK | 员工ID |
| lead_id | varchar(36) | NULL, FK | 关联线索ID（自动匹配） |
| chat_type | varchar(20) | NOT NULL | 枚举：wechat_wechat/wechat_group |
| direction | varchar(10) | NOT NULL | 枚举：in/out |
| content | text | NOT NULL | 消息内容 |
| sent_at | datetime | NOT NULL | 消息发送时间 |
| created_at | datetime | NOT NULL | 创建时间 |

**新增实体：SensitiveAlert（sensitive_alerts表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| device_id | varchar(36) | NOT NULL, FK | 设备ID |
| user_id | varchar(36) | NOT NULL, FK | 员工ID |
| alert_type | varchar(20) | NOT NULL | 预警类型枚举 |
| alert_detail | text | NOT NULL | JSON详情 |
| occurred_at | datetime | NOT NULL | 发生时间 |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 处理状态 |
| handled_by | varchar(36) | NULL, FK | 处理人ID |
| handle_note | text | NULL | 处理备注 |
| created_at | datetime | NOT NULL | 创建时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/devices/bind | 绑定营销手机 | JWT（org_admin/super_admin） |
| DELETE | /api/devices/:id/unbind | 解绑手机 | JWT（org_admin/super_admin） |
| GET | /api/devices | 查询设备列表 | JWT |
| PUT | /api/devices/:id/lock | 远程锁定手机 | JWT（org_admin/super_admin） |
| PUT | /api/devices/:id/unlock | 远程解锁 | JWT（org_admin/super_admin） |
| POST | /api/devices/chat-sync | 聊天记录批量同步 | JWT（设备token） |
| POST | /api/devices/sensitive-alert | 上报敏感操作 | JWT（设备token） |
| GET | /api/devices/sensitive-alerts | 查询敏感预警列表 | JWT |
| PUT | /api/devices/sensitive-alerts/:id/handle | 处理预警 | JWT（org_admin/super_admin） |

**请求示例（POST /api/devices/sensitive-alert）**：
```json
{
  "device_id": "device-uuid-001",
  "alert_type": "delete_friend",
  "alert_detail": "{\"friend_wechat\":\"wxid_abc123\",\"friend_phone\":\"13800138000\",\"lead_id\":\"lead-uuid-001\"}",
  "occurred_at": "2026-07-25T10:00:00.000Z"
}
```

**成功响应（201 Created）**：
```json
{
  "id": "alert-uuid-001",
  "device_id": "device-uuid-001",
  "user_id": "user-uuid-002",
  "alert_type": "delete_friend",
  "alert_detail": "{\"friend_wechat\":\"wxid_abc123\",\"friend_phone\":\"13800138000\",\"lead_id\":\"lead-uuid-001\"}",
  "occurred_at": "2026-07-25T10:00:00.000Z",
  "status": "pending",
  "created_at": "2026-07-25T10:00:00.000Z",
  "notification_sent": true
}
```

**失败响应（400 Bad Request）**：
```json
{
  "statusCode": 400,
  "message": "设备未绑定或已锁定，无法上报",
  "error": "Bad Request"
}
```

#### **7. 交互流程**
1. **用户操作**：员工在营销手机上删除微信好友。
2. **手机端SDK**：监听到删除操作，立即POST `/api/devices/sensitive-alert`。
3. **后端**：DeviceController.sensitiveAlert → 写入 `sensitive_alerts` 表 → 通过WebSocket/IM推送预警给管理员。
4. **数据**：`sensitive_alerts` 表新增记录，`notification_sent=true` 标记已推送。
5. **响应**：返回预警对象，管理员PC端/手机端弹窗"⚠️ 员工user-002删除了客户wxid_abc123（手机号13800138000）"。

#### **8. 异常场景**
1. **设备未绑定**：上报返回400，提示"设备未绑定或已锁定，无法上报"，手机端本地缓存预警待绑定后补传。
2. **网络异常**：手机端本地SQLite缓存预警与聊天记录，网络恢复后批量上传，最长缓存7天。
3. **IMEI重复绑定**：返回400，提示"该IMEI已绑定其他员工，请先解绑"。
4. **远程锁定后操作**：手机端操作被拦截，提示"设备已被管理员锁定，请联系管理员"。

#### **9. 验收标准**
- **场景1（正常-聊天同步）**：Given user-002的营销手机与客户微信聊天10条，When 手机端每5分钟同步，Then `chat_logs` 表新增10条记录，PC端客户档案实时展示聊天记录。
- **场景2（边界-敏感预警）**：Given user-002在营销手机删除客户微信好友，When SDK上报alert_type=delete_friend，Then `sensitive_alerts` 表新增记录，管理员在3秒内收到弹窗预警。
- **场景3（异常-设备未绑定）**：Given 未绑定IMEI=123456789012345的设备上报预警，When 后端校验device_id，Then 返回400，错误信息"设备未绑定或已锁定"，预警缓存在手机本地。

---

### 模块4：标准化案件办案管理系统

#### 4.1 案件立案管理

#### **1. 功能描述**
谈案签约后一键发起立案申请，自动带入客户信息、案由、签约金额，立案需完成正式利益冲突检索、委托合同上传、办案律师指派，审批通过后生成唯一案件编号，正式进入办案流程，并同步至财务、合规、C端客户端口。

#### **2. 用户故事**
- 作为谈案岗员工，我希望签约后一键立案，以便客户信息与签约金额自动带入案件系统，无需重复录入。
- 作为律所主任，我希望立案审批通过后才生成正式案件编号，以便严格控制案件入口合规性。

#### **3. 业务规则**
1. **立案入口**：谈案端通过 `POST /api/opportunities/:id/convert-to-case` 一键发起，自动带入 `lead_id`、`client_id`、`case_type`、`service_fee`。
2. **正式利冲检索**：立案时执行正式利冲检索（区别于线索入库时的初查），检索范围扩大至对方当事人、关联企业、利益关系人。
3. **委托合同上传**：必须上传委托代理合同PDF至 `documents` 表，未上传不可审批通过。
4. **办案律师指派**：`PUT /api/cases/:id/assign` 指派 `assignee_lawyer_id`，律师角色必须为 `lawyer`。
5. **案件编号生成**：审批通过后按规则生成 `case_no`（格式：案由大写-年份-流水号，如MARRIAGE-2026-0001），全系统唯一。
6. **状态流转**：`CaseStatus` 枚举 `pending_assign`（待指派）→ `processing`（办理中）→ `filing`（立案）→ `evidence`（举证）→ `hearing`（开庭）→ `appeal`（上诉）→ `pending_close`（待结案）→ `closed`（已结案）。
7. **同步通知**：立案审批通过后同步至财务系统（生成应收账款）、合规系统（建档监控）、C端客户端口（客户可查看案件进度）。
8. **风险等级**：立案时默认 `risk_level=low`，可根据案件标的、客户类型调整为 `medium`/`high`。

#### **4. 输入/输出规范**

**输入字段（POST /api/cases 创建案件）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_type | varchar | 是 | 枚举：marriage/traffic/labor/debt/other |
| client_id | varchar | 是 | UUID，必须为有效Lead ID |
| organization_id | varchar | 是 | UUID |
| fee_amount | real | 否 | ≥0，标的额 |
| amount | real | 否 | ≥0，争议金额 |
| description | text | 否 | 最大长度2000 |
| case_no | varchar | 否 | 案件编号，留空自动生成 |
| client_name | varchar | 否 | 最大长度64 |
| client_phone | varchar | 否 | 11位手机号 |
| court | varchar | 否 | 受理法院 |
| filing_date | datetime | 否 | 立案日期 |
| expected_close_date | datetime | 否 | 预计结案日期，必须晚于filing_date |

**输出结果**：返回完整Case对象，含生成的 `id`、`case_no`、`status=pending_assign`。

#### **5. 数据模型**

**实体：Case（cases表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| case_type | varchar(20) | NOT NULL | 案由枚举 |
| status | varchar(20) | NOT NULL, DEFAULT 'pending_assign' | 案件状态枚举 |
| client_id | varchar(36) | NOT NULL | 客户ID（关联Lead ID） |
| assignee_lawyer_id | varchar(36) | NULL, FK | 主办律师ID |
| lead_id | varchar(36) | NULL, FK | 关联线索ID |
| fee_amount | real | NULL | 标的额（decimal 12,2） |
| service_fee | real | NULL | 服务费（decimal 12,2） |
| amount | real | NULL | 争议金额（decimal 12,2） |
| description | text | NULL | 案件描述 |
| deadline | datetime | NULL | 截止日期 |
| court | varchar(100) | NULL | 受理法院 |
| case_no | varchar(50) | NULL | 案件编号，唯一 |
| client_name | varchar(64) | NULL | 客户姓名 |
| client_phone | varchar(20) | NULL | 客户手机号 |
| filing_date | datetime | NULL | 立案日期 |
| expected_close_date | datetime | NULL | 预计结案日期 |
| risk_level | varchar(10) | NOT NULL, DEFAULT 'low' | 风险等级：low/medium/high |
| risk_notes | text | NULL | 风险备注 |
| is_overdue | boolean | NOT NULL, DEFAULT 0 | 是否超期 |
| organization_id | varchar(36) | NOT NULL, FK | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/cases | 创建案件 | JWT |
| GET | /api/cases | 分页查询案件（支持status/case_type/assignee_lawyer_id/case_no/client_name筛选） | JWT |
| GET | /api/cases/overdue | 查询超期案件 | JWT |
| GET | /api/cases/high-risk | 查询高风险案件 | JWT |
| GET | /api/cases/:id | 案件详情 | JWT |
| PUT | /api/cases/:id/status | 更新案件状态 | JWT |
| PUT | /api/cases/:id/assign | 指派主办律师 | JWT |
| PUT | /api/cases/:id/deadline | 更新截止日期 | JWT |
| POST | /api/cases/:id/documents | 上传案件文档 | JWT |
| GET | /api/cases/:id/documents | 查询案件文档列表 | JWT |
| POST | /api/cases/:id/close | 结案 | JWT |
| PUT | /api/cases/:id/risk | 更新风险等级 | JWT |
| POST | /api/cases/check-overdue | 检查超期案件（定时任务） | JWT |

**请求示例（POST /api/cases）**：
```json
{
  "case_type": "marriage",
  "client_id": "lead-uuid-001",
  "organization_id": "org-uuid-001",
  "fee_amount": 1000000,
  "service_fee": 50000,
  "description": "离婚财产分割案件，结婚5年，有一子，财产涉及房产1套、车辆1辆",
  "client_name": "王女士",
  "client_phone": "13800138000",
  "court": "北京市朝阳区人民法院",
  "filing_date": "2026-07-25T00:00:00.000Z",
  "expected_close_date": "2027-01-25T00:00:00.000Z"
}
```

**成功响应（201 Created）**：
```json
{
  "id": "case-uuid-001",
  "case_type": "marriage",
  "status": "pending_assign",
  "client_id": "lead-uuid-001",
  "assignee_lawyer_id": null,
  "lead_id": null,
  "fee_amount": 1000000,
  "service_fee": 50000,
  "amount": null,
  "description": "离婚财产分割案件，结婚5年，有一子，财产涉及房产1套、车辆1辆",
  "deadline": null,
  "court": "北京市朝阳区人民法院",
  "case_no": "MARRIAGE-2026-0001",
  "client_name": "王女士",
  "client_phone": "13800138000",
  "filing_date": "2026-07-25T00:00:00.000Z",
  "expected_close_date": "2027-01-25T00:00:00.000Z",
  "risk_level": "low",
  "risk_notes": null,
  "is_overdue": false,
  "organization_id": "org-uuid-001",
  "created_at": "2026-07-25T11:00:00.000Z",
  "updated_at": "2026-07-25T11:00:00.000Z"
}
```

**失败响应（400 Bad Request）**：
```json
{
  "statusCode": 400,
  "message": "client_id不存在或已删除",
  "error": "Bad Request"
}
```

#### **7. 交互流程**
1. **用户操作**：谈案岗在商机详情页点击"一键立案"，填写案件信息（部分自动带入）。
2. **前端**：POST `/api/cases`，body含client_id、case_type、service_fee等字段。
3. **后端**：CaseController.create → 校验client_id有效性 → 执行正式利冲检索 → 生成case_no（按案由+年份+流水号）→ 持久化 → 同步通知至财务/合规/C端。
4. **数据**：`cases` 表新增记录，`documents` 表自动关联委托合同（前端上传后），`case_no` 唯一约束校验。
5. **响应**：返回Case对象，前端跳转案件详情页，提示"立案成功，案件编号MARRIAGE-2026-0001"。

#### **8. 异常场景**
1. **正式利冲未通过**：返回400，提示"正式利冲检索未通过，案件存在冲突，请联系合规专员"，案件状态不变。
2. **委托合同未上传**：审批节点校验 `documents` 表无委托合同，返回400，提示"请先上传委托代理合同"。
3. **case_no 重复**：极小概率发生，捕获唯一约束错误后重试生成（流水号+1），最多重试3次，仍失败返回500，提示"案件编号生成失败，请联系管理员"。
4. **expected_close_date 早于 filing_date**：返回400，提示"预计结案日期必须晚于立案日期"。

#### **9. 验收标准**
- **场景1（正常-立案）**：Given 谈案岗提交完整案件信息且client_id有效，When POST /api/cases，Then 返回201，`cases` 表新增记录，`case_no=MARRIAGE-2026-0001`，`status=pending_assign`，财务/合规/C端同步收到通知。
- **场景2（边界-自动带入）**：Given 通过 `POST /api/opportunities/:id/convert-to-case` 一键立案，When 商机opp-001的actual_amount=50000，Then 创建的Case `service_fee=50000`，`client_id=opp-001.lead_id`，无需手动填写。
- **场景3（异常-利冲未通过）**：Given client_id对应客户在系统中为另一案件的对方当事人，When 立案时正式利冲检索，Then 返回400，错误信息"正式利冲检索未通过，案件存在冲突"，`cases` 表无新增。

---

#### 4.2 办案SOP模板管理

#### **1. 功能描述**
预置民事诉讼、刑事、劳动仲裁、交通事故、婚姻家事等高频案由标准办案流程模板，支持自定义任务节点、责任人、截止时间规则，案件创建时自动匹配对应案由模板生成全流程任务。

#### **2. 用户故事**
- 作为办案主管，我希望预置婚姻家事标准办案SOP，以便新案件立案后自动生成"起诉状起草→立案→举证→开庭→判决"全流程任务。
- 作为律所主任，我希望支持自定义SOP模板，以便不同分所、不同业务线有差异化的办案标准。

#### **3. 业务规则**
1. **模板字段**：`CaseSOPTemplate` 含 `name`、`case_type`、`stages`（JSON数组）、`is_default`、`enabled`、`description`、`organization_id`。
2. **阶段结构**：`CaseSOPStage` 含 `stage_id`、`stage_name`、`order`、`tasks`（任务列表）。
3. **任务模板**：`CaseTaskTemplate` 含 `task_id`、`task_name`、`responsible_role`（lawyer/assistant/admin）、`deadline_days`（相对阶段开始的天数）、`is_required`、`description`。
4. **系统预置**：`organization_id=null` 为系统预置模板，所有组织可见但不可编辑；`organization_id` 非空为组织自定义模板。
5. **默认模板**：每个 `case_type` 仅允许1个 `is_default=true` 模板（系统级+组织级各1个），案件创建时优先匹配组织级默认，无则用系统级默认。
6. **权限控制**：仅 `super_admin`/`org_admin` 可创建、更新、删除、启停模板，普通律师仅可查询。
7. **系统模板初始化**：`POST /api/case-sop-templates/initialize-system-templates` 仅 `super_admin` 可调用，初始化5大案由系统模板。
8. **模板启停**：`enabled=false` 的模板不参与匹配，已有案件的任务不受影响。

#### **4. 输入/输出规范**

**输入字段（POST /api/case-sop-templates 创建模板）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| name | varchar | 是 | 最大长度64 |
| case_type | varchar | 是 | 枚举：marriage/traffic/labor/debt/other |
| stages | array | 是 | 至少1个阶段 |
| stages[].stage_id | varchar | 否 | UUID，未填则自动生成 |
| stages[].stage_name | varchar | 是 | 最大长度64 |
| stages[].order | integer | 是 | ≥1 |
| stages[].tasks | array | 是 | 至少1个任务 |
| stages[].tasks[].task_id | varchar | 否 | UUID |
| stages[].tasks[].task_name | varchar | 是 | 最大长度64 |
| stages[].tasks[].responsible_role | varchar | 是 | lawyer/assistant/admin |
| stages[].tasks[].deadline_days | integer | 是 | ≥0 |
| stages[].tasks[].is_required | boolean | 否 | 默认false |
| stages[].tasks[].description | text | 否 | 最大长度500 |
| is_default | boolean | 否 | 默认false |
| enabled | boolean | 否 | 默认true |
| description | varchar | 否 | 最大长度500 |

**输出结果**：返回完整CaseSOPTemplate对象。

#### **5. 数据模型**

**实体：CaseSOPTemplate（case_sop_templates表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| name | varchar(64) | NOT NULL | 模板名称 |
| case_type | varchar(20) | NOT NULL | 案由枚举 |
| stages | text | NOT NULL | JSON阶段列表（含tasks） |
| is_default | boolean | NOT NULL, DEFAULT 0 | 是否默认模板 |
| enabled | boolean | NOT NULL, DEFAULT 1 | 是否启用 |
| description | varchar(500) | NULL | 模板描述 |
| organization_id | varchar(36) | NULL, FK | 组织ID，null为系统预置 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/case-sop-templates | 创建SOP模板（仅管理员） | JWT（org_admin/super_admin） |
| PUT | /api/case-sop-templates/:id | 更新模板（仅管理员） | JWT（org_admin/super_admin） |
| DELETE | /api/case-sop-templates/:id | 删除模板（仅管理员） | JWT（org_admin/super_admin） |
| GET | /api/case-sop-templates | 查询模板列表（支持case_type筛选） | JWT |
| GET | /api/case-sop-templates/:id | 查询模板详情 | JWT |
| PUT | /api/case-sop-templates/:id/set-default | 设置默认模板（仅管理员） | JWT（org_admin/super_admin） |
| PUT | /api/case-sop-templates/:id/toggle-enabled | 启停模板（仅管理员） | JWT（org_admin/super_admin） |
| POST | /api/case-sop-templates/initialize-system-templates | 初始化系统模板（仅超管） | JWT（super_admin） |

**请求示例（POST /api/case-sop-templates）**：
```json
{
  "name": "婚姻家事标准办案SOP",
  "case_type": "marriage",
  "stages": [
    {
      "stage_name": "立案阶段",
      "order": 1,
      "tasks": [
        { "task_name": "起诉状起草", "responsible_role": "lawyer", "deadline_days": 3, "is_required": true, "description": "起草民事起诉状" },
        { "task_name": "立案材料准备", "responsible_role": "assistant", "deadline_days": 5, "is_required": true }
      ]
    },
    {
      "stage_name": "举证阶段",
      "order": 2,
      "tasks": [
        { "task_name": "证据收集整理", "responsible_role": "assistant", "deadline_days": 15, "is_required": true },
        { "task_name": "举证清单提交", "responsible_role": "lawyer", "deadline_days": 20, "is_required": true }
      ]
    }
  ],
  "is_default": true,
  "description": "婚姻家事案件标准办案流程"
}
```

**成功响应（201 Created）**：
```json
{
  "id": "sop-template-uuid-001",
  "name": "婚姻家事标准办案SOP",
  "case_type": "marriage",
  "stages": "[{\"stage_id\":\"stage-001\",\"stage_name\":\"立案阶段\",\"order\":1,\"tasks\":[...]},...]",
  "is_default": true,
  "enabled": true,
  "description": "婚姻家事案件标准办案流程",
  "organization_id": "org-uuid-001",
  "created_at": "2026-07-25T10:00:00.000Z",
  "updated_at": "2026-07-25T10:00:00.000Z"
}
```

**失败响应（403 Forbidden）**：
```json
{
  "statusCode": 403,
  "message": "仅管理员可以操作SOP模板",
  "error": "Forbidden"
}
```

#### **7. 交互流程**
1. **用户操作**：管理员在"办案SOP"页点击"新建模板"，填写名称、案由、阶段与任务。
2. **前端**：POST `/api/case-sop-templates`，stages数组前端序列化为JSON字符串。
3. **后端**：CaseSopTemplateController.create → 校验管理员权限 → 自动生成stage_id/task_id → 持久化。
4. **数据**：`case_sop_templates` 表新增记录；新案件创建时按 `case_type` 匹配默认模板，批量生成 `case_tasks` 记录。
5. **响应**：返回模板对象，模板列表新增一行。

#### **8. 异常场景**
1. **非管理员创建模板**：返回403，提示"仅管理员可以操作SOP模板"。
2. **重复设置默认**：案由下已有默认模板时再设置默认返回400，提示"该案由已存在默认模板，请先取消原默认"。
3. **stages JSON格式错误**：后端解析失败返回400，提示"stages字段格式错误，需为合法JSON数组"。
4. **系统模板被组织编辑**：`organization_id=null` 的系统模板仅 `super_admin` 可编辑，组织管理员编辑返回403。

#### **9. 验收标准**
- **场景1（正常-创建模板）**：Given org_admin登录且案由marriage无默认模板，When 创建SOP含2个阶段4个任务并is_default=true，Then 返回201，`case_sop_templates` 表新增记录，新婚姻案件立案时自动匹配该模板生成4条 `case_tasks`。
- **场景2（边界-系统模板初始化）**：Given super_admin调用initialize-system-templates，When 触发初始化，Then 5大案由各生成1个系统级默认模板，`organization_id=null`。
- **场景3（异常-非管理员创建）**：Given 普通lawyer角色用户调用POST，When 后端校验权限，Then 返回403，错误信息"仅管理员可以操作SOP模板"，模板未创建。

---

#### 4.3 案件任务协同管理

#### **1. 功能描述**
案件任务拆解、指派与协同，支持多级任务指派主办律师、协办律师、助理对应任务，任务可上传成果、评论协作、状态更新，操作全留痕，进度实时同步至案件总进度。

#### **2. 用户故事**
- 作为主办律师，我希望案件任务能按SOP自动生成并指派给助理，以便我无需手动分配重复性工作。
- 作为助理，我希望能在任务下上传成果文件、评论协作，以便主办律师及时审阅与反馈。

#### **3. 业务规则**
1. **任务来源**：案件创建时按SOP模板自动生成 `case_tasks` 记录，也支持 `POST /api/case-tasks` 手动创建。
2. **任务状态**：`CaseTaskStatus` 枚举 `pending`（待处理）/ `in_progress`（进行中）/ `completed`（已完成）/ `verified`（已验收）/ `overdue`（已超期）/ `cancelled`（已取消）。
3. **任务优先级**：`TaskPriority` 枚举 `low`/`medium`/`high`/`urgent`，默认 `medium`。
4. **任务指派**：`PUT /api/case-tasks/:taskId/assign` 指派 `assignee_id`，必须为同组织内 `lawyer`/`assistant` 角色。
5. **进度更新**：`PUT /api/case-tasks/:taskId/progress` 更新 `progress`（0-100），100%自动置 `status=completed`。
6. **成果上传**：`POST /api/case-tasks/:taskId/results` 上传文件至 `case_task_comments` 表（含 `file_url`、`file_name`、`file_type`）。
7. **评论协作**：`POST /api/case-tasks/:taskId/comments` 添加文本评论，状态变更与指派变更自动记录评论。
8. **任务分组**：`GET /api/case-tasks/case/:caseId/grouped` 按阶段分组返回任务列表。
9. **完成率统计**：`GET /api/case-tasks/case/:caseId/completion-rate` 返回 `{ total, completed, completion_rate }`。
10. **超期处理**：定时任务检查 `deadline`，超期任务 `status=overdue` 并触发预警。

#### **4. 输入/输出规范**

**输入字段（POST /api/case-tasks 创建任务）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | varchar | 是 | UUID |
| sop_template_id | varchar | 否 | UUID，模板来源 |
| stage_id | varchar | 是 | 阶段ID |
| stage_name | varchar | 是 | 最大长度64 |
| stage_order | integer | 是 | ≥1 |
| task_id | varchar | 是 | 任务ID（来自模板或UUID） |
| task_name | varchar | 是 | 最大长度64 |
| responsible_role | varchar | 否 | lawyer/assistant/admin |
| assignee_id | varchar | 否 | UUID |
| deadline | datetime | 否 | ISO8601 |
| is_required | boolean | 否 | 默认true |
| deadline_days | integer | 否 | ≥0 |
| description | text | 否 | 最大长度2000 |
| priority | varchar | 否 | 枚举，默认medium |

**输入字段（PUT /api/case-tasks/:taskId/status 更新状态）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| status | varchar | 是 | 枚举：pending/in_progress/completed/verified/overdue/cancelled |
| result | text | 否 | 任务结果备注 |

**输出结果**：返回 `{ success: true, data: CaseTask, message: "..." }`。

#### **5. 数据模型**

**实体：CaseTask（case_tasks表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| case_id | varchar(36) | NOT NULL, FK | 关联案件ID |
| sop_template_id | varchar(36) | NULL, FK | 来源模板ID |
| stage_id | varchar(36) | NOT NULL | 阶段ID |
| stage_name | varchar(64) | NOT NULL | 阶段名称 |
| stage_order | integer | NOT NULL | 阶段顺序 |
| task_id | varchar(36) | NOT NULL | 任务ID（来自模板） |
| task_name | varchar(64) | NOT NULL | 任务名称 |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 任务状态枚举 |
| responsible_role | varchar(20) | NULL | 责任人角色 |
| assignee_id | varchar(36) | NULL, FK | 实际指派人ID |
| deadline | datetime | NULL | 截止时间 |
| completed_at | datetime | NULL | 完成时间 |
| is_required | boolean | NOT NULL, DEFAULT 1 | 是否必做 |
| deadline_days | integer | NULL | 相对天数 |
| description | text | NULL | 任务描述 |
| result | text | NULL | 任务结果备注 |
| priority | varchar(10) | NOT NULL, DEFAULT 'medium' | 优先级枚举 |
| progress | integer | NOT NULL, DEFAULT 0 | 进度0-100 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**新增实体：CaseTaskComment（case_task_comments表，用于评论与成果）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| task_id | varchar(36) | NOT NULL, FK | 关联任务ID |
| user_id | varchar(36) | NOT NULL, FK | 操作人ID |
| content | text | NULL | 评论内容 |
| file_url | varchar(500) | NULL | 成果文件URL |
| file_name | varchar(200) | NULL | 文件名 |
| file_type | varchar(20) | NULL | 文件类型 |
| comment_type | varchar(20) | NOT NULL, DEFAULT 'comment' | comment/result/status_change/assign_change |
| created_at | datetime | NOT NULL | 创建时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/case-tasks | 分页查询任务（支持status/priority/assignee_id/case_id/stage_id筛选） | JWT |
| GET | /api/case-tasks/case/:caseId | 案件任务列表 | JWT |
| GET | /api/case-tasks/case/:caseId/grouped | 按阶段分组任务 | JWT |
| GET | /api/case-tasks/case/:caseId/statistics | 任务统计 | JWT |
| GET | /api/case-tasks/case/:caseId/completion-rate | 案件任务完成率 | JWT |
| GET | /api/case-tasks/:taskId | 任务详情 | JWT |
| POST | /api/case-tasks | 手动创建任务 | JWT |
| PUT | /api/case-tasks/:taskId | 更新任务信息 | JWT |
| PUT | /api/case-tasks/:taskId/status | 更新任务状态 | JWT |
| PUT | /api/case-tasks/:taskId/assign | 指派任务 | JWT |
| PUT | /api/case-tasks/:taskId/progress | 更新任务进度 | JWT |
| GET | /api/case-tasks/:taskId/comments | 任务评论与成果列表 | JWT |
| POST | /api/case-tasks/:taskId/comments | 添加评论 | JWT |
| POST | /api/case-tasks/:taskId/results | 上传任务成果 | JWT |

**请求示例（PUT /api/case-tasks/task-uuid-001/status）**：
```json
{
  "status": "completed",
  "result": "起诉状已起草完成，附件为民事起诉状.docx"
}
```

**成功响应（200 OK）**：
```json
{
  "success": true,
  "data": {
    "id": "task-uuid-001",
    "case_id": "case-uuid-001",
    "stage_name": "立案阶段",
    "task_name": "起诉状起草",
    "status": "completed",
    "assignee_id": "user-uuid-004",
    "completed_at": "2026-07-25T15:00:00.000Z",
    "result": "起诉状已起草完成，附件为民事起诉状.docx",
    "progress": 100
  },
  "message": "状态更新成功"
}
```

**失败响应（400 Bad Request）**：
```json
{
  "statusCode": 400,
  "message": "任务状态非法，仅支持pending/in_progress/completed/verified/overdue/cancelled",
  "error": "Bad Request"
}
```

#### **7. 交互流程**
1. **用户操作**：助理在任务详情页点击"完成"，上传成果文件并填写备注。
2. **前端**：先 `POST /api/case-tasks/:taskId/results` 上传文件，再 `PUT /api/case-tasks/:taskId/status` 更新状态为completed。
3. **后端**：CaseTaskController.updateTaskStatus → 校验status合法性 → 更新 `case_tasks` 表 → 自动调用 `commentService.recordStatusChange` 记录状态变更评论 → 若 `progress=100` 自动置 `completed_at`。
4. **数据**：`case_tasks` 表更新status、completed_at、result字段；`case_task_comments` 表新增状态变更记录。
5. **响应**：返回更新后的CaseTask对象，主办律师工作台收到"任务已完成"通知。

#### **8. 异常场景**
1. **状态非法**：返回400，提示"任务状态非法，仅支持pending/in_progress/completed/verified/overdue/cancelled"。
2. **指派给非律师/助理角色**：返回400，提示"被指派人角色必须为lawyer或assistant"。
3. **进度超出0-100**：返回400，提示"进度值必须为0-100"。
4. **任务已取消仍操作**：返回400，提示"任务已取消，不可更新状态"。
5. **成果文件超过50MB**：返回413，提示"成果文件过大（超过50MB），请压缩或拆分上传"。

#### **9. 验收标准**
- **场景1（正常-完成任务）**：Given task-001指派给assistant user-004，When user-004上传起诉状并更新status=completed，Then `case_tasks.status=completed`、`completed_at` 自动填充、`progress=100`，主办律师收到通知。
- **场景2（边界-进度自动完成）**：Given task-001的progress从80更新为100，When 调用PUT /progress，Then `status` 自动从 `in_progress` 流转为 `completed`，`completed_at` 自动填充。
- **场景3（异常-非法状态）**：Given 提交status="invalid_status"，When 调用PUT /status，Then 返回400，错误信息"任务状态非法"，`case_tasks.status` 不变。

---

#### 4.4 关键节点自动预警

#### **1. 功能描述**
案件关键时间节点（举证期、上诉期、开庭时间、保全到期、时效到期）自动提醒，支持多级预警（7天/3天/1天），超期未完成自动升级预警至律所管理员并同步合规风控模块。

#### **2. 用户故事**
- 作为主办律师，我希望举证期到期前7天/3天/1天分别收到提醒，以便我提前准备举证材料。
- 作为律所主任，我希望超期未完成的节点自动升级预警给我，以便我介入督办，避免执业事故。

#### **3. 业务规则**
1. **预警类型**：`WarningType` 枚举 `evidence_period`（举证期）/ `appeal_period`（上诉期）/ `hearing_date`（开庭时间）/ `preservation_expire`（保全到期）/ `statute_expire`（时效到期）/ `payment_deadline`（付款截止）。
2. **预警级别**：`WarningLevel` 枚举 `reminder`（提醒，7天前）/ `warning`（警告，3天前）/ `urgent`（紧急，1天前或当天）。
3. **预警状态**：`WarningStatus` 枚举 `pending`（待处理）/ `processed`（已处理）/ `overdue`（已超期）。
4. **多级预警**：每类节点按 `advance_days` 配置提前量，默认 [7,3,1] 三级，组织可自定义。
5. **预警生成**：定时任务每日凌晨6点扫描所有未结案案件的关键节点，生成对应级别的预警记录。
6. **预警通知**：预警生成后通过IM/邮件/短信通知 `handler_id`（默认为主办律师），超期升级通知律所管理员。
7. **预警处理**：`PUT /api/case-warnings/:id` 由责任人填写 `handle_note` 并置 `status=processed`，记录 `handled_at`。
8. **超期升级**：节点到期未处理则 `status=overdue`，自动同步至合规风控模块生成"执业风险事件"。
9. **手动触发**：`POST /api/case-warnings/trigger` 支持手动触发预警生成（测试与紧急补漏用）。

#### **4. 输入/输出规范**

**输入字段（POST /api/case-warnings 手动创建预警）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | varchar | 是 | UUID |
| warning_type | varchar | 是 | 枚举 |
| warning_level | varchar | 是 | 枚举：reminder/warning/urgent |
| warning_date | date | 是 | YYYY-MM-DD，预警日期 |
| target_date | date | 是 | YYYY-MM-DD，目标节点日期 |
| description | text | 否 | 最大长度500 |
| advance_days | integer | 否 | 默认0 |

**输入字段（PUT /api/case-warnings/:id 处理预警）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| status | varchar | 是 | 枚举：processed/overdue |
| handle_note | text | 否 | 最大长度500 |

**输出结果**：返回 `{ code: 0, data: CaseWarning, message: "..." }`。

#### **5. 数据模型**

**实体：CaseWarning（case_warnings表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| case_id | varchar(36) | NOT NULL, FK | 关联案件ID |
| warning_type | varchar(30) | NOT NULL | 预警类型枚举 |
| warning_level | varchar(10) | NOT NULL | 预警级别枚举 |
| warning_date | date | NOT NULL | 预警日期 |
| target_date | date | NOT NULL | 目标节点日期 |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 预警状态枚举 |
| handler_id | varchar(36) | NULL, FK | 处理人ID |
| handle_note | text | NULL | 处理备注 |
| description | text | NULL | 预警描述 |
| advance_days | integer | NOT NULL, DEFAULT 0 | 提前天数 |
| handled_at | datetime | NULL | 处理时间 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/case-warnings | 查询预警列表（支持case_id/warning_type/warning_level/status筛选） | JWT |
| GET | /api/case-warnings/statistics | 预警统计（按级别/状态分组） | JWT |
| GET | /api/case-warnings/:id | 预警详情 | JWT |
| POST | /api/case-warnings | 手动创建预警 | JWT |
| PUT | /api/case-warnings/:id | 处理预警 | JWT |
| POST | /api/case-warnings/trigger | 手动触发预警生成 | JWT |

**请求示例（PUT /api/case-warnings/warning-uuid-001）**：
```json
{
  "status": "processed",
  "handle_note": "举证材料已于7月20日提交法院，附回执"
}
```

**成功响应（200 OK）**：
```json
{
  "code": 0,
  "data": {
    "id": "warning-uuid-001",
    "case_id": "case-uuid-001",
    "warning_type": "evidence_period",
    "warning_level": "warning",
    "warning_date": "2026-07-22",
    "target_date": "2026-07-25",
    "status": "processed",
    "handler_id": "user-uuid-004",
    "handle_note": "举证材料已于7月20日提交法院，附回执",
    "description": "举证期将于3天后到期",
    "advance_days": 3,
    "handled_at": "2026-07-22T10:00:00.000Z",
    "created_at": "2026-07-22T06:00:00.000Z",
    "updated_at": "2026-07-22T10:00:00.000Z"
  },
  "message": "处理成功"
}
```

**失败响应（404 Not Found）**：
```json
{
  "statusCode": 404,
  "message": "预警记录不存在",
  "error": "Not Found"
}
```

#### **7. 交互流程**
1. **用户操作**：定时任务每日6点扫描；主办律师在工作台收到预警通知后点击"去处理"。
2. **前端**：PUT `/api/case-warnings/:id`，body含status=processed与handle_note。
3. **后端**：CaseWarningController.update → 校验预警存在 → 更新status、handler_id（取自req.user.id）、handle_note、handled_at → 若超期未处理则同步合规风控模块。
4. **数据**：`case_warnings` 表更新status、handler_id、handle_note、handled_at字段。
5. **响应**：返回更新后的CaseWarning，前端从"待处理预警"列表移除，提示"预警已处理"。

#### **8. 异常场景**
1. **预警记录不存在**：返回404，提示"预警记录不存在或已被删除"。
2. **非处理人处理预警**：校验handler_id必须为案件主办律师或管理员，否则返回403，提示"仅案件主办律师或管理员可处理预警"。
3. **节点时间未配置**：案件无 `filing_date` 等关键节点时间，定时任务跳过该案件，通知管理员"案件case-001缺少关键节点时间，请补充"。
4. **通知渠道异常**：IM/邮件/短信发送失败时记录日志，预警状态正常更新，后台异步重试通知3次。

#### **9. 验收标准**
- **场景1（正常-多级预警）**：Given 案件case-001的举证期target_date=2026-07-25，When 7月18日定时任务执行，Then 生成1条 `warning_level=reminder`、`advance_days=7` 的预警，主办律师收到通知。
- **场景2（边界-超期升级）**：Given 举证期已过且预警未处理，When 7月26日定时任务执行，Then 预警 `status=overdue`，律所管理员收到升级预警，合规风控模块生成"执业风险事件"。
- **场景3（异常-节点缺失）**：Given 案件case-002无filing_date与deadline，When 定时任务扫描，Then 跳过该案件不生成预警，管理员收到"案件缺少关键节点时间"通知。

---

#### 4.5 证据与电子卷宗管理

#### **1. 功能描述**
案件证据与卷宗电子化集中管理，支持证据批量上传、分类标注、智能编码，自动生成证据目录；电子卷宗按阶段分类存储，支持版本管理、权限管控、在线预览批注与导出归档。

#### **2. 用户故事**
- 作为主办律师，我希望批量上传证据材料并自动生成证据目录，以便我提交法院时无需手动整理。
- 作为助理，我希望证据文件有新版本时能保留历史版本，以便追溯证据修改记录。

#### **3. 业务规则**
1. **证据类型**：`EvidenceType` 枚举 `contract`（合同）/ `evidence`（证据）/ `document`（文书）/ `other`（其他）。
2. **证据分类**：`EvidenceCategory` 枚举 `plaintiff`（原告方）/ `defendant`（被告方）/ `court`（法院）/ `other`（其他）。
3. **批量上传**：`POST /api/evidences/batch-upload/:caseId` 单次最多20个文件，单文件最大100MB。
4. **版本管理**：`POST /api/evidences/:id/version` 上传新版本，`parent_evidence_id` 关联父证据，`version` 自增。
5. **归档与恢复**：`PUT /api/evidences/:id/archive` 软删除（`is_archived=true`），`PUT /api/evidences/:id/restore` 恢复，`DELETE /api/evidences/:id` 物理删除。
6. **批量操作**：`PUT /api/evidences/batch/archive` 批量归档，`PUT /api/evidences/batch/category` 批量修改分类。
7. **证据目录**：`GET /api/evidences/catalog/:caseId` 自动生成证据目录PDF，含证据名称、类型、分类、上传时间、版本号。
8. **在线预览**：`GET /api/evidences/:id/preview` 流式传输文件，支持PDF/图片/Office文档预览。
9. **权限管控**：仅案件 `assignee_lawyer_id`、`assistant` 角色与管理员可上传/编辑，其他角色仅可查看。
10. **文件存储**：文件存储在OSS/本地文件系统，`file_path` 记录相对路径，`mime_type` 与 `file_size` 自动提取。

#### **4. 输入/输出规范**

**输入字段（POST /api/evidences/upload/:caseId 单文件上传）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| caseId | varchar | 是 | URL参数，UUID |
| file | file | 是 | multipart文件，≤100MB |
| upload_by_id | varchar | 是 | UUID |
| name | varchar | 否 | 默认取文件名，最大长度200 |
| type | varchar | 否 | 枚举，默认other |
| category | varchar | 否 | 枚举，默认other |
| description | text | 否 | 最大长度500 |

**输出结果**：返回Evidence对象，含自动生成的 `id`、`version=1`、`file_size`、`mime_type`。

#### **5. 数据模型**

**实体：Evidence（evidences表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| name | varchar(200) | NOT NULL | 证据名称 |
| type | varchar(20) | NOT NULL, DEFAULT 'other' | 证据类型枚举 |
| category | varchar(20) | NOT NULL, DEFAULT 'other' | 证据分类枚举 |
| file_path | varchar(500) | NOT NULL | 文件存储路径 |
| file_size | integer | NULL | 文件大小（字节） |
| mime_type | varchar(100) | NULL | MIME类型 |
| description | text | NULL | 证据描述 |
| version | integer | NOT NULL, DEFAULT 1 | 版本号 |
| is_archived | boolean | NOT NULL, DEFAULT 0 | 是否归档 |
| case_id | varchar(36) | NOT NULL, FK | 关联案件ID |
| upload_by_id | varchar(36) | NOT NULL, FK | 上传人ID |
| parent_evidence_id | varchar(36) | NULL, FK | 父证据ID（版本管理） |
| upload_at | datetime | NOT NULL | 上传时间（CreateDateColumn） |
| updated_at | datetime | NOT NULL | 更新时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/evidences | 分页查询证据（支持type/category/is_archived/case_id筛选） | JWT |
| POST | /api/evidences/upload/:caseId | 单文件上传证据（multipart） | JWT |
| POST | /api/evidences/batch-upload/:caseId | 批量上传证据（multipart，≤20个文件） | JWT |
| GET | /api/evidences/case/:caseId | 案件证据列表 | JWT |
| GET | /api/evidences/:id | 证据详情 | JWT |
| PUT | /api/evidences/:id/category | 更新证据分类标注 | JWT |
| POST | /api/evidences/:id/version | 上传新版本（multipart） | JWT |
| PUT | /api/evidences/:id/archive | 归档证据（软删除） | JWT |
| PUT | /api/evidences/:id/restore | 恢复证据 | JWT |
| DELETE | /api/evidences/:id | 物理删除证据 | JWT |
| GET | /api/evidences/catalog/:caseId | 生成证据目录 | JWT |
| GET | /api/evidences/:id/preview | 文件预览（流式传输） | JWT |
| GET | /api/evidences/:id/download | 文件下载 | JWT |
| PUT | /api/evidences/batch/archive | 批量归档 | JWT |
| PUT | /api/evidences/batch/category | 批量修改分类 | JWT |

**请求示例（POST /api/evidences/upload/case-uuid-001）**：
```
Content-Type: multipart/form-data
file: [binary file 借款合同.pdf]
upload_by_id: user-uuid-004
name: 借款合同原件
type: contract
category: plaintiff
description: 客户与被告签署的借款合同原件扫描件
```

**成功响应（201 Created）**：
```json
{
  "id": "evidence-uuid-001",
  "name": "借款合同原件",
  "type": "contract",
  "category": "plaintiff",
  "file_path": "/evidences/case-uuid-001/2026/07/借款合同.pdf",
  "file_size": 1048576,
  "mime_type": "application/pdf",
  "description": "客户与被告签署的借款合同原件扫描件",
  "version": 1,
  "is_archived": false,
  "case_id": "case-uuid-001",
  "upload_by_id": "user-uuid-004",
  "parent_evidence_id": null,
  "upload_at": "2026-07-25T10:00:00.000Z",
  "updated_at": "2026-07-25T10:00:00.000Z"
}
```

**失败响应（400 Bad Request）**：
```json
{
  "statusCode": 400,
  "message": "未上传文件",
  "error": "Bad Request"
}
```

#### **7. 交互流程**
1. **用户操作**：助理在案件"证据管理"页点击"批量上传"，选择多个文件并设置分类。
2. **前端**：POST `/api/evidences/batch-upload/:caseId`，multipart/form-data格式。
3. **后端**：EvidenceController.batchUploadEvidence → 校验文件数≤20 → 逐个保存文件至OSS → 创建Evidence记录（version=1）→ 提取file_size、mime_type。
4. **数据**：`evidences` 表批量新增记录，文件持久化至存储。
5. **响应**：返回上传成功的Evidence数组，前端展示证据列表并提示"已上传N个证据"。

#### **8. 异常场景**
1. **文件超过100MB**：返回413，提示"文件过大（超过100MB），请压缩或拆分上传"。
2. **批量上传超过20个**：返回400，提示"单次批量上传最多20个文件，请分批上传"。
3. **案件不存在**：返回404，提示"案件不存在，无法上传证据"。
4. **文件类型不允许**：返回400，提示"不支持的文件类型：.exe，仅支持PDF/图片/Office文档"。
5. **预览文件丢失**：返回404，提示"证据文件已丢失，请联系管理员恢复"。

#### **9. 验收标准**
- **场景1（正常-批量上传）**：Given 助理选择5个PDF文件上传至case-001，When 调用batch-upload，Then 返回5个Evidence对象，`evidences` 表新增5条记录，`version=1`，`is_archived=false`。
- **场景2（边界-版本管理）**：Given evidence-001已有v1版本，When 上传v2版本，Then 新增1条Evidence记录 `parent_evidence_id=evidence-001`、`version=2`，原v1记录保留。
- **场景3（异常-文件过大）**：Given 上传单个文件大小150MB，When 调用upload，Then 返回413，错误信息"文件过大（超过100MB）"，`evidences` 表无新增。

---

#### 4.6 法律大数据检索工具

#### **1. 功能描述**
内置法律检索工具，整合裁判文书库、法规库、司法观点库、类案同判库，支持案情自然语言检索与多维度高级筛选，检索结果可批量对比并一键生成检索报告关联至案件档案。

#### **2. 用户故事**
- 作为主办律师，我希望用自然语言描述案情即可检索类案，以便我快速找到参考判例。
- 作为助理，我希望生成的检索报告自动关联到案件档案，以便主办律师随时查阅。

#### **3. 业务规则**
1. **数据库覆盖**：
   - 裁判文书库：最高法、各省高院、中院公开裁判文书
   - 法规库：法律、行政法规、地方性法规、司法解释
   - 司法观点库：最高法公报案例、典型案例观点
   - 类案同判库：按案由+争议焦点聚类
2. **检索方式**：
   - 自然语言检索：输入案情描述，AI提取关键词与争议焦点
   - 高级筛选：按法院层级、地域、裁判时间、案由、审理程序、裁判结果多维度筛选
3. **批量对比**：最多选择5个案例加入对比清单，表格化展示异同。
4. **检索报告**：一键生成标准化检索报告PDF，含检索条件、案例摘要、法律依据、关联案件ID。
5. **权限控制**：所有律师角色均可检索，检索报告自动关联至 `case_id`（如有）。
6. **检索历史**：记录用户检索历史，便于复用检索条件。
7. **数据库授权**：依赖外部法律数据库授权（如裁判文书网API、北大法宝API），授权失败时降级为本地缓存检索。

#### **4. 输入/输出规范**

**输入字段（POST /api/legal-search 检索）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| query | text | 是 | 自然语言检索词，最大长度500 |
| case_id | varchar | 否 | UUID，关联案件 |
| filters | object | 否 | 高级筛选条件 |
| filters.court_level | varchar | 否 | 枚举：supreme/high/intermediate/basic |
| filters.region | varchar | 否 | 省份代码 |
| filters.judgment_date_start | date | 否 | YYYY-MM-DD |
| filters.judgment_date_end | date | 否 | YYYY-MM-DD，需晚于start |
| filters.case_type | varchar | 否 | 案由枚举 |
| filters.procedure | varchar | 否 | 一审/二审/再审 |
| page | integer | 否 | 默认1 |
| limit | integer | 否 | 默认20，最大50 |

**输出结果**：
```json
{
  "total": 152,
  "page": 1,
  "limit": 20,
  "results": [
    {
      "id": "case-doc-001",
      "title": "张某与李某离婚财产分割纠纷一审民事判决书",
      "court": "北京市朝阳区人民法院",
      "judgment_date": "2025-06-15",
      "case_type": "marriage",
      "procedure": "一审",
      "summary": "法院判决房产按贡献比例分割...",
      "relevant_score": 0.95
    }
  ]
}
```

#### **5. 数据模型**

**新增实体：LegalSearchRecord（legal_search_records表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| user_id | varchar(36) | NOT NULL, FK | 检索人ID |
| case_id | varchar(36) | NULL, FK | 关联案件ID |
| query | text | NOT NULL | 检索词 |
| filters | text | NULL | JSON筛选条件 |
| result_count | integer | NOT NULL, DEFAULT 0 | 结果数量 |
| created_at | datetime | NOT NULL | 创建时间 |

**新增实体：LegalSearchReport（legal_search_reports表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| case_id | varchar(36) | NULL, FK | 关联案件ID |
| user_id | varchar(36) | NOT NULL, FK | 生成人ID |
| report_title | varchar(200) | NOT NULL | 报告标题 |
| report_path | varchar(500) | NOT NULL | PDF文件路径 |
| search_record_id | varchar(36) | NULL, FK | 关联检索记录 |
| created_at | datetime | NOT NULL | 创建时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/legal-search | 执行检索 | JWT |
| GET | /api/legal-search/history | 查询检索历史 | JWT |
| POST | /api/legal-search/compare | 案例对比（body: {case_doc_ids: string[]}） | JWT |
| POST | /api/legal-search/report | 生成检索报告PDF | JWT |
| GET | /api/legal-search/reports | 查询报告列表（支持case_id筛选） | JWT |
| GET | /api/legal-search/reports/:id | 下载报告 | JWT |

**请求示例（POST /api/legal-search）**：
```json
{
  "query": "婚姻存续期间一方购买的房产离婚时如何分割",
  "case_id": "case-uuid-001",
  "filters": {
    "court_level": "intermediate",
    "judgment_date_start": "2023-01-01",
    "judgment_date_end": "2026-07-25",
    "case_type": "marriage"
  },
  "page": 1,
  "limit": 20
}
```

**成功响应（200 OK）**：
```json
{
  "total": 152,
  "page": 1,
  "limit": 20,
  "results": [
    {
      "id": "case-doc-001",
      "title": "张某与李某离婚财产分割纠纷一审民事判决书",
      "court": "北京市第三中级人民法院",
      "judgment_date": "2025-06-15",
      "case_type": "marriage",
      "procedure": "二审",
      "summary": "法院判决婚姻存续期间购买的房产属夫妻共同财产，按均等原则分割，但考虑一方贡献较大，酌情调整比例",
      "relevant_score": 0.95
    }
  ],
  "search_record_id": "search-uuid-001"
}
```

**失败响应（503 Service Unavailable）**：
```json
{
  "statusCode": 503,
  "message": "法律数据库授权已过期，请联系管理员续费",
  "error": "Service Unavailable"
}
```

#### **7. 交互流程**
1. **用户操作**：律师在"法律检索"页输入案情描述，可选设置高级筛选。
2. **前端**：POST `/api/legal-search`，body含query与filters。
3. **后端**：LegalSearchService → 调用外部法律数据库API（如裁判文书网）→ AI提取关键词与争议焦点 → 多维度匹配 → 写入 `legal_search_records` 表。
4. **数据**：检索记录写入 `legal_search_records` 表，结果缓存至Redis（1小时）。
5. **响应**：返回检索结果分页列表，前端展示案例卡片与相关度评分。

#### **8. 异常场景**
1. **数据库授权过期**：返回503，提示"法律数据库授权已过期，请联系管理员续费"，降级为本地缓存检索。
2. **检索词为空**：返回400，提示"检索词不能为空"。
3. **对比案例超过5个**：返回400，提示"对比案例最多5个，请减少选择"。
4. **报告生成失败**：PDF渲染失败返回500，提示"检索报告生成失败，请稍后重试"。

#### **9. 验收标准**
- **场景1（正常-自然语言检索）**：Given 律师输入"婚姻存续期间房产分割"，When POST /api/legal-search，Then 返回total=152条结果，按相关度降序排列，`legal_search_records` 表新增1条记录。
- **场景2（边界-高级筛选）**：Given 设置court_level=intermediate、case_type=marriage，When 检索，Then 结果仅包含中级法院婚姻案件判决。
- **场景3（异常-数据库过期）**：Given 法律数据库API授权失效，When 检索，Then 返回503，错误信息"法律数据库授权已过期"，降级使用本地缓存。

---

#### 4.7 法律文书智能生成与审查

#### **1. 功能描述**
内置起诉状、答辩状、代理词、合同等标准化文书模板，AI自动填充案件与客户信息生成文书初稿；支持AI优化文书内容、校对法条准确性；文书合规审查自动识别违规承诺与不当表述并标注修改建议。

#### **2. 用户故事**
- 作为主办律师，我希望AI根据案件信息自动生成起诉状初稿，以便我只需微调即可提交法院。
- 作为合规专员，我希望文书提交前自动审查违规承诺，以便规避执业风险。

#### **3. 业务规则**
1. **文书模板**：预置起诉状、答辩状、代理词、辩护词、法律意见书、委托合同等模板，按案由分类。
2. **自动填充**：从 `cases`、`leads` 表提取 `client_name`、`case_type`、`description`、`court`、`fee_amount` 等字段填充模板变量。
3. **AI优化**：调用AI模型优化文书逻辑、措辞、法条引用准确性，返回修改建议（不直接修改原文）。
4. **合规审查**：识别违规承诺（包胜诉、100%成功）、不当表述（贬低同行、虚假宣传）、缺失必要条款（风险告知），标注位置与修改建议。
5. **文书管理**：生成的文书存储在 `documents` 表，`is_ai_generated=true` 标记，关联 `case_id`。
6. **版本管理**：每次AI优化生成新版本，保留历史版本可回退。
7. **导出格式**：支持导出Word、PDF格式，PDF加水印"AI生成草稿，需律师审阅"。
8. **权限控制**：仅案件主办律师与助理可生成/编辑文书，合规专员可查看合规审查结果。

#### **4. 输入/输出规范**

**输入字段（POST /api/documents/generate AI生成文书）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | varchar | 是 | UUID |
| template_id | varchar | 是 | 模板ID |
| variables | object | 否 | 自定义变量键值对 |
| ai_optimize | boolean | 否 | 是否调用AI优化，默认true |

**输入字段（POST /api/documents/:id/compliance-review 合规审查）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| id | varchar | 是 | URL参数，文档ID |

**输出结果**：
```json
{
  "document_id": "doc-uuid-001",
  "compliance_issues": [
    { "type": "violation", "position": 152, "original": "保证胜诉", "suggestion": "根据案件情况评估胜诉可能性" }
  ],
  "missing_clauses": ["风险告知条款"],
  "review_result": "warning"
}
```

#### **5. 数据模型**

**实体：Document（documents表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| name | varchar(200) | NOT NULL | 文档名称 |
| file_path | varchar(500) | NOT NULL | 文件存储路径 |
| file_type | varchar(20) | NULL | 文件类型（docx/pdf） |
| size | integer | NULL | 文件大小（字节） |
| description | text | NULL | 文档描述 |
| is_ai_generated | boolean | NOT NULL, DEFAULT 0 | 是否AI生成 |
| case_id | varchar(36) | NOT NULL, FK | 关联案件ID |
| uploaded_by_id | varchar(36) | NOT NULL, FK | 上传人ID |
| created_at | datetime | NOT NULL | 创建时间 |

**新增实体：DocumentComplianceReview（document_compliance_reviews表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| document_id | varchar(36) | NOT NULL, FK | 关联文档ID |
| case_id | varchar(36) | NOT NULL, FK | 关联案件ID |
| compliance_issues | text | NULL | JSON合规问题列表 |
| missing_clauses | text | NULL | JSON缺失条款列表 |
| review_result | varchar(20) | NOT NULL | pass/warning/reject |
| reviewed_by | varchar(36) | NULL, FK | 审查人ID（AI为system） |
| created_at | datetime | NOT NULL | 创建时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/documents/templates | 查询文书模板列表（支持case_type筛选） | JWT |
| POST | /api/documents/generate | AI生成文书 | JWT |
| GET | /api/documents/case/:caseId | 案件文书列表 | JWT |
| GET | /api/documents/:id | 文书详情 | JWT |
| PUT | /api/documents/:id | 编辑文书内容 | JWT |
| POST | /api/documents/:id/compliance-review | 合规审查 | JWT |
| GET | /api/documents/:id/reviews | 查询文书审查历史 | JWT |
| GET | /api/documents/:id/download | 下载文书（支持docx/pdf格式） | JWT |
| POST | /api/cases/:id/documents | 上传文书（复用案件文档接口） | JWT |

**请求示例（POST /api/documents/generate）**：
```json
{
  "case_id": "case-uuid-001",
  "template_id": "template-marriage-complaint",
  "variables": {
    "plaintiff_address": "北京市朝阳区xxx",
    "defendant_name": "李某",
    "claims": ["判决离婚", "房产按7:3分割", "孩子由原告抚养"]
  },
  "ai_optimize": true
}
```

**成功响应（201 Created）**：
```json
{
  "document_id": "doc-uuid-001",
  "name": "民事起诉状-王女士诉李某离婚纠纷.docx",
  "file_path": "/documents/case-uuid-001/民事起诉状-王女士诉李某离婚纠纷.docx",
  "is_ai_generated": true,
  "case_id": "case-uuid-001",
  "ai_suggestions": [
    { "position": 152, "original": "保证判决离婚", "suggestion": "请求法院依法判决离婚" }
  ],
  "created_at": "2026-07-25T11:00:00.000Z"
}
```

**失败响应（400 Bad Request）**：
```json
{
  "statusCode": 400,
  "message": "案件信息不完整，缺少client_name，无法生成文书",
  "error": "Bad Request"
}
```

#### **7. 交互流程**
1. **用户操作**：律师在案件"文书管理"页选择"起诉状"模板，点击"AI生成"。
2. **前端**：POST `/api/documents/generate`，body含case_id、template_id、variables。
3. **后端**：DocumentService.generate → 从cases表提取案件信息 → 填充模板变量 → 调用AI模型优化 → 生成docx文件存储至OSS → 写入 `documents` 表（is_ai_generated=true）。
4. **数据**：`documents` 表新增记录，文件持久化至存储。
5. **响应**：返回document_id与AI建议列表，前端打开文书编辑器展示初稿与建议。

#### **8. 异常场景**
1. **案件信息不完整**：返回400，提示"案件信息不完整，缺少client_name，无法生成文书"。
2. **AI优化失败**：降级为模板填充不调用AI，提示"AI优化暂不可用，已生成基础模板"。
3. **合规审查识别违规**：返回review_result=warning，前端高亮违规表述并展示修改建议。
4. **文书导出失败**：返回500，提示"文书导出失败，请稍后重试"。

#### **9. 验收标准**
- **场景1（正常-AI生成）**：Given case-001信息完整且选择起诉状模板，When POST /api/documents/generate，Then 返回201，`documents` 表新增记录 `is_ai_generated=true`，文书内容含案件信息。
- **场景2（边界-合规审查）**：Given 文书含"保证胜诉"表述，When POST compliance-review，Then 返回review_result=warning，compliance_issues含1条违规，前端高亮提示。
- **场景3（异常-信息不完整）**：Given case-002无client_name，When 生成文书，Then 返回400，错误信息"案件信息不完整，缺少client_name"，`documents` 表无新增。

---

#### 4.8 律所内部OA审批

#### **1. 功能描述**
律所行政流程线上审批，覆盖用印申请、所函开具、合同审批、退费申请、立案审批等场景，支持自定义审批流，审批节点可关联对应案件，审批记录全留存并自动归档至案件档案。

#### **2. 用户故事**
- 作为律师，我希望线上提交用印申请并自动流转至主任审批，以便我无需跑腿签批。
- 作为律所主任，我希望审批记录自动归档至对应案件档案，以便事后审计追溯。

#### **3. 业务规则**
1. **审批类型**：预置5类审批：用印申请、所函开具、合同审批、退费申请、立案审批；支持管理员自定义新类型。
2. **审批流配置**：每个审批类型可配置多级审批节点，每节点指定审批人角色（如 `org_admin`）或具体用户。
3. **案件关联**：审批单可关联 `case_id`，审批通过后审批记录自动归档至 `documents` 表。
4. **审批状态**：`pending`（待审批）→ `approved`（通过）/ `rejected`（驳回）/ `cancelled`（撤销）。
5. **审批操作**：审批人可"通过"、"驳回"（需填写原因）、"转签"（转交他人）。
6. **审批权限**：仅当前节点审批人可操作；申请人可撤销自己的审批单。
7. **通知提醒**：审批提交、流转、通过、驳回均通过IM/邮件通知相关人员。
8. **审批留痕**：所有审批操作记录在 `approval_logs` 表，含操作人、操作类型、时间、备注，永久留存。
9. **审批超时**：节点超过预设时长（默认48小时）未处理，自动升级提醒至上级。

#### **4. 输入/输出规范**

**输入字段（POST /api/approvals 提交审批）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| approval_type | varchar | 是 | 枚举：seal/letter/contract/refund/filing |
| case_id | varchar | 否 | UUID，关联案件 |
| title | varchar | 是 | 最大长度200 |
| content | text | 是 | 审批内容，最大长度5000 |
| attachments | array | 否 | 附件URL数组 |
| amount | real | 否 | 金额（退费/合同审批用） |

**输入字段（PUT /api/approvals/:id/process 审批操作）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| action | varchar | 是 | 枚举：approve/reject/transfer |
| remark | text | 否 | 备注，驳回时必填 |
| transfer_to | varchar | 否 | 转签人ID，action=transfer时必填 |

**输出结果**：返回Approval对象，含当前节点、审批历史。

#### **5. 数据模型**

**新增实体：Approval（approvals表）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| approval_type | varchar(20) | NOT NULL | 审批类型枚举 |
| case_id | varchar(36) | NULL, FK | 关联案件ID |
| title | varchar(200) | NOT NULL | 审批标题 |
| content | text | NOT NULL | 审批内容 |
| attachments | text | NULL | JSON附件URL数组 |
| amount | real | NULL | 金额 |
| applicant_id | varchar(36) | NOT NULL, FK | 申请人ID |
| current_node | integer | NOT NULL, DEFAULT 1 | 当前审批节点序号 |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 审批状态 |
| organization_id | varchar(36) | NOT NULL, FK | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**新增实体：ApprovalNode（approval_nodes表，审批流配置）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| approval_type | varchar(20) | NOT NULL | 审批类型 |
| node_order | integer | NOT NULL | 节点顺序 |
| node_name | varchar(64) | NOT NULL | 节点名称 |
| approver_role | varchar(20) | NULL | 审批人角色 |
| approver_id | varchar(36) | NULL, FK | 指定审批人ID |
| organization_id | varchar(36) | NOT NULL, FK | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |

**新增实体：ApprovalLog（approval_logs表，审批操作日志）**

| 字段名 | 类型（SQLite兼容） | 约束 | 说明 |
|--------|---------------------|------|------|
| id | varchar(36) | PK, NOT NULL | UUID主键 |
| approval_id | varchar(36) | NOT NULL, FK | 关联审批ID |
| node_order | integer | NOT NULL | 节点序号 |
| operator_id | varchar(36) | NOT NULL, FK | 操作人ID |
| action | varchar(20) | NOT NULL | approve/reject/transfer/cancel |
| remark | text | NULL | 操作备注 |
| transfer_to | varchar(36) | NULL, FK | 转签目标人ID |
| created_at | datetime | NOT NULL | 操作时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/approvals | 提交审批申请 | JWT |
| GET | /api/approvals | 查询审批列表（支持approval_type/status/case_id筛选） | JWT |
| GET | /api/approvals/:id | 审批详情 | JWT |
| PUT | /api/approvals/:id/process | 审批操作（通过/驳回/转签） | JWT |
| PUT | /api/approvals/:id/cancel | 撤销审批（仅申请人） | JWT |
| GET | /api/approvals/my-pending | 我待审批的列表 | JWT |
| GET | /api/approvals/my-submitted | 我提交的审批列表 | JWT |
| POST | /api/approval-nodes | 配置审批流节点（仅管理员） | JWT（org_admin/super_admin） |
| GET | /api/approval-nodes | 查询审批流配置 | JWT |
| GET | /api/approvals/:id/logs | 查询审批操作日志 | JWT |

**请求示例（PUT /api/approvals/approval-uuid-001/process）**：
```json
{
  "action": "approve",
  "remark": "同意用印，请规范使用"
}
```

**成功响应（200 OK）**：
```json
{
  "id": "approval-uuid-001",
  "approval_type": "seal",
  "title": "案件case-001用印申请",
  "current_node": 2,
  "status": "pending",
  "logs": [
    {
      "node_order": 1,
      "operator_id": "user-uuid-005",
      "action": "approve",
      "remark": "同意用印，请规范使用",
      "created_at": "2026-07-25T14:00:00.000Z"
    }
  ]
}
```

**失败响应（403 Forbidden）**：
```json
{
  "statusCode": 403,
  "message": "您不是当前节点审批人，无权操作",
  "error": "Forbidden"
}
```

#### **7. 交互流程**
1. **用户操作**：律师在"OA审批"页提交用印申请，关联案件case-001，填写用印事由。
2. **前端**：POST `/api/approvals`，body含approval_type=seal、case_id、title、content。
3. **后端**：ApprovalController.create → 查询 `approval_nodes` 表获取审批流 → 创建Approval记录（current_node=1，status=pending）→ 通知第1节点审批人。
4. **数据**：`approvals` 表新增记录；审批人操作时 `approval_logs` 表新增日志，`current_node` 流转。
5. **响应**：返回Approval对象，审批人在工作台收到"待审批"通知。

#### **8. 异常场景**
1. **非当前节点审批人操作**：返回403，提示"您不是当前节点审批人，无权操作"。
2. **驳回未填写原因**：返回400，提示"驳回操作必须填写原因"。
3. **转签人不存在**：返回400，提示"转签人不存在或已离职，请重新选择"。
4. **审批流未配置**：返回500，提示"审批流未配置，请联系管理员"，审批单不可提交。
5. **撤销非自己的审批**：返回403，提示"仅申请人可撤销自己的审批单"。

#### **9. 验收标准**
- **场景1（正常-审批通过）**：Given 用印申请审批流配置2个节点（主办律师→主任），When 第1节点审批人通过，Then `current_node=2`、`status=pending`，第2节点审批人收到通知。
- **场景2（边界-全部通过归档）**：Given 2节点审批流且第2节点审批人通过，When 调用process action=approve，Then `status=approved`，审批记录自动归档至案件case-001的 `documents` 表。
- **场景3（异常-非审批人操作）**：Given user-006非当前节点审批人，When 调用process，Then 返回403，错误信息"您不是当前节点审批人，无权操作"，`approvals` 表状态不变。

---

## 附录：模块3-4数据模型与API总览

### 模块3 涉及实体清单

| 实体 | 表名 | 模块3功能点 | 来源 |
|------|------|------------|------|
| Lead | leads | 3.1/3.2/3.3/3.5/3.6 | 已有 |
| FollowUp | follow_ups | 3.5 | 已有 |
| LeadAssignment | lead_assignments | 3.3 | 已有 |
| LeadPool | lead_pool | 3.4 | 已有 |
| InviteTask | invite_tasks | 3.5/3.6/3.11 | 已有 |
| Opportunity | opportunities | 3.5/3.7 | 已有 |
| OpportunityQuoteItem | opportunity_quote_items | 3.7 | 已有 |
| OpportunityStageLog | opportunity_stage_logs | 3.7 | 已有 |
| TalkSOP | talk_sops | 3.8 | 已有 |
| OpportunitySOPProgress | opportunity_sop_progress | 3.8 | 已有 |
| HandoverLog | handover_logs | 3.10 | 已有 |
| LeadConflictCheck | lead_conflict_checks | 3.2 | 新增 |
| ClientTag | client_tags | 3.5 | 新增 |
| ComplianceRecord | compliance_records | 3.9 | 新增 |
| DeviceBinding | device_bindings | 3.11 | 新增 |
| ChatLog | chat_logs | 3.11 | 新增 |
| SensitiveAlert | sensitive_alerts | 3.11 | 新增 |

### 模块4 涉及实体清单

| 实体 | 表名 | 模块4功能点 | 来源 |
|------|------|------------|------|
| Case | cases | 4.1/4.3/4.4/4.5/4.7/4.8 | 已有 |
| CaseSOPTemplate | case_sop_templates | 4.2 | 已有 |
| CaseTask | case_tasks | 4.3 | 已有 |
| CaseWarning | case_warnings | 4.4 | 已有 |
| Evidence | evidences | 4.5 | 已有 |
| Document | documents | 4.1/4.7 | 已有 |
| CaseTaskComment | case_task_comments | 4.3 | 新增 |
| LegalSearchRecord | legal_search_records | 4.6 | 新增 |
| LegalSearchReport | legal_search_reports | 4.6 | 新增 |
| DocumentComplianceReview | document_compliance_reviews | 4.7 | 新增 |
| Approval | approvals | 4.8 | 新增 |
| ApprovalNode | approval_nodes | 4.8 | 新增 |
| ApprovalLog | approval_logs | 4.8 | 新增 |

### API路径规范说明

- 全局前缀：`/api`
- 鉴权：所有接口均需JWT鉴权（除特别说明）
- 错误响应统一格式：`{ statusCode, message, error }`
- 分页响应统一格式：`{ data: T[], total: number, page: number, limit: number }`
- 时间格式：ISO8601（如 `2026-07-25T10:00:00.000Z`）
- ID格式：UUID v4
- SQLite兼容类型：varchar/text/integer/real/datetime/date/boolean(用integer 0/1存储)

### 模块5：全节点AI合规风控体系

### 模块5概述

全节点AI合规风控体系覆盖网推律所"获客—谈案—签约—办案—结案—财务—客诉"全链路节点，通过规则引擎+AI识别双轮驱动，实现合规预审、实时质检、风险预警、闭环整改。本模块共7个功能点，与后端 `backend/src/compliance/` 模块对应，全局API前缀 `/api/compliance`，JWT鉴权。

---

#### 5.1 获客环节合规风控

**1. 功能描述**

管控前端获客全流程合规性，覆盖营销内容发布前AI预审、公域账号内容定期巡检、获客素材永久留痕三大能力，确保营销内容符合《律师执业行为规范》及《广告法》要求，未通过合规预审的内容无法对外发布。

**2. 用户故事**

- 作为营销运营人员，我希望提交营销内容后系统能自动进行合规预审并给出修改建议，以便我能快速修改后发布。
- 作为合规管理员，我希望对已发布的公域账号内容进行定期巡检，以便及时发现违规内容并下架。
- 作为律所主任，我希望所有获客素材永久留痕并支持导出，以便应对监管核查。

**3. 业务规则**

1. 营销内容（MarketingContent）创建后状态默认为 `draft`，提交审核后变为 `pending_review`，必须经过合规预审才能变更为 `approved`，未通过审核（`rejected`）的内容禁止对外发布。
2. 合规预审基于 `ComplianceRule` 规则库（check_stage='acquisition'），按 keyword/regex/manual 三种规则类型匹配，命中任意一条 reject 级别规则即返回拒绝结果。
3. 已审核通过（status='approved'）的营销内容，系统每日 02:00 自动执行巡检（is_inspection=true），识别后续平台规则变更引发的违规，生成预警记录并通知 reviewer_id。
4. 同一营销内容 24 小时内提交审核超过 5 次，触发频率限制并提示"请检查内容质量后再提交"。
5. 所有营销内容及其审核记录永久留存，禁止物理删除，仅支持状态置为 `rejected`，监管核查时可按 organization_id + 时间范围一键导出。
6. 营销内容必须绑定平台（platform: douyin/baidu/kuaishou/wechat/other），未绑定平台的素材禁止提交审核。

**4. 输入/输出规范**

输入字段（POST /api/compliance/marketing-content）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| title | string | 是 | 长度1-100字符，禁止含特殊符号 |
| content | string | 是 | 长度≥10字符，富文本内容 |
| content_type | string | 是 | 枚举值：article/video/image/short_text |
| platform | string | 是 | 枚举值：douyin/baidu/kuaishou/wechat/other |
| organization_id | string | 是 | UUID格式，必须为当前登录用户所属组织 |
| operator_id | string | 是 | UUID格式，必须为系统有效用户 |

输出结果：返回创建的 MarketingContent 记录，包含自动生成的合规预审结果（compliance_issues、compliance_suggestions）；若命中拒绝规则，返回 422 状态码及违规明细。

**5. 数据模型**

实体名：MarketingContent（表名 marketing_contents）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| title | varchar(255) | NOT NULL | 标题 |
| content | text | NOT NULL | 内容正文 |
| content_type | varchar(50) | NOT NULL | 内容类型 |
| platform | varchar(50) | NOT NULL | 平台类型 |
| status | varchar(20) | DEFAULT 'draft' | 状态：draft/pending_review/approved/rejected |
| compliance_issues | text | NULL | 合规问题（JSON） |
| compliance_suggestions | text | NULL | 修改建议（JSON） |
| review_time | datetime | NULL | 审核时间 |
| reviewer_id | varchar(36) | NULL | 审核人ID |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| operator_id | varchar(36) | NOT NULL | 操作人ID |
| created_at | datetime | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

实体名：ComplianceCheckResult（表名 compliance_check_results，target_type='marketing_content'）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| rule_id | varchar(36) | NOT NULL | 命中的规则ID |
| target_type | varchar(50) | NOT NULL | 目标类型，固定为 'marketing_content' |
| target_id | varchar(36) | NOT NULL | 营销内容ID |
| check_result | varchar(20) | NOT NULL | pass/review/reject |
| violation_content | text | NULL | 违规内容片段 |
| handler_id | varchar(36) | NULL | 处理人ID |
| handle_status | varchar(20) | DEFAULT 'pending' | pending/processed/ignored |
| handle_note | text | NULL | 处理备注 |
| is_inspection | boolean | DEFAULT 0 | 是否为巡检产生 |
| created_at | datetime | NOT NULL | 创建时间 |
| handled_at | datetime | NULL | 处理时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/compliance/marketing-content | 创建营销内容并触发合规预审 | JWT |
| PUT | /api/compliance/marketing-content/:id/review | 人工审核营销内容 | JWT |
| GET | /api/compliance/marketing-content | 查询营销内容列表 | JWT |
| POST | /api/compliance/check | 通用合规检查接口 | JWT |
| GET | /api/compliance/records | 查询合规记录列表 | JWT |

请求示例（POST /api/compliance/marketing-content）：

```json
{
  "title": "离婚诉讼常见问题解答",
  "content": "我们律所专业代理离婚案件，包赢承诺100%胜诉，欢迎咨询。",
  "content_type": "article",
  "platform": "douyin",
  "organization_id": "org-uuid-001",
  "operator_id": "user-uuid-001"
}
```

成功响应（200 OK）：

```json
{
  "id": "mc-uuid-001",
  "title": "离婚诉讼常见问题解答",
  "content": "我们律所专业代理离婚案件，包赢承诺100%胜诉，欢迎咨询。",
  "status": "rejected",
  "compliance_issues": "[\"命中规则R001：禁止使用'包赢''100%胜诉'等绝对化承诺表述\"]",
  "compliance_suggestions": "[\"建议修改为：'我们律所专业代理离婚案件，为您提供专业法律意见，欢迎咨询'\"]",
  "review_time": null,
  "reviewer_id": null,
  "organization_id": "org-uuid-001",
  "operator_id": "user-uuid-001",
  "created_at": "2026-07-25T10:30:00.000Z",
  "updated_at": "2026-07-25T10:30:00.000Z"
}
```

失败响应（422 Unprocessable Entity）：

```json
{
  "statusCode": 422,
  "message": "营销内容未通过合规预审，禁止发布",
  "error": "ComplianceCheckFailed",
  "violations": [
    {
      "rule_id": "rule-uuid-001",
      "rule_name": "禁止绝对化承诺",
      "matched_content": "包赢承诺100%胜诉",
      "suggestion": "请删除绝对化承诺表述"
    }
  ]
}
```

**7. 交互流程**

1. 营销人员在「合规风控-获客合规」页面填写标题、内容、平台并点击"提交审核"。
2. 前端校验表单完整性后调用 POST /api/compliance/marketing-content。
3. 后端 ComplianceService.createMarketingContent 接收请求，写入 marketing_contents 表（status='pending_review'）。
4. 后端同步调用 checkCompliance(content, 'marketing_content', org_id, operator_id, source_id) 加载 check_stage='acquisition' 的启用规则集。
5. 规则引擎按 keyword → regex → manual 顺序匹配，命中规则则写入 compliance_check_results 表。
6. 后端根据检查结果更新 status：全通过→approved，命中拒绝→rejected 并回填 compliance_issues/suggestions。
7. 前端接收响应，approved 时提示"审核通过可发布"，rejected 时高亮显示违规片段及修改建议。
8. 巡检定时任务每日 02:00 扫描所有 approved 内容，重新执行合规检查，命中规则则创建 is_inspection=true 的预警记录。

**8. 异常场景**

1. **规则库为空**：当 organization_id 下无启用的 acquisition 阶段规则时，返回 400 错误"未配置获客阶段合规规则，请联系管理员"，禁止内容直接发布。
2. **频率超限**：同一 operator_id 24 小时内提交审核超过 5 次，返回 429 状态码，提示"今日审核提交已达上限，请优化内容后再试"。
3. **平台账号未绑定**：当 platform=douyin 但律所未绑定抖音账号时，返回 400 错误"平台账号未绑定，请先在【公域账号管理】完成绑定"。
4. **巡检服务异常**：定时巡检任务失败时记录错误日志，3 次重试后告警通知管理员，但不影响正常业务流程，下一次巡检周期自动恢复。
5. **内容超长**：富文本内容超过 50KB 时，返回 413 错误"内容超出长度限制（50KB），请精简后提交"。

**9. 验收标准**

- **正常场景**：Given 营销人员提交了一条不含违规词的内容，When 调用 POST /api/compliance/marketing-content，Then 返回 status='approved' 且 compliance_issues 为空，内容可在公域账号管理中发布。
- **边界场景**：Given 营销内容仅命中一条 review 级别规则（非 reject），When 调用创建接口，Then 返回 status='pending_review' 并附带 review 级别提示，等待人工审核后变更状态。
- **异常场景**：Given 营销内容包含"100%胜诉"等绝对化承诺，When 调用创建接口，Then 返回 422 状态码及违规明细，marketing_contents 表中 status='rejected'，禁止发布。
- **巡检场景**：Given 一条已审核通过的内容后续被平台规则变更判定违规，When 每日 02:00 巡检任务执行，Then 生成一条 is_inspection=true 的 ComplianceCheckResult 并通知 reviewer_id。

---

#### 5.2 谈案环节智能合规质检

**1. 功能描述**

全量质检谈案通话与聊天记录，通过AI自动识别虚假承诺、包胜诉、夸大效果、违规收费等违规表述，违规内容自动标记并通知负责人与管理员，支持按员工、时间、违规类型统计合规率，生成质检报表。

**2. 用户故事**

- 作为谈案岗销售，我希望通话结束后能及时收到质检反馈，以便我能纠正话术违规。
- 作为销售主管，我希望按周查看团队成员的合规率报表，以便针对性地开展话术培训。
- 作为合规管理员，我希望对违规通话自动生成预警工单，以便跟踪整改进度。

**3. 业务规则**

1. 所有通话/聊天记录（SalesCompliance 或 TalkQualityCheck）入库后，自动触发 AI 质检任务，质检覆盖率必须达到 100%。
2. 违规类型（TalkViolationType）包括：false_promise（虚假承诺/包胜诉）、exaggerate（夸大效果）、illegal_fee（违规收费）、other（其他），命中任一类型即设置 check_result='violation'。
3. check_result='violation' 的记录，系统自动通知对应 inviter_id 和管理员，notified=true 并记录 notified_at；check_result='warning' 仅通知 inviter_id。
4. 违规工单 handle_status 默认为 'pending'，必须在 48 小时内由 handler_id 处理为 'processed'，否则升级通知管理员。
5. 同一 inviter_id 单日命中违规超过 3 次，自动触发"话术风险"预警并暂停该销售的新商机分配权限。
6. 风险告知签署（risk_disclosure_accepted）必须在签约前完成，未签署的商机禁止推进至签约阶段。

**4. 输入/输出规范**

输入字段（POST /api/compliance/sales-compliance）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| lead_id | string | 是 | UUID格式，必须为有效商机ID |
| sales_id | string | 是 | UUID格式，谈案销售人员ID |
| channel | string | 是 | 枚举值：phone/wechat/qq/other |
| content | string | 否 | 聊天记录文本，channel=phone 时可空 |
| audio_url | string | 否 | 通话录音URL，channel=phone 时必填 |
| organization_id | string | 是 | UUID格式，当前用户所属组织 |

输出结果：返回创建的 SalesCompliance 记录及关联的 TalkQualityCheck 质检结果，包含 violation_type、violation_content、check_result 字段。

**5. 数据模型**

实体名：TalkQualityCheck（表名 talk_quality_checks）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| invite_task_id | varchar(36) | NOT NULL | 邀约任务ID |
| check_type | varchar(20) | NOT NULL | call/chat |
| violation_type | varchar(30) | NULL | false_promise/exaggerate/illegal_fee/other |
| violation_content | text | NULL | 违规内容片段 |
| violation_keyword | varchar(255) | NULL | 命中关键词 |
| check_result | varchar(20) | DEFAULT 'pass' | pass/warning/violation |
| handle_status | varchar(20) | DEFAULT 'pending' | pending/processed |
| handler_id | varchar(36) | NULL | 处理人ID |
| handle_note | text | NULL | 处理备注 |
| organization_id | varchar(36) | NULL | 组织ID |
| inviter_id | varchar(36) | NULL | 邀约人ID（冗余） |
| notified | boolean | DEFAULT 0 | 是否已通知 |
| notified_at | datetime | NULL | 通知时间 |
| notification_summary | text | NULL | 通知摘要 |
| created_at | datetime | NOT NULL | 创建时间 |
| handled_at | datetime | NULL | 处理时间 |

实体名：SalesCompliance（表名 sales_compliance）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| lead_id | varchar(36) | NOT NULL | 商机ID |
| sales_id | varchar(36) | NOT NULL | 销售ID |
| channel | varchar(20) | NOT NULL | phone/wechat/qq/other |
| content | text | NULL | 聊天/通话转写内容 |
| audio_url | varchar(500) | NULL | 录音URL |
| check_result | varchar(20) | DEFAULT 'pass' | pass/warning/violation |
| violation_details | text | NULL | 违规明细 |
| risk_disclosure_accepted | boolean | DEFAULT 0 | 风险告知是否签署 |
| risk_disclosure_time | datetime | NULL | 风险告知签署时间 |
| risk_disclosure_content | text | NULL | 风险告知内容 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/compliance/sales-compliance | 创建谈案合规记录并触发AI质检 | JWT |
| POST | /api/compliance/sales-compliance/:leadId/risk-disclosure | 记录风险告知签署 | JWT |
| GET | /api/compliance/sales-compliance | 查询谈案合规记录 | JWT |
| GET | /api/compliance/records | 查询合规记录（含质检结果） | JWT |

请求示例（POST /api/compliance/sales-compliance）：

```json
{
  "lead_id": "lead-uuid-001",
  "sales_id": "user-uuid-sales01",
  "channel": "phone",
  "audio_url": "https://oss.example.com/calls/20260725/call-001.wav",
  "content": "我们保证能帮你胜诉，先交5000元咨询费。",
  "organization_id": "org-uuid-001"
}
```

成功响应（200 OK）：

```json
{
  "id": "sc-uuid-001",
  "lead_id": "lead-uuid-001",
  "sales_id": "user-uuid-sales01",
  "channel": "phone",
  "check_result": "violation",
  "violation_details": "[{\"type\":\"false_promise\",\"content\":\"保证能帮你胜诉\"},{\"type\":\"illegal_fee\",\"content\":\"先交5000元咨询费\"}]",
  "risk_disclosure_accepted": false,
  "talk_quality_checks": [
    {
      "id": "tqc-uuid-001",
      "check_type": "call",
      "violation_type": "false_promise",
      "violation_content": "保证能帮你胜诉",
      "check_result": "violation",
      "notified": true,
      "notified_at": "2026-07-25T14:30:00.000Z"
    }
  ],
  "created_at": "2026-07-25T14:29:50.000Z"
}
```

失败响应（400 Bad Request）：

```json
{
  "statusCode": 400,
  "message": "channel=phone 时 audio_url 必填",
  "error": "BadRequestError"
}
```

**7. 交互流程**

1. 销售在 CRM 中结束通话或上传聊天记录后，前端调用 POST /api/compliance/sales-compliance。
2. 后端 ComplianceService.createSalesCompliance 写入 sales_compliance 表。
3. 后端异步触发 AI 质检：调用 ASR 服务转写音频（如未提供 content），然后加载 negotiation 阶段规则。
4. 规则引擎识别违规内容，写入 talk_quality_checks 表，回填 check_result 和 violation_details。
5. 命中违规时，调用通知服务向 inviter_id 和管理员发送通知，notified=true。
6. 前端通过 WebSocket 接收实时质检结果，弹窗提示违规并展示违规片段。
7. 销售主管在「质检报表」页面查看团队合规率，可按时间/员工/违规类型筛选。
8. handler 在 48 小时内处理违规工单，handle_status='processed'，超时自动升级。

**8. 异常场景**

1. **AI 质检服务不可用**：ASR 或规则引擎调用失败时，TalkQualityCheck 记录 check_result='pass' 但 handle_status='pending' 标记为"待人工复核"，5 分钟后自动重试。
2. **录音文件损坏**：audio_url 对应文件无法访问或解码失败，返回 400 错误"录音文件无法访问，请检查文件链接"，sales_compliance 表不创建记录。
3. **商机状态不允许质检**：当 lead_id 对应商机已签约时，返回 409 错误"商机已签约，无需进行谈案质检"。
4. **重复质检**：同一 lead_id + sales_id + channel 在 1 小时内重复提交，返回 409 错误"该商机已有质检记录，请勿重复提交"。

**9. 验收标准**

- **正常场景**：Given 销售上传了一段不含违规话术的通话录音，When 调用 POST /api/compliance/sales-compliance，Then check_result='pass'，talk_quality_checks 表无 violation 记录。
- **边界场景**：Given 销售话术中包含"包赢"关键词，When AI 质检执行，Then check_result='violation'，violation_type='false_promise'，notified=true，inviter_id 和管理员均收到通知。
- **异常场景**：Given 同一 lead_id 在 1 小时内重复提交质检，When 调用创建接口，Then 返回 409 状态码，提示"该商机已有质检记录，请勿重复提交"。
- **超时升级场景**：Given 一条 violation 工单 48 小时内未处理，When 定时任务扫描，Then 自动升级通知管理员并标记 handle_status 仍为 'pending' 但 escalated=true。

---

#### 5.3 签约环节合规管控

**1. 功能描述**

规范签约全流程，强制使用系统合规模板、校验办案律师执业资质、管控风险告知签署，规避合同合规风险。所有签约合规材料自动归档至案件档案，支持监管核查。

**2. 用户故事**

- 作为办案律师，我希望在签约时系统自动校验我的执业资质有效性，以便避免因资质过期无法签约。
- 作为签约岗人员，我希望使用系统预置的合规模板生成委托合同，以便规避自定义条款风险。
- 作为合规管理员，我希望签约必须完成风险告知签署才能生效，以便留存合规证据。

**3. 业务规则**

1. 委托合同必须使用 ContractTemplate（is_approved=true）作为基础模板，自定义修改需触发合同合规审查（contract_compliance_passed=false 时禁止完成签约）。
2. SigningCompliance 创建时，自动校验 lawyer_id 对应的 LawyerQualification：status 必须为 'verified' 且 valid_until 必须晚于当前日期，否则 lawyer_qualification_verified=false 并禁止签约。
3. 风险告知（RiskDisclosure）必须在签约完成前签署，risk_disclosure_signed=false 时调用 completeSigning 接口返回 400 错误。
4. 签约状态流转：pending → reviewing → signed（或 rejected），状态不可逆，signed 后合同内容禁止修改。
5. 合同合规检查命中违规条款时，contract_compliance_issues 字段记录违规明细，需人工修改后重新提交审核。
6. 一份合同模板（ContractTemplate）启用前必须经合规管理员审核，is_approved=true 才能在签约流程中引用。

**4. 输入/输出规范**

输入字段（POST /api/compliance/signing-compliance）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | string | 是 | UUID格式，必须为有效案件ID |
| client_id | string | 是 | UUID格式，委托人ID |
| lawyer_id | string | 是 | UUID格式，办案律师ID，必须持有有效执业证 |
| contract_template_id | string | 否 | UUID格式，未提供则使用默认模板 |
| contract_content | string | 否 | 自定义合同内容，与 template 二选一 |
| organization_id | string | 是 | UUID格式，当前用户所属组织 |

输出结果：返回 SigningCompliance 记录，包含 lawyer_qualification_verified、risk_disclosure_signed、contract_compliance_passed 三个校验状态及签约状态。

**5. 数据模型**

实体名：SigningCompliance（表名 signing_compliance）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| client_id | varchar(36) | NOT NULL | 委托人ID |
| lawyer_id | varchar(36) | NOT NULL | 律师ID |
| contract_template_id | varchar(36) | NULL | 合同模板ID |
| status | varchar(20) | DEFAULT 'pending' | pending/reviewing/signed/rejected |
| lawyer_qualification_verified | boolean | DEFAULT 0 | 律师资质校验结果 |
| risk_disclosure_signed | boolean | DEFAULT 0 | 风险告知签署状态 |
| contract_compliance_passed | boolean | DEFAULT 0 | 合同合规校验结果 |
| contract_compliance_issues | text | NULL | 合同违规明细 |
| contract_content | text | NULL | 合同内容 |
| signed_time | datetime | NULL | 签约时间 |
| risk_disclosure_time | datetime | NULL | 风险告知签署时间 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

实体名：LawyerQualification（表名 lawyer_qualifications）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| user_id | varchar(36) | NOT NULL | 用户ID |
| license_number | varchar(50) | NOT NULL | 执业证号 |
| license_type | varchar(20) | NOT NULL | lawyer/paralegal/legal_worker |
| valid_until | datetime | NOT NULL | 有效期至 |
| status | varchar(20) | DEFAULT 'pending' | pending/verified/expired/revoked |
| verified_at | datetime | NULL | 审核时间 |
| verified_by | varchar(36) | NULL | 审核人ID |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

实体名：ContractTemplate（表名 contract_templates）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| name | varchar(100) | NOT NULL | 模板名称 |
| case_type | varchar(50) | NOT NULL | 适用案由 |
| content | text | NOT NULL | 模板内容 |
| version | integer | DEFAULT 1 | 版本号 |
| is_approved | boolean | DEFAULT 0 | 是否审核通过 |
| created_by | varchar(36) | NOT NULL | 创建人ID |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

实体名：RiskDisclosure（表名 risk_disclosures）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NULL | 案件ID |
| opportunity_id | varchar(36) | NULL | 商机ID |
| signed_by | varchar(36) | NOT NULL | 签署人ID |
| signed_at | datetime | NOT NULL | 签署时间 |
| content | text | NOT NULL | 告知内容 |
| file_path | varchar(500) | NULL | 文件路径 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/compliance/signing-compliance | 创建签约合规记录 | JWT |
| PUT | /api/compliance/signing-compliance/:id/risk-disclosure | 签署风险告知 | JWT |
| PUT | /api/compliance/signing-compliance/:id/complete | 完成签约 | JWT |
| GET | /api/compliance/signing-compliance | 查询签约合规记录 | JWT |

请求示例（PUT /api/compliance/signing-compliance/:id/complete）：

```http
PUT /api/compliance/signing-compliance/sign-uuid-001/complete
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

成功响应（200 OK）：

```json
{
  "id": "sign-uuid-001",
  "case_id": "case-uuid-001",
  "client_id": "client-uuid-001",
  "lawyer_id": "lawyer-uuid-001",
  "status": "signed",
  "lawyer_qualification_verified": true,
  "risk_disclosure_signed": true,
  "contract_compliance_passed": true,
  "signed_time": "2026-07-25T16:00:00.000Z",
  "risk_disclosure_time": "2026-07-25T15:50:00.000Z"
}
```

失败响应（400 Bad Request）：

```json
{
  "statusCode": 400,
  "message": "签约前置条件未满足",
  "error": "SigningPreconditionFailed",
  "unmet_conditions": [
    { "field": "lawyer_qualification_verified", "value": false, "reason": "律师执业证已过期，请先更新资质" },
    { "field": "risk_disclosure_signed", "value": false, "reason": "风险告知未签署" }
  ]
}
```

**7. 交互流程**

1. 签约岗在「合规风控-签约合规」页面选择案件、委托人、办案律师、合同模板，点击"创建签约记录"。
2. 前端调用 POST /api/compliance/signing-compliance。
3. 后端 ComplianceService.createSigningCompliance 写入 signing_compliance 表（status='pending'）。
4. 后端自动校验律师资质：查询 lawyer_qualifications 表，校验 status='verified' 且 valid_until > 当前日期，结果写入 lawyer_qualification_verified。
5. 后端调用合同合规检查引擎，比对 contract_content 与 ContractTemplate，结果写入 contract_compliance_passed 和 contract_compliance_issues。
6. 委托人在 C 端阅读并签署风险告知，前端调用 PUT /api/compliance/signing-compliance/:id/risk-disclosure，后端写入 risk_disclosure_signed=true 和 risk_disclosure_time，并同步写入 risk_disclosures 表。
7. 三项校验全部通过后，签约岗点击"完成签约"，前端调用 PUT /api/compliance/signing-compliance/:id/complete。
8. 后端校验前置条件全部满足，更新 status='signed' 和 signed_time，触发案件状态推进。

**8. 异常场景**

1. **律师资质过期**：lawyer_id 对应的 LawyerQualification.status='expired' 或 valid_until < 当前日期，返回律师资质校验失败，禁止完成签约，提示"律师执业证已过期，请前往【律师资质管理】更新"。
2. **合同模板未审核**：contract_template_id 对应的 ContractTemplate.is_approved=false，返回 400 错误"合同模板未审核通过，请选择已审核模板"。
3. **风险告知未签署即完成签约**：risk_disclosure_signed=false 时调用 completeSigning，返回 400 错误"风险告知未签署，无法完成签约"。
4. **重复签约**：case_id 已存在 status='signed' 的记录，返回 409 错误"该案件已完成签约，请勿重复操作"。
5. **合同内容违规**：contract_compliance_passed=false 时禁止完成签约，需用户修改合同内容后重新提交审核。

**9. 验收标准**

- **正常场景**：Given 律师资质有效、合同使用已审核模板、风险告知已签署，When 调用 PUT /api/compliance/signing-compliance/:id/complete，Then 返回 status='signed'，signed_time 非空。
- **边界场景**：Given 律师执业证 valid_until 为今日，When 创建签约记录，Then lawyer_qualification_verified=true（包含当日有效）。
- **异常场景**：Given 律师执业证已过期，When 创建签约记录，Then lawyer_qualification_verified=false，禁止完成签约并提示更新资质。
- **风险告知缺失场景**：Given risk_disclosure_signed=false，When 调用完成签约接口，Then 返回 400 状态码及未满足条件清单。

---

#### 5.4 办案交付合规管控

**1. 功能描述**

管控办案全流程合规性，通过 SOP 强制节点、超期预警、文书/证据巡检、人员变更审批四大能力，规避挂名办案、违规转委托等执业风险，确保案件办理过程可追溯。

**2. 用户故事**

- 作为办案律师，我希望系统能清晰展示当前案件的 SOP 节点进度，以便我知道下一步该做什么。
- 作为合规管理员，我希望案件节点超期时能自动预警，以便及时督促律师推进案件。
- 作为律所主任，我希望主办律师变更必须经过审批，以便管控挂名办案风险。

**3. 业务规则**

1. 案件立案后自动生成 CaseSOP 节点序列（按 case_type 匹配模板），强制节点（is_required=true）未完成时，案件无法推进至下一阶段。
2. CaseSOP 节点 deadline 到期未完成，自动创建 CaseComplianceCheck（check_type='overdue_warning'），risk_level 按超期天数分级：1-7天 low、8-30天 medium、>30天 high。
3. 文书/证据巡检（check_type='document_inspection'/'evidence_inspection'）每周执行一次，识别缺失或违规文书，生成预警。
4. 主办律师变更（change_type='main_lawyer'）和转委托（change_type='delegation'）必须经过审批，status='pending' 时变更不生效，审批通过后 case 表对应字段才更新。
5. 挂名办案检测：当 CaseSOP.operator_id 与案件实际主办律师不一致超过 30 天，自动触发 personnel_change 类型的合规检查。
6. evidence_verified=false 的节点禁止标记为 completed，必须先完成证据校验。

**4. 输入/输出规范**

输入字段（POST /api/compliance/case-sop）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | string | 是 | UUID格式，必须为已立案案件 |
| case_type | string | 是 | 案由代码，必须为系统预设案由 |
| organization_id | string | 是 | UUID格式，当前用户所属组织 |

输入字段（PUT /api/compliance/case-sop/:id/complete）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| operator_id | string | 是 | UUID格式，操作人ID |
| notes | string | 否 | 完成备注，最长500字符 |

输出结果：返回 CaseSOP 记录及关联的 CaseComplianceCheck 记录，包含节点状态、超期预警、巡检结果。

**5. 数据模型**

实体名：CaseSOP（表名 case_sop）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| case_type | varchar(50) | NOT NULL | 案由 |
| step_name | varchar(100) | NOT NULL | 节点名称 |
| step_order | integer | NOT NULL | 节点顺序 |
| status | varchar(20) | DEFAULT 'pending' | pending/completed/overdue |
| deadline | datetime | NOT NULL | 截止时间 |
| completed_time | datetime | NULL | 完成时间 |
| operator_id | varchar(36) | NULL | 操作人ID |
| notes | text | NULL | 备注 |
| evidence_check_result | text | NULL | 证据校验结果（JSON） |
| evidence_verified | boolean | DEFAULT 0 | 证据是否已校验 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

实体名：CaseComplianceCheck（表名 case_compliance_checks）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| check_type | varchar(30) | NOT NULL | sop_node/overdue_warning/document_inspection/evidence_inspection/personnel_change |
| check_result | varchar(20) | NOT NULL | pass/warning/violation |
| risk_level | varchar(10) | DEFAULT 'low' | low/medium/high |
| violation_detail | text | NULL | 违规明细 |
| handler_id | varchar(36) | NULL | 处理人ID |
| handle_status | varchar(20) | DEFAULT 'pending' | pending/processed/ignored |
| handle_note | text | NULL | 处理备注 |
| source_id | varchar(36) | NULL | 关联来源ID |
| organization_id | varchar(36) | NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| handled_at | datetime | NULL | 处理时间 |

实体名：CasePersonnelChange（表名 case_personnel_changes）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| change_type | varchar(20) | NOT NULL | main_lawyer/assistant/delegation |
| original_person_id | varchar(36) | NULL | 原人员ID |
| new_person_id | varchar(36) | NOT NULL | 新人员ID |
| reason | text | NOT NULL | 变更原因 |
| approver_id | varchar(36) | NULL | 审批人ID |
| status | varchar(20) | DEFAULT 'pending' | pending/approved/rejected |
| approval_note | text | NULL | 审批备注 |
| organization_id | varchar(36) | NULL | 组织ID |
| applicant_id | varchar(36) | NULL | 申请人ID |
| created_at | datetime | NOT NULL | 创建时间 |
| approved_at | datetime | NULL | 审批时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/compliance/case-sop | 创建案件 SOP 节点序列 | JWT |
| PUT | /api/compliance/case-sop/:id/complete | 完成指定 SOP 节点 | JWT |
| PUT | /api/compliance/case-sop/:id/verify-evidence | 校验证据材料 | JWT |
| GET | /api/compliance/case-sop | 查询 SOP 节点 | JWT |
| GET | /api/compliance/case-sop/stats | 查询 SOP 统计数据 | JWT |

请求示例（PUT /api/compliance/case-sop/:id/complete）：

```json
{
  "operator_id": "user-uuid-lawyer01",
  "notes": "已完成立案材料审查，证据齐全"
}
```

成功响应（200 OK）：

```json
{
  "id": "sop-uuid-001",
  "case_id": "case-uuid-001",
  "case_type": "divorce",
  "step_name": "立案材料审查",
  "step_order": 1,
  "status": "completed",
  "deadline": "2026-07-20T23:59:59.000Z",
  "completed_time": "2026-07-18T14:00:00.000Z",
  "operator_id": "user-uuid-lawyer01",
  "notes": "已完成立案材料审查，证据齐全",
  "evidence_verified": true,
  "next_step": {
    "id": "sop-uuid-002",
    "step_name": "证据收集",
    "step_order": 2,
    "deadline": "2026-08-05T23:59:59.000Z"
  }
}
```

失败响应（400 Bad Request）：

```json
{
  "statusCode": 400,
  "message": "证据未校验，无法完成节点",
  "error": "EvidenceNotVerified",
  "sop_id": "sop-uuid-001",
  "evidence_verified": false,
  "suggestion": "请先调用 PUT /api/compliance/case-sop/:id/verify-evidence 完成证据校验"
}
```

**7. 交互流程**

1. 案件立案后，系统自动调用 POST /api/compliance/case-sop 按 case_type 生成 SOP 节点序列。
2. 办案律师在「案件详情-SOP进度」页面查看当前节点，上传证据材料后点击"提交校验"。
3. 前端调用 PUT /api/compliance/case-sop/:id/verify-evidence，后端校验证据完整性，evidence_verified=true。
4. 律师点击"完成节点"，前端调用 PUT /api/compliance/case-sop/:id/complete。
5. 后端校验 evidence_verified=true 且当前节点为最前未完成节点，更新 status='completed' 和 completed_time。
6. 后端检查下一节点是否存在，若存在则解锁；若当前为强制节点未完成则案件阶段禁止推进。
7. 定时任务每日 03:00 扫描所有 status='pending' 且 deadline < 当前时间的节点，更新 status='overdue' 并创建 CaseComplianceCheck（check_type='overdue_warning'）。
8. 主办律师变更时，律师提交 CasePersonnelChange 申请，status='pending'，主任审批通过后 status='approved'，案件表对应字段更新。

**8. 异常场景**

1. **强制节点未完成即推进案件**：当存在 is_required=true 且 status!='completed' 的节点时，调用案件阶段推进接口返回 400 错误"存在未完成的强制 SOP 节点，禁止推进案件"。
2. **证据未校验完成节点**：evidence_verified=false 时调用 completeCaseSOP，返回 400 错误"证据未校验，无法完成节点"。
3. **人员变更未审批**：CasePersonnelChange.status='pending' 时，原人员仍为案件主办，禁止案件结案，提示"人员变更审批中，案件禁止结案"。
4. **SOP 模板缺失**：case_type 对应的 SOP 模板未配置时，返回 400 错误"该案由未配置 SOP 模板，请联系管理员"。
5. **重复完成节点**：status='completed' 的节点再次调用完成接口，返回 409 错误"节点已完成，请勿重复操作"。

**9. 验收标准**

- **正常场景**：Given 律师已完成证据校验，When 调用 PUT /api/compliance/case-sop/:id/complete，Then status='completed'，completed_time 非空，下一节点解锁。
- **边界场景**：Given 节点 deadline 为今日 23:59:59 且已完成，When 定时任务扫描，Then 不生成 overdue_warning 记录。
- **异常场景**：Given 节点 deadline 已过且 status='pending'，When 定时任务扫描，Then 节点 status 更新为 'overdue'，创建 CaseComplianceCheck 记录，risk_level 按超期天数分级。
- **挂名办案场景**：Given CaseSOP.operator_id 与案件主办律师不一致超过 30 天，When 巡检任务执行，Then 生成 personnel_change 类型的合规检查记录。

---

#### 5.5 结案归档合规管控

**1. 功能描述**

规范结案归档流程，强制校验卷宗材料完整性和节点闭环，电子卷宗按监管要求标准化归档，支持一键导出和永久检索调阅，满足监管检查要求。

**2. 用户故事**

- 作为办案律师，我希望在结案前系统能自动检查材料清单完整性，以便避免遗漏材料。
- 作为合规管理员，我希望结案档案按标准化格式自动归档，以便应对监管核查。
- 作为律所主任，我希望按案件或时间检索历史归档卷宗，以便复盘案件质量。

**3. 业务规则**

1. 案件提交结案申请前必须通过归档校验：material_checklist 中所有 required=true 的材料必须 uploaded=true，node_completion_check 中所有 is_required=true 的节点必须 completed=true。
2. 校验未通过时 archive_status='rejected'，reject_reason 记录缺失项，禁止结案；校验通过后 archive_status='pending' 等待归档执行。
3. 归档执行时 archive_status 流转：pending → archiving → archived，archived 后卷宗内容禁止修改。
4. 归档时间超过 30 分钟未完成，自动告警通知管理员。
5. 归档后的电子卷宗支持按 case_id、时间范围、案由、律师等多维度检索调阅，所有调阅行为留痕。
6. 卷宗材料来源包括：document（文书）、evidence（证据）、manual（手动上传），每份材料需指定 source 字段。

**4. 输入/输出规范**

输入字段（POST /api/compliance/case-archive，触发归档校验）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | string | 是 | UUID格式，必须为办理完成案件 |
| organization_id | string | 是 | UUID格式，当前用户所属组织 |
| operator_id | string | 是 | UUID格式，操作人ID |

输出结果：返回 CaseArchive 记录，包含 archive_status、material_checklist（材料清单及上传状态）、node_completion_check（节点闭环状态）。

**5. 数据模型**

实体名：CaseArchive（表名 case_archives）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| archive_status | varchar(20) | DEFAULT 'pending' | pending/archiving/archived/rejected |
| material_checklist | text | NULL | 材料清单（JSON 数组） |
| node_completion_check | text | NULL | 节点闭环检查（JSON 数组） |
| archive_path | varchar(500) | NULL | 归档路径 |
| organization_id | varchar(36) | NULL | 组织ID |
| archived_by | varchar(36) | NULL | 归档人ID |
| archived_at | datetime | NULL | 归档时间 |
| reject_reason | text | NULL | 驳回原因 |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

material_checklist JSON 结构示例：

```json
[
  {
    "name": "委托合同",
    "uploaded": true,
    "file_path": "/archives/case-001/contract.pdf",
    "file_id": "doc-uuid-001",
    "source": "document",
    "required": true,
    "description": "已签署委托合同"
  }
]
```

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/compliance/case-archive | 创建归档记录并校验 | JWT |
| PUT | /api/compliance/case-archive/:id/archive | 执行归档 | JWT |
| GET | /api/compliance/case-archive | 查询归档记录列表 | JWT |
| GET | /api/compliance/case-archive/:id | 查询归档详情 | JWT |
| GET | /api/compliance/case-archive/:id/export | 导出电子卷宗 | JWT |

请求示例（PUT /api/compliance/case-archive/:id/archive）：

```json
{
  "archived_by": "user-uuid-admin01"
}
```

成功响应（200 OK）：

```json
{
  "id": "archive-uuid-001",
  "case_id": "case-uuid-001",
  "archive_status": "archived",
  "material_checklist": "[...]",
  "node_completion_check": "[...]",
  "archive_path": "/archives/2026/07/case-uuid-001/",
  "archived_by": "user-uuid-admin01",
  "archived_at": "2026-07-25T17:30:00.000Z"
}
```

失败响应（422 Unprocessable Entity）：

```json
{
  "statusCode": 422,
  "message": "归档校验未通过，缺失必需材料",
  "error": "ArchiveValidationFailed",
  "archive_status": "rejected",
  "reject_reason": "缺失必需材料：判决书、送达回证；未完成节点：文书送达",
  "missing_materials": ["判决书", "送达回证"],
  "incomplete_nodes": ["文书送达"]
}
```

**7. 交互流程**

1. 律师在「案件详情-结案归档」页面点击"提交归档申请"。
2. 前端调用 POST /api/compliance/case-archive，传入 case_id 和组织信息。
3. 后端 ComplianceService 创建 CaseArchive 记录（archive_status='pending'），自动生成 material_checklist（按案由模板）和 node_completion_check（基于 CaseSOP）。
4. 后端扫描案件文档、证据表，更新 material_checklist 中 uploaded 字段；扫描 CaseSOP 表更新 node_completion_check 中 completed 字段。
5. 校验所有 required 材料已上传且强制节点已完成，通过则保持 'pending' 状态等待归档执行，未通过则更新 archive_status='rejected' 并记录 reject_reason。
6. 校验通过后，管理员点击"执行归档"，前端调用 PUT /api/compliance/case-archive/:id/archive。
7. 后端 archive_status 流转：pending → archiving → archived，生成 archive_path，记录 archived_by 和 archived_at。
8. 用户可在「归档检索」页面按条件检索已归档卷宗，调用 GET /api/compliance/case-archive/:id/export 导出电子卷宗。

**8. 异常场景**

1. **必需材料缺失**：material_checklist 中 required=true 但 uploaded=false 的材料存在时，archive_status='rejected'，提示"缺失必需材料：[材料名称]"。
2. **强制节点未完成**：node_completion_check 中 is_required=true 但 completed=false 的节点存在时，archive_status='rejected'，提示"未完成节点：[节点名称]"。
3. **归档超时**：archive_status='archiving' 超过 30 分钟未变为 'archived'，系统自动告警通知管理员，可人工介入处理。
4. **重复归档**：case_id 已存在 archive_status='archived' 的记录，返回 409 错误"案件已归档，请勿重复操作"。
5. **卷宗导出失败**：归档文件损坏或权限不足时，返回 500 错误"卷宗导出失败，请联系管理员"。

**9. 验收标准**

- **正常场景**：Given 案件所有必需材料已上传且强制节点已完成，When 调用归档校验接口，Then archive_status='pending'，可执行归档。
- **边界场景**：Given material_checklist 中存在非必需材料未上传，When 调用归档校验，Then archive_status='pending'（仅必需材料影响校验）。
- **异常场景**：Given 缺失必需材料"判决书"，When 调用归档校验，Then archive_status='rejected'，reject_reason 包含"缺失必需材料：判决书"。
- **导出场景**：Given 案件已归档，When 调用导出接口，Then 返回标准化电子卷宗压缩包，包含所有归档材料。

---

#### 5.6 财务税务合规校验

**1. 功能描述**

管控财务全流程合规，针对收费、发票、分润三大关键环节自动校验，识别超额/低价收费、无收款开票、异常分润等风险，生成财税合规预警和合规校验记录。

**2. 用户故事**

- 作为财务人员，我希望收款时系统能自动校验金额与合同一致性，以便避免超额或低价收费。
- 作为合规管理员，我希望发票开具时自动校验对应收款记录，以便避免无收款开票。
- 作为律所主任，我希望分润核算时自动校验分润规则合规性，以便避免异常分润。

**3. 业务规则**

1. 收费校验（check_type='receivable'）：案件累计收款金额与合同金额（contract_amount）偏差超过 ±5% 时，生成 warning 级别预警；偏差超过 ±20% 或负数时，生成 violation 级别预警。
2. 发票校验（check_type='invoice'）：发票金额必须对应已收款记录（PaymentRecord.status='paid'），无收款开票自动生成 violation 预警；发票金额超过收款金额时生成 warning。
3. 分润校验（check_type='commission'）：分润总额（所有 CommissionRecord.commission_amount 之和）不得超过案件收款金额的 50%，超过时生成 violation 预警并拦截审批。
4. 同一目标对象（target_type + target_id）24 小时内重复校验仅保留最新记录。
5. 所有 violation 级别预警必须由 handler_id 在 72 小时内处理为 'processed'，否则升级通知律所主任。
6. 财税合规校验记录永久留存，支持按 case_id、check_type、check_result、时间范围多维查询。

**4. 输入/输出规范**

输入字段（POST /api/compliance/finance-compliance-check，自动触发）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| check_type | string | 是 | 枚举值：receivable/invoice/commission |
| target_type | string | 是 | 枚举值：receivable/invoice/commission |
| target_id | string | 是 | UUID格式，目标对象ID |
| case_id | string | 否 | UUID格式，关联案件ID |
| organization_id | string | 是 | UUID格式，当前用户所属组织 |

输出结果：返回 FinanceComplianceCheck 记录，包含 check_result（pass/warning/violation）、warning_content、suggestion 字段。

**5. 数据模型**

实体名：FinanceComplianceCheck（表名 finance_compliance_checks）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| check_type | varchar(20) | NOT NULL | receivable/invoice/commission |
| target_type | varchar(20) | NOT NULL | receivable/invoice/commission |
| target_id | varchar(36) | NOT NULL | 目标对象ID |
| case_id | varchar(36) | NULL | 案件ID |
| check_result | varchar(20) | NOT NULL | pass/warning/violation |
| warning_content | text | NULL | 预警内容 |
| suggestion | text | NULL | 整改建议 |
| handler_id | varchar(36) | NULL | 处理人ID |
| handle_status | varchar(20) | DEFAULT 'pending' | pending/processed/ignored |
| handle_note | text | NULL | 处理备注 |
| organization_id | varchar(36) | NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| handled_at | datetime | NULL | 处理时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/compliance/finance-compliance-check | 创建财务合规校验记录 | JWT |
| GET | /api/compliance/finance-compliance-check | 查询财务合规校验记录 | JWT |
| PUT | /api/compliance/finance-compliance-check/:id/handle | 处理财务合规预警 | JWT |
| GET | /api/compliance/finance-compliance-check/stats | 查询财务合规统计 | JWT |

请求示例（POST /api/compliance/finance-compliance-check）：

```json
{
  "check_type": "receivable",
  "target_type": "receivable",
  "target_id": "recv-uuid-001",
  "case_id": "case-uuid-001",
  "organization_id": "org-uuid-001"
}
```

成功响应（200 OK）：

```json
{
  "id": "fcc-uuid-001",
  "check_type": "receivable",
  "target_type": "receivable",
  "target_id": "recv-uuid-001",
  "case_id": "case-uuid-001",
  "check_result": "warning",
  "warning_content": "案件累计收款金额 8,000 元，与合同金额 10,000 元偏差 -20%，低于 ±5% 容忍阈值",
  "suggestion": "请核实是否存在补缴款项安排，或补充说明低价收费原因",
  "handle_status": "pending",
  "created_at": "2026-07-25T15:00:00.000Z"
}
```

失败响应（400 Bad Request）：

```json
{
  "statusCode": 400,
  "message": "目标对象不存在",
  "error": "TargetNotFound",
  "target_type": "receivable",
  "target_id": "recv-uuid-001"
}
```

**7. 交互流程**

1. 财务人员在「财务-收款登记」录入收款或开票时，系统自动调用 POST /api/compliance/finance-compliance-check。
2. 后端 ComplianceService 加载对应 check_type 的校验规则。
3. 收费校验：查询 Receivable.contract_amount 与 PaymentRecord 累计金额比对，计算偏差比例。
4. 发票校验：查询 Invoice 对应的 PaymentRecord，校验是否存在已付款记录。
5. 分润校验：查询 CommissionRecord 总和与案件收款金额比例，校验是否超过 50%。
6. 后端写入 finance_compliance_checks 表，check_result 根据规则匹配结果设置。
7. 前端实时接收校验结果，violation 时弹窗拦截操作并提示整改建议。
8. handler 在「合规预警」页面处理预警，调用 PUT /api/compliance/finance-compliance-check/:id/handle，handle_status='processed'。

**8. 异常场景**

1. **目标对象不存在**：target_id 对应的 Receivable/Invoice/CommissionRecord 不存在时，返回 400 错误"目标对象不存在"。
2. **重复校验**：同一 target_id 在 24 小时内重复校验，覆盖原记录，提示"已更新最新校验结果"。
3. **violation 拦截**：分润校验返回 violation 时，禁止分润审批通过，提示"分润总额超过收款金额 50%，禁止审批，请调整分润规则"。
4. **超时未处理**：violation 级别预警 72 小时内未处理，自动升级通知律所主任。
5. **合同金额缺失**：Receivable.contract_amount 为 0 或 null 时，返回 400 错误"合同金额未录入，无法进行收费校验"。

**9. 验收标准**

- **正常场景**：Given 案件累计收款金额与合同金额偏差在 ±5% 内，When 触发收费校验，Then check_result='pass'，无预警内容。
- **边界场景**：Given 收款金额偏差为 -10%，When 触发收费校验，Then check_result='warning'，warning_content 提示偏差比例。
- **异常场景**：Given 分润总额占收款金额 60%，When 触发分润校验，Then check_result='violation'，禁止分润审批通过。
- **超时升级场景**：Given violation 预警 72 小时未处理，When 定时任务扫描，Then 自动通知律所主任并标记为待升级处理。

---

#### 5.7 客诉与舆情闭环管控

**1. 功能描述**

支持多渠道客诉录入生成唯一工单，客诉分级管理与自动升级，处理全流程留痕并归档至客户档案，高频投诉点自动统计反向优化业务流程。

**2. 用户故事**

- 作为客服人员，我希望从多渠道（C端、电话、微信、企业微信）录入客诉并生成唯一工单号，以便统一跟踪处理。
- 作为客诉处理人，我希望高风险投诉自动升级至管理员，以便快速响应避免舆情扩散。
- 作为律所主任，我希望统计高频投诉点，以便反向优化业务流程。

**3. 业务规则**

1. 客诉工单（ComplaintTicket）创建时自动生成唯一 ticket_number（格式：CT-YYYYMMDD-NNNN），source_channel 标识来源渠道。
2. 客诉分级：severity_level 为 low/medium/high/critical，其中 high 和 critical 自动触发升级（escalated=true），通知管理员。
3. severity_level='critical' 的工单必须在 2 小时内响应，24 小时内解决；'high' 工单 4 小时内响应，48 小时内解决；超时自动升级。
4. 工单状态流转：pending → processing → resolved → closed（或 escalated），status 不可逆（closed 后不可重开）。
5. 处理记录（process_records）以 JSON 数组形式永久保存所有操作日志，包括创建、分配、处理、状态变更、升级、解决、关闭、备注等动作。
6. 工单关闭后 archived=true，自动归档至对应客户档案和案件档案；高频投诉点（同 complaint_type 月度发生 ≥5 次）自动生成流程优化建议。

**4. 输入/输出规范**

输入字段（POST /api/compliance/complaint）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| type | string | 是 | 枚举值：service_attitude/case_progress/fee_issue/lawyer_professional/other |
| content | string | 是 | 投诉内容，长度≥10字符 |
| client_id | string | 是 | UUID格式，投诉客户ID |
| client_name | string | 是 | 客户姓名 |
| client_phone | string | 是 | 手机号格式校验 |
| organization_id | string | 是 | UUID格式，当前用户所属组织 |
| case_id | string | 否 | UUID格式，关联案件ID |
| evidence_files | string | 否 | 证据文件URL（JSON数组） |

输出结果：返回创建的 Complaint 及关联的 ComplaintTicket 记录，包含 ticket_number、severity_level、status 等字段。

**5. 数据模型**

实体名：ComplaintTicket（表名 complaint_tickets）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| ticket_number | varchar(50) | NOT NULL, UNIQUE | 工单编号 |
| source_channel | varchar(30) | NOT NULL | client_portal/phone/wechat/enterprise_wechat/other |
| complaint_type | varchar(30) | NOT NULL | service_attitude/case_progress/fee_issue/lawyer_professional/other |
| severity_level | varchar(10) | DEFAULT 'low' | low/medium/high/critical |
| title | varchar(200) | NOT NULL | 工单标题 |
| content | text | NOT NULL | 工单内容 |
| case_id | varchar(36) | NULL | 关联案件ID |
| client_id | varchar(36) | NULL | 客户ID |
| client_name | varchar(100) | NULL | 客户姓名 |
| client_phone | varchar(20) | NULL | 客户电话 |
| handler_id | varchar(36) | NULL | 处理人ID |
| status | varchar(20) | DEFAULT 'pending' | pending/processing/resolved/closed/escalated |
| process_records | text | NULL | 处理记录（JSON数组） |
| resolved_at | datetime | NULL | 解决时间 |
| closed_at | datetime | NULL | 关闭时间 |
| archived | boolean | DEFAULT 0 | 是否已归档 |
| archived_at | datetime | NULL | 归档时间 |
| escalated | boolean | DEFAULT 0 | 是否已升级 |
| escalated_at | datetime | NULL | 升级时间 |
| organization_id | varchar(36) | NULL | 组织ID |
| resolution | text | NULL | 解决方案 |
| satisfaction_score | integer | NULL | 满意度评分（1-5） |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

实体名：Complaint（表名 complaints）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| type | varchar(30) | NOT NULL | 投诉类型 |
| content | text | NOT NULL | 投诉内容 |
| status | varchar(20) | DEFAULT 'new' | 投诉状态 |
| client_id | varchar(36) | NOT NULL | 客户ID |
| client_name | varchar(100) | NOT NULL | 客户姓名 |
| client_phone | varchar(20) | NOT NULL | 客户电话 |
| evidence_files | text | NULL | 证据文件 |
| case_id | varchar(36) | NULL | 关联案件ID |
| assignee_id | varchar(36) | NULL | 分配处理人ID |
| process_note | text | NULL | 处理备注 |
| resolution | text | NULL | 解决方案 |
| satisfaction_score | integer | NULL | 满意度评分 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/compliance/complaint | 创建客诉工单 | JWT |
| PUT | /api/compliance/complaint/:id/status | 更新客诉状态/分配处理人 | JWT |
| PUT | /api/compliance/complaint/:id/close | 关闭客诉工单 | JWT |
| GET | /api/compliance/complaints | 查询客诉列表 | JWT |
| GET | /api/compliance/complaint/:id | 查询客诉详情 | JWT |

请求示例（POST /api/compliance/complaint）：

```json
{
  "type": "lawyer_professional",
  "content": "办案律师长期不回复消息，案件进展缓慢，已3个月无进展。",
  "client_id": "client-uuid-001",
  "client_name": "张三",
  "client_phone": "13800138000",
  "organization_id": "org-uuid-001",
  "case_id": "case-uuid-001",
  "evidence_files": "[\"https://oss.example.com/evidence/001.png\"]"
}
```

成功响应（200 OK）：

```json
{
  "id": "cp-uuid-001",
  "type": "lawyer_professional",
  "status": "new",
  "ticket": {
    "id": "ct-uuid-001",
    "ticket_number": "CT-20260725-0001",
    "source_channel": "client_portal",
    "complaint_type": "lawyer_professional",
    "severity_level": "high",
    "title": "律师专业度投诉-张三",
    "status": "pending",
    "escalated": true,
    "escalated_at": "2026-07-25T18:00:00.000Z",
    "process_records": "[{\"action\":\"create\",\"operator_id\":\"user-uuid-001\",\"content\":\"客诉工单创建\",\"created_at\":\"2026-07-25T18:00:00.000Z\"}]"
  },
  "created_at": "2026-07-25T18:00:00.000Z"
}
```

失败响应（400 Bad Request）：

```json
{
  "statusCode": 400,
  "message": "客户电话格式错误",
  "error": "BadRequestError",
  "field": "client_phone",
  "value": "1380013800"
}
```

**7. 交互流程**

1. 客户通过 C 端、电话、微信等渠道发起投诉，客服人员在「客诉管理」页面录入投诉信息。
2. 前端调用 POST /api/compliance/complaint 创建投诉。
3. 后端 ComplianceService.createComplaint 写入 complaints 表，并自动创建 ComplaintTicket 记录（生成 ticket_number）。
4. 后端根据 complaint_type 和 content 自动判定 severity_level，high/critical 时 escalated=true 并通知管理员。
5. 管理员在「客诉工单」页面分配 handler_id，前端调用 PUT /api/compliance/complaint/:id/status，status='processing'，process_records 追加分配记录。
6. handler 处理工单，更新 process_records，处理完成后调用 PUT /api/compliance/complaint/:id/close，status='closed'，记录 resolution 和 satisfaction_score。
7. 工单关闭后 archived=true，自动归档至客户档案和案件档案。
8. 定时任务每周统计高频投诉点，生成流程优化建议通知律所主任。

**8. 异常场景**

1. **客户信息缺失**：client_id 或 client_phone 为空时，返回 400 错误"客户信息缺失，请补充客户ID和联系方式"。
2. **超时未响应**：severity_level='critical' 的工单 2 小时内未变为 'processing'，自动升级并通知律所主任。
3. **重复创建工单**：同一 client_id + case_id + content（哈希比对）在 24 小时内重复创建，返回 409 错误"该客诉已存在工单，请勿重复提交"。
4. **关闭后重开**：status='closed' 的工单调用状态更新接口，返回 409 错误"工单已关闭，不可重开，请新建工单"。
5. **满意度评分越界**：satisfaction_score 不在 1-5 范围内，返回 400 错误"满意度评分必须在 1-5 之间"。

**9. 验收标准**

- **正常场景**：Given 客服录入一条 medium 级别客诉，When 调用 POST /api/compliance/complaint，Then 生成唯一 ticket_number，status='pending'，escalated=false。
- **边界场景**：Given 客诉内容判定为 critical 级别，When 创建工单，Then escalated=true，2 小时内未响应自动通知律所主任。
- **异常场景**：Given 同一客户 + 案件 + 内容 24 小时内重复提交，When 调用创建接口，Then 返回 409 状态码，提示"该客诉已存在工单"。
- **归档场景**：Given 工单已关闭，When 关闭后 24 小时定时任务执行，Then archived=true，archived_at 非空，归档至客户和案件档案。

---

### 模块6：财务分润与收支管理系统

### 模块6概述

财务分润与收支管理系统覆盖网推律所"收费—分润—成本—退费—报表"全财务链路，自动归集应收账款、智能核算多角色提成、精准核算单案利润、规范退费流程、生成多维度财务报表。本模块共5个功能点，与后端 `backend/src/finance/` 模块对应，全局API前缀 `/api/finance` 和 `/api/commission`，JWT鉴权。

---

#### 6.1 案件收费管理

**1. 功能描述**

案件收费、开票全流程线上管理，立案后自动生成应收款台账，支持分期收款、收款登记、电子开票、逾期预警，收款数据自动同步案件进度。

**2. 用户故事**

- 作为财务人员，我希望案件立案后系统自动生成应收款台账，以便清晰掌握每个案件的收款进度。
- 作为客户，我希望支持分期付款并在线完成支付，以便减轻一次性付款压力。
- 作为财务主管，我希望到期应收款自动提醒，逾期未收生成预警，以便及时跟进催收。

**3. 业务规则**

1. 案件立案后自动创建 Receivable 记录，contract_amount 来自案件合同，received_amount=0，pending_amount=contract_amount，status='pending'。
2. 支持分期收款（installment_plan JSON 数组），每期包含 installment_id、amount、due_date、status；分期总额必须等于 contract_amount。
3. 收款登记时创建 PaymentRecord（status='paid'），自动更新 Receivable.received_amount 和 pending_amount，状态根据收款进度流转：partial（部分收款）/completed（已完成）。
4. 发票（Invoice）创建后 status='pending'，开具后变为 'issued'，对应收款到账后变为 'paid'；发票金额必须 ≤ 已收款金额。
5. 分期 due_date 到期未收款，自动创建 OverdueWarning（status='pending'），overdue_days 每日递增；status 流转：pending → notified → resolved。
6. 收款完成后自动同步案件进度，全部款项到账是案件结案的前置条件。

**4. 输入/输出规范**

输入字段（POST /api/finance/fee，创建收款记录）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | string | 是 | UUID格式，必须为已立案案件 |
| amount | number | 是 | 大于0，精度2位小数 |
| organization_id | string | 是 | UUID格式，当前用户所属组织 |
| description | string | 否 | 收款描述，最长200字符 |

输入字段（POST /api/finance/invoice，创建发票）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | string | 是 | UUID格式 |
| amount | number | 是 | 大于0，且 ≤ 案件已收款金额 |
| invoice_type | string | 否 | 发票类型：special/normal |
| payer_name | string | 是 | 开票方名称 |
| payer_tax_id | string | 是 | 纳税人识别号 |
| payer_address | string | 否 | 开票方地址 |
| payer_bank | string | 否 | 开户行 |
| payer_account | string | 否 | 开户账号 |
| organization_id | string | 是 | UUID格式 |

输出结果：返回创建的 Fee/Invoice 记录，包含状态、关联案件信息。

**5. 数据模型**

实体名：Receivable（表名 receivables）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| contract_amount | real | NOT NULL | 合同金额（decimal 12,2） |
| received_amount | real | DEFAULT 0 | 已收金额 |
| pending_amount | real | DEFAULT 0 | 待收金额 |
| installment_plan | text | NULL | 分期计划（JSON数组） |
| status | varchar(20) | DEFAULT 'pending' | pending/partial/completed/overdue |
| remarks | varchar(500) | NULL | 备注 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

实体名：PaymentRecord（表名 payment_records）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| client_id | varchar(36) | NOT NULL | 客户ID |
| amount | real | NOT NULL | 收款金额 |
| status | varchar(20) | DEFAULT 'pending' | pending/paid/failed/refunded |
| method | varchar(20) | DEFAULT 'alipay' | alipay/wechat/bank |
| transaction_id | varchar(100) | NULL | 第三方交易号 |
| remarks | varchar(500) | NULL | 备注 |
| created_at | datetime | NOT NULL | 创建时间 |

实体名：Invoice（表名 invoices）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| amount | real | NOT NULL | 发票金额 |
| invoice_no | varchar(50) | NULL | 发票号 |
| status | varchar(20) | DEFAULT 'pending' | pending/issued/paid/cancelled |
| invoice_type | varchar(20) | NULL | 发票类型 |
| payer_name | varchar(200) | NULL | 开票方名称 |
| payer_tax_id | varchar(50) | NULL | 纳税人识别号 |
| payer_address | varchar(500) | NULL | 开票方地址 |
| payer_bank | varchar(100) | NULL | 开户行 |
| payer_account | varchar(50) | NULL | 开户账号 |
| issue_date | date | NULL | 开票日期 |
| due_date | date | NULL | 到期日期 |
| notes | text | NULL | 备注 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

实体名：OverdueWarning（表名 overdue_warnings）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| receivable_id | varchar(36) | NOT NULL | 应收款ID |
| case_id | varchar(36) | NOT NULL | 案件ID |
| installment_id | varchar(36) | NULL | 分期ID |
| overdue_amount | real | NOT NULL | 逾期金额 |
| overdue_days | integer | DEFAULT 0 | 逾期天数 |
| due_date | date | NOT NULL | 应收日期 |
| status | varchar(20) | DEFAULT 'pending' | pending/notified/resolved |
| remarks | text | NULL | 备注 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/finance/fee | 创建收款记录 | JWT |
| GET | /api/finance/fees | 查询收款记录列表 | JWT |
| PUT | /api/finance/fee/:id/paid | 标记收款为已支付 | JWT |
| POST | /api/finance/invoice | 创建发票 | JWT |
| GET | /api/finance/invoices | 查询发票列表 | JWT |
| PUT | /api/finance/invoice/:id/issue | 开具发票 | JWT |
| PUT | /api/finance/invoice/:id/paid | 标记发票已付款 | JWT |
| PUT | /api/finance/invoice/:id/cancel | 取消发票 | JWT |

请求示例（POST /api/finance/fee）：

```json
{
  "case_id": "case-uuid-001",
  "amount": 5000.00,
  "organization_id": "org-uuid-001",
  "description": "二期收款-立案后"
}
```

成功响应（200 OK）：

```json
{
  "id": "fee-uuid-001",
  "case_id": "case-uuid-001",
  "amount": 5000.00,
  "paid": false,
  "description": "二期收款-立案后",
  "organization_id": "org-uuid-001",
  "created_at": "2026-07-25T10:00:00.000Z",
  "receivable_update": {
    "received_amount": 5000.00,
    "pending_amount": 5000.00,
    "status": "partial"
  }
}
```

失败响应（400 Bad Request）：

```json
{
  "statusCode": 400,
  "message": "案件不存在或未立案",
  "error": "BadRequestError",
  "case_id": "case-uuid-invalid"
}
```

**7. 交互流程**

1. 案件立案时，系统自动创建 Receivable 记录，contract_amount 来自案件合同。
2. 财务人员在「财务-应收台账」页面查看待收款案件，点击"登记收款"。
3. 前端调用 POST /api/finance/fee 创建 Fee 记录（paid=false）。
4. 客户通过支付链接完成付款，前端调用 PUT /api/finance/fee/:id/paid 标记已支付。
5. 后端 FinanceService.markAsPaid 更新 Fee.paid=true 和 paid_at，同步更新 Receivable.received_amount 和 pending_amount。
6. 若 Receivable.received_amount 累计达到 contract_amount，status='completed'；否则 status='partial'。
7. 财务人员根据客户需求创建发票，POST /api/finance/invoice，发票 status='pending'。
8. 开票员调用 PUT /api/finance/invoice/:id/issue 开具发票，填写 invoice_no，status='issued'。
9. 定时任务每日 09:00 扫描分期 due_date 到期未收款，创建 OverdueWarning 并通知财务。

**8. 异常场景**

1. **案件不存在**：case_id 对应案件不存在或未立案时，返回 400 错误"案件不存在或未立案"。
2. **收款金额超限**：累计收款金额超过 contract_amount 时，返回 400 错误"收款金额超过合同金额，请核实"。
3. **发票金额超限**：发票金额超过已收款金额时，返回 400 错误"发票金额超过已收款金额，禁止开票"。
4. **重复开票**：同一 case_id 已存在 status='issued' 或 'paid' 的发票，再次创建返回 409 错误"该案件已开票，请勿重复创建"。
5. **支付失败**：第三方支付回调 status='failed' 时，Fee.paid 保持 false，自动通知客户重新支付。

**9. 验收标准**

- **正常场景**：Given 案件已立案且合同金额 10000 元，When 财务登记收款 5000 元并标记已支付，Then Receivable.received_amount=5000，status='partial'。
- **边界场景**：Given 案件累计收款等于合同金额，When 标记最后一笔收款已支付，Then Receivable.status='completed'，触发案件可结案状态。
- **异常场景**：Given 收款金额超过合同金额，When 调用创建收款接口，Then 返回 400 状态码，提示"收款金额超过合同金额"。
- **逾期场景**：Given 分期 due_date 已过且未收款，When 定时任务执行，Then 创建 OverdueWarning，overdue_days 每日递增，status='pending'。

---

#### 6.2 多角色智能分润引擎

**1. 功能描述**

自动核算多岗位提成，适配网推流水线分工，支持投放岗、邀约岗、谈案岗、办案律师、助理等多角色分润配置，支持阶梯提成、按案由差异化提成，案件结案且全款到账后自动核算提成。

**2. 用户故事**

- 作为律所主任，我希望灵活配置不同角色的分润规则，以便适配律所的实际分配制度。
- 作为财务人员，我希望案件结案且全款到账后系统自动核算各角色提成，以便减少人工计算错误。
- 作为谈案岗销售，我希望查询自己的提成明细，以便了解收入情况。

**3. 业务规则**

1. 分润规则（CommissionRule）按 role_type 配置，支持6种角色：marketing（投放）、invite（邀约）、sales（谈案）、main_lawyer（主办律师）、assist_lawyer（协办律师）、assistant（助理）。
2. 提成类型（commission_type）：fixed（固定金额）和 percentage（比例）；支持阶梯规则（tier_rules JSON 数组），按 base_amount 区间匹配提成值。
3. 分润规则可按 case_type 差异化配置，case_type 为空时表示适用所有案由；同一 role_type + case_type 仅能有一条 enabled=true 的规则。
4. 案件结案且 Receivable.status='completed' 后，调用 POST /api/commission/calculate/:caseId 触发分润核算，按角色匹配规则计算 CommissionRecord。
5. 分润总额（所有 CommissionRecord.commission_amount 之和）不得超过案件收款金额的 50%，超过时拦截并提示"分润总额超限，请调整规则"。
6. CommissionRecord.status='pending' 待发放，财务审批后调用 PUT /api/commission/records/:id/paid 标记已发放，paid_at 记录发放时间。

**4. 输入/输出规范**

输入字段（POST /api/commission/rules，创建分润规则）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| name | string | 是 | 规则名称，唯一 |
| role_type | string | 是 | 枚举值：marketing/invite/sales/main_lawyer/assist_lawyer/assistant |
| commission_type | string | 是 | 枚举值：fixed/percentage |
| commission_value | number | 是 | 大于0，percentage 时为 0-100 |
| tier_rules | string | 否 | 阶梯规则JSON数组 |
| case_type | string | 否 | 适用案由，为空表示通用 |
| description | string | 否 | 规则描述 |

输出结果：返回创建的 CommissionRule 记录及核算后的 CommissionRecord 数组。

**5. 数据模型**

实体名：CommissionRule（表名 commission_rules）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| name | varchar(100) | NOT NULL | 规则名称 |
| role_type | varchar(30) | NOT NULL | marketing/invite/sales/main_lawyer/assist_lawyer/assistant |
| commission_type | varchar(20) | NOT NULL | fixed/percentage |
| commission_value | real | NOT NULL | 提成值（金额或比例） |
| tier_rules | text | NULL | 阶梯规则JSON |
| enabled | boolean | DEFAULT 1 | 是否启用 |
| case_type | varchar(50) | NULL | 适用案由 |
| description | text | NULL | 描述 |
| organization_id | varchar(36) | NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

实体名：CommissionRecord（表名 commission_records）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| user_id | varchar(36) | NOT NULL | 用户ID |
| role_type | varchar(30) | NOT NULL | 角色类型 |
| rule_id | varchar(36) | NOT NULL | 规则ID |
| base_amount | real | NOT NULL | 基础金额 |
| commission_amount | real | NOT NULL | 提成金额 |
| status | varchar(20) | DEFAULT 'pending' | pending/paid |
| paid_at | datetime | NULL | 发放时间 |
| remarks | text | NULL | 备注 |
| organization_id | varchar(36) | NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/commission/rules | 创建分润规则 | JWT |
| GET | /api/commission/rules | 查询分润规则列表 | JWT |
| GET | /api/commission/rules/:id | 查询分润规则详情 | JWT |
| PUT | /api/commission/rules/:id | 更新分润规则 | JWT |
| DELETE | /api/commission/rules/:id | 删除分润规则 | JWT |
| PUT | /api/commission/rules/:id/toggle | 启用/禁用分润规则 | JWT |
| POST | /api/commission/calculate/:caseId | 计算案件分润 | JWT |
| POST | /api/commission/calculate/batch | 批量计算分润 | JWT |
| GET | /api/commission/records | 查询分润记录 | JWT |
| PUT | /api/commission/records/:id/paid | 标记分润已发放 | JWT |

请求示例（POST /api/commission/calculate/:caseId）：

```http
POST /api/commission/calculate/case-uuid-001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

成功响应（200 OK）：

```json
{
  "case_id": "case-uuid-001",
  "case_type": "divorce",
  "total_received": 10000.00,
  "total_commission": 4500.00,
  "commission_records": [
    {
      "id": "cr-uuid-001",
      "user_id": "user-uuid-marketing01",
      "role_type": "marketing",
      "rule_id": "rule-uuid-001",
      "base_amount": 10000.00,
      "commission_amount": 500.00,
      "status": "pending"
    },
    {
      "id": "cr-uuid-002",
      "user_id": "user-uuid-sales01",
      "role_type": "sales",
      "rule_id": "rule-uuid-002",
      "base_amount": 10000.00,
      "commission_amount": 1500.00,
      "status": "pending"
    },
    {
      "id": "cr-uuid-003",
      "user_id": "user-uuid-lawyer01",
      "role_type": "main_lawyer",
      "rule_id": "rule-uuid-003",
      "base_amount": 10000.00,
      "commission_amount": 2500.00,
      "status": "pending"
    }
  ]
}
```

失败响应（422 Unprocessable Entity）：

```json
{
  "statusCode": 422,
  "message": "案件分润前置条件未满足",
  "error": "CommissionPreconditionFailed",
  "unmet_conditions": [
    { "field": "case_status", "value": "in_progress", "reason": "案件未结案，禁止核算分润" },
    { "field": "receivable_status", "value": "partial", "reason": "案件款项未结清，禁止核算分润" }
  ]
}
```

**7. 交互流程**

1. 律所主任在「财务-分润规则」页面配置各角色的 CommissionRule，POST /api/commission/rules。
2. 案件结案且全款到账后，财务人员点击"核算分润"，前端调用 POST /api/commission/calculate/:caseId。
3. 后端 CommissionService.calculateCommission 校验前置条件：案件状态为已结案 + Receivable.status='completed'。
4. 后端按 case_type 加载启用的 CommissionRule 集合，识别案件各角色对应的 user_id。
5. 按 commission_type 计算提成：fixed 直接取 commission_value，percentage 计算 base_amount × commission_value / 100。
6. 支持阶梯规则：根据 base_amount 匹配 tier_rules 区间，取对应 commission_value。
7. 后端写入 CommissionRecord 数组，校验分润总额不超过收款金额 50%，超限则回滚并返回错误。
8. 财务审批通过后，调用 PUT /api/commission/records/:id/paid 标记已发放，status='paid'，paid_at 非空。
9. 用户在「我的提成」页面查询自己的 CommissionRecord，可导出工资核算表。

**8. 异常场景**

1. **案件未结案**：案件状态非已结案时调用核算接口，返回 422 错误"案件未结案，禁止核算分润"。
2. **款项未结清**：Receivable.status!='completed' 时调用核算接口，返回 422 错误"案件款项未结清，禁止核算分润"。
3. **分润规则缺失**：某角色未配置启用规则时，跳过该角色并提示"角色 [role_type] 未配置分润规则，已跳过"。
4. **分润总额超限**：核算后分润总额超过收款金额 50%，回滚所有记录，返回 422 错误"分润总额超限，请调整规则"。
5. **重复核算**：case_id 已存在 CommissionRecord 时再次核算，返回 409 错误"该案件已核算分润，请勿重复操作"。

**9. 验收标准**

- **正常场景**：Given 案件已结案且全款到账10000元，配置了3个角色分润规则，When 调用 POST /api/commission/calculate/:caseId，Then 生成3条 CommissionRecord，分润总额不超过 5000 元。
- **边界场景**：Given 规则配置为阶梯提成，base_amount=10000 命中第二阶梯，When 核算分润，Then commission_amount 按第二阶梯规则计算。
- **异常场景**：Given 案件状态为 'in_progress'，When 调用核算接口，Then 返回 422 状态码，提示"案件未结案"。
- **总额超限场景**：Given 规则配置导致分润总额达 6000 元（>50%），When 核算分润，Then 返回 422 错误，无 CommissionRecord 写入。

---

#### 6.3 单案件成本与利润核算

**1. 功能描述**

自动归集案件成本，包括投放获客成本、人力成本、办案其他成本，实时核算单案毛利、净利润，支持分案由、分团队盈利统计。

**2. 用户故事**

- 作为财务人员，我希望系统自动归集案件对应的投放成本，以便准确核算单案利润。
- 作为律所主任，我希望按案由和团队统计盈利情况，以便优化业务结构。
- 作为办案律师，我希望查看自己案件的利润贡献，以便了解工作价值。

**3. 业务规则**

1. 案件成本（CaseCost）按 cost_type 分类：marketing（投放）、labor（人力）、case_handling（办案）、other（其他），所有成本归集至 case_id。
2. 投放成本自动匹配：通过案件的线索溯源链（线索→商机→案件），匹配对应投放消耗，自动创建 cost_type='marketing' 的 CaseCost 记录。
3. 人力成本基于角色实际工时 × 时薪计算，或手动录入 cost_type='labor' 的记录。
4. 单案毛利 = 案件收款总额（Receivable.received_amount）- 案件总成本（CaseCost.amount 之和）。
5. 单案净利润 = 毛利 - 分润总额（CommissionRecord.commission_amount 之和）。
6. 支持按案由、团队、律师、时间范围多维统计，盈利为负的案件自动标记"亏损案件"并通知律所主任。

**4. 输入/输出规范**

输入字段（POST /api/finance/case-cost，手动录入成本）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | string | 是 | UUID格式，必须为有效案件 |
| cost_type | string | 是 | 枚举值：marketing/labor/case_handling/other |
| amount | number | 是 | 大于0，精度2位小数 |
| description | string | 否 | 成本描述，最长500字符 |
| incurred_date | date | 否 | 发生日期，默认当前日期 |
| organization_id | string | 是 | UUID格式 |

输出结果：返回创建的 CaseCost 记录及更新后的案件利润核算结果（毛利、净利润、利润率）。

**5. 数据模型**

实体名：CaseCost（表名 case_costs）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| cost_type | varchar(20) | NOT NULL | marketing/labor/case_handling/other |
| amount | real | NOT NULL | 成本金额 |
| description | text | NULL | 描述 |
| incurred_date | date | NULL | 发生日期 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |

实体名：ProfitShare（表名 profit_shares，利润分摊记录）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| role | varchar(30) | NOT NULL | 角色（FeeRole） |
| user_id | varchar(36) | NULL | 用户ID |
| percentage | real | NULL | 分摊比例（decimal 5,2） |
| amount | real | NOT NULL | 分摊金额 |
| paid | boolean | DEFAULT 0 | 是否已支付 |
| paid_at | datetime | NULL | 支付时间 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |

实体名：Fee（表名 fees，收款记录）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| amount | real | NOT NULL | 金额 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| description | varchar(500) | NULL | 描述 |
| paid | boolean | DEFAULT 0 | 是否已支付 |
| paid_at | datetime | NULL | 支付时间 |
| payment_method | varchar(50) | NULL | 支付方式 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/finance/case-cost | 创建案件成本记录 | JWT |
| GET | /api/finance/case-costs | 查询案件成本列表 | JWT |
| GET | /api/finance/case-profit/:caseId | 查询单案利润核算 | JWT |
| GET | /api/finance/profit-stats | 查询利润统计（按案由/团队） | JWT |
| POST | /api/finance/profit-share | 计算利润分摊 | JWT |
| GET | /api/finance/profit-share | 查询利润分摊记录 | JWT |

请求示例（GET /api/finance/case-profit/:caseId）：

```http
GET /api/finance/case-profit/case-uuid-001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

成功响应（200 OK）：

```json
{
  "case_id": "case-uuid-001",
  "case_type": "divorce",
  "main_lawyer_id": "user-uuid-lawyer01",
  "received_amount": 10000.00,
  "costs": [
    { "cost_type": "marketing", "amount": 800.00 },
    { "cost_type": "labor", "amount": 1500.00 },
    { "cost_type": "case_handling", "amount": 500.00 }
  ],
  "total_cost": 2800.00,
  "gross_profit": 7200.00,
  "total_commission": 4500.00,
  "net_profit": 2700.00,
  "profit_margin": 0.27,
  "is_loss": false
}
```

失败响应（404 Not Found）：

```json
{
  "statusCode": 404,
  "message": "案件不存在",
  "error": "NotFoundError",
  "case_id": "case-uuid-invalid"
}
```

**7. 交互流程**

1. 案件立案后，系统自动通过线索溯源链匹配投放消耗，创建 cost_type='marketing' 的 CaseCost 记录。
2. 财务人员在「财务-成本管理」页面手动录入人力成本和办案成本，POST /api/finance/case-cost。
3. 后端 FinanceService 写入 case_costs 表，incurred_date 默认当前日期。
4. 用户在「案件详情-利润核算」页面查看利润，前端调用 GET /api/finance/case-profit/:caseId。
5. 后端聚合 Receivable.received_amount、CaseCost.amount 之和、CommissionRecord.commission_amount 之和。
6. 后端计算毛利、净利润、利润率，若净利润为负，is_loss=true 并通知律所主任。
7. 律所主任在「利润统计」页面按案由/团队/时间筛选，GET /api/finance/profit-stats 返回聚合数据。
8. 利润分摊通过 POST /api/finance/profit-share 计算，按 role 比例分配并写入 profit_shares 表。

**8. 异常场景**

1. **案件不存在**：case_id 无效时返回 404 错误"案件不存在"。
2. **投放数据未同步**：线索溯源链断裂无法匹配投放消耗时，跳过自动归集并提示"投放成本未归集，请手动录入"。
3. **成本金额超限**：成本金额超过案件收款金额时，返回 400 错误"成本金额超过案件收款金额，请核实"。
4. **重复成本录入**：同 case_id + cost_type + incurred_date 重复录入时，返回 409 错误"该日期已存在同类成本记录"。
5. **利润核算数据缺失**：Receivable 或 CommissionRecord 不存在时，对应字段返回 0 并提示"部分数据缺失，核算结果可能不准确"。

**9. 验收标准**

- **正常场景**：Given 案件收款 10000 元、总成本 2800 元、分润总额 4500 元，When 调用利润核算接口，Then 毛利=7200，净利润=2700，利润率=0.27，is_loss=false。
- **边界场景**：Given 案件净利润为 0，When 调用利润核算，Then is_loss=false，利润率=0。
- **异常场景**：Given 案件总成本超过收款金额，When 调用利润核算，Then 净利润为负，is_loss=true，通知律所主任。
- **投放归集场景**：Given 案件线索溯源链完整，When 案件立案，Then 自动创建 marketing 类型的 CaseCost 记录。

---

#### 6.4 退费全流程管理

**1. 功能描述**

退费线上审批与核算，规范退费流程，支持阶梯退费规则配置，按办案进度自动计算应退金额，退费需多级审批，审批通过后自动更新财务台账，同步至客户档案。

**2. 用户故事**

- 作为客户，我希望提交退费申请后系统能自动核算应退金额，以便了解退费情况。
- 作为财务人员，我希望退费申请经过多级审批，以便避免违规退费。
- 作为合规管理员，我希望高频率退费案件自动生成风险预警，以便反向优化业务。

**3. 业务规则**

1. 退费申请（Refund）必须关联 case_id 和 fee_id（可选），reason 字段必填且长度 ≥20 字符，amount 必须 >0 且 ≤ 已收款金额。
2. 阶梯退费规则：根据案件办理进度（已完成的 SOP 节点比例）计算应退比例，进度越深应退比例越低；具体规则按 organization_id 配置。
3. 退费审批多级流转：status=pending → approved（或 rejected）→ paid；approved 后财务执行打款，paid 后案件 Receivable 同步扣减。
4. 退费记录同步至合规风控模块：同一客户 30 天内退费 ≥2 次或同一律师月度退费率 ≥10%，自动生成风险预警。
5. 退费金额必须 ≤ Fee.amount（对应原收款记录），且案件已发放分润需同步扣回。
6. 退费完成后自动同步至客户档案和案件档案，archived=true。

**4. 输入/输出规范**

输入字段（POST /api/finance/refund）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | string | 是 | UUID格式，必须为有效案件 |
| organization_id | string | 是 | UUID格式，当前用户所属组织 |
| amount | number | 是 | 大于0，且 ≤ 案件已收款金额 |
| reason | string | 是 | 退费原因，长度≥20字符 |
| fee_id | string | 否 | UUID格式，关联原收款记录 |
| evidence_files | string | 否 | 证据文件URL（JSON数组） |

输出结果：返回创建的 Refund 记录，包含 status='pending'、应退金额核算明细、审批流配置。

**5. 数据模型**

实体名：Refund（表名 refunds）

| 字段名 | 类型 SQLite兼容 | 约束 | 说明 |
|--------|----------------|------|------|
| id | varchar(36) | PK | UUID主键 |
| case_id | varchar(36) | NOT NULL | 案件ID |
| fee_id | varchar(36) | NULL | 关联收款记录ID |
| amount | real | NOT NULL | 退费金额 |
| reason | text | NOT NULL | 退费原因 |
| status | varchar(20) | DEFAULT 'pending' | pending/approved/rejected/paid |
| evidence_files | text | NULL | 证据文件（JSON） |
| approval_note | text | NULL | 审批备注 |
| approved_by | varchar(36) | NULL | 审批人ID |
| approved_at | datetime | NULL | 审批时间 |
| organization_id | varchar(36) | NOT NULL | 组织ID |
| created_at | datetime | NOT NULL | 创建时间 |
| updated_at | datetime | NOT NULL | 更新时间 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/finance/refund | 创建退费申请 | JWT |
| PUT | /api/finance/refund/:id/approve | 审批通过退费 | JWT |
| PUT | /api/finance/refund/:id/reject | 拒绝退费申请 | JWT |
| GET | /api/finance/refunds | 查询退费记录列表 | JWT |
| PUT | /api/finance/refund/:id/pay | 执行退费打款 | JWT |

请求示例（POST /api/finance/refund）：

```json
{
  "case_id": "case-uuid-001",
  "organization_id": "org-uuid-001",
  "amount": 3000.00,
  "reason": "客户对服务不满意，案件仅完成立案阶段，协商退还部分费用",
  "fee_id": "fee-uuid-001",
  "evidence_files": "[\"https://oss.example.com/refund/evidence.pdf\"]"
}
```

成功响应（200 OK）：

```json
{
  "id": "refund-uuid-001",
  "case_id": "case-uuid-001",
  "fee_id": "fee-uuid-001",
  "amount": 3000.00,
  "reason": "客户对服务不满意，案件仅完成立案阶段，协商退还部分费用",
  "status": "pending",
  "calculation_detail": {
    "received_amount": 10000.00,
    "completed_sop_ratio": 0.25,
    "refund_ratio": 0.30,
    "suggested_amount": 3000.00,
    "is_consistent": true
  },
  "approval_flow": [
    { "level": 1, "role": "finance_manager", "status": "pending" },
    { "level": 2, "role": "director", "status": "pending" }
  ],
  "created_at": "2026-07-25T14:00:00.000Z"
}
```

失败响应（400 Bad Request）：

```json
{
  "statusCode": 400,
  "message": "退费金额超过已收款金额",
  "error": "BadRequestError",
  "requested_amount": 3000.00,
  "received_amount": 2500.00
}
```

**7. 交互流程**

1. 客户或财务人员在「财务-退费管理」页面提交退费申请，POST /api/finance/refund。
2. 后端 FinanceService.createRefund 校验金额合理性，写入 refunds 表（status='pending'）。
3. 后端调用阶梯退费规则引擎：查询案件 SOP 完成比例，按规则计算应退比例和金额。
4. 后端生成审批流配置（多级），返回给前端展示审批进度。
5. 审批人依次审批：PUT /api/finance/refund/:id/approve 或 /reject，记录 approved_by 和 approved_at。
6. 全部审批通过后 status='approved'，财务执行打款，PUT /api/finance/refund/:id/pay，status='paid'。
7. 后端同步扣减 Receivable.received_amount，回滚对应 CommissionRecord（如已发放）。
8. 退费记录同步至合规风控模块，触发高频退费预警（如适用）。
9. 退费完成后归档至客户档案和案件档案。

**8. 异常场景**

1. **退费金额超限**：amount 超过案件已收款金额，返回 400 错误"退费金额超过已收款金额"。
2. **退费原因过短**：reason 长度 <20 字符，返回 400 错误"退费原因描述过短，请详细说明（至少20字符）"。
3. **案件无收款记录**：case_id 对应案件无已付款 Fee 记录，返回 400 错误"案件无已收款记录，无法退费"。
4. **重复退费**：case_id 已存在 status='pending' 或 'approved' 的退费申请，返回 409 错误"该案件已有进行中的退费申请"。
5. **分润已发放**：案件 CommissionRecord.status='paid' 且未回滚时，禁止退费打款，提示"已发放分润需先回滚，请联系财务处理"。

**9. 验收标准**

- **正常场景**：Given 案件已收款 10000 元，客户提交 3000 元退费申请，When 调用 POST /api/finance/refund，Then status='pending'，应退金额核算明细返回。
- **边界场景**：Given 退费金额等于已收款金额（全额退费），When 调用创建接口，Then status='pending'，审批流配置生效。
- **异常场景**：Given 退费金额超过已收款金额，When 调用创建接口，Then 返回 400 状态码，提示"退费金额超过已收款金额"。
- **高频退费预警场景**：Given 同一律师月度退费率达 10%，When 退费完成，Then 自动生成风险预警通知合规管理员。

---

#### 6.5 财务报表与对账管理

**1. 功能描述**

生成律所全维度财务报表，覆盖营收、收款、支出、提成、应收账款等多维度，支持按月/季度/年度/案由/团队统计，支持对接第三方财务软件，数据一键导出。

**2. 用户故事**

- 作为财务人员，我希望按月生成营收报表和收款台账，以便完成月度财务核算。
- 作为律所主任，我希望查看按案由和团队的盈利统计，以便优化业务结构。
- 作为审计人员，我希望一键导出财务数据对接第三方软件，以便完成年度审计。

**3. 业务规则**

1. 报表类型包含：营收报表（按月汇总收款）、收款台账（明细）、支出报表（CaseCost 汇总）、提成报表（CommissionRecord 汇总）、应收账款报表（Receivable + OverdueWarning）。
2. 统计维度支持：时间（月/季度/年度）、案由、团队、律师、客户，支持多维度交叉筛选。
3. 报表数据实时计算，源数据来自 Fee、PaymentRecord、CaseCost、CommissionRecord、Receivable、OverdueWarning、Invoice 等表。
4. 应收账款报表必须包含：合同金额、已收金额、待收金额、逾期金额、逾期天数分布。
5. 导出格式支持 Excel（.xlsx）和 CSV，导出文件包含原始数据和汇总数据两个 Sheet。
6. 报表查询权限按角色控制：财务人员可查看全部，律师仅可查看自己案件，主任可查看全所。

**4. 输入/输出规范**

输入字段（GET /api/finance/report，查询报表）：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| report_type | string | 是 | 枚举值：revenue/payment/expense/commission/receivable |
| start_date | date | 是 | 起始日期，格式 YYYY-MM-DD |
| end_date | date | 是 | 结束日期，必须 ≥ start_date |
| case_type | string | 否 | 案由筛选 |
| team_id | string | 否 | 团队ID筛选 |
| lawyer_id | string | 否 | 律师ID筛选 |
| group_by | string | 否 | 聚合维度：month/quarter/year/case_type/team |
| organization_id | string | 是 | UUID格式，当前用户所属组织 |

输出结果：返回报表数据（含明细和汇总）及导出链接。

**5. 数据模型**

本功能为报表查询，主要依赖以下已存在的实体表：

| 实体名 | 表名 | 用途 |
|--------|------|------|
| Fee | fees | 收款明细数据源 |
| PaymentRecord | payment_records | 支付记录数据源 |
| CaseCost | case_costs | 成本数据源 |
| CommissionRecord | commission_records | 提成数据源 |
| Receivable | receivables | 应收账款数据源 |
| OverdueWarning | overdue_warnings | 逾期数据源 |
| Invoice | invoices | 发票数据源 |
| Refund | refunds | 退费数据源 |

**6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/finance/report | 查询财务报表 | JWT |
| GET | /api/finance/report/export | 导出财务报表 | JWT |
| GET | /api/finance/dashboard | 财务看板数据 | JWT |
| GET | /api/finance/reconciliation | 财务对账 | JWT |

请求示例（GET /api/finance/report?report_type=revenue&start_date=2026-07-01&end_date=2026-07-31&group_by=case_type）：

```http
GET /api/finance/report?report_type=revenue&start_date=2026-07-01&end_date=2026-07-31&group_by=case_type
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

成功响应（200 OK）：

```json
{
  "report_type": "revenue",
  "start_date": "2026-07-01",
  "end_date": "2026-07-31",
  "group_by": "case_type",
  "summary": {
    "total_revenue": 150000.00,
    "total_cases": 25,
    "avg_revenue_per_case": 6000.00
  },
  "details": [
    {
      "case_type": "divorce",
      "case_count": 10,
      "revenue": 80000.00,
      "percentage": 0.533
    },
    {
      "case_type": "contract_dispute",
      "case_count": 8,
      "revenue": 50000.00,
      "percentage": 0.333
    },
    {
      "case_type": "labor_dispute",
      "case_count": 7,
      "revenue": 20000.00,
      "percentage": 0.133
    }
  ],
  "export_url": "/api/finance/report/export?report_type=revenue&start_date=2026-07-01&end_date=2026-07-31&format=xlsx"
}
```

失败响应（400 Bad Request）：

```json
{
  "statusCode": 400,
  "message": "日期范围无效",
  "error": "BadRequestError",
  "start_date": "2026-07-31",
  "end_date": "2026-07-01",
  "reason": "结束日期不能早于起始日期"
}
```

**7. 交互流程**

1. 财务人员在「财务-报表中心」页面选择报表类型、时间范围、筛选条件。
2. 前端调用 GET /api/finance/report 查询报表数据。
3. 后端 FinanceService 根据 report_type 加载对应数据源表。
4. 后端按 group_by 维度聚合数据，计算汇总指标（总额、案件数、平均值、占比）。
5. 后端返回报表数据（summary + details）和导出链接。
6. 前端展示报表数据，支持图表可视化（柱状图、饼图、趋势图）。
7. 用户点击"导出"，前端调用 GET /api/finance/report/export，后端生成 Excel/CSV 文件。
8. 导出文件包含两个 Sheet：原始明细数据和汇总数据，附带生成时间戳。
9. 律所主任在「财务看板」页面查看核心指标，GET /api/finance/dashboard 返回本月营收、应收、提成、利润等关键数据。

**8. 异常场景**

1. **日期范围无效**：end_date 早于 start_date，返回 400 错误"结束日期不能早于起始日期"。
2. **日期范围过大**：查询范围超过 1 年，返回 400 错误"查询范围不能超过1年，请缩小日期范围"。
3. **权限不足**：律师角色查询全所报表，返回 403 错误"权限不足，仅能查询本人案件数据"。
4. **数据为空**：查询范围内无数据，返回 200 状态码，summary 各项为 0，details 为空数组，提示"查询范围内无数据"。
5. **导出失败**：文件生成失败（如磁盘空间不足），返回 500 错误"报表导出失败，请联系管理员"。

**9. 验收标准**

- **正常场景**：Given 2026年7月有 25 个案件收款共 150000 元，When 调用营收报表按案由聚合，Then 返回3个案由分组数据，总额=150000，案件数=25。
- **边界场景**：Given 查询范围为单日且无数据，When 调用报表接口，Then 返回 200 状态码，summary 各项为 0，details 为空数组。
- **异常场景**：Given end_date 早于 start_date，When 调用报表接口，Then 返回 400 状态码，提示"结束日期不能早于起始日期"。
- **权限场景**：Given 律师角色查询全所报表，When 调用报表接口，Then 返回 403 状态码，提示"权限不足"。
- **导出场景**：Given 报表数据已查询，When 用户点击导出，Then 生成 Excel 文件，包含原始明细和汇总两个 Sheet。

### 模块7：C端客户服务与口碑运营体系

> 设计目标：为C端客户提供独立服务入口，覆盖案件进度透明化、AI智能答疑、线上业务办理、口碑沉淀全流程，降低律所客服人力占用，提升客户体验与复购口碑资产沉淀。
>
> 工程约束：
> - C端所有接口路径统一以 `/api/client/*` 为前缀，**一律使用 HTTP POST 方法**（管理端可使用 GET/PUT/DELETE）
> - client 角色登录后前端自动重定向至 `/client` 页面，使用独立 JWT 鉴权
> - 数据库类型仅使用 SQLite 兼容类型：`varchar` / `datetime` / `text` / `integer` / `real` / `boolean`
> - 数据权限严格按 `client_id` + `organization_id` 双重隔离

---

#### 7.1 客户专属服务端口

#### **1. 功能描述**

为C端客户提供独立的Web服务入口，客户登录后即可查看本人关联的全部案件信息、文书、缴费记录、咨询历史，实现服务过程透明化，降低反复咨询带来的客服成本。

#### **2. 用户故事**

- 作为客户，我希望登录专属服务端口后能集中查看我所有委托案件的进度与材料，以便随时掌握案件动态而无需反复联系律师。
- 作为律所运营人员，我希望客户登录后自动按律所品牌定制界面展示律所Logo与联系方式，以便提升品牌信任度。

#### **3. 业务规则**

1. **登录与重定向**：client 角色用户使用手机号+验证码或账号密码登录后，前端自动重定向至 `/client` 页面，其他角色用户禁止访问 `/client` 路径。
2. **数据权限隔离**：客户只能查看 `client_id = 当前登录用户ID` 的案件、文书、缴费、咨询记录，跨客户查询一律返回"案件不存在或无权访问"。
3. **品牌定制**：页面顶部展示当前用户所属 `organization_id` 对应律所的Logo、名称、客服电话，未配置品牌信息的律所展示默认品牌信息。
4. **案件列表范围**：仅返回 `cases.client_id = 当前客户ID` 的案件，按 `created_at DESC` 排序，并附带队办律师姓名 `lawyer_name`。
5. **未实名客户访问限制**：客户账号必须完成实名认证（`user.real_name` 非空）后才能进入服务端口，未实名时引导跳转至实名认证页。
6. **会话超时**：JWT Token 有效期 24 小时，过期后需重新登录。

#### **4. 输入/输出规范**

**输入字段（POST `/api/client/cases` 查询案件列表）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| client_id | string(uuid) | 是 | 必须等于 JWT 中 sub 字段，否则视为越权 |
| keyword | string | 否 | 长度 ≤ 50，用于案件编号模糊搜索 |
| status | string | 否 | 取值范围：pending_assign/processing/closed |

**输出结果**：

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "case_no": "CASE20260725001",
      "case_type": "marriage",
      "case_type_label": "婚姻家事",
      "status": "processing",
      "court": "北京市朝阳区人民法院",
      "assignee_lawyer_id": "uuid",
      "lawyer_name": "张律师",
      "created_at": "2026-07-01T10:00:00.000Z",
      "updated_at": "2026-07-20T15:30:00.000Z"
    }
  ],
  "total": 1
}
```

#### **5. 数据模型**

复用已有 `cases` 表与 `users` 表，无新增实体。关键字段对齐：

**Entity：Case（关键字段）**

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | varchar(uuid) | PK | 案件ID |
| case_no | varchar | not null | 案件编号 |
| case_type | varchar | not null | 案由类型 |
| status | varchar | default 'pending_assign' | 案件状态 |
| court | varchar | nullable | 受理法院 |
| client_id | varchar | not null, FK→users.id | 客户ID |
| assignee_lawyer_id | varchar | nullable, FK→users.id | 承办律师ID |
| organization_id | varchar | not null, FK→organizations.id | 律所ID |
| deadline | datetime | nullable | 办案期限 |
| created_at | datetime | auto | 创建时间 |
| updated_at | datetime | auto | 更新时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/client/cases | 查询客户关联案件列表 | client JWT |
| POST | /api/client/cases/:id | 查询案件详情 | client JWT |
| POST | /api/client/cases/:id/documents/list | 查询案件文书列表 | client JWT |
| POST | /api/client/cases/:id/documents | 客户上传文书 | client JWT |

**请求/响应示例（POST /api/client/cases/:id 案件详情）**：

成功响应：
```json
{
  "code": 0,
  "data": {
    "id": "9b1c...",
    "case_no": "CASE20260725001",
    "case_type": "marriage",
    "status": "processing",
    "court": "北京市朝阳区人民法院",
    "client_id": "user-uuid-001",
    "assignee_lawyer_id": "lawyer-uuid-001",
    "lawyer_name": "张律师",
    "organization_id": "org-uuid-001",
    "created_at": "2026-07-01T10:00:00.000Z"
  }
}
```

失败响应（无权访问）：
```json
{
  "code": 403,
  "message": "案件不存在或无权访问"
}
```

#### **7. 交互流程**

1. 客户在登录页输入账号密码 → 前端 `POST /api/auth/login` 提交凭据 → 后端校验返回 JWT（role=client）→ 前端识别角色后重定向至 `/client`。
2. 客户进入 `/client` 首页 → 前端 `POST /api/client/cases` 携带 `client_id` 查询 → 后端按 `client_id` 过滤 `cases` 表并 join `users` 取律师姓名 → 返回案件列表。
3. 客户点击某案件 → 前端 `POST /api/client/cases/:id` → 后端校验 `case.client_id === 当前client_id` → 返回案件详情（含 lawyer_name）。
4. 客户进入文书列表 → 前端 `POST /api/client/cases/:id/documents/list` → 后端再次校验归属 → 返回该案件 `documents` 记录。
5. 客户上传文书 → 前端先调用文件上传接口拿到 `file_path`，再 `POST /api/client/cases/:id/documents` 提交元数据 → 后端写入 `documents` 表，`uploaded_by_id = client_id`。

#### **8. 异常场景**

1. **跨客户访问案件**：后端校验 `case.client_id !== client_id`，返回 `code:403, message:"案件不存在或无权访问"`，前端 toast 提示"您无权查看该案件"。
2. **JWT 过期**：所有接口返回 `code:401`，前端拦截器统一跳转登录页，toast 提示"登录已过期，请重新登录"。
3. **案件ID格式错误**：`/api/client/cases/abc` 中 `abc` 非 UUID，后端返回 `code:400, message:"案件ID格式错误"`，前端提示"案件不存在"。
4. **未实名客户访问**：前端在路由守卫中检查 `user.real_name` 为空，跳转 `/client/verify`，提示"请先完成实名认证后查看案件"。

#### **9. 验收标准**

- **正常场景**：Given 客户A已登录且存在2条案件记录，When 客户A调用 `POST /api/client/cases` 传 `client_id=客户A`，Then 返回 `code:0, data.length=2` 且均含 `lawyer_name`。
- **边界场景**：Given 客户A无任何案件，When 调用 `POST /api/client/cases`，Then 返回 `code:0, data:[], total:0`，前端展示"暂无案件"空状态。
- **异常场景**：Given 客户A登录，When 调用 `POST /api/client/cases/:id` 传入客户B的案件ID，Then 返回 `code:403, message:"案件不存在或无权访问"`，前端 toast 提示对应文案。

---

#### 7.2 案件进度主动推送

#### **1. 功能描述**

案件节点变更时（立案、开庭、判决、结案），系统自动生成标准化推送内容并通知客户，屏蔽对方当事人、案号等敏感信息，同时全量留存推送记录供客户回溯。

#### **2. 用户故事**

- 作为客户，我希望案件每次到关键节点（如已立案、即将开庭）都能主动收到通知，以便提前做好准备而无需反复询问律师。
- 作为律所管理者，我希望推送内容标准化且不泄露敏感信息，以便符合法律行业合规要求。

#### **3. 业务规则**

1. **触发节点**：仅以下节点触发推送：`filing`(立案)、`court`(开庭)、`judgment`(判决)、`closed`(结案)，其他节点变更不推送。
2. **内容脱敏**：推送内容由 `buildPushContent` 模板生成，对方当事人姓名、案号、判决书细节一律替换为 `XXX`，仅保留案件阶段与必要提示。
3. **推送渠道**：默认渠道 `in_app`（站内信），后续可扩展 `wechat`(微信)/`sms`(短信)，由律所配置决定。
4. **状态流转**：推送记录状态为 `pending`→`sent`→`failed`，`sent` 状态需写入 `sent_at` 实际发送时间。
5. **重复推送保护**：同一案件同一 `node_type` 24小时内只能推送一次，重复触发返回提示"该节点已推送过"。
6. **客户可见范围**：客户只能查看 `client_id = 当前客户ID` 的推送记录，跨客户查询返回空列表。

#### **4. 输入/输出规范**

**输入字段（POST `/api/client/cases/:id/push-notifications`）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| client_id | string(uuid) | 是 | 必须等于 JWT sub，且须与案件 client_id 一致 |

**输出结果**：

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "case_id": "case-uuid-001",
      "client_id": "user-uuid-001",
      "node_type": "filing",
      "push_content": "您的案件已正式立案，案件编号：XXX，后续将有专人为您跟进，请保持通讯畅通。",
      "push_channel": "in_app",
      "push_time": "2026-07-25T10:00:00.000Z",
      "status": "sent",
      "sent_at": "2026-07-25T10:00:01.000Z"
    }
  ]
}
```

#### **5. 数据模型**

**Entity：CasePushNotification（表名 case_push_notifications）**

| 字段名 | 类型 SQLite | 约束 | 说明 |
|--------|-------------|------|------|
| id | varchar(uuid) | PK | 推送记录ID |
| case_id | varchar | not null, FK→cases.id | 案件ID |
| client_id | varchar | not null, FK→users.id | 客户ID |
| node_type | varchar | not null | 节点类型：filing/court/judgment/closed |
| push_content | text | not null | 推送内容（标准化模板） |
| push_channel | varchar | default 'in_app' | 推送渠道：wechat/sms/in_app |
| push_time | datetime | nullable | 计划推送时间 |
| status | varchar | default 'pending' | 状态：pending/sent/failed |
| organization_id | varchar | nullable, FK→organizations.id | 律所ID |
| sent_at | datetime | nullable | 实际发送时间 |
| created_at | datetime | auto | 创建时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/client/cases/:id/push-notifications | 查询指定案件的推送记录 | client JWT |
| POST | /api/client/push-notifications | 查询客户全部推送记录 | client JWT |
| POST | /api/internal/client/trigger-push | 案件节点变更触发推送（内部调用） | system JWT |

**请求/响应示例（POST /api/client/push-notifications 查询客户全部推送）**：

请求：
```json
{ "client_id": "user-uuid-001" }
```

成功响应：
```json
{
  "code": 0,
  "data": [
    {
      "id": "push-uuid-001",
      "case_id": "case-uuid-001",
      "node_type": "filing",
      "push_content": "您的案件已正式立案，案件编号：XXX，后续将有专人为您跟进，请保持通讯畅通。",
      "push_channel": "in_app",
      "status": "sent",
      "push_time": "2026-07-25T10:00:00.000Z",
      "sent_at": "2026-07-25T10:00:01.000Z"
    }
  ]
}
```

失败响应（JWT 失效）：
```json
{
  "code": 401,
  "message": "未授权，请重新登录"
}
```

#### **7. 交互流程**

1. 律师在案件管理模块将案件状态改为"已立案" → 后端调用 `triggerPushOnNodeChange(caseId, 'filing')`。
2. `triggerPushOnNodeChange` 查询 `cases` 表获取 `client_id` 与 `organization_id` → 调用 `buildPushContent` 生成脱敏内容 → 写入 `case_push_notifications` 表，状态 `sent`，`sent_at = now()`。
3. 客户进入 `/client/notifications` 页 → 前端 `POST /api/client/push-notifications` 携带 `client_id` → 后端按 `client_id` 过滤返回记录列表。
4. 客户点击某条推送 → 前端展开推送内容详情，并提供"查看案件"跳转至 `cases/:id`。
5. 推送渠道如配置 `wechat`/`sms` → 后端在写入记录后异步调用对应渠道 API → 失败时更新 `status=failed` 并记录错误日志。

#### **8. 异常场景**

1. **案件不存在**：`triggerPushOnNodeChange` 查询 `cases` 表为空时抛出 `案件不存在`，内部调用方需捕获并记录日志，不影响节点变更主流程。
2. **渠道发送失败**：微信/短信网关异常时，将推送记录 `status` 置为 `failed`，前端在客户查看时展示"推送失败，请稍后重试"，并提供"重新获取进度"按钮触发重推。
3. **重复推送**：同一 `node_type` 24小时内重复触发，返回 `{ triggered: false, message: "该节点已推送过" }`，前端不展示重复通知。
4. **客户禁用通知**：若 `user.notification_enabled = false`，跳过实际发送，仅写入记录但 `status=pending`，避免打扰客户。

#### **9. 验收标准**

- **正常场景**：Given 案件A状态变更为 `closed`，When 系统调用 `triggerPushOnNodeChange(caseA, 'closed')`，Then `case_push_notifications` 表新增一条记录 `node_type=closed, status=sent, sent_at` 非空。
- **边界场景**：Given 客户A有3条推送记录（其中1条 `client_id` 是客户B），When 客户A调用 `POST /api/client/push-notifications`，Then 仅返回2条 `client_id=客户A` 的记录。
- **异常场景**：Given 案件A刚推送过 `filing` 节点不足1分钟，When 系统再次触发同节点推送，Then 返回 `triggered:false` 且不新增数据库记录，错误日志记录重复触发原因。

---

#### 7.3 AI客户智能答疑

#### **1. 功能描述**

C端客户在专属端口输入法律咨询问题，AI即时返回标准化法律建议与相关法规，复杂问题自动转人工生成工单并同步至对应办案人员，咨询记录全量归档至客户档案。

#### **2. 用户故事**

- 作为客户，我希望7×24小时都能在专属端口提问法律相关问题，以便快速获得指引而非等待人工回复。
- 作为客户，当我的问题超出AI能力时，我希望系统自动转人工并通知律师跟进，以便复杂问题不被遗漏。

#### **3. 业务规则**

1. **问题长度限制**：单次问题文本长度需在 5-500 字之间，过短或过长均拒绝并提示。
2. **转人工触发关键词**：当问题文本包含 `投诉`、`转人工`、`人工`、`律师`、`无法解决` 任一关键词时，自动转人工。
3. **转人工工单生成**：转人工时复用 `complaints` 表，`type='consultation_transfer'`，`status='new'`，`case_id` 与问题关联（如有）。
4. **咨询记录归档**：所有咨询（无论是否转人工）均写入 `client_consultations` 表，保存 `question`、`ai_answer`、`is_transferred_to_human`、`ticket_id`。
5. **AI回答规范**：AI回答须包含基础建议（3条要点）+ `related_laws` 法规列表（民法典/民事诉讼法/律师法），不得给出具体案件胜诉承诺。
6. **频次限制**：单客户每小时最多发起20次咨询，超出返回 `code:429`，提示"咨询频次过高，请稍后再试"。

#### **4. 输入/输出规范**

**输入字段（POST `/api/client/ai/consult-enhanced`）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| client_id | string(uuid) | 是 | 等于 JWT sub |
| question | string | 是 | 长度 5-500 字 |
| case_id | string(uuid) | 否 | 关联案件ID（如有） |
| organization_id | string(uuid) | 否 | 客户所属律所ID |

**输出结果**：

```json
{
  "code": 0,
  "data": {
    "consultation": {
      "id": "consult-uuid-001",
      "client_id": "user-uuid-001",
      "case_id": "case-uuid-001",
      "question": "我想咨询离婚财产分割流程",
      "ai_answer": "针对您的问题...",
      "is_transferred_to_human": false,
      "ticket_id": null,
      "created_at": "2026-07-25T10:00:00.000Z"
    },
    "answer": "针对您的问题...",
    "related_laws": ["中华人民共和国民法典", "中华人民共和国民事诉讼法", "中华人民共和国律师法"],
    "transferred": false
  }
}
```

#### **5. 数据模型**

**Entity：ClientConsultation（表名 client_consultations）**

| 字段名 | 类型 SQLite | 约束 | 说明 |
|--------|-------------|------|------|
| id | varchar(uuid) | PK | 咨询记录ID |
| client_id | varchar | not null, FK→users.id | 客户ID |
| case_id | varchar | nullable, FK→cases.id | 关联案件ID |
| question | text | not null | 客户问题 |
| ai_answer | text | nullable | AI回答 |
| is_transferred_to_human | boolean | default false | 是否转人工 |
| ticket_id | varchar | nullable | 转人工工单ID（关联 complaints.id） |
| organization_id | varchar | nullable, FK→organizations.id | 律所ID |
| created_at | datetime | auto | 创建时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/client/ai/consult | 基础AI咨询（仅返回答案，不落库） | client JWT |
| POST | /api/client/ai/consult-enhanced | 增强咨询（落库 + 自动转人工） | client JWT |
| POST | /api/client/consultations | 查询客户咨询记录列表 | client JWT |

**请求/响应示例（POST /api/client/ai/consult-enhanced）**：

请求：
```json
{
  "client_id": "user-uuid-001",
  "question": "我要投诉律师服务态度，要求转人工",
  "case_id": "case-uuid-001",
  "organization_id": "org-uuid-001"
}
```

成功响应（含转人工）：
```json
{
  "code": 0,
  "data": {
    "consultation": {
      "id": "consult-uuid-001",
      "question": "我要投诉律师服务态度，要求转人工",
      "ai_answer": "针对您的问题...",
      "is_transferred_to_human": true,
      "ticket_id": "complaint-uuid-001",
      "created_at": "2026-07-25T10:00:00.000Z"
    },
    "answer": "针对您的问题...",
    "related_laws": ["中华人民共和国民法典", "中华人民共和国民事诉讼法", "中华人民共和国律师法"],
    "transferred": true
  }
}
```

失败响应（问题过短）：
```json
{
  "code": 400,
  "message": "问题长度需在5-500字之间"
}
```

#### **7. 交互流程**

1. 客户进入 `/client/ai-chat` 页面 → 展示聊天框与历史咨询列表。
2. 客户输入问题点击发送 → 前端校验长度 → `POST /api/client/ai/consult-enhanced` 提交。
3. 后端调用 `aiConsult(question)` 生成基础回答 → 检查 `TRANSFER_KEYWORDS` 是否命中 → 若命中，写入 `complaints` 表 `type='consultation_transfer'` 拿到 `ticket_id`。
4. 后端将咨询记录写入 `client_consultations` 表（含 `ai_answer`、`is_transferred_to_human`、`ticket_id`）→ 返回完整响应。
5. 前端展示AI回答 + 相关法规 → 若 `transferred=true`，额外展示"已为您转人工，工单号 XXX，律师将在24小时内联系"。
6. 客户进入 `/client/consultations` → 前端 `POST /api/client/consultations` → 返回历史咨询列表按 `created_at DESC` 排序。

#### **8. 异常场景**

1. **AI服务超时**：AI生成回答超过10秒，返回 `code:504, message:"AI服务暂时不可用，请稍后再试"`，前端按钮置为可重试状态。
2. **问题内容为空或过短**：长度<5字时返回 `code:400, message:"问题长度需在5-500字之间"`，前端禁用发送按钮并 inline 提示。
3. **频次超限**：单客户1小时内超过20次咨询，返回 `code:429, message:"咨询频次过高，请稍后再试"`，前端倒计时60秒后恢复。
4. **转人工工单写入失败**：`complaints` 表写入异常时，咨询记录仍写入但 `ticket_id=null, is_transferred_to_human=false`，记录错误日志并通知律所运营人员人工介入。

#### **9. 验收标准**

- **正常场景**：Given 客户A登录，When 提交问题"离婚财产如何分割"（不含转人工关键词），Then `client_consultations` 新增记录 `is_transferred_to_human=false`，AI回答包含3条建议+法规列表。
- **边界场景**：Given 客户A提交问题含"转人工"关键词，When 调用 `/api/client/ai/consult-enhanced`，Then 同时新增 `client_consultations` 记录与 `complaints` 工单，且 `ticket_id` 不为空。
- **异常场景**：Given 客户A提交问题仅2个字，When 调用接口，Then 返回 `code:400, message:"问题长度需在5-500字之间"`，且不写入任何数据库记录。

---

#### 7.4 线上服务大厅

#### **1. 功能描述**

C端客户可在专属端口一站式办理在线签约、电子发票下载、证据材料上传、投诉提交等业务，所有操作全量留痕并自动同步至律所对应业务模块，提升服务效率。

#### **2. 用户故事**

- 作为客户，我希望在线签署委托合同而无需到所，以便节省往返时间。
- 作为客户，我希望在线下载已付款的电子发票，以便及时报销入账。
- 作为客户，我希望在线上传案件证据材料，以便律师即时查阅而无需邮寄。

#### **3. 业务规则**

1. **在线签约前置条件**：必须传 `case_id`、`client_id`、`lawyer_id`、`contract_template_id`、`organization_id`，且合同模板必须存在于 `contract_templates` 表。
2. **签约状态**：调用 `onlineSign` 后直接生成 `signing_compliance` 记录，`status='signed'`，`signed_time=now()`，`contract_content` 取模板内容。
3. **电子发票生成规则**：发票号格式 `INV{时间戳}{0-999随机数}`，仅返回发票数据（实际开票需对接税控系统），客户须校验 `payment.client_id === 当前client_id`。
4. **证据上传同步**：上传的证据写入 `evidence` 表，`type='evidence'`，`category='plaintiff'`，`upload_by_id=client_id`，自动同步至案件卷宗。
5. **投诉提交校验**：投诉内容长度 ≥10 字，`type` 必须为枚举值之一（service_quality/communication_fee/lawyer_attitude/consultation_transfer/low_score_rating/other），`status` 初始为 `new`。
6. **支付数据同步**：客户在 C 端发起的支付操作同步写入 `payment_records`，律所财务端实时可见。

#### **4. 输入/输出规范**

**输入字段（POST `/api/client/online-sign` 在线签约）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | string(uuid) | 是 | 案件必须存在且 client_id 一致 |
| client_id | string(uuid) | 是 | 等于 JWT sub |
| lawyer_id | string(uuid) | 是 | 律师须存在 |
| contract_template_id | string(uuid) | 是 | 模板须存在 |
| organization_id | string(uuid) | 是 | 律所ID |

**输入字段（POST `/api/client/cases/:id/evidence` 上传证据）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| client_id | string(uuid) | 是 | 等于 JWT sub |
| name | string | 是 | 长度 ≤ 100 |
| file_path | string | 是 | 文件存储路径 |
| file_size | number | 否 | 单位字节，≤ 50MB |
| mime_type | string | 否 | 标准 MIME 类型 |
| description | string | 否 | 长度 ≤ 500 |

**输出结果（在线签约）**：

```json
{
  "code": 0,
  "data": {
    "id": "signing-uuid-001",
    "case_id": "case-uuid-001",
    "client_id": "user-uuid-001",
    "lawyer_id": "lawyer-uuid-001",
    "contract_template_id": "tpl-uuid-001",
    "status": "signed",
    "contract_content": "...",
    "signed_time": "2026-07-25T10:00:00.000Z",
    "organization_id": "org-uuid-001"
  }
}
```

#### **5. 数据模型**

本节复用既有实体，无新增表：

- **SigningCompliance**（合规签约表，表名 `signing_compliances`）：存储签约记录
- **PaymentRecord**（付款记录表，表名 `payment_records`）：用于发票下载关联
- **Evidence**（证据表，表名 `evidences`）：存储客户上传的证据材料
- **Complaint**（投诉表，表名 `complaints`）：存储客户投诉

**Entity：Evidence 关键字段（对齐后端）**

| 字段名 | 类型 SQLite | 约束 | 说明 |
|--------|-------------|------|------|
| id | varchar(uuid) | PK | 证据ID |
| name | varchar | not null | 证据名称 |
| file_path | varchar | not null | 文件路径 |
| file_size | integer | nullable | 文件大小（字节） |
| mime_type | varchar | nullable | MIME 类型 |
| description | text | nullable | 描述 |
| type | varchar | not null | 类型：evidence/document/other |
| category | varchar | not null | 分类：plaintiff/defendant/court/other |
| case_id | varchar | not null, FK→cases.id | 案件ID |
| upload_by_id | varchar | not null, FK→users.id | 上传人ID |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/client/online-sign | 在线签约 | client JWT |
| POST | /api/client/payments | 查询客户付款记录 | client JWT |
| POST | /api/client/payments/:id/invoice | 下载电子发票 | client JWT |
| POST | /api/client/cases/:id/evidence | 上传证据材料 | client JWT |
| POST | /api/client/complaint | 提交投诉 | client JWT |
| POST | /api/client/complaints | 查询客户投诉列表 | client JWT |
| POST | /api/client/service-fee | 查询客户服务费 | client JWT |

**请求/响应示例（POST /api/client/cases/:id/evidence 上传证据）**：

请求：
```json
{
  "client_id": "user-uuid-001",
  "name": "微信聊天记录截图",
  "file_path": "/uploads/2026/07/abc123.png",
  "file_size": 524288,
  "mime_type": "image/png",
  "description": "2026年6月与对方的微信沟通记录"
}
```

成功响应：
```json
{
  "code": 0,
  "data": {
    "id": "evidence-uuid-001",
    "name": "微信聊天记录截图",
    "file_path": "/uploads/2026/07/abc123.png",
    "file_size": 524288,
    "mime_type": "image/png",
    "description": "2026年6月与对方的微信沟通记录",
    "type": "evidence",
    "category": "plaintiff",
    "case_id": "case-uuid-001",
    "upload_by_id": "user-uuid-001"
  }
}
```

失败响应（无权访问案件）：
```json
{
  "code": 403,
  "message": "案件不存在或无权访问"
}
```

#### **7. 交互流程**

1. **在线签约**：客户在案件详情页点击"立即签约" → 前端拉取合同模板列表 → 客户阅读并勾选同意 → `POST /api/client/online-sign` → 后端校验模板存在性 → 写入 `signing_compliances` 表 `status=signed` → 返回签约记录。
2. **下载发票**：客户进入"我的缴费" → `POST /api/client/payments` 拉取付款列表 → 点击"下载发票" → `POST /api/client/payments/:id/invoice` → 后端校验 `payment.client_id === 当前client_id` → 生成发票号与下载URL → 前端跳转下载。
3. **上传证据**：客户进入案件证据页 → 选择文件并填写名称描述 → 前端先上传文件至文件服务拿 `file_path` → `POST /api/client/cases/:id/evidence` → 后端校验案件归属 → 写入 `evidences` 表 → 同步至案件卷宗。
4. **提交投诉**：客户进入"投诉建议" → 选择投诉类型填写内容 → `POST /api/client/complaint` → 后端写入 `complaints` 表 `status=new` → 律所合规端实时可见。
5. **服务费查询**：客户进入"服务费" → `POST /api/client/service-fee` → 后端通过 `client_id` 查 `users` 拿 phone → 用 phone 查 `leads` 取 `service_fee` → 返回金额。

#### **8. 异常场景**

1. **合同模板不存在**：`onlineSign` 查询 `contract_templates` 为空，抛出 `合同模板不存在`，前端提示"合同模板已下架，请联系律师"。
2. **付款记录越权访问**：`downloadInvoice` 时 `payment.client_id !== client_id`，抛出 `付款记录不存在或无权访问`，前端 toast 提示。
3. **证据文件超限**：`file_size > 50MB`，前端在上传前拦截，提示"单个文件不能超过50MB"。
4. **投诉内容为空**：`createComplaint` 时 `content.length < 10`，返回 `code:400, message:"投诉内容至少10字"`，前端 inline 提示。
5. **重复签约**：同一 `case_id` 已存在 `signing_compliances` 记录时，返回 `code:409, message:"该案件已签约"`，前端提示"您已签署过该案件合同"。

#### **9. 验收标准**

- **正常场景**：Given 客户A已登录且案件A归属客户A，When 客户A `POST /api/client/cases/A/evidence` 上传证据，Then `evidences` 表新增记录 `type=evidence, category=plaintiff, upload_by_id=客户A`。
- **边界场景**：Given 客户A下载付款记录P的发票，但P.client_id 是客户B，When 调用 `POST /api/client/payments/P/invoice`，Then 返回 `code:403, message:"付款记录不存在或无权访问"`。
- **异常场景**：Given 客户A在线签约时传入不存在的 `contract_template_id`，When 调用 `POST /api/client/online-sign`，Then 返回 `code:400, message:"合同模板不存在"`，且不写入 `signing_compliances` 表。

---

#### 7.5 服务评价与口碑沉淀

#### **1. 功能描述**

案件结案后系统自动触发服务评价推送，客户对服务进行1-5星评分与文字评价；好评经审核后沉淀至营销素材库，低分评价自动生成客诉预警同步至合规风控模块。

#### **2. 用户故事**

- 作为客户，我希望结案后能对本次法律服务进行评价，以便表达我的真实感受。
- 作为律所运营人员，我希望好评能沉淀为口碑素材用于营销宣传，以便降低获客成本。
- 作为合规风控人员，我希望低分评价能自动生成客诉预警，以便及时介入避免事态扩大。

#### **3. 业务规则**

1. **评价触发时机**：案件状态变为 `closed` 时，系统自动调用 `triggerRatingOnCaseClose` 推送评价邀请。
2. **重复评价保护**：同一 `case_id` 已存在 `service_ratings` 记录时，`triggerRatingOnCaseClose` 返回 `{ triggered:false, message:"该案件已存在评价，无需重复触发" }`，不重复推送。
3. **评分范围**：`rating` 取值 1-5 整数，超出范围返回 `评分需在1-5之间`。
4. **评价初始状态**：客户提交评价时 `status='pending'`，等待律所审核。
5. **低分预警阈值**：`rating <= 2` 时自动调用 `createLowScoreWarning` 生成 `complaint_tickets` 记录，`severity_level='high'`，`status='pending'`，工单号格式 `LSR{时间戳}{0-999随机数}`。
6. **好评沉淀规则**：仅 `rating >= 4` 的评价可被 `convertRatingToMaterial` 沉淀至营销素材库，且不可重复沉淀（`is_converted_to_material=true` 时返回 `该评价已沉淀为素材`）。
7. **素材生成规则**：沉淀时调用 `AdMaterial` 创建素材记录，`type='article'`，`tags=['客户好评','口碑素材']`，`channel='word_of_mouth'`，`status='draft'`，`compliance_status='pending'`。
8. **审核状态流转**：`pending` → `approved` / `rejected` / `converted_to_material`，审核时写入 `reviewed_at` 与 `reviewer_id`。

#### **4. 输入/输出规范**

**输入字段（POST `/api/client/service-ratings` 提交评价）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| case_id | string(uuid) | 是 | 案件须存在 |
| client_id | string(uuid) | 是 | 等于 JWT sub |
| rating | integer | 是 | 1-5 整数 |
| content | string | 否 | 长度 ≤ 1000 |
| organization_id | string(uuid) | 否 | 客户所属律所ID |

**输出结果**：

```json
{
  "code": 0,
  "data": {
    "id": "rating-uuid-001",
    "case_id": "case-uuid-001",
    "client_id": "user-uuid-001",
    "rating": 5,
    "content": "律师服务非常专业，沟通及时，强烈推荐！",
    "status": "pending",
    "is_converted_to_material": false,
    "material_id": null,
    "organization_id": "org-uuid-001",
    "created_at": "2026-07-25T10:00:00.000Z"
  }
}
```

#### **5. 数据模型**

**Entity：ServiceRating（表名 service_ratings）**

| 字段名 | 类型 SQLite | 约束 | 说明 |
|--------|-------------|------|------|
| id | varchar(uuid) | PK | 评价ID |
| case_id | varchar | not null, FK→cases.id | 案件ID |
| client_id | varchar | not null, FK→users.id | 客户ID |
| rating | integer | not null | 评分 1-5 |
| content | text | nullable | 评价内容 |
| status | varchar | default 'pending' | 状态：pending/approved/rejected/converted_to_material |
| is_converted_to_material | boolean | default false | 是否已沉淀素材 |
| material_id | varchar | nullable, FK→ad_materials.id | 沉淀素材ID |
| organization_id | varchar | nullable, FK→organizations.id | 律所ID |
| reviewed_at | datetime | nullable | 审核时间 |
| reviewer_id | varchar | nullable, FK→users.id | 审核人ID |
| created_at | datetime | auto | 创建时间 |

索引：`INDEX(organization_id, status)` / `INDEX(client_id)` / `INDEX(case_id)`

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/client/service-ratings | 客户提交评价 | client JWT |
| POST | /api/client/service-ratings/list | 客户查询自己的评价 | client JWT |
| GET | /api/client/service-ratings/admin | 管理端查询评价列表 | admin JWT |
| PUT | /api/client/service-ratings/:id/review | 审核评价 | admin JWT |
| POST | /api/client/service-ratings/:id/convert | 好评沉淀至素材库 | admin JWT |
| POST | /api/internal/client/trigger-rating | 案件结案触发评价推送（内部调用） | system JWT |

**请求/响应示例（POST /api/client/service-ratings 提交评价）**：

请求：
```json
{
  "case_id": "case-uuid-001",
  "client_id": "user-uuid-001",
  "rating": 1,
  "content": "律师服务态度极差，响应缓慢，强烈不满",
  "organization_id": "org-uuid-001"
}
```

成功响应（含低分预警自动触发）：
```json
{
  "code": 0,
  "data": {
    "id": "rating-uuid-001",
    "case_id": "case-uuid-001",
    "client_id": "user-uuid-001",
    "rating": 1,
    "content": "律师服务态度极差，响应缓慢，强烈不满",
    "status": "pending",
    "is_converted_to_material": false,
    "material_id": null,
    "organization_id": "org-uuid-001",
    "created_at": "2026-07-25T10:00:00.000Z"
  },
  "warning_ticket": {
    "id": "ticket-uuid-001",
    "ticket_number": "LSR17534376001234",
    "severity_level": "high",
    "status": "pending"
  }
}
```

失败响应（评分越界）：
```json
{
  "code": 400,
  "message": "评分需在1-5之间"
}
```

#### **7. 交互流程**

1. 律师将案件状态改为 `closed` → 后端调用 `triggerRatingOnCaseClose(caseId)` → 检查是否已有评价 → 无则调用 `createPushNotification` 推送评价邀请。
2. 客户在 `/client/notifications` 看到评价邀请 → 点击进入评价页 → 选择星级 + 填写文字 → `POST /api/client/service-ratings`。
3. 后端校验 `rating` 范围 → 校验案件存在 → 写入 `service_ratings` 表 `status='pending'` → 若 `rating<=2` 调用 `createLowScoreWarning` 生成 `complaint_tickets` 工单。
4. 律所管理端 `GET /api/client/service-ratings/admin?org_id=xxx&status=pending` 拉取待审核评价列表 → 审核员点击通过/驳回 → `PUT /api/client/service-ratings/:id/review` 更新 `status, reviewed_at, reviewer_id`。
5. 对于好评（`rating>=4`）→ 审核员点击"沉淀为素材" → `POST /api/client/service-ratings/:id/convert` → 创建 `ad_materials` 记录 → 更新评价 `is_converted_to_material=true, material_id=xxx, status='converted_to_material'`。
6. 合规风控端实时可见低分预警工单 → 风控人员跟进处理 → 工单状态流转。

#### **8. 异常场景**

1. **评分越界**：`rating=6` 或 `rating=0`，返回 `code:400, message:"评分需在1-5之间"`，前端禁用提交按钮。
2. **案件不存在**：`createServiceRating` 时 `cases` 查询为空，返回 `code:404, message:"案件不存在"`，前端提示"案件不存在，无法评价"。
3. **重复沉淀**：`convertRatingToMaterial` 时 `is_converted_to_material=true`，返回 `code:409, message:"该评价已沉淀为素材"`。
4. **低分评价无法沉淀**：`convertRatingToMaterial` 时 `rating<4`，返回 `code:400, message:"仅评分≥4的好评可沉淀至素材库"`。
5. **重复触发评价推送**：`triggerRatingOnCaseClose` 检测到已有评价记录，返回 `{ triggered:false, message:"该案件已存在评价，无需重复触发" }`，避免重复打扰客户。

#### **9. 验收标准**

- **正常场景**：Given 客户A对已结案案件B提交5星好评，When 调用 `POST /api/client/service-ratings`，Then `service_ratings` 表新增 `status='pending'` 记录，且不触发 `complaint_tickets` 工单。
- **边界场景**：Given 客户A提交1星评价，When 调用提交接口，Then `service_ratings` 新增记录同时 `complaint_tickets` 新增 `severity_level='high', status='pending'` 工单。
- **异常场景**：Given 评价记录R已被沉淀为素材（`is_converted_to_material=true`），When 审核员再次调用 `POST /api/client/service-ratings/R/convert`，Then 返回 `code:409, message:"该评价已沉淀为素材"`，且不重复创建 `ad_materials` 记录。

---

### 模块8：全链路经营数据决策中台

> 设计目标：聚合投放、线索、销售、办案、财务、合规六大业务系统的数据，为律所管理者提供从漏斗转化到合规风控的全维度数据看板，支持自定义报表与定时订阅推送，驱动数据化经营决策。
>
> 工程约束：
> - 所有 dashboard 接口路径以 `/api/dashboard/*` 为前缀，使用 GET 查询、POST 写入/导出
> - 数据按 `organization_id` 严格隔离，跨律所查询返回空结果
> - 时间范围查询统一使用 `start_date` / `end_date` 参数（ISO 8601 格式）
> - 报表导出文件存放于 `process.cwd()/exports` 目录

---

#### 8.1 投放转化漏斗看板

#### **1. 功能描述**

展示从曝光到回款的八级转化漏斗数据，支持按渠道、平台、案由、时间筛选，实时计算线索成本、加微率、到所率、签约率、ROI 等核心投放指标，驱动投放优化决策。

#### **2. 用户故事**

- 作为律所投放专员，我希望查看不同渠道的转化漏斗数据，以便识别哪一环节流失严重并优化投放策略。
- 作为律所管理者，我希望实时掌握整体ROI与线索成本，以便判断投放预算的投入产出比。

#### **3. 业务规则**

1. **漏斗八级**：曝光(impression) → 点击(click) → 线索(lead) → 加微(wechat_add) → 邀约(invite) → 到所(visit) → 签约(sign) → 回款(payment)，前两级暂未对接数据源时返回0。
2. **数据来源**：线索量、加微、邀约、签约取自 `conversion_events` 表对应 `event_type`；到所量取自 `invite_tasks` 表 `status='arrived'`；回款量取自 `fees` 表 `paid=true`。
3. **筛选维度**：支持 `channel`(渠道)、`platform`(平台)、`case_type`(案由)、`start_date`/`end_date`(时间范围)四维筛选。
4. **核心指标计算规则**：
   - 线索成本 = 投放成本(`conversion_events.event_type='impression_cost'` 的 SUM(amount)) / 线索量
   - 加微率 = 加微量 / 线索量 × 100%
   - 到所率 = 到所量 / 线索量 × 100%
   - 签约率 = 签约量 / 线索量 × 100%
   - ROI = (回款金额 - 投放成本) / 投放成本 × 100%
5. **分母为零保护**：所有比率计算的分母为0时，结果直接返回0，不抛出异常。
6. **筛选项获取**：`GET /api/dashboard/funnel-filter-options` 返回当前律所去重后的渠道、平台、案由列表，无数据时返回默认渠道列表 `['抖音','百度','快手','微信']`。

#### **4. 输入/输出规范**

**输入字段（GET `/api/dashboard/conversion-funnel-enhanced`）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| org_id | string(uuid) | 是 | 等于 JWT 用户所属律所ID |
| channel | string | 否 | 来自 funnel-filter-options.channels |
| platform | string | 否 | 来自 funnel-filter-options.platforms |
| case_type | string | 否 | 来自 funnel-filter-options.case_types |
| start_date | datetime | 否 | ISO 8601 格式 |
| end_date | datetime | 否 | ISO 8601，须晚于 start_date |

**输出结果**：

```json
{
  "code": 0,
  "data": {
    "funnel": [
      { "stage": "impression", "label": "曝光", "count": 0 },
      { "stage": "click", "label": "点击", "count": 0 },
      { "stage": "lead", "label": "线索", "count": 120 },
      { "stage": "wechat_add", "label": "加微", "count": 80 },
      { "stage": "invite", "label": "邀约", "count": 50 },
      { "stage": "visit", "label": "到所", "count": 30 },
      { "stage": "sign", "label": "签约", "count": 15 },
      { "stage": "payment", "label": "回款", "count": 10 }
    ],
    "metrics": {
      "lead_cost": 25.50,
      "wechat_add_rate": 66.67,
      "visit_rate": 25.00,
      "sign_rate": 12.50,
      "roi": 150.00
    }
  }
}
```

#### **5. 数据模型**

复用既有实体，无新增表：

- **ConversionEvent**（表名 `conversion_events`）：投放转化事件，记录曝光/点击/线索/加微/邀约/签约/投放成本等事件
- **InviteTask**（表名 `invite_tasks`）：邀约任务，记录到所状态
- **Fee**（表名 `fees`）：费用记录，记录回款金额
- **Lead**（表名 `leads`）：线索，提供筛选维度

**关键字段对齐**：

| 字段名 | 类型 SQLite | 所属表 | 说明 |
|--------|-------------|--------|------|
| event_type | varchar | conversion_events | 事件类型：lead/wechat_add/invite/sign/impression_cost |
| channel | varchar | conversion_events | 投放渠道 |
| amount | real | conversion_events | 金额（投放成本） |
| status | varchar | invite_tasks | 邀约状态：arrived/invited |
| paid | boolean | fees | 是否已付款 |
| amount | real | fees | 回款金额 |
| source_channel | varchar | leads | 线索来源渠道 |
| case_type | varchar | leads | 线索案由 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/dashboard/conversion-funnel | 基础漏斗数据（旧版） | admin JWT |
| GET | /api/dashboard/conversion-funnel-enhanced | 八级漏斗数据（增强版） | admin JWT |
| GET | /api/dashboard/funnel-filter-options | 获取漏斗筛选项 | admin JWT |
| GET | /api/dashboard/channel-roi | 渠道ROI分析 | admin JWT |

**请求/响应示例（GET /api/dashboard/conversion-funnel-enhanced）**：

请求：
```
GET /api/dashboard/conversion-funnel-enhanced?org_id=org-001&channel=抖音&start_date=2026-07-01T00:00:00Z&end_date=2026-07-31T23:59:59Z
```

成功响应：
```json
{
  "code": 0,
  "data": {
    "funnel": [
      { "stage": "impression", "label": "曝光", "count": 0 },
      { "stage": "lead", "label": "线索", "count": 80 },
      { "stage": "wechat_add", "label": "加微", "count": 60 },
      { "stage": "invite", "label": "邀约", "count": 40 },
      { "stage": "visit", "label": "到所", "count": 20 },
      { "stage": "sign", "label": "签约", "count": 10 },
      { "stage": "payment", "label": "回款", "count": 8 }
    ],
    "metrics": {
      "lead_cost": 30.00,
      "wechat_add_rate": 75.00,
      "visit_rate": 25.00,
      "sign_rate": 12.50,
      "roi": 200.00
    }
  }
}
```

失败响应（无权限）：
```json
{
  "code": 403,
  "message": "无权访问该律所数据"
}
```

#### **7. 交互流程**

1. 管理者进入 `/dashboard/conversion-funnel` 页面 → 前端并行调用 `GET /api/dashboard/funnel-filter-options` 拉取筛选项 + `GET /api/dashboard/conversion-funnel-enhanced` 拉取默认数据。
2. 前端展示漏斗图（ECharts Funnel）+ 核心指标卡片（线索成本/加微率/到所率/签约率/ROI）。
3. 用户选择筛选条件（渠道/平台/案由/时间范围）点击"查询" → 前端拼接 query → `GET /api/dashboard/conversion-funnel-enhanced?org_id&channel&...`。
4. 后端按 `org_id` + 筛选条件构建 `conversion_events` / `invite_tasks` / `fees` 查询 → 分别统计八级数据 → 计算核心指标 → 返回。
5. 用户点击"导出" → 复用模块8.6报表导出能力 → 生成 Excel 文件下载。

#### **8. 异常场景**

1. **时间范围非法**：`end_date <= start_date`，返回 `code:400, message:"结束时间必须晚于开始时间"`，前端 inline 提示。
2. **跨律所访问**：JWT 中 `organization_id` 与 query 中 `org_id` 不一致，返回 `code:403, message:"无权访问该律所数据"`。
3. **数据为空**：所选筛选条件下无任何转化事件，漏斗各级 `count=0`，指标全部为0，前端展示空状态"当前筛选条件下无数据"。
4. **投放成本为0时ROI计算**：分母为0直接返回 `roi:0`，不抛出除零异常，前端展示"ROI: 0%（投放成本为0，无法计算）"。

#### **9. 验收标准**

- **正常场景**：Given 律所A 2026年7月有80条线索、10条签约、8条回款、投放成本2400元、回款金额7200元，When 调用 `GET /api/dashboard/conversion-funnel-enhanced?org_id=A&start_date=2026-07-01&end_date=2026-07-31`，Then 返回漏斗签约量10、ROI=200%。
- **边界场景**：Given 律所A在所选时间范围内无投放成本记录，When 调用接口，Then `lead_cost=0, roi=0`，不抛出除零异常。
- **异常场景**：Given 管理员A属于律所A，When 调用接口传 `org_id=律所B`，Then 返回 `code:403, message:"无权访问该律所数据"`。

---

#### 8.2 销售团队绩效看板

#### **1. 功能描述**

分邀约岗与谈案岗两个维度统计销售团队绩效数据，包括接通量、邀约量、到所量、签约量、签约金额、人均产能等指标，支持个人与团队排行，驱动销售团队精细化管理。

#### **2. 用户故事**

- 作为销售主管，我希望查看邀约岗与谈案岗的全维度绩效数据，以便识别高低产能成员并针对性辅导。
- 作为律所管理者，我希望按时间维度查看销售排行榜，以便制定激励政策与资源倾斜。

#### **3. 业务规则**

1. **邀约岗指标**：`total_connected`(接通量) = `invite_tasks` 总数；`total_invited`(邀约量) = `status IN ('invited','arrived')`；`total_visited`(到所量) = `status='arrived'`；`visit_rate` = 到所量/邀约量×100%；`avg_capacity`(人均产能) = 邀约量/邀约岗人数。
2. **谈案岗指标**：`total_received`(接待量) = `opportunities` 总数；`total_signed`(签约量) = `stage='signed'`；`sign_rate` = 签约量/接待量×100%；`signed_amount`(签约金额) = SUM(`actual_amount`)；`avg_performance`(人均业绩) = 签约金额/谈案岗人数。
3. **排行维度**：支持 `dimension=individual`(个人) 或 `dimension=team`(团队)，团队按 `users.role` 分组。
4. **时间筛选**：支持 `start_date`/`end_date` 时间范围，按 `invite_tasks.created_at` / `opportunities.created_at` 过滤。
5. **数据权限**：所有查询须 `leads.organization_id = 当前律所ID`，跨律所数据不可见。
6. **分母为零保护**：人均指标分母为0时返回0，不抛异常。

#### **4. 输入/输出规范**

**输入字段（GET `/api/dashboard/sales-performance`）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| org_id | string(uuid) | 是 | 等于 JWT 律所ID |
| start_date | datetime | 否 | ISO 8601 |
| end_date | datetime | 否 | 须晚于 start_date |

**输入字段（GET `/api/dashboard/sales-ranking`）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| org_id | string(uuid) | 是 | 等于 JWT 律所ID |
| start_date | datetime | 否 | ISO 8601 |
| end_date | datetime | 否 | 须晚于 start_date |
| dimension | string | 否 | 取值：individual(默认)/team |

**输出结果（sales-performance）**：

```json
{
  "code": 0,
  "data": {
    "invite_team": {
      "total_connected": 200,
      "total_invited": 100,
      "total_visited": 40,
      "visit_rate": 40.00,
      "avg_capacity": 33.33
    },
    "negotiate_team": {
      "total_received": 50,
      "total_signed": 15,
      "sign_rate": 30.00,
      "signed_amount": 75000.00,
      "avg_performance": 25000.00
    }
  }
}
```

#### **5. 数据模型**

复用既有实体，无新增表：

- **InviteTask**（表名 `invite_tasks`）：邀约任务
- **Opportunity**（表名 `opportunities`）：商机/谈案记录
- **User**（表名 `users`）：用户信息（real_name、role）
- **Lead**（表名 `leads`）：线索，提供 organization_id 关联

**关键字段对齐**：

| 字段名 | 类型 SQLite | 所属表 | 说明 |
|--------|-------------|--------|------|
| inviter_id | varchar | invite_tasks | 邀约人ID |
| status | varchar | invite_tasks | 邀约状态：invited/arrived |
| negotiator_id | varchar | opportunities | 谈案人ID |
| stage | varchar | opportunities | 商机阶段：signed/... |
| actual_amount | real | opportunities | 实际签约金额 |
| real_name | varchar | users | 用户真实姓名 |
| role | varchar | users | 用户角色 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/dashboard/sales-performance | 销售团队绩效总览 | admin JWT |
| GET | /api/dashboard/sales-ranking | 销售排行榜（个人/团队） | admin JWT |

**请求/响应示例（GET /api/dashboard/sales-ranking?dimension=individual）**：

请求：
```
GET /api/dashboard/sales-ranking?org_id=org-001&start_date=2026-07-01T00:00:00Z&end_date=2026-07-31T23:59:59Z&dimension=individual
```

成功响应：
```json
{
  "code": 0,
  "data": {
    "dimension": "individual",
    "invite_ranking": [
      { "user_id": "user-001", "user_name": "李邀约", "invite_count": 35 },
      { "user_id": "user-002", "user_name": "王邀约", "invite_count": 28 }
    ],
    "sign_ranking": [
      { "user_id": "user-003", "user_name": "张谈案", "sign_count": 8, "sign_amount": 40000.00 },
      { "user_id": "user-004", "user_name": "刘谈案", "sign_count": 5, "sign_amount": 25000.00 }
    ]
  }
}
```

失败响应（参数错误）：
```json
{
  "code": 400,
  "message": "dimension 参数取值必须为 individual 或 team"
}
```

#### **7. 交互流程**

1. 销售主管进入 `/dashboard/sales-performance` 页面 → 前端 `GET /api/dashboard/sales-performance?org_id&start_date&end_date` 拉取绩效总览。
2. 前端展示邀约岗与谈案岗两组指标卡片 + 双柱状图对比。
3. 主管切换至"排行榜"Tab → 选择维度（个人/团队）+ 时间范围 → `GET /api/dashboard/sales-ranking?dimension=xxx&...`。
4. 后端按 `inviter_id` / `negotiator_id` 分组统计 → JOIN `users` 取真实姓名 → 按 `invite_count` / `sign_amount` DESC 排序 → 返回排行列表。
5. 若 `dimension=team` → 按 `users.role` 二次聚合 → 返回团队排行。
6. 主管点击某成员 → 跳转 `/dashboard/sales-performance?user_id=xxx` 查看个人详情。

#### **8. 异常场景**

1. **dimension 参数非法**：取值非 `individual`/`team`，返回 `code:400, message:"dimension 参数取值必须为 individual 或 team"`。
2. **时间范围跨度过大**：超过1年时返回 `code:400, message:"时间范围不能超过1年"`，前端限制日期选择跨度。
3. **无任何邀约任务**：返回 `invite_team.total_connected=0` 等全0数据，前端展示"所选时间范围内无销售数据"空状态。
4. **用户已离职**：`users` 表中查不到 `inviter_id` 对应记录时，`user_name` 返回"未知"，不阻断统计流程。

#### **9. 验收标准**

- **正常场景**：Given 律所A有3名邀约员共完成90条邀约、2名谈案员共签约30万元，When 调用 `GET /api/dashboard/sales-performance?org_id=A`，Then `invite_team.avg_capacity=30`、`negotiate_team.signed_amount=300000`、`avg_performance=150000`。
- **边界场景**：Given 律所A所选时间范围内邀约岗人数为0，When 调用接口，Then `avg_capacity=0`，不抛出除零异常。
- **异常场景**：Given dimension 参数传 `abc`，When 调用 `GET /api/dashboard/sales-ranking?dimension=abc`，Then 返回 `code:400, message:"dimension 参数取值必须为 individual 或 team"`。

---

#### 8.3 办案效能分析看板

#### **1. 功能描述**

统计办案团队的效率与案件情况，包括案件总量、在办数、结案数、平均办案周期、节点超时率，并按律师/案由/团队维度统计人均产能，展示案件类型分布与结案趋势。

#### **2. 用户故事**

- 作为办案主管，我希望查看每位律师的结案率与平均办案周期，以便识别效率瓶颈并优化资源配置。
- 作为律所管理者，我希望查看案件类型分布与结案趋势，以便预判产能并调整案源结构。

#### **3. 业务规则**

1. **总体指标**：`total_cases`(案件总量)、`processing_cases`(在办数，`status != 'closed'`)、`closed_cases`(结案数)、`avg_cycle_days`(平均办案周期，已结案案件的 `JULIANDAY(updated_at) - JULIANDAY(created_at)` 平均值)、`timeout_rate`(节点超时率，`case_tasks.status='overdue'` 占比)。
2. **律师维度统计**：按 `cases.assignee_lawyer_id` 分组，统计 `processing_count`、`closed_count`、`close_rate`，关联 `users.real_name`。
3. **案由分布**：按 `cases.case_type` 分组统计数量，返回 `[{case_type, count}]`。
4. **结案趋势**：按月份聚合已结案案件数，使用 `strftime('%Y-%m', case.updated_at)` 分组，按月份升序。
5. **时间筛选**：按 `cases.created_at` 过滤，未传时间范围则统计全部数据。
6. **未分配律师案件排除**：律师维度统计时 `assignee_lawyer_id IS NULL` 的案件不计入个人绩效。

#### **4. 输入/输出规范**

**输入字段（GET `/api/dashboard/case-efficiency`）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| org_id | string(uuid) | 是 | 等于 JWT 律所ID |
| start_date | datetime | 否 | ISO 8601 |
| end_date | datetime | 否 | 须晚于 start_date |

**输出结果**：

```json
{
  "code": 0,
  "data": {
    "stats": {
      "total_cases": 200,
      "processing_cases": 120,
      "closed_cases": 80,
      "avg_cycle_days": 45.5,
      "timeout_rate": 12.50
    },
    "lawyer_stats": [
      {
        "lawyer_id": "user-001",
        "lawyer_name": "张律师",
        "processing_count": 15,
        "closed_count": 20,
        "avg_closed": 20,
        "avg_cycle_days": 40.0,
        "close_rate": 57.14
      }
    ],
    "case_type_distribution": [
      { "case_type": "marriage", "count": 60 },
      { "case_type": "traffic", "count": 50 }
    ],
    "close_trend": [
      { "month": "2026-06", "closed_count": 25 },
      { "month": "2026-07", "closed_count": 30 }
    ]
  }
}
```

#### **5. 数据模型**

复用既有实体，无新增表：

- **Case**（表名 `cases`）：案件主表
- **CaseTask**（表名 `case_tasks`）：案件任务，用于计算超时率
- **User**（表名 `users`）：律师信息

**关键字段对齐**：

| 字段名 | 类型 SQLite | 所属表 | 说明 |
|--------|-------------|--------|------|
| assignee_lawyer_id | varchar | cases | 承办律师ID |
| case_type | varchar | cases | 案由类型 |
| status | varchar | cases | 案件状态：pending_assign/processing/closed |
| status | varchar | case_tasks | 任务状态：overdue/... |
| created_at | datetime | cases | 创建时间 |
| updated_at | datetime | cases | 更新时间（结案时间） |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/dashboard/case-stats | 基础案件统计（旧版） | admin JWT |
| GET | /api/dashboard/case-efficiency | 办案效能分析（增强版） | admin JWT |
| GET | /api/dashboard/lawyer-performance | 律师绩效明细 | admin JWT |

**请求/响应示例（GET /api/dashboard/case-efficiency）**：

请求：
```
GET /api/dashboard/case-efficiency?org_id=org-001&start_date=2026-01-01T00:00:00Z&end_date=2026-07-31T23:59:59Z
```

成功响应：
```json
{
  "code": 0,
  "data": {
    "stats": {
      "total_cases": 150,
      "processing_cases": 90,
      "closed_cases": 60,
      "avg_cycle_days": 42.3,
      "timeout_rate": 8.50
    },
    "lawyer_stats": [
      {
        "lawyer_id": "user-001",
        "lawyer_name": "张律师",
        "processing_count": 10,
        "closed_count": 15,
        "close_rate": 60.00,
        "avg_cycle_days": 38.5
      }
    ],
    "case_type_distribution": [
      { "case_type": "marriage", "count": 50 },
      { "case_type": "traffic", "count": 40 }
    ],
    "close_trend": [
      { "month": "2026-06", "closed_count": 20 },
      { "month": "2026-07", "closed_count": 25 }
    ]
  }
}
```

失败响应（无权限）：
```json
{
  "code": 403,
  "message": "无权访问该律所数据"
}
```

#### **7. 交互流程**

1. 办案主管进入 `/dashboard/case-efficiency` 页面 → 前端 `GET /api/dashboard/case-efficiency?org_id&start_date&end_date`。
2. 前端展示四块内容：总体指标卡片、律师效能表格、案由分布饼图、结案趋势折线图。
3. 用户调整时间范围 → 重新拉取数据。
4. 后端构建 `cases` 查询 → 按状态统计总数 → `JULIANDAY` 计算平均周期 → JOIN `case_tasks` 计算超时率 → 按 `assignee_lawyer_id` 分组统计律师效能 → 按 `case_type` 分组统计分布 → 按 `strftime('%Y-%m', updated_at)` 分组统计趋势。
5. 用户点击某律师行 → 跳转 `/dashboard/lawyer-performance?lawyer_id=xxx` 查看该律师承办的详细案件列表。

#### **8. 异常场景**

1. **无已结案案件**：`avg_cycle_days=0`，前端展示"暂无已结案案件，无法计算平均周期"。
2. **无任何案件任务**：`totalTasks=0`，`timeout_rate=0`，前端展示"暂无任务数据"。
3. **跨律所访问**：JWT 中律所ID 与 query 不符，返回 `code:403, message:"无权访问该律所数据"`。
4. **时间范围超限**：超过2年时返回 `code:400, message:"时间范围不能超过2年"`。

#### **9. 验收标准**

- **正常场景**：Given 律所A有150个案件、60个已结案、平均周期42.3天，When 调用 `GET /api/dashboard/case-efficiency?org_id=A`，Then 返回 `stats.total_cases=150, avg_cycle_days=42.3`。
- **边界场景**：Given 律所A所有案件均未结案，When 调用接口，Then `closed_cases=0, avg_cycle_days=0`，不抛出除零异常。
- **异常场景**：Given 律师ID `user-001` 已离职（users表无记录），When 查询律师效能，Then 该律师行 `lawyer_name='未知'`，仍正常返回统计数据。

---

#### 8.4 财务经营数据看板

#### **1. 功能描述**

展示律所全维度经营财务数据，包括总营收、回款金额、应收账款、总成本、净利润，支持分案由/分团队/分月份统计营收与盈利，展示营收趋势与盈利结构分析。

#### **2. 用户故事**

- 作为律所财务负责人，我希望实时掌握总营收与净利润，以便评估经营健康度。
- 作为律所管理者，我希望查看分案由与分团队的盈利结构，以便识别高价值案源并优化资源分配。

#### **3. 业务规则**

1. **核心指标**：`total_revenue`(总营收) = SUM(`fees.amount`)；`paid_revenue`(回款金额) = SUM(`fees.amount` WHERE `paid=true`)；`pending_revenue`(应收账款) = 总营收 - 回款金额；`total_cost`(总成本) = 投放成本(`conversion_events.amount` WHERE `event_type='impression_cost'`) + 案件成本(SUM(`case_costs.amount`))；`net_profit`(净利润) = 总营收 - 总成本。
2. **分案由统计**：JOIN `cases` 取 `case_type`，分别从 `fees` 与 `case_costs` 聚合营收与成本，计算 `profit = revenue - cost`。
3. **分团队统计**：JOIN `cases` + `users` 按 `users.role` 分组聚合营收。
4. **分月份趋势**：使用 `strftime('%Y-%m', fees.created_at)` 分组聚合营收，按月份升序。
5. **盈利结构**：以分案由利润为基础，计算各案由利润占比 `profit_ratio = profit / total_profit × 100%`。
6. **时间筛选**：按 `fees.created_at` 与 `case_costs.created_at` 过滤，未传则统计全部。
7. **分母为零保护**：`total_profit=0` 时所有 `profit_ratio=0`，不抛异常。

#### **4. 输入/输出规范**

**输入字段（GET `/api/dashboard/finance-dashboard`）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| org_id | string(uuid) | 是 | 等于 JWT 律所ID |
| start_date | datetime | 否 | ISO 8601 |
| end_date | datetime | 否 | 须晚于 start_date |

**输出结果**：

```json
{
  "code": 0,
  "data": {
    "case_type_profit": [
      { "case_type": "marriage", "revenue": 300000.00, "cost": 100000.00, "profit": 200000.00 },
      { "case_type": "traffic", "revenue": 150000.00, "cost": 80000.00, "profit": 70000.00 }
    ],
    "team_profit": [
      { "team": "lawyer", "revenue": 350000.00 },
      { "team": "paralegal", "revenue": 100000.00 }
    ],
    "revenue_trend": [
      { "month": "2026-06", "revenue": 200000.00 },
      { "month": "2026-07", "revenue": 250000.00 }
    ],
    "profit_structure": [
      { "case_type": "marriage", "profit": 200000.00, "profit_ratio": 74.07 },
      { "case_type": "traffic", "profit": 70000.00, "profit_ratio": 25.93 }
    ]
  }
}
```

#### **5. 数据模型**

复用既有实体，无新增表：

- **Fee**（表名 `fees`）：费用记录，营收来源
- **CaseCost**（表名 `case_costs`）：案件成本
- **ConversionEvent**（表名 `conversion_events`）：投放成本
- **Case**（表名 `cases`）：案件，提供 case_type 关联
- **User**（表名 `users`）：用户，提供 role 团队维度

**关键字段对齐**：

| 字段名 | 类型 SQLite | 所属表 | 说明 |
|--------|-------------|--------|------|
| amount | real | fees | 费用金额 |
| paid | boolean | fees | 是否已付款 |
| case_id | varchar | fees | 关联案件ID |
| amount | real | case_costs | 成本金额 |
| case_type | varchar | cases | 案由 |
| assignee_lawyer_id | varchar | cases | 承办律师ID |
| role | varchar | users | 用户角色（团队） |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/dashboard/revenue-stats | 基础营收统计（旧版） | admin JWT |
| GET | /api/dashboard/finance-dashboard | 财务经营看板（增强版） | admin JWT |
| GET | /api/dashboard/case-type-profit | 案由利润分析 | admin JWT |

**请求/响应示例（GET /api/dashboard/finance-dashboard）**：

请求：
```
GET /api/dashboard/finance-dashboard?org_id=org-001&start_date=2026-01-01T00:00:00Z&end_date=2026-07-31T23:59:59Z
```

成功响应：
```json
{
  "code": 0,
  "data": {
    "case_type_profit": [
      { "case_type": "marriage", "revenue": 300000.00, "cost": 100000.00, "profit": 200000.00 },
      { "case_type": "traffic", "revenue": 150000.00, "cost": 80000.00, "profit": 70000.00 }
    ],
    "team_profit": [
      { "team": "lawyer", "revenue": 350000.00 },
      { "team": "paralegal", "revenue": 100000.00 }
    ],
    "revenue_trend": [
      { "month": "2026-06", "revenue": 200000.00 },
      { "month": "2026-07", "revenue": 250000.00 }
    ],
    "profit_structure": [
      { "case_type": "marriage", "profit": 200000.00, "profit_ratio": 74.07 },
      { "case_type": "traffic", "profit": 70000.00, "profit_ratio": 25.93 }
    ]
  }
}
```

失败响应（无权限）：
```json
{
  "code": 403,
  "message": "无权访问该律所数据"
}
```

#### **7. 交互流程**

1. 财务负责人进入 `/dashboard/finance` 页面 → 前端 `GET /api/dashboard/finance-dashboard?org_id&start_date&end_date`。
2. 前端展示四块内容：营收指标卡片（总营收/回款/应收/成本/利润）、案由利润柱状图、团队营收饼图、营收趋势折线图、盈利结构堆叠图。
3. 用户调整时间范围 → 重新拉取数据。
4. 后端分别构建 `fees` + `cases` / `case_costs` + `cases` / `fees` + `cases` + `users` / `fees` 按月份分组 查询 → 聚合计算 → 返回。
5. 用户点击"导出报表" → 复用模块8.6生成Excel下载。

#### **8. 异常场景**

1. **无任何费用记录**：所有指标返回0，前端展示"暂无财务数据"空状态。
2. **跨律所访问**：返回 `code:403, message:"无权访问该律所数据"`。
3. **案件未关联律师**：`assignee_lawyer_id` 为空时，该部分营收不计入团队统计，归入 `team='unknown'`。
4. **时间范围跨度过大**：超过3年时返回 `code:400, message:"时间范围不能超过3年"`。

#### **9. 验收标准**

- **正常场景**：Given 律所A婚姻家事案件营收30万、成本10万，When 调用 `GET /api/dashboard/finance-dashboard?org_id=A`，Then `case_type_profit` 中婚姻家事 `profit=200000`。
- **边界场景**：Given 律所A总利润为0（所有案由亏损与盈利相抵），When 调用接口，Then 所有 `profit_ratio=0`，不抛出除零异常。
- **异常场景**：Given 管理员A属于律所A，When 调用接口传 `org_id=律所B`，Then 返回 `code:403, message:"无权访问该律所数据"`。

---

#### 8.5 合规风险监控看板

#### **1. 功能描述**

全局展示律所合规风险情况，按获客、谈案、办案、财务四个环节分类展示风险分布，高风险事项置顶展示并支持一键跳转处理，驱动合规风险闭环管理。

#### **2. 用户故事**

- 作为合规风控负责人，我希望实时查看全律所风险分布与高风险事项，以便优先处理紧急风险。
- 作为律所管理者，我希望一键跳转到具体风险处理页面，以便快速闭环风险事件。

#### **3. 业务规则**

1. **风险环节分类**：
   - 获客环节（acquisition）：`compliance_check_results.target_type='marketing_content'` 且 `check_result='reject'` 的数量
   - 谈案环节（sales）：`compliance_check_results.target_type='sales_compliance'` 且 `check_result='reject'` 的数量
   - 办案环节（case）：`case_warnings` 表中属于本律所案件的数量
   - 财务环节（finance）：`compliance_check_results.target_type='signing_compliance'` 且 `check_result='reject'` 的数量
2. **高风险事项来源**：合并 `case_warnings`（案件预警）与 `complaint_tickets`（投诉工单 `severity_level IN ('high','critical')`），按风险等级排序后取前10条置顶展示。
3. **风险等级排序规则**：`levelOrder = { urgent:1, critical:1, warning:2, high:2, reminder:3, medium:3, low:3 }`，未识别等级按4处理。
4. **核心指标**（来自 `getRiskStats`）：违规预警总数、整改完成率、客诉率、超期案件数、高风险/中风险/低风险案件数。
5. **数据权限**：所有查询须 `cases.organization_id` 或 `complaint_tickets.organization_id = 当前律所ID`。
6. **一键跳转**：高风险事项返回 `id` 与 `source`（case_warning/complaint），前端据此跳转至对应处理页面。

#### **4. 输入/输出规范**

**输入字段（GET `/api/dashboard/compliance-risk-dashboard`）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| org_id | string(uuid) | 是 | 等于 JWT 律所ID |

**输出结果**：

```json
{
  "code": 0,
  "data": {
    "risk_distribution": {
      "acquisition": 5,
      "sales": 3,
      "case": 12,
      "finance": 2
    },
    "high_risk_items": [
      {
        "id": "warning-uuid-001",
        "source": "case_warning",
        "type": "deadline_warning",
        "level": "urgent",
        "description": "案件将于明日超期，请立即处理",
        "status": "pending",
        "date": "2026-07-25T10:00:00.000Z",
        "case_no": "CASE20260725001",
        "handler": "张律师"
      },
      {
        "id": "ticket-uuid-001",
        "source": "complaint",
        "type": "low_score_rating",
        "level": "high",
        "description": "低分评价客诉预警-评分1星",
        "status": "pending",
        "date": "2026-07-24T15:00:00.000Z",
        "case_no": null,
        "handler": null
      }
    ]
  }
}
```

#### **5. 数据模型**

复用既有实体，无新增表：

- **ComplianceCheckResult**（表名 `compliance_check_results`）：合规检查结果
- **CaseWarning**（表名 `case_warnings`）：案件预警
- **ComplaintTicket**（表名 `complaint_tickets`）：投诉工单
- **Case**（表名 `cases`）：案件，提供 organization_id 关联

**关键字段对齐**：

| 字段名 | 类型 SQLite | 所属表 | 说明 |
|--------|-------------|--------|------|
| target_type | varchar | compliance_check_results | 检查目标类型：marketing_content/sales_compliance/signing_compliance |
| check_result | varchar | compliance_check_results | 检查结果：pass/warning/reject |
| warning_type | varchar | case_warnings | 预警类型 |
| warning_level | varchar | case_warnings | 预警等级：urgent/warning/reminder |
| warning_date | datetime | case_warnings | 预警日期 |
| case_id | varchar | case_warnings | 关联案件ID |
| handler_id | varchar | case_warnings | 处理人ID |
| complaint_type | varchar | complaint_tickets | 投诉类型 |
| severity_level | varchar | complaint_tickets | 严重等级：low/medium/high/critical |
| organization_id | varchar | complaint_tickets | 律所ID |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/dashboard/risk-alerts | 风险预警概览（旧版） | admin JWT |
| GET | /api/dashboard/risk-stats | 风险统计指标 | admin JWT |
| GET | /api/dashboard/compliance-stats | 合规检查统计 | admin JWT |
| GET | /api/dashboard/compliance-risk-dashboard | 合规风险大盘（增强版） | admin JWT |

**请求/响应示例（GET /api/dashboard/compliance-risk-dashboard）**：

请求：
```
GET /api/dashboard/compliance-risk-dashboard?org_id=org-001
```

成功响应：
```json
{
  "code": 0,
  "data": {
    "risk_distribution": {
      "acquisition": 5,
      "sales": 3,
      "case": 12,
      "finance": 2
    },
    "high_risk_items": [
      {
        "id": "warning-uuid-001",
        "source": "case_warning",
        "type": "deadline_warning",
        "level": "urgent",
        "description": "案件将于明日超期",
        "status": "pending",
        "date": "2026-07-25T10:00:00.000Z",
        "case_no": "CASE20260725001",
        "handler": "张律师"
      }
    ]
  }
}
```

失败响应（无权限）：
```json
{
  "code": 403,
  "message": "无权访问该律所数据"
}
```

#### **7. 交互流程**

1. 合规风控负责人进入 `/dashboard/compliance-risk` 页面 → 前端并行调用 `GET /api/dashboard/compliance-risk-dashboard` 与 `GET /api/dashboard/risk-stats`。
2. 前端展示：四环节风险分布雷达图、核心指标卡片（违规总数/整改率/客诉率/超期案件数）、高风险事项置顶列表（前10条）。
3. 后端构建四个环节的 `compliance_check_results` / `case_warnings` 查询 → 聚合统计 → 合并 `case_warnings` + `complaint_tickets` 按 `levelOrder` 排序取前10。
4. 用户点击某条高风险事项 → 根据 `source` 跳转：`case_warning` → `/case/warnings/:id`；`complaint` → `/compliance/tickets/:id`。
5. 用户在处理页面完成风险闭环 → 状态变为 `resolved` → 重新刷新看板数据。

#### **8. 异常场景**

1. **无任何风险数据**：`risk_distribution` 各项为0，`high_risk_items` 为空数组，前端展示"当前无风险事项"空状态。
2. **跨律所访问**：返回 `code:403, message:"无权访问该律所数据"`。
3. **风险等级字段缺失**：`warning_level` 或 `severity_level` 为空时，按 `levelOrder=4` 排在末尾，不阻断流程。
4. **case_no 拉取失败**：`case_warnings` 对应案件被删除时，`case_no=null`，前端展示"案件已归档"。

#### **9. 验收标准**

- **正常场景**：Given 律所A有2条 urgent 案件预警、3条 high 投诉工单，When 调用 `GET /api/dashboard/compliance-risk-dashboard?org_id=A`，Then `high_risk_items` 前2条 `level=urgent`，后3条 `level=high`。
- **边界场景**：Given 律所A无任何风险事项，When 调用接口，Then `risk_distribution` 各项为0，`high_risk_items=[]`，不抛异常。
- **异常场景**：Given 管理员A属于律所A，When 调用接口传 `org_id=律所B`，Then 返回 `code:403, message:"无权访问该律所数据"`。

---

#### 8.6 自定义报表导出

#### **1. 功能描述**

支持用户自定义维度、指标、时间范围生成报表，可导出 Excel/PDF 格式文件，导出日志全量留存；支持固定报表订阅，按 daily/weekly/monthly 频率定时推送至指定人员。

#### **2. 用户故事**

- 作为律所运营人员，我希望按自定义维度组合生成报表，以便满足不同管理场景的数据需求。
- 作为律所管理者，我希望订阅核心经营报表并每日定时收到，以便无需登录即可掌握经营动态。

#### **3. 业务规则**

1. **维度可选值**：`channel`(渠道)、`case_type`(案由)、`lawyer`(律师)、`team`(团队)、`month`(月份)，支持多选组合。
2. **指标可选值**：`case_count`(案件数)、`revenue`(营收)、`cost`(成本)、`profit`(利润，自动计算 = revenue - cost)。
3. **时间范围**：支持 `7d`(近7天)、`30d`(近30天)、`90d`(近90天)、`custom`(自定义起止时间)，默认 `30d`。
4. **报表模板CRUD**：用户可创建/查询/更新/删除模板，模板存储 `dimensions`/`metrics` 为 JSON 字符串。
5. **导出格式**：Excel 使用 `exceljs` 生成 `.xlsx` 文件；PDF 暂生成 HTML 文件供前端打印；文件存放于 `process.cwd()/exports` 目录。
6. **导出日志**：每次导出写入 `report_export_logs` 表，记录 `template_id`、`exporter_id`、`export_format`、`file_path`、`file_size`、`filters`、`organization_id`。
7. **订阅频率**：`daily`(每日)/`weekly`(每周一)/`monthly`(每月1日)，定时任务 `EVERY_DAY_AT_9AM` 自动执行并生成 Excel 推送。
8. **模板名称唯一性**：同一 `organization_id` 下模板名称不可重复（业务约束，前端校验）。
9. **数据权限**：所有模板与日志查询须 `organization_id = 当前律所ID`，跨律所不可见。

#### **4. 输入/输出规范**

**输入字段（POST `/api/dashboard/report-templates` 创建模板）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| name | string | 是 | 长度 1-50，律所内唯一 |
| description | string | 否 | 长度 ≤ 200 |
| dimensions | string[] | 是 | 取值范围：channel/case_type/lawyer/team/month |
| metrics | string[] | 是 | 取值范围：case_count/revenue/cost/profit |
| time_range | string | 否 | 取值：7d/30d/90d/custom，默认30d |
| custom_start_date | datetime | 否 | time_range=custom 时必填 |
| custom_end_date | datetime | 否 | time_range=custom 时必填，须晚于 custom_start_date |
| created_by | string(uuid) | 是 | 创建人ID |
| organization_id | string(uuid) | 是 | 律所ID |

**输入字段（POST `/api/dashboard/reports/export-excel` 导出）**：

| 字段名 | 类型 | 必填 | 校验规则 |
|--------|------|------|----------|
| template_id | string(uuid) | 是 | 模板须存在 |
| filters | object | 否 | 覆盖模板默认筛选，含 start_date/end_date/channel/case_type |

**输出结果（导出 Excel）**：

```json
{
  "code": 0,
  "data": {
    "file_path": "/var/app/exports/report_tpl-001_1753437600.xlsx",
    "file_size": 24576
  }
}
```

#### **5. 数据模型**

**Entity：ReportTemplate（表名 report_templates）**

| 字段名 | 类型 SQLite | 约束 | 说明 |
|--------|-------------|------|------|
| id | varchar(uuid) | PK | 模板ID |
| name | varchar | not null | 模板名称 |
| description | text | nullable | 模板描述 |
| dimensions | text | not null | 维度配置（JSON 字符串） |
| metrics | text | not null | 指标配置（JSON 字符串） |
| time_range | varchar | default '30d' | 时间范围：7d/30d/90d/custom |
| custom_start_date | datetime | nullable | 自定义开始时间 |
| custom_end_date | datetime | nullable | 自定义结束时间 |
| subscriber_ids | text | nullable | 订阅人ID数组（JSON 字符串） |
| subscription_frequency | varchar | nullable | 订阅频率：daily/weekly/monthly |
| created_by | varchar | not null, FK→users.id | 创建人ID |
| organization_id | varchar | not null, FK→organizations.id | 律所ID |
| created_at | datetime | auto | 创建时间 |
| updated_at | datetime | auto | 更新时间 |

**Entity：ReportExportLog（表名 report_export_logs）**

| 字段名 | 类型 SQLite | 约束 | 说明 |
|--------|-------------|------|------|
| id | varchar(uuid) | PK | 日志ID |
| template_id | varchar | nullable, FK→report_templates.id | 关联模板ID |
| exporter_id | varchar | not null, FK→users.id | 导出人ID |
| export_format | varchar | not null | 导出格式：excel/pdf |
| file_path | varchar | not null | 文件路径 |
| file_size | integer | nullable | 文件大小（字节） |
| filters | text | nullable | 筛选条件（JSON 字符串） |
| organization_id | varchar | not null, FK→organizations.id | 律所ID |
| created_at | datetime | auto | 创建时间 |

#### **6. API接口规范**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/dashboard/report-templates | 创建报表模板 | admin JWT |
| GET | /api/dashboard/report-templates | 查询模板列表 | admin JWT |
| PUT | /api/dashboard/report-templates/:id | 更新模板 | admin JWT |
| DELETE | /api/dashboard/report-templates/:id | 删除模板 | admin JWT |
| POST | /api/dashboard/reports/generate | 生成报表数据（不导出） | admin JWT |
| POST | /api/dashboard/reports/export-excel | 导出 Excel | admin JWT |
| POST | /api/dashboard/reports/export-pdf | 导出 PDF | admin JWT |
| GET | /api/dashboard/export-logs | 查询导出日志 | admin JWT |
| POST | /api/dashboard/report-templates/:id/subscribe | 订阅报表 | admin JWT |

**请求/响应示例（POST /api/dashboard/reports/export-excel）**：

请求：
```json
{
  "template_id": "tpl-uuid-001",
  "filters": {
    "start_date": "2026-07-01T00:00:00.000Z",
    "end_date": "2026-07-31T23:59:59.000Z"
  }
}
```

成功响应：
```json
{
  "code": 0,
  "data": {
    "file_path": "/var/app/exports/report_tpl-uuid-001_1753437600.xlsx",
    "file_size": 24576
  }
}
```

失败响应（模板不存在）：
```json
{
  "code": 404,
  "message": "报表模板不存在"
}
```

#### **7. 交互流程**

1. **创建模板**：用户进入 `/dashboard/reports` → 点击"新建报表模板" → 选择维度+指标+时间范围 → `POST /api/dashboard/report-templates` → 后端将 dimensions/metrics JSON 序列化后写入 `report_templates` 表 → 返回模板ID。
2. **生成预览**：用户点击"预览数据" → `POST /api/dashboard/reports/generate` → 后端解析模板配置 → 动态构建 `cases` + `fees` + `case_costs` + `leads` + `users` 联表查询 → 按维度 GroupBy → 返回结果数据 → 前端表格展示。
3. **导出 Excel**：用户点击"导出 Excel" → `POST /api/dashboard/reports/export-excel` → 后端调用 `generateReport` 拿数据 → 使用 `exceljs` 生成 `.xlsx` → 写入 `exports/` 目录 → 写入 `report_export_logs` 日志 → 返回 `file_path` 与 `file_size` → 前端触发下载。
4. **导出 PDF**：用户点击"导出 PDF" → `POST /api/dashboard/reports/export-pdf` → 后端生成 HTML 文件 → 返回路径 → 前端打开新窗口供用户浏览器打印另存为 PDF。
5. **订阅报表**：用户在模板详情页选择订阅人 + 频率 → `POST /api/dashboard/report-templates/:id/subscribe` → 后端更新 `subscriber_ids` 与 `subscription_frequency` → 定时任务 `EVERY_DAY_AT_9AM` 按频率自动生成 Excel 并推送。
6. **查看日志**：用户进入"导出日志" → `GET /api/dashboard/export-logs?org_id&page&limit` → 返回分页日志列表。

#### **8. 异常场景**

1. **模板不存在**：`generateReport` / `exportReportToExcel` / `exportReportToPdf` 查询 `report_templates` 为空，抛出 `报表模板不存在`，返回 `code:404`。
2. **导出目录创建失败**：`fs.mkdirSync(exportsDir, { recursive: true })` 失败（权限问题），返回 `code:500, message:"导出目录创建失败，请联系管理员"`，记录错误日志。
3. **Excel 写入失败**：`workbook.xlsx.writeFile` 失败（磁盘满），返回 `code:500, message:"文件写入失败，请稍后重试"`，不写入日志。
4. **维度与指标均为空**：模板 `dimensions=[]` 且 `metrics=[]`，返回 `code:400, message:"至少选择一个维度和一个指标"`。
5. **订阅人ID无效**：`subscriber_ids` 中包含不存在的 `user_id`，定时任务跳过该订阅人并记录日志，不影响其他订阅人推送。
6. **自定义时间范围非法**：`time_range=custom` 但 `custom_start_date` 或 `custom_end_date` 为空，返回 `code:400, message:"自定义时间范围须填写起止时间"`。

#### **9. 验收标准**

- **正常场景**：Given 用户A创建模板T（维度=[case_type]，指标=[revenue,cost,profit]），When 调用 `POST /api/dashboard/reports/export-excel` 传 `template_id=T`，Then `exports/` 目录新增 `.xlsx` 文件，`report_export_logs` 新增一条记录，返回 `file_path` 与 `file_size`。
- **边界场景**：Given 模板T的筛选条件下无任何案件数据，When 调用 `POST /api/dashboard/reports/generate`，Then 返回 `data: []`，导出 Excel 时仅含表头无数据行。
- **异常场景**：Given 模板T已被删除，When 调用 `POST /api/dashboard/reports/export-excel` 传 `template_id=T`，Then 返回 `code:404, message:"报表模板不存在"`，且不写入 `report_export_logs` 表。

## 第5章 非功能性需求

### 5.1 性能需求

本平台面向网推律所的高频在线业务场景（线索录入、案件办理、财务收款、客户沟通），需在 500 并发下保证稳定响应。性能指标按"接口层—前端层—存储层—业务层"四维度量化，每项指标配套可执行的测试方法，作为上线前的验收门槛与上线后的监控基线。

| 指标项 | 量化值 | 测试方法 |
|--------|--------|----------|
| API 响应时间 P99 | ≤ 500ms | 使用 Apache JMeter 或 k6，按 500 并发持续压测 10 分钟，统计所有非文件类接口 P99 响应时间；采样自 `/api/leads`、`/api/cases`、`/api/receivables` 等 20 个高频接口 |
| API 响应时间 P95 | ≤ 300ms | 同上压测任务中统计 P95 分位值；针对列表查询接口需包含分页参数 `?page=1&pageSize=20` |
| 并发用户数 | ≥ 500 在线用户 | 模拟 500 用户同时在线（每秒发起 1 次请求），CPU 占用 ≤ 70%、内存增长 ≤ 30%，无 5xx 错误 |
| 页面首屏加载时间 | ≤ 2s | 使用 Lighthouse 在 4G 网络模拟下测试 PC 端工作台首页与移动端 H5 案件详情页，首屏 FCP ≤ 1.2s、LCP ≤ 2s |
| 数据库查询响应时间 | ≤ 200ms | 在 SQLite 单库 10 万条案件 + 100 万条线索数据量下，对核心查询 SQL 开启 `PRAGMA timer`，统计复杂 JOIN + 分页查询耗时；PostgreSQL 迁移后保持同等量级 |
| 文件上传大小 | ≤ 10MB/文件 | 上传图片（jpg/png）、PDF、Word、Excel 各类型 10MB 文件，超时 30s 内完成；超过 10MB 返回 `9002 文件超过大小限制` |
| 报表生成时间 | ≤ 10s | 触发 Dashboard 模块月度营收报表、案件漏斗报表、投放 ROI 报表，从点击导出到文件下载完成 ≤ 10s；超大数据量（≥ 5 万行）异步生成，5 分钟内可下载 |
| WebSocket 消息推送延迟 | ≤ 1s | 案件状态变更、任务指派、客户消息推送场景，从服务端事件触发到客户端 UI 更新 ≤ 1s |
| 静态资源加载 | ≤ 1.5s | 主 JS Bundle ≤ 500KB（gzip 后），首屏关键 CSS 内联，图片懒加载 + WebP 格式 |

### 5.2 安全需求

法律业务涉及当事人隐私、案件证据、财务数据，安全等级要求达到等保 2.0 三级标准。安全需求覆盖"认证—加密—传输—存储—审计—运维"全链路。

#### 5.2.1 身份认证与授权

| 安全项 | 规范要求 | 实现方式 |
|--------|----------|----------|
| JWT 有效期 | 24 小时 | 登录成功后 `JwtService.sign({ sub, phone, role })` 签发，过期时间 `expiresIn: '24h'`；过期后返回 `401 1002 Token过期` |
| Token 刷新机制 | 滑动续期 + 7 天硬过期 | 客户端 `axios.ts` 在响应拦截器中检测响应头 `X-Token-Refreshed`，自动更新 localStorage 中的 token；token 签发满 7 天强制重新登录 |
| 密码加密 | bcrypt cost factor ≥ 10 | 注册/重置密码时使用 `bcrypt.hash(password, 10)` 存储；登录校验使用 `bcrypt.compare`；明文密码禁止入库、禁止日志输出 |
| 验证码机制 | 登录失败 5 次锁定 30 分钟 | 同一手机号 30 分钟内密码错误 5 次触发账号锁定，需短信验证码解锁 |
| 角色权限校验 | 中间件层强制校验 | `JwtAuthGuard` 全局守卫 + 角色装饰器 `@Roles('admin','lawyer','sales')` 校验；管理后台路由全部受保护 |
| 数据权限隔离 | 基于组织 + 角色 | 所有查询过滤 `req.user.organization_id`；跨律所访问返回 `3002 无权限`；律所内按角色限制可见案件范围（律师仅看自己承办案件） |

#### 5.2.2 数据加密与脱敏

| 安全项 | 规范要求 | 实现方式 |
|--------|----------|----------|
| 手机号脱敏 | `138****1234` | 前端展示统一使用脱敏组件；API 返回时根据调用方权限决定是否返回明文（管理后台可见后 4 位，客户端仅可见后 4 位） |
| 身份证脱敏 | `110***********1234` | 仅保留前 3 位 + 后 4 位，中间 11 位用 `*` 替代；存储采用 AES-256 加密，密钥由 KMS 管理 |
| 银行卡脱敏 | `6222****1234` | 前 4 位 + 后 4 位明文，中间用 `*` 替代；财务模块仅展示，不入库存明文 |
| 微信号脱敏 | `wx***123` | 前 2 位 + 后 3 位明文，中间用 `*` 替代 |
| 姓名脱敏 | `张*三` | 2 字姓名全脱敏为 `张*`；3 字及以上保留首尾，中间用 `*` 替代 |
| SQL 注入防护 | TypeORM 参数化查询 | 全部查询走 `Repository.find({ where })` 或 `QueryBuilder.setParameter()`，禁止字符串拼接 SQL；输入参数经 `ValidationPipe` 校验 |
| XSS 防护 | DOMPurify 净化 | 前端富文本内容（案件描述、跟进记录、合同模板）渲染前使用 `DOMPurify.sanitize()` 过滤；后端入库前使用 `sanitize-html` 二次过滤 |
| CSRF 防护 | SameSite Cookie + Token | JWT 走 Authorization Header 不走 Cookie；状态变更接口校验 `Origin` 与 `Referer` 头 |
| 敏感数据传输 | HTTPS 强制 | 全站 HSTS，TLS 1.2+；证书由腾讯云 SSL 托管，自动续期 |

#### 5.2.3 文件与操作安全

| 安全项 | 规范要求 | 实现方式 |
|--------|----------|----------|
| 文件上传 MIME 校验 | 白名单机制 | 仅允许 `image/jpeg`、`image/png`、`image/gif`、`application/pdf`、`application/msword`、`application/vnd.openxmlformats-*`、`application/vnd.ms-excel*`；通过文件头魔数校验，不仅依赖扩展名 |
| 文件上传大小限制 | 10MB | Nginx `client_max_body_size 10m` + 后端 `FileInterceptor` 双重限制 |
| 文件存储隔离 | 私有 + 临时签名 URL | 证据文件存储于腾讯云 COS 私有桶，访问走预签名 URL（5 分钟过期） |
| 敏感操作二次确认 | 关键操作弹窗确认 | 案件结案、财务确认收款、分润发放、用户删除、合同模板发布 5 类操作前端弹窗二次确认，后端要求 `confirm: true` 字段 |
| 审计日志 | 全量记录 | 所有写操作（POST/PUT/DELETE）通过 TypeORM Subscriber 写入 `audit_logs` 表，字段：`operator_id`、`organization_id`、`module`、`action`、`target_id`、`before_data`、`after_data`、`ip`、`user_agent`、`created_at`；保留期 ≥ 3 年 |

### 5.3 可用性需求

| 可用性指标 | 量化值 | 实现方式 |
|------------|--------|----------|
| SLA 可用率 | ≥ 99.5% | 年停机时间 ≤ 43.8 小时；统计口径：用户可访问且核心功能（登录、案件查看、收款）可用 |
| 数据备份策略 | 每日全量 + 实时 WAL | SQLite 启用 WAL 模式 `PRAGMA journal_mode=WAL`；每日凌晨 02:00 全量备份至腾讯云 COS 异地桶；WAL 文件每小时归档一次；备份保留 30 天 |
| RTO 恢复时间目标 | ≤ 4 小时 | 故障发生后 4 小时内恢复业务可用；含故障定位（30 分钟）+ 数据恢复（2 小时）+ 服务启动（30 分钟）+ 验证（1 小时） |
| RPO 数据丢失目标 | ≤ 1 小时 | 依赖 WAL 实时归档，最坏情况丢失 1 小时内的写入数据 |
| 故障切换 | 双机热备 + Nginx 健康检查 | 主备双 CVM 部署，Nginx upstream 配置 `max_fails=3 fail_timeout=30s`；主节点宕机 30 秒内切到备节点 |
| 灰度发布 | 按 5% → 20% → 100% | 新版本先在测试环境验证，生产环境按 5% 流量灰度 24 小时无异常 → 20% 48 小时 → 100% 全量 |
| 降级策略 | 核心可用、非核心降级 | 数据库故障时：只读模式 + 缓存兜底；AI 模块故障时：降级为人工 SOP；文件存储故障时：本地临时存储 + 异步重试 |
| 监控告警 | 5 分钟响应 | Prometheus + Grafana 监控 CPU/内存/磁盘/响应时间；告警通过企业微信/短信双通道，运维 5 分钟内响应 |

### 5.4 可扩展性需求

| 扩展性维度 | 量化值 | 实现方式 |
|------------|--------|----------|
| 律所规模 | 10-500 人/律所 | 单实例支持 50 家律所、累计 2.5 万用户；超出时按律所分库 |
| 案件容量 | ≥ 10 万条/律所 | SQLite 单表 100 万行无性能瓶颈；案件表按 `organization_id` + `created_at` 复合索引 |
| 线索容量 | ≥ 100 万条/律所 | 线索表按月分区（逻辑分区），历史数据 6 个月后归档至 `leads_archive` 表 |
| 用户总量 | ≥ 5 万并发用户 | NestJS 单实例支持 5000 并发，超出后通过 Nginx 负载均衡水平扩展 |
| 水平扩展 | 无状态可横向扩容 | 应用层无状态（会话走 JWT）；Nginx 负载均衡采用轮询策略；文件存储走 COS 不依赖本地磁盘 |
| 模块化架构 | 可插拔 | 13 个功能模块（Auth/User/Lead/Case/Compliance/Finance/Client/Dashboard/Marketing/SCRM/Ai/Seeds）通过 `@Module` 解耦，可独立启停；新增模块不影响存量功能 |
| 数据库可迁移 | SQLite → PostgreSQL | TypeORM ORM 层屏蔽方言差异；禁用 SQLite 特有语法（如 `PRAGMA`）；字段类型统一使用 `varchar`、`datetime`、`decimal`、`text`、`boolean`、`json`、`integer`；避免使用 `enum` 与 `timestamp`，状态字段统一 `varchar` + TS 枚举映射 |
| API 版本管理 | 向后兼容 2 个版本 | URL 可选版本前缀 `/api/v1/leads` 与默认 `/api/leads` 并存；废弃接口保留 6 个月过渡期 |

### 5.5 兼容性需求

| 兼容性维度 | 支持范围 | 实现方式 |
|------------|----------|----------|
| PC 端浏览器 | Chrome 90+、Edge 90+、Safari 14+、Firefox 88+ | 主流浏览器最近 2 个大版本；使用 Babel 转译 ES2020+ 语法；CSS 使用 PostCSS 自动补全前缀 |
| 移动端 H5 系统 | iOS 13+、Android 8+ | WebView 与系统浏览器双适配；触摸事件统一走 `@ant-design/mobile` 兼容层 |
| PC 端分辨率 | ≥ 1280×720 | 主工作台分辨率 1440×900 为基准设计，最低 1280×720 不出现横向滚动条；栅格采用 24 列响应式 |
| C 端 H5 分辨率 | 375×667 ~ 414×896 | 覆盖 iPhone SE ~ iPhone Pro Max 主流机型；rem 自适应 + 1px 边框优化 |
| 平板端 | iPad iOS 14+、Android 平板 | 适配 768px/1024px 断点，案件列表自动切换为双列 |
| 打印机友好 | A4 纵向 | 案件详情、合同模板、财务对账单、分润明细 4 类页面提供 `@media print` 样式；去除导航/侧边栏，保留核心内容；表格分页自动换行 |
| 第三方系统对接 | 飞书、企业微信、抖音 | 通过 OAuth 2.0 标准协议接入；Webhook 事件回调兼容主流 IM 平台消息格式 |

### 5.6 可维护性需求

| 维护性维度 | 规范要求 | 实现方式 |
|------------|----------|----------|
| 代码规范 | ESLint + Prettier | 前后端统一配置 `.eslintrc.json` + `.prettierrc`；提交前 Husky 钩子强制校验，校验失败禁止 commit |
| 代码风格 | TypeScript 严格模式 | `tsconfig.json` 启用 `strict: true`；禁止 `any`（除 `@Request() req: any` 框架例外）；函数入参与返回值必须显式类型 |
| 日志规范 | Winston 分级日志 | `error`/`warn`/`info`/`debug` 四级；error 写文件 + 推送告警；info 写文件按天滚动保留 30 天；生产环境默认 info 级别，调试时动态切换 debug |
| 日志格式 | JSON 结构化 | 字段：`timestamp`、`level`、`module`、`traceId`、`userId`、`orgId`、`message`、`stack`；接入 ELK 日志检索 |
| 监控告警 | Prometheus + Grafana | 采集指标：HTTP 请求 QPS、P99 响应时间、错误率、JVM 内存、数据库连接池；告警阈值：错误率 > 1%、P99 > 800ms、CPU > 80% 持续 5 分钟 |
| 链路追踪 | OpenTelemetry | 跨服务调用自动注入 `traceId`；案件状态变更全链路可追溯（线索 → 邀约 → 谈案 → 立案 → 办案 → 结案） |
| 文档同步机制 | PRD 与代码同步 | 每次需求变更同步更新 PRD（`/Users/season/AI编程/法律咨询/全链产品/.trae/specs/write-detailed-prd-v2/`）；API 文档由 Swagger 自动生成，与代码同源 |
| 版本管理 | Git Flow | `main` 生产、`develop` 集成、`feature/*` 功能、`hotfix/*` 紧急修复；PR 评审至少 1 人 approve；合并触发 CI |
| CI/CD 流水线 | GitHub Actions / 腾讯云 CODING | 流程：lint → test → build → docker build → push → deploy to CVM；流水线耗时 ≤ 10 分钟；失败回滚 ≤ 2 分钟 |
| 单元测试覆盖率 | 核心模块 ≥ 70% | Service 层强制单测；Controller 层集成测试覆盖核心接口；财务、合规模块覆盖率 ≥ 85% |
| 数据库迁移工具 | TypeORM Migration | 禁用生产环境 `synchronize: true`；DDL 变更走 `typeorm migration:generate` + `migration:run`；每次发版前执行迁移脚本 |
| 部署回滚 | 一键回滚 | Docker 镜像保留最近 5 个版本；回滚命令 `docker rollback <version>` 5 分钟内完成；数据库迁移需配套回滚 SQL |

---

## 第6章 数据规范

### 6.1 核心实体关系图

本平台共 13 个 NestJS 模块，包含 60+ 实体表。围绕"投放获客 → 线索管理 → 私域运营 → 邀约谈案 → 立案办案 → 财务分润 → 合规质检 → 客户服务"全链路，核心实体关系如下：

#### 6.1.1 组织与用户域

- **Organization（律所）1 : N User（用户）**：一个律所包含多个用户（管理员/律师/销售/谈案/财务）。
- **Organization 1 : N Lead（线索）**：律所下的所有线索。
- **Organization 1 : N Case（案件）**：律所下的所有案件。
- **User 1 : N Lead**：销售负责的线索（`assign_sales_id`）。
- **User 1 : N Case**：律师承办的案件（`assignee_lawyer_id`）。

#### 6.1.2 投放获客域（Marketing 模块）

- **Organization 1 : N AdAccount（投放账户）**：律所绑定的腾讯广告/巨量引擎/百度竞价账户。
- **AdAccount 1 : N AdPlan（投放计划）**：一个账户下多个计划。
- **AdPlan 1 : N AdMaterial（投放素材）**：一个计划下多个素材。
- **AdMaterial 1 : N SocialPost（社媒发布）**：素材与社媒内容关联。
- **Organization 1 : N ConversionEvent（转化事件）**：通过 `channel`/`account_id`/`plan_id`/`material_id` 多维度松耦合关联投放资产，记录线索→加微→邀约→签约四级转化。

#### 6.1.3 线索与邀约域（Lead 模块）

- **Lead 1 : N FollowUp（跟进记录）**：一条线索多次跟进。
- **Lead 1 : 1 Opportunity（谈案机会）**：线索进入谈案阶段转为 Opportunity。
- **Lead 1 : N InviteTask（邀约任务）**：线索可生成多次邀约任务。
- **Lead 1 : N HandoverLog（线索移交日志）**：销售之间移交记录。
- **Lead 1 : N LeadAssignmentLog（线索分配日志）**：分配记录。
- **Opportunity 1 : N OpportunityQuoteItem（报价项）**：谈案报价明细。
- **Opportunity 1 : N OpportunityStageLog（阶段日志）**：谈案阶段流转记录。

#### 6.1.4 私域运营域（SCRM 模块）

- **Client 1 : N ChatArchive（聊天归档）**：客户与员工的所有聊天消息归档。
- **Client 1 : N ReachTask（触达任务）**：客户的定期触达任务。
- **ClientTag N : M Client**：通过 `client_tag_relation` 中间表实现多对多标签关系。
- **LiveCode（活码）1 : N ChannelTracking（渠道追踪）**：活码下多渠道追踪。
- **ScriptLibrary（话术库）**：独立维护，按场景分类。

#### 6.1.5 案件办理域（Case 模块）

- **Case 1 : N CaseTask（案件任务）**：立案时按 SOP 模板生成 N 个任务。
- **Case 1 : N Evidence（证据）**：案件证据材料。
- **Evidence 1 : N Evidence（版本）**：通过 `parent_evidence_id` 自关联实现版本管理。
- **Case 1 : N Document（案件文档）**：法律文书、合同、起诉状等。
- **Case 1 : N CaseWarning（案件预警）**：超期、风险等级变更预警。
- **Case 1 : N CaseTaskComment（任务评论）**：任务执行评论。
- **CaseSOPTemplate（SOP 模板）1 : N CaseTask**：模板生成具体任务实例。

#### 6.1.6 财务管理域（Finance 模块）

- **Case 1 : 1 Receivable（应收账款）**：立案时创建应收记录。
- **Receivable 1 : N PaymentRecord（收款记录）**：分多次收款。
- **Case 1 : N Invoice（发票）**：案件对应多张发票。
- **Case 1 : N Fee（费用）**：案件支出成本（差旅、诉讼费等）。
- **Fee 1 : N Refund（退款）**：费用退款记录。
- **Case 1 : N CommissionRecord（分润记录）**：按 CommissionRule 计算的多角色分润。
- **CommissionRule 1 : N CommissionRecord**：分润规则生成具体分润记录。
- **Case 1 : N CaseCost（案件成本）**：成本归集。
- **Receivable 1 : N OverdueWarning（逾期预警）**：逾期催收提醒。

#### 6.1.7 合规质检域（Compliance 模块）

- **ComplianceRule（合规规则）1 : N ComplianceCheckResult（合规检查结果）**：规则触发检查结果。
- **ComplianceCheckResult** 多态关联 `target_type`（`marketing_content`/`sales_compliance`/`signing_compliance`）+ `target_id`。
- **MarketingContent（营销内容）1 : N ComplianceCheckResult**：投放物料合规检查。
- **SalesCompliance（销售合规）1 : N ComplianceCheckResult**：话术合规检查。
- **SigningCompliance（签约合规）1 : N ComplianceCheckResult**：合同合规检查。
- **Case 1 : N CaseComplianceCheck（案件合规检查）**：案件全程合规。
- **Case 1 : N CaseArchive（案件归档）**：结案归档。
- **Case 1 : N CasePersonnelChange（人员变更）**：律师变更、客户变更记录。
- **Complaint（投诉）1 : N ComplaintTicket（投诉工单）**：客户投诉处理工单。
- **RiskDisclosure（风险告知）1 : 1 Case**：案件风险告知书。
- **TalkQualityCheck（谈话质检）**：独立表，关联 ChatArchive。
- **ContractTemplate（合同模板）1 : N Case**：合同模板复用。
- **LawyerQualification（律师资质）1 : 1 User**：律师执业证信息。

#### 6.1.8 客户服务域（Client 模块）

- **Case 1 : N ClientConsultation（客户咨询）**：案件相关的客户咨询记录。
- **Case 1 : N ServiceRating（服务评价）**：客户满意度评分。
- **Case 1 : N CasePushNotification（案件推送通知）**：案件进度推送。

### 6.2 数据字典

按 8 大业务模块组织数据字典。每个核心实体列出字段名、类型、约束、默认值、说明。类型遵循 SQLite 兼容约束：统一使用 `varchar`/`datetime`/`decimal`/`text`/`boolean`/`json`/`integer`，避免 `enum`/`timestamp`。

#### 6.2.1 用户与组织模块

##### User（用户）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 用户ID（UUID v4） |
| real_name | varchar(64) | NOT NULL | - | 真实姓名 |
| phone | varchar(20) | UNIQUE, NOT NULL | - | 手机号（登录账号） |
| email | varchar(128) | NULL | NULL | 邮箱 |
| password | varchar(128) | NULL | NULL | bcrypt 加密后的密码 |
| role | varchar(32) | NOT NULL | - | 角色枚举：super_admin/org_admin/marketing/sales/lawyer/assistant/finance/client |
| credentials_no | varchar(64) | NULL | NULL | 律师执业证号 |
| avatar | varchar(255) | NULL | NULL | 头像URL |
| status | boolean | NOT NULL | true | 账号状态：true 启用 / false 禁用 |
| organization_id | varchar(36) | FK, NULL | NULL | 所属律所ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### Organization（律所）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 律所ID |
| name | varchar(128) | NOT NULL | - | 律所名称 |
| logo | varchar(255) | NULL | NULL | 律所Logo URL |
| domain | varchar(128) | NULL | NULL | 律所域名 |
| address | varchar(255) | NULL | NULL | 律所地址 |
| license_no | varchar(64) | NULL | NULL | 律所执业许可证号 |
| status | boolean | NOT NULL | true | 律所状态 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

#### 6.2.2 投放获客模块

##### ConversionEvent（转化事件）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 事件ID |
| channel | varchar(32) | NOT NULL | - | 投放渠道：douyin/baidu/kuaishou/wechat/other |
| account_id | varchar(64) | NULL | NULL | 投放账户ID（松耦合） |
| plan_id | varchar(64) | NULL | NULL | 投放计划ID（松耦合） |
| material_id | varchar(64) | NULL | NULL | 投放素材ID |
| event_type | varchar(32) | NOT NULL | - | 事件类型：lead/wechat_add/invite/sign |
| amount | decimal(12,2) | NOT NULL | 0 | 回款金额（仅 sign 事件） |
| keyword | varchar(128) | NULL | NULL | 触发关键词 |
| client_id | varchar(36) | NULL | NULL | 关联客户ID |
| lead_id | varchar(36) | NULL | NULL | 关联线索ID |
| case_id | varchar(36) | NULL | NULL | 关联案件ID（仅 sign 事件） |
| organization_id | varchar(36) | NOT NULL | - | 所属律所ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 事件创建时间 |

##### AdPlan（投放计划）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 计划ID |
| account_id | varchar(36) | FK, NOT NULL | - | 所属投放账户ID |
| plan_name | varchar(128) | NOT NULL | - | 计划名称 |
| case_type | varchar(20) | NOT NULL | - | 案由：marriage/traffic/labor/debt/other |
| budget | decimal(12,2) | NOT NULL | 0 | 日预算（元） |
| bid | decimal(12,2) | NOT NULL | 0 | 出价（元） |
| status | varchar(20) | NOT NULL | 'paused' | 状态：running/paused/ended |
| platform_plan_id | varchar(128) | NULL | NULL | 平台返回的计划ID |
| start_date | date | NULL | NULL | 投放开始日期 |
| end_date | date | NULL | NULL | 投放结束日期 |
| organization_id | varchar(36) | NOT NULL | - | 所属律所ID |
| creator_id | varchar(36) | NULL | NULL | 创建人ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

#### 6.2.2补充 投放获客模块（补充实体）

##### AdAccount（广告账户）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 账户ID |
| platform | varchar(20) | NOT NULL | - | 投放平台：douyin/baidu/tencent/kuaishou |
| account_name | varchar(64) | NOT NULL | - | 账户名称 |
| account_id | varchar(128) | NOT NULL | - | 平台账户ID |
| group_name | varchar(32) | NULL | NULL | 分组名称 |
| balance | decimal(12,2) | NOT NULL | 0 | 账户余额（元） |
| threshold | decimal(12,2) | NOT NULL | 0 | 余额预警阈值（元） |
| status | varchar(20) | NOT NULL | 'active' | 状态：active/disabled/unauthorized |
| auth_token | text | NULL | NULL | 授权令牌JSON |
| authorized_at | datetime | NULL | NULL | 授权时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| creator_id | varchar(36) | NULL | NULL | 创建人ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### AdMaterial（投放素材）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 素材ID |
| name | varchar(128) | NOT NULL | - | 素材名称 |
| type | varchar(20) | NOT NULL | - | 素材类型：image/video/article/script |
| tags | json | NULL | NULL | 标签数组 |
| file_path | varchar(255) | NULL | NULL | 文件路径 |
| account_id | varchar(36) | NULL | NULL | 关联广告账户ID |
| plan_id | varchar(36) | NULL | NULL | 关联投放计划ID |
| channel | varchar(32) | NULL | NULL | 投放渠道 |
| impressions | integer | NOT NULL | 0 | 曝光量 |
| clicks | integer | NOT NULL | 0 | 点击量 |
| conversions | integer | NOT NULL | 0 | 转化数 |
| cost | decimal(12,2) | NOT NULL | 0 | 消耗金额（元） |
| roi | decimal(10,2) | NOT NULL | 0 | ROI |
| status | varchar(20) | NOT NULL | 'draft' | 状态：draft/active/paused/archived |
| compliance_status | varchar(20) | NOT NULL | 'pending' | 合规状态：pending/passed/need_modification/forbidden |
| compliance_detail | text | NULL | NULL | 合规预审详情 |
| compliance_checked_at | datetime | NULL | NULL | 合规预审时间 |
| content_text | text | NULL | NULL | 内容文本 |
| case_type | varchar(20) | NULL | NULL | 案由类型 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| uploaded_by_id | varchar(36) | NOT NULL | - | 上传人ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### ContentTemplate（内容模板）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 模板ID |
| case_type | varchar(20) | NOT NULL | - | 案由类型 |
| content_type | varchar(32) | NOT NULL | - | 内容类型：video_script/copywriting/live_script/article |
| title | varchar(128) | NOT NULL | - | 模板标题 |
| content | text | NOT NULL | - | 模板内容 |
| version | integer | NOT NULL | 1 | 版本号 |
| is_active | boolean | NOT NULL | true | 是否启用 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### AdAccountWarning（账户预警）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 预警ID |
| account_id | varchar(36) | NOT NULL | - | 关联广告账户ID |
| platform | varchar(20) | NOT NULL | - | 平台 |
| account_name | varchar(64) | NOT NULL | - | 账户名称 |
| balance | decimal(12,2) | NOT NULL | - | 当前余额快照 |
| threshold | decimal(12,2) | NOT NULL | - | 预警阈值 |
| status | varchar(20) | NOT NULL | 'pending' | 状态：pending/notified/resolved |
| remarks | text | NULL | NULL | 处理备注 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### AdPlanLog（计划操作日志）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 日志ID |
| plan_id | varchar(36) | NOT NULL | - | 关联投放计划ID |
| operator_id | varchar(36) | NOT NULL | - | 操作人ID |
| operation_type | varchar(32) | NOT NULL | - | 操作类型：create/update/delete/start/pause/end/budget_adjust/bid_adjust/copy/migrate |
| operation_detail | text | NULL | NULL | 操作详情JSON |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 操作时间 |

##### DigitalHumanLive（数字人直播）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 直播ID |
| title | varchar(128) | NOT NULL | - | 直播标题 |
| anchor_name | varchar(64) | NOT NULL | - | 主播姓名 |
| script_content | text | NULL | NULL | 话术脚本 |
| cover_url | varchar(255) | NULL | NULL | 封面图URL |
| live_url | varchar(255) | NULL | NULL | 直播间URL |
| status | varchar(20) | NOT NULL | 'draft' | 状态：draft/live/ended/scheduled |
| scheduled_start | datetime | NULL | NULL | 预定开播时间 |
| actual_start | datetime | NULL | NULL | 实际开播时间 |
| actual_end | datetime | NULL | NULL | 实际结束时间 |
| duration | integer | NULL | NULL | 直播时长（分钟） |
| viewer_count | integer | NOT NULL | 0 | 观看人数 |
| like_count | integer | NOT NULL | 0 | 点赞数 |
| conversion_count | integer | NOT NULL | 0 | 转化数 |
| case_type | varchar(20) | NULL | NULL | 案由类型 |
| brand_id | varchar(36) | NULL | NULL | 品牌ID |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_by | varchar(36) | NULL | NULL | 创建人ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### MarketingMaterial（营销素材库）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 素材ID |
| name | varchar(128) | NOT NULL | - | 素材名称 |
| file_path | varchar(255) | NOT NULL | - | 文件路径 |
| file_type | varchar(32) | NULL | NULL | 文件类型 |
| size | integer | NULL | NULL | 文件大小（字节） |
| tags | varchar(255) | NULL | NULL | 标签 |
| platform | varchar(32) | NULL | NULL | 适用平台 |
| is_ai_generated | boolean | NOT NULL | false | 是否AI生成 |
| compliance_checked | boolean | NOT NULL | false | 是否已合规检查 |
| compliance_result | varchar(255) | NULL | NULL | 合规检查结果 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| uploaded_by_id | varchar(36) | NOT NULL | - | 上传人ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

#### 6.2.3 线索与邀约模块

##### Lead（线索）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 线索ID |
| source_channel | varchar(32) | NOT NULL | - | 来源渠道：douyin/baidu/kuaishou/wechat/other |
| source_keyword | varchar(128) | NULL | NULL | 投放关键词 |
| case_type | varchar(32) | NULL | NULL | 案件类型：marriage/traffic/labor/debt/other |
| status | varchar(32) | NOT NULL | 'new' | 状态：new/pending_follow/following/inviting/negotiating/pending_sign/lost |
| assign_sales_id | varchar(36) | FK, NULL | NULL | 分配邀约岗ID |
| phone | varchar(20) | NOT NULL | - | 联系电话 |
| contact_name | varchar(64) | NULL | NULL | 联系人姓名 |
| case_description | text | NULL | NULL | 案情描述 |
| landing_page | varchar(255) | NULL | NULL | 落地页URL |
| service_fee | decimal(12,2) | NULL | NULL | 期望服务费 |
| organization_id | varchar(36) | NOT NULL | - | 所属律所ID |
| follow_up_time | datetime | NULL | NULL | 下次跟进时间 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### Opportunity（谈案机会）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 谈案机会ID |
| lead_id | varchar(36) | FK, NOT NULL | - | 来源线索ID |
| negotiator_id | varchar(36) | FK, NOT NULL | - | 谈案人ID |
| stage | varchar(32) | NOT NULL | 'first_contact' | 后端存储阶段：first_contact/signed/lost（前端UI展示扩展为6阶段用于状态机展示） |
| quote_amount | decimal(12,2) | NULL | NULL | 报价金额 |
| actual_amount | decimal(12,2) | NULL | NULL | 成交金额 |
| status | varchar(16) | NOT NULL | 'active' | 状态：active/completed |
| requirement_note | text | NULL | NULL | 需求说明 |
| plan_note | text | NULL | NULL | 方案说明 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

#### 6.2.3补充 线索模块（补充实体）

##### FollowUp（跟进记录）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 记录ID |
| lead_id | varchar(36) | NOT NULL | - | 线索ID |
| creator_id | varchar(36) | NOT NULL | - | 创建人ID |
| content | text | NOT NULL | - | 跟进内容 |
| type | varchar(20) | NOT NULL | 'other' | 跟进方式：call/wechat/visit/other |
| next_follow_time | datetime | NULL | NULL | 下次跟进时间 |
| result | varchar(50) | NULL | NULL | 跟进结果：connected/not_connected/answered/no_answer |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### HandoverLog（交接记录）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 记录ID |
| lead_id | varchar(36) | NOT NULL | - | 线索ID |
| from_user_id | varchar(36) | NOT NULL | - | 原负责人ID |
| to_user_id | varchar(36) | NOT NULL | - | 新负责人ID |
| reason | varchar(20) | NOT NULL | 'other' | 交接原因：self/manager/auto_recycle/other |
| remark | text | NULL | NULL | 交接备注 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### InviteTask（邀约任务）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 任务ID |
| lead_id | varchar(36) | NOT NULL | - | 线索ID |
| sales_id | varchar(36) | NOT NULL | - | 邀约岗ID |
| negotiator_id | varchar(36) | NULL | NULL | 谈案岗ID（分配后） |
| status | varchar(20) | NOT NULL | 'pending' | 状态：pending/invited/visited/signed/lost/expired |
| scheduled_time | datetime | NULL | NULL | 预约到店时间 |
| visited_time | datetime | NULL | NULL | 实际到店时间 |
| result | varchar(20) | NULL | NULL | 结果：waiting/signed/follow_up/lost/other |
| remark | text | NULL | NULL | 备注 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### LeadAssignment（线索分配）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 分配ID |
| lead_id | varchar(36) | NOT NULL | - | 线索ID |
| sales_id | varchar(36) | NOT NULL | - | 销售ID |
| assign_type | varchar(20) | NOT NULL | 'auto' | 分配类型：auto/manual/recycle |
| status | varchar(20) | NOT NULL | 'pending' | 状态：pending/accepted/rejected/timeout |
| expires_at | datetime | NULL | NULL | 过期时间 |
| accepted_at | datetime | NULL | NULL | 接受时间 |
| remark | text | NULL | NULL | 分配备注 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### LeadAssignmentLog（线索分配日志）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 日志ID |
| lead_id | varchar(36) | NOT NULL | - | 线索ID |
| operator_id | varchar(36) | NOT NULL | - | 操作人ID |
| from_sales_id | varchar(36) | NULL | NULL | 原销售ID |
| to_sales_id | varchar(36) | NULL | NULL | 新销售ID |
| action | varchar(32) | NOT NULL | - | 操作类型：assign/reassign/accept/reject/timeout/recycle/revert_auto |
| reason | varchar(255) | NULL | NULL | 原因说明 |
| extra | text | NULL | NULL | 扩展数据JSON |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### LeadPool（公海池配置）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 配置ID |
| name | varchar(100) | NOT NULL | - | 公海池名称 |
| max_leads_per_sales | integer | NOT NULL | 50 | 每人最大持有线索数 |
| protect_days | integer | NOT NULL | 3 | 新线索保护天数 |
| recover_days_no_follow | integer | NOT NULL | 2 | 未跟进回收天数 |
| recover_days_no_visit | integer | NOT NULL | 7 | 未到访回收天数 |
| auto_recycle_enabled | boolean | NOT NULL | true | 是否开启自动回收 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### TalkSOP（谈案SOP）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | SOP ID |
| case_type | varchar(20) | NOT NULL | - | 案件类型：marriage/traffic/labor/debt/other |
| sop_name | varchar(100) | NOT NULL | - | SOP名称 |
| nodes | text | NOT NULL | - | SOP节点配置JSON |
| is_active | boolean | NOT NULL | true | 是否启用 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### OpportunitySOPProgress（商机SOP进度）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 进度ID |
| opportunity_id | varchar(36) | NOT NULL | - | 商机ID |
| sop_id | varchar(36) | NOT NULL | - | SOP ID |
| node_id | varchar(36) | NOT NULL | - | 节点ID |
| node_name | varchar(100) | NOT NULL | - | 节点名称 |
| status | varchar(20) | NOT NULL | 'pending' | 状态：pending/in_progress/completed/skipped |
| result | varchar(20) | NULL | NULL | 结果：pass/fail/skip |
| remark | text | NULL | NULL | 备注 |
| completed_at | datetime | NULL | NULL | 完成时间 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### OpportunityQuoteItem（报价明细）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 明细ID |
| opportunity_id | varchar(36) | NOT NULL | - | 商机ID |
| item_name | varchar(128) | NOT NULL | - | 收费项目名称 |
| amount | decimal(12,2) | NOT NULL | 0 | 金额 |
| remark | varchar(255) | NULL | NULL | 备注 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### OpportunityStageLog（商机阶段日志）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 日志ID |
| opportunity_id | varchar(36) | NOT NULL | - | 商机ID |
| operator_id | varchar(36) | NOT NULL | - | 操作人ID |
| from_stage | varchar(32) | NULL | NULL | 原阶段 |
| to_stage | varchar(32) | NOT NULL | - | 新阶段 |
| remark | text | NULL | NULL | 备注 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

#### 6.2.4 私域运营模块

##### ChatArchive（聊天归档）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 消息ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| employee_id | varchar(36) | NOT NULL | - | 员工ID |
| message_type | varchar(16) | NOT NULL | 'text' | 消息类型：text/image/voice/video/file |
| content | text | NULL | NULL | 消息内容（文本类） |
| file_path | varchar(255) | NULL | NULL | 文件路径（媒体类） |
| sent_at | datetime | NULL | NULL | 消息发送时间 |
| archived_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 归档时间 |
| organization_id | varchar(36) | NULL | NULL | 所属律所ID |
| compliance_synced | boolean | NOT NULL | false | 是否已同步合规质检 |
| compliance_result | varchar(16) | NULL | NULL | 合规结果：pass/warning/reject |

#### 6.2.4补充 私域运营模块（补充实体）

##### ClientTag（客户标签）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 标签ID |
| name | varchar(64) | NOT NULL | - | 标签名称 |
| color | varchar(32) | NULL | NULL | 标签颜色 |
| type | varchar(20) | NOT NULL | 'custom' | 标签类型：system/custom |
| sort_order | integer | NOT NULL | 0 | 排序 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### ClientTagRelation（客户标签关系）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 关系ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| tag_id | varchar(36) | NOT NULL | - | 标签ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### ReachTask（触达任务）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 任务ID |
| name | varchar(128) | NOT NULL | - | 任务名称 |
| content | text | NOT NULL | - | 触达内容 |
| channel | varchar(20) | NOT NULL | - | 触达渠道：wechat/sms/phone |
| target_clients | text | NULL | NULL | 目标客户ID列表JSON |
| execute_time | datetime | NULL | NULL | 执行时间 |
| status | varchar(20) | NOT NULL | 'pending' | 状态：pending/executing/completed/failed |
| executed_count | integer | NOT NULL | 0 | 已执行数量 |
| success_count | integer | NOT NULL | 0 | 成功数量 |
| fail_count | integer | NOT NULL | 0 | 失败数量 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| creator_id | varchar(36) | NOT NULL | - | 创建人ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### ScriptLibrary（话术库）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 话术ID |
| title | varchar(128) | NOT NULL | - | 话术标题 |
| content | text | NOT NULL | - | 话术内容 |
| case_type | varchar(20) | NULL | NULL | 适用案由 |
| scene | varchar(50) | NULL | NULL | 使用场景 |
| tags | varchar(255) | NULL | NULL | 标签 |
| usage_count | integer | NOT NULL | 0 | 使用次数 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| creator_id | varchar(36) | NOT NULL | - | 创建人ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

#### 6.2.5 案件办理模块

##### Case（案件）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 案件ID |
| case_type | varchar(32) | NOT NULL | - | 案件类型：marriage/traffic/labor/debt/other |
| status | varchar(32) | NOT NULL | 'pending_assign' | 状态：pending_assign/processing/filing/evidence/hearing/appeal/pending_close/closed |
| client_id | varchar(36) | NULL | NULL | 客户ID |
| assignee_lawyer_id | varchar(36) | FK, NULL | NULL | 承办律师ID |
| lead_id | varchar(36) | FK, NULL | NULL | 来源线索ID |
| fee_amount | decimal(12,2) | NULL | NULL | 律师费 |
| service_fee | decimal(12,2) | NULL | NULL | 服务费 |
| amount | decimal(12,2) | NULL | NULL | 案件总金额 |
| description | text | NULL | NULL | 案件描述 |
| deadline | datetime | NULL | NULL | 截止时间 |
| court | varchar(128) | NULL | NULL | 受理法院 |
| case_no | varchar(64) | NULL | NULL | 案号 |
| client_name | varchar(64) | NULL | NULL | 当事人姓名 |
| client_phone | varchar(20) | NULL | NULL | 当事人电话 |
| filing_date | datetime | NULL | NULL | 立案日期 |
| expected_close_date | datetime | NULL | NULL | 预计结案日期 |
| risk_level | varchar(16) | NOT NULL | 'low' | 风险等级：low/medium/high |
| risk_notes | text | NULL | NULL | 风险备注 |
| is_overdue | boolean | NOT NULL | false | 是否超期 |
| organization_id | varchar(36) | NOT NULL | - | 所属律所ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### CaseTask（案件任务）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 任务ID |
| case_id | varchar(36) | FK, NOT NULL | - | 案件ID |
| sop_template_id | varchar(36) | FK, NULL | NULL | SOP模板ID |
| stage_id | varchar(36) | NOT NULL | - | 阶段ID |
| stage_name | varchar(64) | NOT NULL | - | 阶段名称 |
| stage_order | integer | NOT NULL | - | 阶段顺序 |
| task_id | varchar(36) | NOT NULL | - | 任务ID（来自模板） |
| task_name | varchar(128) | NOT NULL | - | 任务名称 |
| status | varchar(32) | NOT NULL | 'pending' | 状态：pending/in_progress/completed/verified/overdue/cancelled |
| responsible_role | varchar(32) | NULL | NULL | 责任人角色 |
| assignee_id | varchar(36) | FK, NULL | NULL | 实际指派人ID |
| deadline | datetime | NULL | NULL | 截止时间 |
| completed_at | datetime | NULL | NULL | 完成时间 |
| is_required | boolean | NOT NULL | true | 是否必做 |
| deadline_days | integer | NULL | NULL | 相对天数 |
| description | text | NULL | NULL | 任务描述 |
| result | text | NULL | NULL | 任务结果 |
| priority | varchar(16) | NOT NULL | 'medium' | 优先级：low/medium/high/urgent |
| progress | integer | NOT NULL | 0 | 进度（0-100） |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### Evidence（证据）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 证据ID |
| name | varchar(128) | NOT NULL | - | 证据名称 |
| type | varchar(32) | NOT NULL | 'other' | 类型：document/photo/video/audio/other |
| category | varchar(32) | NOT NULL | 'other' | 分类：evidence/material/identity/correspondence/other |
| file_path | varchar(255) | NOT NULL | - | 文件路径 |
| file_size | integer | NULL | NULL | 文件大小（字节） |
| mime_type | varchar(64) | NULL | NULL | MIME类型 |
| description | text | NULL | NULL | 证据描述 |
| version | integer | NOT NULL | 1 | 版本号 |
| is_archived | boolean | NOT NULL | false | 是否已归档 |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| upload_by_id | varchar(36) | FK, NOT NULL | - | 上传人ID |
| parent_evidence_id | varchar(36) | FK, NULL | NULL | 父证据ID（版本管理） |
| upload_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 上传时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

#### 6.2.5补充 案件办理模块（补充实体）

##### CaseSOPTemplate（案件SOP模板）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 模板ID |
| name | varchar(128) | NOT NULL | - | 模板名称 |
| case_type | varchar(20) | NOT NULL | - | 适用案件类型：marriage/traffic/labor/debt/other |
| stages | json | NOT NULL | - | 阶段列表（JSON格式） |
| is_default | boolean | NOT NULL | false | 是否为默认模板 |
| enabled | boolean | NOT NULL | true | 是否启用 |
| description | text | NULL | NULL | 模板描述 |
| organization_id | varchar(36) | NULL | NULL | 所属组织ID（null为系统预置） |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### CaseWarning（案件预警）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 预警ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| warning_type | varchar(32) | NOT NULL | - | 预警类型：deadline/overdue/risk/compliance |
| warning_level | varchar(16) | NOT NULL | - | 预警级别：low/medium/high/critical |
| warning_date | date | NOT NULL | - | 预警日期 |
| target_date | date | NOT NULL | - | 目标日期 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/handled/ignored |
| handler_id | varchar(36) | FK, NULL | NULL | 处理人ID |
| handle_note | text | NULL | NULL | 处理备注 |
| description | text | NULL | NULL | 预警描述 |
| advance_days | integer | NOT NULL | 0 | 提前预警天数 |
| handled_at | datetime | NULL | NULL | 处理时间 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### Document（文档）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 文档ID |
| name | varchar(128) | NOT NULL | - | 文档名称 |
| file_path | varchar(255) | NOT NULL | - | 文件路径 |
| file_type | varchar(32) | NULL | NULL | 文件类型 |
| size | integer | NULL | NULL | 文件大小（字节） |
| description | text | NULL | NULL | 文档描述 |
| is_ai_generated | boolean | NOT NULL | false | 是否AI生成 |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| uploaded_by_id | varchar(36) | FK, NOT NULL | - | 上传人ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### LegalDocument（法律文书模板）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 文书ID |
| template_name | varchar(128) | NOT NULL | - | 模板名称 |
| document_type | varchar(32) | NULL | NULL | 文书类型 |
| case_type | varchar(20) | NULL | NULL | 适用案件类型 |
| content_template | text | NULL | NULL | 内容模板 |
| variables | text | NULL | NULL | 变量定义（JSON） |
| is_system | boolean | NOT NULL | true | 是否系统预置 |
| status | varchar(16) | NOT NULL | 'active' | 状态：active/inactive |
| organization_id | varchar(36) | NULL | NULL | 所属组织ID |
| created_by | varchar(36) | NULL | NULL | 创建人ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### CaseTaskComment（任务评论）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 评论ID |
| task_id | varchar(36) | FK, NOT NULL | - | 关联任务ID |
| user_id | varchar(36) | FK, NOT NULL | - | 评论人ID |
| type | varchar(20) | NOT NULL | 'comment' | 类型：comment/result/status_change/assign_change |
| content | text | NOT NULL | - | 评论内容 |
| file_url | text | NULL | NULL | 文件URL（成果上传） |
| file_name | varchar(255) | NULL | NULL | 文件名 |
| file_type | varchar(64) | NULL | NULL | 文件类型 |
| metadata | json | NULL | NULL | 扩展字段（JSON） |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

#### 6.2.6 财务管理模块

##### Receivable（应收账款）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 应收ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| contract_amount | decimal(12,2) | NOT NULL | - | 合同金额 |
| received_amount | decimal(12,2) | NOT NULL | 0 | 已收金额 |
| pending_amount | decimal(12,2) | NOT NULL | 0 | 待收金额 |
| installment_plan | json | NULL | NULL | 分期计划（含 installment_id/amount/due_date/status/paid_date/paid_amount） |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/partial/completed/overdue |
| remarks | varchar(255) | NULL | NULL | 备注 |
| organization_id | varchar(36) | NOT NULL | - | 所属律所ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### PaymentRecord（收款记录）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 收款记录ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| amount | decimal(12,2) | NOT NULL | - | 收款金额 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/paid/failed/refunded |
| method | varchar(16) | NOT NULL | 'alipay' | 方式：alipay/wechat/bank |
| transaction_id | varchar(64) | NULL | NULL | 第三方交易号 |
| remarks | varchar(255) | NULL | NULL | 备注 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### CommissionRecord（分润记录）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 分润记录ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| user_id | varchar(36) | FK, NOT NULL | - | 分润对象（销售/谈案/律师/律所） |
| role_type | varchar(32) | NOT NULL | - | 角色类型：sales/negotiator/lawyer/firm |
| rule_id | varchar(36) | FK, NOT NULL | - | 关联分润规则ID |
| base_amount | decimal(12,2) | NOT NULL | - | 计算基数 |
| commission_amount | decimal(12,2) | NOT NULL | - | 提成金额 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/paid |
| paid_at | datetime | NULL | NULL | 发放时间 |
| remarks | text | NULL | NULL | 备注 |
| organization_id | varchar(36) | NULL | NULL | 所属律所ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

#### 6.2.7 合规质检模块

##### ComplianceCheckResult（合规检查结果）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 结果ID |
| rule_id | varchar(36) | NOT NULL | - | 触发的规则ID |
| target_type | varchar(32) | NOT NULL | - | 目标类型：marketing_content/sales_compliance/signing_compliance |
| target_id | varchar(36) | NOT NULL | - | 目标对象ID |
| check_result | varchar(16) | NOT NULL | - | 检查结果：pass/review/reject |
| violation_content | text | NULL | NULL | 违规内容描述 |
| handler_id | varchar(36) | NULL | NULL | 处理人ID |
| handle_status | varchar(16) | NOT NULL | 'pending' | 处理状态：pending/processed/ignored |
| handle_note | text | NULL | NULL | 处理备注 |
| is_inspection | boolean | NOT NULL | false | 是否为巡检产生 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 检查时间 |
| handled_at | datetime | NULL | NULL | 处理时间 |

#### 6.2.8 客户服务模块

##### ClientConsultation（客户咨询）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 咨询ID |
| case_id | varchar(36) | FK, NULL | NULL | 关联案件ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| content | text | NULL | NULL | 咨询内容 |
| reply | text | NULL | NULL | 回复内容 |
| handler_id | varchar(36) | NULL | NULL | 处理人ID |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/replied/closed |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### ServiceRating（服务评价）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 评价ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| rating | integer | NOT NULL | 5 | 评分（1-5星） |
| comment | text | NULL | NULL | 评价内容 |
| lawyer_id | varchar(36) | NULL | NULL | 被评价律师ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 评价时间 |

#### 6.2.6补充 财务管理模块（补充实体）

##### Fee（收费记录）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 收费ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| amount | decimal(12,2) | NOT NULL | - | 收费金额 |
| description | varchar(255) | NULL | NULL | 收费说明 |
| paid | boolean | NOT NULL | false | 是否已支付 |
| paid_at | datetime | NULL | NULL | 支付时间 |
| payment_method | varchar(32) | NULL | NULL | 支付方式 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### Invoice（发票）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 发票ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| amount | decimal(12,2) | NOT NULL | - | 开票金额 |
| invoice_no | varchar(64) | NULL | NULL | 发票号码 |
| invoice_type | varchar(32) | NOT NULL | 'normal' | 发票类型：normal/special |
| title | varchar(255) | NOT NULL | - | 发票抬头 |
| tax_no | varchar(64) | NULL | NULL | 税号 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/issued/cancelled |
| issued_at | datetime | NULL | NULL | 开票时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### Refund（退费）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 退费ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| amount | decimal(12,2) | NOT NULL | - | 退费金额 |
| reason | text | NULL | NULL | 退费原因 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/approved/rejected/completed |
| approved_by | varchar(36) | NULL | NULL | 审批人ID |
| approved_at | datetime | NULL | NULL | 审批时间 |
| refunded_at | datetime | NULL | NULL | 退费时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### CommissionRule（分润规则）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 规则ID |
| name | varchar(128) | NOT NULL | - | 规则名称 |
| case_type | varchar(20) | NOT NULL | - | 适用案件类型 |
| role_type | varchar(32) | NOT NULL | - | 角色类型：sales/negotiator/lawyer/assistant |
| commission_type | varchar(16) | NOT NULL | 'percentage' | 分润类型：fixed/percentage |
| commission_value | decimal(10,2) | NOT NULL | 0 | 分润值（固定金额或百分比） |
| min_amount | decimal(12,2) | NULL | NULL | 最低收费金额阈值 |
| max_commission | decimal(12,2) | NULL | NULL | 最高分润上限 |
| is_active | boolean | NOT NULL | true | 是否启用 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### CaseCost（案件成本）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 成本ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| cost_type | varchar(32) | NOT NULL | - | 成本类型：court_fee/appraisal/transportation/other |
| amount | decimal(12,2) | NOT NULL | - | 成本金额 |
| description | varchar(255) | NULL | NULL | 成本说明 |
| occurred_at | datetime | NULL | NULL | 发生时间 |
| created_by | varchar(36) | NOT NULL | - | 创建人ID |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### OverdueWarning（逾期预警）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 预警ID |
| receivable_id | varchar(36) | FK, NOT NULL | - | 关联应收ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| overdue_amount | decimal(12,2) | NOT NULL | - | 逾期金额 |
| overdue_days | integer | NOT NULL | 0 | 逾期天数 |
| overdue_level | varchar(16) | NOT NULL | 'normal' | 逾期等级：normal/warning/danger/severe |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/notified/resolved |
| notified_at | datetime | NULL | NULL | 通知时间 |
| resolved_at | datetime | NULL | NULL | 解决时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### Reconciliation（对账）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 对账ID |
| period_start | date | NOT NULL | - | 对账周期开始 |
| period_end | date | NOT NULL | - | 对账周期结束 |
| platform | varchar(32) | NOT NULL | - | 对账平台：alipay/wechat/bank |
| system_amount | decimal(12,2) | NOT NULL | 0 | 系统记录金额 |
| platform_amount | decimal(12,2) | NOT NULL | 0 | 平台金额 |
| difference | decimal(12,2) | NOT NULL | 0 | 差额 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/matched/unmatched |
| matched_at | datetime | NULL | NULL | 匹配时间 |
| operator_id | varchar(36) | NULL | NULL | 操作人ID |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### ProfitShare（分润）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 分润ID |
| case_id | varchar(36) | FK, NOT NULL | - | 关联案件ID |
| user_id | varchar(36) | FK, NOT NULL | - | 分润对象ID |
| role_type | varchar(32) | NOT NULL | - | 角色类型 |
| rule_id | varchar(36) | FK, NULL | NULL | 关联规则ID |
| base_amount | decimal(12,2) | NOT NULL | - | 计算基数 |
| share_amount | decimal(12,2) | NOT NULL | - | 分润金额 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/calculating/completed/settled |
| period | varchar(20) | NULL | NULL | 结算周期（YYYY-MM） |
| settled_at | datetime | NULL | NULL | 结算时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

#### 6.2.7补充 合规质检模块（补充实体）

##### LawyerQualification（律师执业资质）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 资质ID |
| user_id | varchar(36) | FK, NOT NULL | - | 律师ID |
| license_number | varchar(64) | NOT NULL | - | 执业证号 |
| license_type | varchar(20) | NOT NULL | 'lawyer' | 证件类型：lawyer/paralegal/legal_worker |
| valid_until | datetime | NOT NULL | - | 有效期至 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/verified/expired/revoked |
| verified_at | datetime | NULL | NULL | 验证时间 |
| verified_by | varchar(36) | NULL | NULL | 验证人ID |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### ComplianceRule（合规规则）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 规则ID |
| name | varchar(128) | NOT NULL | - | 规则名称 |
| check_stage | varchar(32) | NOT NULL | - | 检查阶段：acquisition/negotiation/signing/case_handling/closing/finance |
| rule_type | varchar(16) | NOT NULL | 'keyword' | 规则类型：keyword/regex/manual |
| conditions | text | NOT NULL | - | 规则条件（JSON） |
| enabled | boolean | NOT NULL | true | 是否启用 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### ComplaintTicket（投诉工单）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 工单ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| case_id | varchar(36) | FK, NULL | NULL | 关联案件ID |
| complaint_type | varchar(32) | NOT NULL | - | 投诉类型：service_quality/fee_issue/progress/result/other |
| content | text | NOT NULL | - | 投诉内容 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/processing/resolved/closed |
| handler_id | varchar(36) | NULL | NULL | 处理人ID |
| handle_result | text | NULL | NULL | 处理结果 |
| handled_at | datetime | NULL | NULL | 处理时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### SalesCompliance（谈案合规）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 记录ID |
| lead_id | varchar(36) | NOT NULL | - | 线索ID |
| opportunity_id | varchar(36) | NULL | NULL | 商机ID |
| sales_id | varchar(36) | NOT NULL | - | 销售ID |
| check_result | varchar(16) | NOT NULL | 'pending' | 检查结果：pass/review/reject |
| risk_points | text | NULL | NULL | 风险点 |
| suggestions | text | NULL | NULL | 整改建议 |
| checked_at | datetime | NULL | NULL | 检查时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### CaseComplianceCheck（案件合规检查）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 检查ID |
| case_id | varchar(36) | FK, NOT NULL | - | 案件ID |
| check_type | varchar(32) | NOT NULL | - | 检查类型：lichong/qualification/document/progress |
| check_result | varchar(16) | NOT NULL | 'pending' | 检查结果：pass/review/reject |
| issues | text | NULL | NULL | 发现问题 |
| rectify_required | boolean | NOT NULL | false | 是否需整改 |
| rectify_deadline | datetime | NULL | NULL | 整改截止时间 |
| checked_by | varchar(36) | NULL | NULL | 检查人ID |
| checked_at | datetime | NULL | NULL | 检查时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### RiskDisclosure（风险告知）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 告知ID |
| case_id | varchar(36) | FK, NOT NULL | - | 案件ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| risk_items | text | NOT NULL | - | 风险项列表（JSON） |
| signed | boolean | NOT NULL | false | 是否签署 |
| signed_at | datetime | NULL | NULL | 签署时间 |
| sign_file_url | varchar(255) | NULL | NULL | 签署文件URL |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### TalkQualityCheck（谈话语检）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 质检ID |
| chat_archive_id | varchar(36) | NOT NULL | - | 聊天归档ID |
| lead_id | varchar(36) | NOT NULL | - | 线索ID |
| sales_id | varchar(36) | NOT NULL | - | 销售ID |
| quality_score | integer | NULL | NULL | 质量评分（0-100） |
| violations | text | NULL | NULL | 违规项（JSON） |
| suggestions | text | NULL | NULL | 改进建议 |
| checked_by | varchar(36) | NULL | NULL | 质检人ID |
| checked_at | datetime | NULL | NULL | 质检时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### CasePersonnelChange（案件人员变更）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 变更ID |
| case_id | varchar(36) | FK, NOT NULL | - | 案件ID |
| change_type | varchar(32) | NOT NULL | - | 变更类型：lead_lawyer/co_lawyer/assistant/sales/negotiator |
| from_user_id | varchar(36) | NULL | NULL | 原人员ID |
| to_user_id | varchar(36) | NOT NULL | - | 新人员ID |
| reason | text | NULL | NULL | 变更原因 |
| approved_by | varchar(36) | NULL | NULL | 审批人ID |
| approved_at | datetime | NULL | NULL | 审批时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### ContractTemplate（合同模板）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 模板ID |
| name | varchar(128) | NOT NULL | - | 模板名称 |
| case_type | varchar(20) | NULL | NULL | 适用案件类型 |
| content | text | NOT NULL | - | 合同模板内容 |
| variables | text | NULL | NULL | 变量定义（JSON） |
| is_system | boolean | NOT NULL | true | 是否系统预置 |
| status | varchar(16) | NOT NULL | 'active' | 状态：draft/active/inactive |
| version | integer | NOT NULL | 1 | 版本号 |
| organization_id | varchar(36) | NULL | NULL | 所属组织ID |
| created_by | varchar(36) | NULL | NULL | 创建人ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### FinanceComplianceCheck（财务合规检查）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 检查ID |
| fee_id | varchar(36) | NULL | NULL | 关联收费ID |
| refund_id | varchar(36) | NULL | NULL | 关联退费ID |
| invoice_id | varchar(36) | NULL | NULL | 关联发票ID |
| check_type | varchar(32) | NOT NULL | - | 检查类型：fee/refund/invoice/commission |
| check_result | varchar(16) | NOT NULL | 'pending' | 检查结果：pass/review/reject |
| issues | text | NULL | NULL | 问题描述 |
| checked_by | varchar(36) | NULL | NULL | 检查人ID |
| checked_at | datetime | NULL | NULL | 检查时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### CaseArchive（案件归档）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 归档ID |
| case_id | varchar(36) | FK, NOT NULL | - | 案件ID |
| archive_no | varchar(64) | NULL | NULL | 归档编号 |
| materials_count | integer | NOT NULL | 0 | 材料份数 |
| storage_location | varchar(255) | NULL | NULL | 存放位置 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/approved/rejected/archived |
| archived_by | varchar(36) | NULL | NULL | 归档人ID |
| archived_at | datetime | NULL | NULL | 归档时间 |
| approved_by | varchar(36) | NULL | NULL | 审批人ID |
| remark | text | NULL | NULL | 备注 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### SigningCompliance（签约合规）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 合规ID |
| case_id | varchar(36) | FK, NOT NULL | - | 案件ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| contract_file_url | varchar(255) | NULL | NULL | 合同文件URL |
| check_result | varchar(16) | NOT NULL | 'pending' | 检查结果：pass/review/reject |
| issues | text | NULL | NULL | 问题项 |
| risk_disclosure_signed | boolean | NOT NULL | false | 风险告知书是否签署 |
| authority_verified | boolean | NOT NULL | false | 委托权限是否核实 |
| fee_clear | boolean | NOT NULL | false | 收费是否明确 |
| checked_by | varchar(36) | NULL | NULL | 检查人ID |
| checked_at | datetime | NULL | NULL | 检查时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### MarketingContent（营销内容合规）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 内容ID |
| material_id | varchar(36) | NULL | NULL | 关联素材ID |
| content_type | varchar(32) | NOT NULL | - | 内容类型：ad_material/live_script/article/video |
| title | varchar(255) | NULL | NULL | 内容标题 |
| content_text | text | NULL | NULL | 内容文本 |
| check_result | varchar(16) | NOT NULL | 'pending' | 检查结果：pass/review/reject |
| violations | text | NULL | NULL | 违规内容 |
| suggestions | text | NULL | NULL | 修改建议 |
| checked_by | varchar(36) | NULL | NULL | 检查人ID |
| checked_at | datetime | NULL | NULL | 检查时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### CaseSOP（案件SOP合规）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 记录ID |
| case_id | varchar(36) | FK, NOT NULL | - | 案件ID |
| template_id | varchar(36) | NULL | NULL | SOP模板ID |
| compliance_rate | decimal(5,2) | NOT NULL | 0 | SOP完成合规率 |
| missing_tasks | text | NULL | NULL | 遗漏任务列表（JSON） |
| overdue_tasks | text | NULL | NULL | 超期任务列表（JSON） |
| checked_at | datetime | NULL | NULL | 检查时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### Complaint（投诉）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 投诉ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| case_id | varchar(36) | FK, NULL | NULL | 关联案件ID |
| complaint_type | varchar(32) | NOT NULL | 'other' | 投诉类型 |
| content | text | NOT NULL | - | 投诉内容 |
| status | varchar(16) | NOT NULL | 'pending' | 状态 |
| handler_id | varchar(36) | NULL | NULL | 处理人ID |
| handle_result | text | NULL | NULL | 处理结果 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### ComplianceRecord（合规记录）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 记录ID |
| target_type | varchar(32) | NOT NULL | - | 目标类型 |
| target_id | varchar(36) | NOT NULL | - | 目标ID |
| rule_id | varchar(36) | NULL | NULL | 触发规则ID |
| check_result | varchar(16) | NOT NULL | - | 检查结果 |
| violation_detail | text | NULL | NULL | 违规详情 |
| handled | boolean | NOT NULL | false | 是否已处理 |
| handler_id | varchar(36) | NULL | NULL | 处理人ID |
| handled_at | datetime | NULL | NULL | 处理时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

#### 6.2.8补充 客户服务模块（补充实体）

##### CasePushNotification（案件推送通知）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 通知ID |
| case_id | varchar(36) | FK, NOT NULL | - | 案件ID |
| client_id | varchar(36) | NOT NULL | - | 客户ID |
| node_type | varchar(32) | NOT NULL | - | 节点类型：filing/court/judgment/closed |
| push_content | text | NOT NULL | - | 推送内容 |
| push_channel | varchar(16) | NOT NULL | 'in_app' | 推送渠道：wechat/sms/in_app |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/sent/failed |
| push_time | datetime | NULL | NULL | 推送时间 |
| sent_at | datetime | NULL | NULL | 实际发送时间 |
| organization_id | varchar(36) | NULL | NULL | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

##### ClientArchive（客户档案）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 档案ID |
| client_id | varchar(36) | UNIQUE, NOT NULL | - | 客户ID |
| total_cases | integer | NOT NULL | 0 | 历史案件数 |
| total_amount | decimal(12,2) | NOT NULL | 0 | 历史总金额 |
| complaint_count | integer | NOT NULL | 0 | 投诉次数 |
| rating_avg | decimal(3,2) | NULL | NULL | 平均评分 |
| tags | text | NULL | NULL | 标签列表（JSON） |
| remark | text | NULL | NULL | 备注 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

#### 6.2.9 系统配置模块

##### Role（角色）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 角色ID |
| name | varchar(64) | NOT NULL | - | 角色名称 |
| code | varchar(64) | UNIQUE, NOT NULL | - | 角色编码 |
| description | text | NULL | NULL | 角色描述 |
| permissions | json | NULL | NULL | 权限编码列表（JSON数组） |
| status | boolean | NOT NULL | true | 状态：true启用/false禁用 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### Permission（权限）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 权限ID |
| name | varchar(64) | NOT NULL | - | 权限名称 |
| code | varchar(64) | UNIQUE, NOT NULL | - | 权限编码 |
| description | text | NULL | NULL | 权限描述 |
| module | varchar(32) | NOT NULL | 'system' | 所属模块 |
| type | varchar(16) | NOT NULL | 'read' | 权限类型：read/write/delete/admin |
| status | boolean | NOT NULL | true | 状态 |
| sort_order | integer | NOT NULL | 0 | 排序 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### Menu（菜单）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 菜单ID |
| parent_id | varchar(36) | NULL | NULL | 父菜单ID |
| name | varchar(64) | NOT NULL | - | 菜单名称 |
| path | varchar(128) | NOT NULL | - | 路由路径 |
| icon | varchar(64) | NULL | NULL | 图标 |
| sort_order | integer | NOT NULL | 0 | 排序 |
| is_visible | boolean | NOT NULL | true | 是否可见 |
| permissions | json | NULL | NULL | 所需权限编码列表 |
| component | varchar(128) | NULL | NULL | 前端组件路径 |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### BrandConfig（品牌配置）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 配置ID |
| brand_name | varchar(128) | NOT NULL | - | 品牌名称 |
| logo_url | varchar(255) | NULL | NULL | Logo URL |
| favicon_url | varchar(255) | NULL | NULL | Favicon URL |
| primary_color | varchar(32) | NULL | NULL | 主色调 |
| secondary_color | varchar(32) | NULL | NULL | 辅助色 |
| theme_type | varchar(16) | NOT NULL | 'light' | 主题类型：light/dark/custom |
| login_banner_url | varchar(255) | NULL | NULL | 登录页背景图URL |
| copyright_text | varchar(255) | NULL | NULL | 版权信息 |
| icp_number | varchar(64) | NULL | NULL | ICP备案号 |
| status | varchar(16) | NOT NULL | 'active' | 状态：active/inactive |
| organization_id | varchar(36) | NULL | NULL | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### DeploymentConfig（部署配置）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 配置ID |
| config_name | varchar(128) | NOT NULL | - | 配置名称 |
| server_type | varchar(16) | NOT NULL | 'single' | 服务器类型：single/cluster |
| server_host | varchar(128) | NULL | NULL | 服务器地址 |
| server_port | integer | NULL | NULL | 服务器端口 |
| db_type | varchar(32) | NOT NULL | 'mysql' | 数据库类型 |
| db_host | varchar(128) | NULL | NULL | 数据库地址 |
| db_name | varchar(64) | NULL | NULL | 数据库名 |
| db_user | varchar(64) | NULL | NULL | 数据库用户 |
| cache_type | varchar(32) | NOT NULL | 'redis' | 缓存类型 |
| cache_host | varchar(128) | NULL | NULL | 缓存地址 |
| config_status | varchar(16) | NOT NULL | 'active' | 配置状态：active/inactive |
| organization_id | varchar(36) | NULL | NULL | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### Integration（第三方集成）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 集成ID |
| integration_name | varchar(128) | NOT NULL | - | 集成名称 |
| integration_type | varchar(32) | NOT NULL | 'third_party' | 集成类型：wechat/wework/alipay/third_party/api |
| app_id | varchar(128) | NULL | NULL | AppID |
| app_secret | text | NULL | NULL | AppSecret（加密存储） |
| api_url | varchar(255) | NULL | NULL | API地址 |
| webhook_url | varchar(255) | NULL | NULL | Webhook回调地址 |
| status | varchar(16) | NOT NULL | 'pending' | 状态：active/inactive/pending |
| config | text | NULL | NULL | 扩展配置（JSON） |
| organization_id | varchar(36) | NULL | NULL | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

#### 6.2.10 数据看板模块

##### ReportTemplate（报表模板）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 模板ID |
| name | varchar(128) | NOT NULL | - | 模板名称 |
| description | text | NULL | NULL | 模板描述 |
| dimensions | text | NOT NULL | - | 维度配置（JSON） |
| metrics | text | NOT NULL | - | 指标配置（JSON） |
| time_range | varchar(16) | NOT NULL | '30d' | 时间范围：7d/30d/90d/custom |
| custom_start_date | datetime | NULL | NULL | 自定义开始时间 |
| custom_end_date | datetime | NULL | NULL | 自定义结束时间 |
| subscriber_ids | text | NULL | NULL | 订阅人ID列表（JSON） |
| subscription_frequency | varchar(16) | NULL | NULL | 订阅频率：daily/weekly/monthly |
| created_by | varchar(36) | NOT NULL | - | 创建人ID |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

##### ReportExportLog（报表导出日志）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(36) | PK, NOT NULL | uuid | 日志ID |
| template_id | varchar(36) | NULL | NULL | 报表模板ID |
| report_type | varchar(32) | NOT NULL | - | 报表类型 |
| export_format | varchar(16) | NOT NULL | 'excel' | 导出格式：excel/pdf/csv |
| file_url | varchar(255) | NULL | NULL | 导出文件URL |
| parameters | text | NULL | NULL | 导出参数（JSON） |
| status | varchar(16) | NOT NULL | 'pending' | 状态：pending/processing/completed/failed |
| exported_by | varchar(36) | NOT NULL | - | 导出人ID |
| exported_at | datetime | NULL | NULL | 导出完成时间 |
| organization_id | varchar(36) | NOT NULL | - | 所属组织ID |
| created_at | datetime | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

### 6.3 数据流转规则

8 大业务流转链路覆盖从获客到结案分润的全闭环，每条链路定义触发条件、同步方式与异常处理。

| 链路名称 | 源实体 → 目标实体 | 触发条件 | 同步方式 | 异常处理 |
|----------|-------------------|----------|----------|----------|
| 1. 投放→线索 | ConversionEvent → Lead | 落地页表单提交或线索回传 API 收到 `event_type=lead` | 同步事务写入：Lead 创建后异步回填 ConversionEvent.lead_id | 回传失败重试 3 次（间隔 1/5/15 秒），仍失败入死信队列人工介入；线索重复（同 phone+channel 24h）标记为重复但不丢弃 |
| 2. 线索→私域 | Lead → ChatArchive / ClientTag | 销售添加客户微信后，企微/抖音 IM Webhook 推送首条消息 | 异步：Webhook 触发后写入 ChatArchive，5 分钟内批量回填 client_id | Webhook 签名校验失败丢弃；客户未识别时挂起到 `pending_clients` 表，待销售手动绑定 |
| 3. 线索→邀约→谈案 | Lead → Opportunity | 销售在 Lead 详情点击"转为谈案"按钮，status 由 `qualified` 变更为 `converted` | 同步事务：创建 Opportunity 记录并回写 Lead.status；同时初始化 OpportunityStageLog 首条日志 | Lead 已转换时禁止重复转换，返回 `2002 重复线索`；事务回滚保证一致性 |
| 4. 谈案→立案 | Opportunity → Case | Opportunity.stage 流转为 `signed` 且 actual_amount > 0 | 同步事务：创建 Case（关联 lead_id），触发 Receivable 创建（合同金额=actual_amount），生成 CaseTask 集合（按 SOP 模板） | SOP 模板未配置时案件仍创建但任务列表为空，提示"请补充 SOP"；金额异常（≤0）返回 `5001 金额异常` |
| 5. 立案→办案SOP | Case → CaseTask | Case 创建成功事件 | 同步：读取 CaseSOPTemplate，按 `case_type` 匹配模板，逐条生成 CaseTask，按 `deadline_days` 计算截止时间 | 模板缺失时跳过任务生成但记录告警日志；任务生成失败事务回滚案件创建 |
| 6. 办案→客户服务 | Case → ClientConsultation / ServiceRating / CasePushNotification | Case 状态变更或 CaseTask 完成时 | 异步：事件总线触发推送通知；结案后 7 天自动创建 ServiceRating 邀请 | 推送失败重试 3 次后入 `notification_failed` 表；客户未授权接收则跳过 |
| 7. 立案→财务应收 | Case → Receivable → Invoice / Fee / CommissionRecord | Case 创建 / PaymentRecord 创建 / 结案 | 同步：立案时创建 Receivable；每次 PaymentRecord 入账更新 received_amount 与 pending_amount；结案时按 CommissionRule 批量生成 CommissionRecord | 重复收款校验（同 transaction_id），重复返回 `5002 收款重复`；金额溢出（received > contract）返回 `5001 金额异常` |
| 8. 结案→分润 | Case → CommissionRecord → PaymentRecord（分润发放） | Case.status 流转为 `closed` 且 Receivable.status = `completed` | 同步事务：按 CommissionRule 计算各角色分润金额，批量写入 CommissionRecord；财务审核后批量更新 status=paid 与 paid_at | 分润规则缺失时返回 `5003 分润规则未配置`；案件未结案或应收未完成禁止分润，返回 `5004 分润条件未满足` |

### 6.4 数据脱敏规则

法律业务敏感字段在展示层强制脱敏，存储层采用密文或受控明文，传输层走 HTTPS 加密。

| 字段类型 | 脱敏算法 | 展示示例 | 存储方式 |
|----------|----------|----------|----------|
| 手机号 | 保留前 3 位 + 后 4 位，中间 4 位用 `*` 替代 | `138****1234` | 明文存储（用于短信/通话）；查询时按完整手机号匹配；列表展示统一脱敏 |
| 身份证号 | 保留前 3 位 + 后 4 位，中间 11 位用 `*` 替代 | `110***********1234` | AES-256 加密存储，密钥由 KMS 管理；展示时解密后脱敏；后台导出需二次授权 |
| 银行卡号 | 保留前 4 位 + 后 4 位，中间用 `*` 替代 | `6222****1234` | AES-256 加密存储；财务模块仅展示脱敏值；完整卡号仅在支付时透传给支付通道 |
| 微信号 | 保留前 2 位 + 后 3 位，中间用 `*` 替代 | `wx***123` | 明文存储；列表展示脱敏；详情页对授权角色明文展示 |
| 当事人姓名 | 2 字姓名：首字 + `*`；3 字及以上：首字 + `*` + 末字 | `张*` / `张*三` | 明文存储；展示层脱敏；导出报表自动脱敏 |
| 邮箱 | 用户名部分仅保留首字符 + `***` + 域名 | `z***@example.com` | 明文存储 |
| 家庭住址 | 保留省市区，街道及门牌号用 `*` 替代 | `北京市朝阳区****` | 明文存储；展示层脱敏；财务对账单导出按律所配置决定是否脱敏 |
| 案件描述 | 不脱敏，但禁止包含身份证号/银行卡号 | - | 入库前正则扫描，命中身份证/银行卡模式自动替换为脱敏字符串并标记 `has_sensitive_replaced=true` |
| 律师执业证号 | 保留前 4 位 + 后 4 位 | `1101********1234` | 明文存储；公开页面（律师展示页）脱敏 |

脱敏实施要点：

1. **服务端脱敏优先**：API 响应时根据当前用户角色与请求来源（PC 后台 / 移动端 H5 / C 端）决定返回脱敏值还是明文。
2. **前端兜底**：使用 `<MaskText>` 组件统一处理，避免遗漏。
3. **审计留痕**：明文查询记录写入 `audit_logs`，包含 `operator_id`、`target_field`、`query_time`、`ip`。
4. **导出控制**：Excel/PDF 导出报表默认脱敏，管理员可申请临时授权明文导出（24 小时有效，记录授权链路）。

---

## 第7章 接口规范

### 7.1 RESTful 设计规范

本平台后端基于 NestJS，全局前缀 `api`（`main.ts` 中 `app.setGlobalPrefix('api')`），所有接口路径以 `/api/` 开头。规范遵循 RESTful 风格，但保留少量动作子资源以表达状态机变更。

#### 7.1.1 URL 命名规范

| 规则 | 说明 | 示例 |
|------|------|------|
| 使用复数名词 | 资源集合统一复数 | `/api/leads`、`/api/cases`、`/api/receivables` |
| 资源 ID 在路径中 | 单资源访问通过路径参数 | `/api/leads/:id`、`/api/cases/:id` |
| 子资源嵌套表达归属 | 二级资源通过父资源 ID 嵌套 | `/api/leads/:id/follow-ups`、`/api/cases/:id/tasks` |
| 状态机变更走动作子资源 | 状态变更使用动词子路径 | `PUT /api/leads/:id/status`、`PUT /api/leads/:id/assign`、`PUT /api/opportunities/:id/stage` |
| 模块前缀 | 模块内资源按模块归类 | `/api/marketing/ad-plans`、`/api/scrm/chat-archives`、`/api/finance/commission-records` |
| 单词连字符 | 多词路径用 `-` 连接 | `/api/ad-accounts`、`/api/case-tasks`（不使用下划线或驼峰） |

#### 7.1.2 HTTP 方法语义

| 方法 | 语义 | 示例 | 幂等性 |
|------|------|------|--------|
| GET | 查询资源，无副作用 | `GET /api/leads?page=1&pageSize=20` | 幂等 |
| POST | 创建资源或触发动作 | `POST /api/leads`（创建）、`POST /api/leads/:id/follow-ups`（追加子资源） | 不幂等 |
| PUT | 全量更新资源或子资源状态 | `PUT /api/leads/:id/status`、`PUT /api/cases/:id` | 幂等 |
| DELETE | 删除资源（软删除） | `DELETE /api/leads/:id` | 幂等 |
| PATCH | 局部更新（少量使用） | `PATCH /api/cases/:id/risk-level` | 不幂等 |

#### 7.1.3 版本管理

- 默认路径不加版本号：`/api/leads`。
- 破坏性变更通过 `/api/v1/leads` 与 `/api/leads`（默认等价于 v1）共存。
- 废弃接口在响应头返回 `Deprecation: true` 与 `Sunset: <date>`，保留 6 个月过渡期。

#### 7.1.4 查询参数规范

| 参数类型 | 参数名 | 示例 | 说明 |
|----------|--------|------|------|
| 分页 | `page`、`pageSize` | `?page=1&pageSize=20` | 默认 page=1、pageSize=20；最大 pageSize=100 |
| 排序 | `sortBy`、`order` | `?sortBy=created_at&order=desc` | 单字段排序；多字段用 `sortBy=created_at,status` |
| 等值过滤 | 字段名 | `?status=active&module=lead` | 多个过滤条件 AND 关系 |
| 模糊搜索 | `keyword` | `?keyword=张三` | 在 name/phone/contact_name 等字段模糊匹配 |
| 时间范围 | `startDate`、`endDate` | `?startDate=2026-01-01&endDate=2026-12-31` | 闭区间，按 `created_at` 过滤 |
| 字段投影 | `fields` | `?fields=id,name,phone` | 仅返回指定字段，减少传输量 |
| 组织隔离 | `org_id` | `?org_id=<org_id>` | 默认从 JWT 中读取 `organization_id`；管理员可指定 |

### 7.2 响应格式

后端基于NestJS框架构建，未封装全局统一响应拦截器，接口响应遵循NestJS默认行为：

#### 7.2.1 成功响应 - 单个对象（查询/创建/更新）

查询类接口（GET单个）、创建类接口（POST）、更新类接口（PUT/PATCH）直接返回实体对象：

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "138****1234",
  "status": "new",
  "created_at": "2026-07-25T10:30:00.000Z"
}
```

#### 7.2.2 成功响应 - 列表（分页）

分页查询接口返回包含items和分页元数据的对象：

```json
{
  "items": [
    { "id": "550e8400-e29b-41d4-a716-446655440000", "phone": "138****1234" },
    { "id": "660e8400-e29b-41d4-a716-446655440001", "phone": "139****5678" }
  ],
  "total": 128,
  "page": 1,
  "pageSize": 20
}
```

#### 7.2.3 失败响应（NestJS标准异常格式）

异常由NestJS内置异常过滤器处理，返回标准HTTP异常格式：

```json
{
  "statusCode": 400,
  "message": "参数校验失败",
  "error": "Bad Request"
}
```

鉴权失败（401）示例：
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

权限不足（403）示例：
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

资源不存在（404）示例：
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

#### 7.2.4 字段约定

| 场景 | 返回格式 | 说明 |
|------|----------|------|
| GET单个资源 | 直接返回实体对象 | 无code/message包装 |
| POST创建 | 直接返回创建后的实体对象 | 包含服务端生成的id/created_at等 |
| PUT/PATCH更新 | 直接返回更新后的实体对象 | 包含完整字段 |
| DELETE删除 | 无内容（204 No Content）或返回删除成功标识 | 部分接口返回{success: true} |
| GET列表分页 | `{items, total, page, pageSize}` | items为数据数组 |
| 异常响应 | `{statusCode, message, error}` | NestJS标准异常格式 |

### 7.3 错误码定义

错误码采用 4 位数字，按业务模块分段。HTTP 状态码与业务错误码配合使用：401 用于鉴权失败、400 用于参数错误、403 用于权限不足、404 用于资源不存在、500 用于服务端异常。

#### 7.3.1 1xxx 认证与授权

| 错误码 | HTTP | 描述 | 触发场景 |
|--------|------|------|----------|
| 1001 | 401 | 用户名或密码错误 | `POST /api/auth/login` 校验失败 |
| 1002 | 401 | Token已过期，请重新登录 | JWT 过期或无效 |
| 1003 | 401 | 账号已禁用 | user.status = false |
| 1004 | 403 | 无权限访问该资源 | 跨律所访问或角色不匹配 |
| 1005 | 403 | 账号已被锁定，请稍后重试 | 登录失败 5 次锁定 |
| 1006 | 400 | 验证码错误 | 短信验证码不匹配或过期 |
| 1007 | 400 | 用户未设置密码 | 第三方登录用户首次设置密码前 |

#### 7.3.2 2xxx 线索与邀约

| 错误码 | HTTP | 描述 | 触发场景 |
|--------|------|------|----------|
| 2001 | 404 | 线索不存在 | 查询的 lead_id 不存在或已删除 |
| 2002 | 409 | 重复线索，无法重复转换 | 同 phone + channel 24 小时内重复提交，或已转谈案的线索再次转换 |
| 2003 | 400 | 线索状态变更不合法 | 状态机非法跳转（如 new 直接转 converted） |
| 2004 | 400 | 必填字段缺失 | phone、source_channel 等必填字段为空 |
| 2005 | 404 | 邀约任务不存在 | invite_task_id 不存在 |

#### 7.3.3 3xxx 案件

| 错误码 | HTTP | 描述 | 触发场景 |
|--------|------|------|----------|
| 3001 | 404 | 案件不存在 | case_id 不存在 |
| 3002 | 403 | 无权限操作该案件 | 跨律所访问或律师访问非自己承办案件 |
| 3003 | 400 | 案件状态变更不合法 | 已结案案件再次结案、已取消案件重新打开 |
| 3004 | 400 | 案件类型不支持 | case_type 不在枚举范围内 |
| 3005 | 404 | 案件任务不存在 | case_task_id 不存在 |
| 3006 | 400 | 任务指派失败 | 被指派人不存在或非律师角色 |

#### 7.3.4 4xxx 合规

| 错误码 | HTTP | 描述 | 触发场景 |
|--------|------|------|----------|
| 4001 | 422 | 合规检查未通过 | 营销内容/话术/合同触发 reject 规则 |
| 4002 | 400 | 合规规则不存在 | rule_id 不存在 |
| 4003 | 403 | 无权限处理合规工单 | 非合规管理员尝试处理 |
| 4004 | 400 | 投诉工单状态变更不合法 | 已关闭工单再次处理 |
| 4005 | 422 | 风险告知未签署 | 案件未完成风险告知书签署 |

#### 7.3.5 5xxx 财务

| 错误码 | HTTP | 描述 | 触发场景 |
|--------|------|------|----------|
| 5001 | 400 | 金额异常 | 金额 ≤ 0、received > contract、commission > base |
| 5002 | 409 | 发票重复 | invoice_no 已存在 |
| 5003 | 400 | 分润规则未配置 | 案件未关联 CommissionRule |
| 5004 | 422 | 分润条件未满足 | 案件未结案或应收未完成 |
| 5005 | 404 | 收款记录不存在 | payment_record_id 不存在 |
| 5006 | 400 | 退款金额超出实收 | refund.amount > payment.amount |
| 5007 | 409 | 收款重复（transaction_id 重复） | 同一第三方交易号已入账 |

#### 7.3.6 6xxx 客户端

| 错误码 | HTTP | 描述 | 触发场景 |
|--------|------|------|----------|
| 6001 | 401 | 客户未认证 | C 端 H5 访问缺少 client token |
| 6002 | 403 | 案件不匹配当前客户 | 客户访问非自己的案件详情 |
| 6003 | 400 | 评价已提交 | 同一案件客户重复评价 |
| 6004 | 404 | 客户咨询不存在 | consultation_id 不存在 |

#### 7.3.7 9xxx 系统

| 错误码 | HTTP | 描述 | 触发场景 |
|--------|------|------|----------|
| 9001 | 500 | 数据库错误 | SQL 执行失败、连接超时 |
| 9002 | 400 | 文件上传失败 | 文件大小超限、MIME 不在白名单、存储服务不可用 |
| 9003 | 503 | 服务暂不可用 | 健康检查失败、依赖服务（如 AI、OCR）不可用 |
| 9004 | 429 | 请求过于频繁，请稍后重试 | 触发限流（见 7.5） |
| 9005 | 500 | 第三方服务调用失败 | 短信/支付/IM 服务超时或返回错误 |
| 9006 | 500 | 服务器内部错误 | 未捕获异常，自动记录完整堆栈到日志 |

### 7.4 鉴权方式

#### 7.4.1 JWT 登录流程

1. 客户端调用 `POST /api/auth/login`，请求体：

```json
{
  "phone": "13800001234",
  "password": "明文密码"
}
```

2. 服务端 `AuthService.login` 执行流程：
   - 通过 `UserService.findByPhone` 查询用户。
   - 校验账号状态（`status = true`）。
   - 使用 `bcrypt.compare` 校验密码。
   - 签发 JWT：`JwtService.sign({ sub: user.id, phone: user.phone, role: user.role })`，有效期 24 小时，密钥从 `JWT_SECRET` 环境变量读取。

3. 服务端返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "real_name": "张三",
      "phone": "138****1234",
      "role": "admin",
      "organization_id": "org-uuid-xxx"
    }
  }
}
```

#### 7.4.2 请求头鉴权

后续所有受保护接口要求在请求头携带：

```
Authorization: Bearer <access_token>
```

前端 `axios.ts` 在请求拦截器中自动从 `localStorage.getItem('token')` 读取并注入：

```typescript
config.headers.Authorization = `Bearer ${token}`
```

#### 7.4.3 Token 校验与刷新机制

| 机制 | 说明 |
|------|------|
| 校验时机 | `JwtAuthGuard` 全局守卫拦截，调用 `JwtStrategy.validate` 通过 `payload.sub` 反查用户 |
| 失效时间 | JWT `expiresIn: '24h'`，过期返回 `401 1002 Token已过期` |
| 滑动续期 | 服务端检测到 token 剩余有效期 < 2 小时时，在响应头返回 `X-Token-Refreshed: <new_token>`，前端拦截器自动更新 localStorage |
| 硬过期 | 同一 token 签发满 7 天后强制重新登录，防止长期持有风险 |
| 401 处理 | 前端响应拦截器检测 `status === 401`，清除 token 并重定向到 `/login` |
| Token 注销 | 提供 `POST /api/auth/logout` 接口，将 token 加入 Redis 黑名单（如未启用 Redis 则依赖客户端清除） |

#### 7.4.4 角色权限校验

| 角色 | 权限范围 | 校验方式 |
|------|----------|----------|
| admin（律所管理员） | 律所内全部数据 | `@Roles('admin')` 装饰器 + `RolesGuard` |
| lawyer（律师） | 自己承办的案件 + 案件任务 + 相关证据 | 查询时强制 `assignee_lawyer_id = req.user.id` |
| sales（销售） | 自己负责的线索 + 跟进记录 | 查询时强制 `assign_sales_id = req.user.id` |
| negotiator（谈案） | 自己负责的 Opportunity | 查询时强制 `negotiator_id = req.user.id` |
| finance（财务） | 律所内全部财务数据 | `@Roles('finance','admin')` |
| client（C 端客户） | 自己的案件 + 评价 + 咨询 | 单独 client token，校验 `client_id` 关联案件 |

#### 7.4.5 数据权限校验

所有查询接口在 Service 层强制注入 `organization_id` 过滤：

```typescript
// LeadService.findAll 示例
const finalOrgId = orgId || req?.user?.organization_id;
return this.leadRepository.find({
  where: { organization_id: finalOrgId, ...filters },
});
```

跨律所访问返回 `403 1004 无权限访问该资源`。

### 7.5 限流策略

限流采用双层防护：Nginx 层 IP 限流 + 应用层用户级限流（基于 `@nestjs/throttler`）。超限返回 `429 9004 请求过于频繁`。

#### 7.5.1 接口限流配置

| 接口类型 | 限流维度 | 阈值 | 实现 |
|----------|----------|------|------|
| 普通业务接口 | 单用户 | 100 次/分钟 | `ThrottlerModule` 按 `req.user.id` 限流；超限返回 429 |
| 登录接口 | 单 IP | 10 次/分钟 | Nginx `limit_req zone=login burst=10`；按 IP 维度 |
| 文件上传接口 | 单用户 | 5 次/分钟 | `@Throttle(5, 60)` 装饰器 + 文件大小校验 |
| 报表导出接口 | 单用户 | 5 次/小时 | 自定义 Throttler Guard，按小时窗口限流 |
| 公开接口（C 端） | 单 IP | 60 次/分钟 | Nginx 限流，防止恶意爬取 |
| AI 调用接口 | 单用户 | 30 次/分钟 | AI 模块独立限流，防止滥用 |

#### 7.5.2 防刷机制

| 场景 | 防刷策略 | 触发条件 |
|------|----------|----------|
| 登录防爆破 | 图形验证码 | 同一 IP 1 分钟内失败 ≥ 3 次时，下次登录需输入图形验证码 |
| 短信验证码 | 1 分钟 1 条、1 小时 5 条、1 天 10 条 | 同一手机号 |
| 注册防刷 | 滑块验证 + IP 限频 | 同一 IP 24 小时注册 ≥ 5 个账号触发风控审核 |
| 线索提交 | 同手机号 24 小时去重 | 落地页表单提交场景 |
| 接口调用 | 黑名单机制 | 触发限流 ≥ 10 次的 IP/用户加入黑名单 1 小时 |

#### 7.5.3 文件上传限制

| 限制项 | 配置值 | 实现层 |
|--------|--------|--------|
| 文件类型白名单 | image/jpeg、image/png、image/gif、application/pdf、application/msword、application/vnd.openxmlformats-officedocument.wordprocessingml.document、application/vnd.ms-excel、application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | 后端 `FileInterceptor` MIME + 文件头魔数双重校验 |
| 单文件大小 | 10 MB | Nginx `client_max_body_size 10m` + 后端 `limits.fileSize: 10 * 1024 * 1024` |
| 单次上传数量 | 5 个 | 前端 `Upload` 组件 `maxCount` 限制 |
| 上传频率 | 5 次/分钟/用户 | 应用层 `@Throttle` |
| 存储隔离 | 私有桶 + 预签名 URL | 腾讯云 COS，证据文件不公网可访问 |
| 病毒扫描 | 上传后异步扫描 | 接入腾讯云 CAV（如启用），扫描结果回写 `is_safe` 字段 |

## 第8章 UI/UX规范

### 8.1 设计系统

本产品UI/UX遵循"权威、专业、正式"的法律行业视觉语言，以深藏青为主色基调、暗金为点缀色，搭配蓝渐变强调交互动作，整体呈现稳重的法律权威感。设计系统由颜色、字体、圆角、阴影、动画五个维度构成，所有前端组件统一基于Ant Design 6.x并通过`ConfigProvider`注入主题Token，确保视觉一致性。

#### 8.1.1 颜色系统

| 颜色类别 | 色值 | 用途说明 | 使用场景 |
|---|---|---|---|
| 主色（强调色） | `#0071e3` | 主操作按钮、链接、选中态、Tab激活态、Focus边框 | 主按钮背景、链接文字、菜单选中、输入框聚焦边框、分页当前页 |
| 蓝色渐变 | `#0071e3 → #00a8ff` | CTA按钮、品牌标识、关键数据高亮 | 首页主视觉按钮、登录按钮、KPI核心指标卡片渐变背景 |
| 深藏青 | `#1a2332` | PC端侧边栏背景、深色容器、页头深色主题 | 管理后台侧边栏、登录页左侧品牌区、页头深色模式 |
| 暗金 | `#c9a961` | 品牌点缀、侧边栏激活态、统计数字、徽章 | 侧边栏菜单选中高亮、Logo描边、Avatar边框、关键统计数据 |
| 主文本 | `#1d1d1f` | 正文标题、表格内容、表单值 | 一级标题、卡片标题、表格数据、详情值 |
| 次文本 | `#6e6e73` | 辅助说明、表单标签、表头、占位符 | 表单Label、表格表头、卡片副标题、空状态文案 |
| 背景色 | `#f5f5f7` | 页面整体背景、内容区底色 | Layout内容区背景、Tab切换底色 |
| 卡片背景 | `#ffffff` | 卡片、表格、弹窗、输入框背景 | 所有信息容器背景、Modal内容区、表单容器 |
| 边框色 | `#d2d2d7` | 卡片边框、分隔线、表格行分隔、输入框边框 | 卡片描边、表格行分割线、表单控件默认边框 |
| 成功色 | `#34c759` | 成功状态、成功提示、已完成进度 | message.success提示、Status标签"已完成"、进度条完成态 |
| 警告色 | `#ff9500` | 警告状态、待处理提示、即将到期标记 | Status标签"待处理"、预警提示、即将到期案件标记 |
| 错误色 | `#ff3b30` | 错误状态、删除操作、必填校验失败 | message.error提示、删除按钮、表单校验错误、错误状态标签 |

#### 8.1.2 字体系统

| 字体类别 | 字体族 | 字重 | 使用场景 |
|---|---|---|---|
| 标题字体 | `Noto Serif SC`, `Source Han Serif SC`, `Songti SC`, serif | 500/600/700 | 页面主标题、卡片标题、Modal标题、统计数字、Logo文字 |
| 正文字体 | `Noto Sans SC`, `-apple-system`, `BlinkMacSystemFont`, `PingFang SC`, `Microsoft YaHei`, sans-serif | 400/500/600 | 正文内容、表单标签、按钮文字、表格数据、菜单项 |

字号梯队（行高统一为1.5）：

| 层级 | 字号 | 字重 | 行高 | 使用场景 |
|---|---|---|---|---|
| Display | 32px | 700 | 1.5 | 数据看板核心指标数字、登录页主标题 |
| H1 | 24px | 700 | 1.5 | 页面主标题（如"案件管理"） |
| H2 | 20px | 600 | 1.5 | 卡片区域标题、Modal标题 |
| H3 | 16px | 600 | 1.5 | 卡片标题、表格组标题、表单分组标题 |
| Body | 14px | 400/500 | 1.5 | 正文内容、表格数据、表单值、按钮文字（默认） |
| Caption | 12px | 400/500 | 1.5 | 辅助说明、标签Tag文字、表单Label、表头、时间戳 |

> **工程约束**：字体通过`index.css`顶部的`@import`从Google Fonts加载，并在`:root`中以CSS变量`--font-heading`与`--font-body`定义，AntD `ConfigProvider`的`token.fontFamily`注入正文字体。中文环境统一通过`antd/locale/zh_CN`与`dayjs/locale/zh-cn`配置中文。

#### 8.1.3 圆角系统

| 圆角类别 | 数值 | 使用场景 |
|---|---|---|
| 导航圆角 | 24px | PC端侧边栏Logo容器、C端底部导航激活态背景、品牌区圆角容器 |
| 卡片圆角 | 16px | 信息卡片、表格容器、Modal内容区、详情面板 |
| 按钮/输入框圆角 | 10px | 主按钮、次按钮、输入框、下拉选择器、数字输入框、日期选择器 |
| 标签圆角 | 12px | 状态标签Tag、徽章Badge、分类标记 |
| 圆形 | 50% | Avatar头像、Icon圆形容器、单选圆点、进度环 |

> **工程约束**：圆角值通过AntD `ConfigProvider`的`token.borderRadius`（默认10px）与组件级Token（`Card.borderRadiusLG=16`、`Button.borderRadius=10`、`Tag.borderRadiusSM=12`）注入；导航级24px圆角通过内联样式或自定义CSS类实现。

#### 8.1.4 阴影系统

| 阴影类别 | 阴影值 | 使用场景 |
|---|---|---|
| 卡片默认阴影 | `0 1px 4px rgba(0,0,0,0.04)` | 卡片静态状态、表格容器、详情面板默认态 |
| 悬浮阴影 | `0 4px 12px rgba(0,0,0,0.08)` | 卡片hover态、下拉菜单、Popover、悬浮按钮 |
| 弹层阴影 | `0 12px 24px rgba(0,0,0,0.1)` | Modal弹窗、Drawer抽屉、全局浮层 |
| 侧边栏阴影 | `2px 0 12px rgba(0,0,0,0.08)` | PC端固定侧边栏右侧投影 |

> **工程约束**：阴影通过`index.css`的`:root`定义CSS变量`--shadow-sm`/`--shadow-md`/`--shadow-lg`，并在AntD组件覆盖样式中引用。

#### 8.1.5 动画规范

| 动画属性 | 规范值 | 使用场景 |
|---|---|---|
| 缓动函数（easing） | `cubic-bezier(0.4, 0, 0.2, 1)` | 所有过渡动画的默认缓动曲线 |
| 过渡时长 | 200ms | 颜色变化、背景变化、边框变化、transform位移 |
| 快速反馈时长 | 150ms | 按钮点击、Tab切换、hover态反馈 |
| 慢速过渡时长 | 300ms | 侧边栏折叠展开、抽屉滑出、Modal淡入 |

典型动画场景：
- 按钮hover/press：`transform: scale(0.97)`，150ms过渡
- 卡片hover：`transform: translateY(-2px)` + 悬浮阴影，200ms过渡
- 侧边栏折叠：`width`与`margin-left`联动过渡，300ms
- Tab切换：ink-bar滑动200ms，内容区淡入`fadeInUp` 300ms
- C端页面切换：`fadeInUp`动画（opacity 0→1，translateY 8px→0），300ms

#### 8.1.6 前端路由架构

**技术栈**：React 18 + TypeScript + React Router v6 + Ant Design 6.x + Vite

**路由结构**：

| 端 | 路由前缀 | 布局组件 | 路由数量 | 路由守卫 |
|---|---|---|---|---|
| B端管理后台 | `/` | 8大Layout布局 | 56条 | ProtectedRoute（JWT校验+角色校验） |
| C端客户门户 | `/client` | ClientLayout | 13条 | ClientRoute（客户身份校验） |
| 登录页 | `/login`, `/client/login` | 无Layout（独立页面） | 2条 | 无（公开访问） |

**B端8大Layout布局对应关系**：

| Layout名称 | 对应模块 | 路由路径前缀 | 典型页面 |
|---|---|---|---|
| DashboardLayout | 数据看板 | `/dashboard` | 经营总览、投放ROI、销转漏斗、财务报表 |
| MarketingLayout | 投放营销 | `/marketing` | 广告账户、投放计划、投放素材、数据回传、数字人直播 |
| CRMLayout | 线索CRM | `/crm` | 线索池、商机管理、邀约任务、公海池、谈案SOP |
| CaseLayout | 案件办理 | `/case` | 案件列表、案件详情、办案SOP、卷宗管理、法律文书 |
| ComplianceLayout | 合规风控 | `/compliance` | 合规规则、营销预审、谈案质检、案件合规、财务合规、投诉管理 |
| FinanceLayout | 财务管理 | `/finance` | 应收台账、收款记录、发票管理、退费审批、分润核算、对账管理 |
| SCRMLayout | 私域运营 | `/scrm` | 客户标签、聊天存档、触达任务、话术库 |
| SettingsLayout | 系统设置 | `/settings` | 角色权限、菜单管理、品牌配置、部署配置、第三方集成、组织管理 |

**C端路由（/client前缀）**：

| 路由路径 | 页面功能 |
|---|---|
| `/client/login` | C端登录（手机号+验证码） |
| `/client/dashboard` | 客户首页（我的案件） |
| `/client/case/:id` | 案件详情 |
| `/client/case/:id/progress` | 案件进度 |
| `/client/case/:id/documents` | 案件材料 |
| `/client/consult` | AI咨询/人工咨询 |
| `/client/payment` | 在线支付 |
| `/client/invoice` | 发票申请 |
| `/client/complaint` | 投诉提交 |
| `/client/rating` | 服务评价 |
| `/client/profile` | 个人中心 |
| `/client/messages` | 消息通知 |
| `/client/help` | 帮助中心 |

**路由守卫实现**：
- `ProtectedRoute`：校验localStorage中的JWT token有效性，无效则重定向至`/login`；同时校验用户角色是否有权限访问该路由
- `ClientRoute`：校验C端客户token，无效则重定向至`/client/login`
- 登录状态用户访问`/login`时自动重定向至对应首页（B端→`/dashboard`，C端→`/client/dashboard`）

**主题配置**：通过Ant Design 6.x的`ConfigProvider`注入主题Token，主色`#0071e3`、深藏青`#1A2332`、暗金`#C9A961`，采用Material Design 3风格的圆角与阴影系统。

### 8.2 交互规范

#### 8.2.1 Tab按需加载

- **只获取当前Tab数据**：所有多Tab页面必须采用按需加载策略，切换到某Tab时才发起该Tab对应的数据请求，避免首次进入页面全量加载所有Tab数据。
- **实现方式**：Tab的`onChange`事件触发对应数据加载函数，已加载过的Tab数据可缓存于组件state中，再次切回时若数据未变更则直接使用缓存，避免重复请求。
- **加载态展示**：每个Tab内容区在数据加载期间独立展示`Spin`加载动画，不影响其他Tab。
- **AntD 6.x规范**：Tabs组件必须使用`items`配置数组形式，禁止使用已废弃的`TabPane`子组件。

```tsx
// 正确写法（AntD 6.x）
<Tabs
  items={[
    { key: 'all', label: '全部', children: <AllTabContent /> },
    { key: 'pending', label: '待处理', children: <PendingTabContent /> },
  ]}
  onChange={(key) => loadTabData(key)}
/>
```

#### 8.2.2 AntD 6.x 组件规范

| 组件 | 规范要求 | 禁止用法 |
|---|---|---|
| Modal | 使用`open`属性控制显隐，配合`onCancel`关闭 | 禁止使用已废弃的`visible`属性 |
| Tabs | 使用`items`数组配置项 | 禁止使用`TabPane`子组件 |
| Form | 使用`Form.useForm()`hook管理表单，`Form.Item`的`name`与`rules`配置校验 | 禁止受控value与Form混用 |
| Drawer | 使用`open`属性控制显隐 | 禁止使用`visible`属性 |
| Dropdown | 使用`menu={{ items, onClick }}`配置 | 禁止使用`overlay`属性传递ReactNode |
| message | 函数式调用`message.success()`/`message.error()` | 禁止使用`Message`类组件形式 |

#### 8.2.3 表单校验规范

- **实时校验**：表单字段在`onChange`或`onBlur`时触发实时校验，校验失败时字段下方即时显示红色错误提示，错误文字使用`#ff3b30`。
- **提交校验**：表单提交时调用`form.validateFields()`进行全量校验，校验失败自动滚动定位到第一个错误字段，并阻止提交。
- **必填标记**：必填字段的Label前显示红色`*`号，由AntD `Form.Item`的`required`属性自动渲染。
- **校验规则**：通过`rules`数组配置，包含`required`（必填）、`pattern`（正则）、`max`/`min`（长度）、`validator`（自定义校验函数）。

#### 8.2.4 加载状态规范

| 场景 | 组件 | 使用规范 |
|---|---|---|
| 页面初次加载 | `Spin`包裹整页 | 居中展示`Spin`，size为`large`，加载完成后淡入内容 |
| 表格数据加载 | `Table`的`loading`属性 | 表格区域展示`Spin`，表头保留 |
| 卡片数据加载 | `Skeleton`骨架屏 | 卡片内容区展示骨架屏，模拟真实内容布局 |
| 按钮提交中 | `Button`的`loading`属性 | 按钮展示loading图标，禁用点击 |
| 局部数据刷新 | `Spin`包裹局部 | size为`small`，仅包裹刷新区域 |

#### 8.2.5 空状态规范

- **统一组件**：使用AntD `Empty`组件展示空状态，包含插图与文案。
- **文案规范**：空状态文案需明确说明"暂无XX数据"，如"暂无线索"、"暂无案件"、"暂无搜索结果"。
- **引导操作**：空状态下方可提供引导按钮，如"新建线索"、"导入数据"、"调整筛选条件"。
- **不同场景**：列表空、搜索结果空、筛选结果空需区分文案，引导用户下一步操作。

#### 8.2.6 反馈提示规范

| 反馈类型 | 组件 | 使用场景 | 持续时长 |
|---|---|---|---|
| 成功反馈 | `message.success` | 操作成功（创建、更新、删除、提交） | 2秒 |
| 错误提示 | `message.error` | 操作失败、接口报错、业务校验失败 | 3秒 |
| 警告提示 | `message.warning` | 非阻断性警告（如"即将到期"） | 2秒 |
| 信息提示 | `message.info` | 中性信息提示 | 2秒 |
| 操作确认 | `Modal.confirm` | 删除、批量操作、状态变更、不可逆操作 | 阻塞式，需用户确认 |
| 全局通知 | `notification` | 异步任务完成、后台消息推送 | 4.5秒，可手动关闭 |

- **Modal.confirm规范**：危险操作（删除、撤销）使用`danger`类型，标题红色警告；普通确认使用默认样式。确认按钮文案需明确动作（如"确认删除"、"确认提交"），禁止使用模糊的"确定"。
- **错误反馈链路**：接口请求失败时，统一拦截HTTP错误，提取`message`字段通过`message.error`展示，避免重复弹窗。

### 8.3 响应式设计要求

#### 8.3.1 端侧适配范围

| 端侧 | 适配分辨率范围 | 主要场景 |
|---|---|---|
| PC端（管理后台） | 最小1280px，优化1440px，最大适配1920px | 律所内部运营管理，8大模块全部功能 |
| C端H5（客户端口） | 375px-414px（主流手机），兼容360px-768px | 客户案件查看、AI咨询、签约支付、投诉评价 |

#### 8.3.2 断点定义

| 断点名称 | 宽度范围 | 设备类型 | 布局策略 |
|---|---|---|---|
| xs | < 768px | 手机（C端H5） | 单列布局，底部导航固定，卡片全宽 |
| sm | 768px - 1024px | 平板（过渡态） | 双列布局，侧边栏可折叠 |
| md/lg/xl | ≥ 1024px | 桌面（PC管理后台） | 多列布局，固定侧边栏 + 顶部页头 |

#### 8.3.3 栅格系统

- **栅格基础**：基于AntD `Row`/`Col`的24列栅格系统。
- **PC端典型布局**：详情页采用`gutter={16}`的双列布局（`Col span={12}`），表单页采用单列居中（`Col span={16} offset={4}`），列表页采用全宽（`Col span={24}`）。
- **C端典型布局**：统一单列布局，卡片全宽，内容内边距16px。

#### 8.3.4 PC端响应式要求

- **侧边栏可折叠**：PC端`Layout`组件的`Sider`支持`collapsible`折叠/展开，折叠后宽度80px仅展示图标，展开宽度220px展示图标+文字。折叠状态通过`collapsed`state管理，过渡动画300ms。
- **页头固定**：顶部`Header`固定（`position: fixed`），随侧边栏折叠联动调整`left`定位。
- **内容区自适应**：`Content`区域的`marginLeft`随侧边栏折叠状态联动（80px/220px），内容区内边距24px。
- **分辨率适配**：在1280px-1920px范围内，卡片栅格列数自适应调整（1920px可展示4列KPI卡片，1280px展示2列）。

#### 8.3.5 C端H5响应式要求

- **底部导航固定**：C端`BottomNav`组件`position: fixed`固定于底部，4个Tab（案件/咨询/投诉/签约）均分宽度，激活态展示主色背景与高亮图标。
- **安全区域适配**：底部导航的`paddingBottom`使用`max(12px, env(safe-area-inset-bottom))`适配iPhone底部安全区域。
- **触控优化**：所有可点击元素最小触控区域44px×44px，按钮高度统一44px（小尺寸32px），消除移动端300ms点击延迟（`touch-action: manipulation`）。
- **C端按钮组件**：使用`ClientButton`组件，支持`primary`/`secondary`/`outline`/`ghost`四种variant与`small`/`medium`/`large`三种尺寸，按下态`transform: scale(0.97)`反馈。
- **移动端样式覆盖**：通过`@media screen and (max-width: 768px)`覆盖AntD组件样式，输入框高度提升至44px，字号保持14px，表格字号缩小至13px。

### 8.4 无障碍要求

#### 8.4.1 键盘导航

| 操作 | 快捷键 | 使用场景 |
|---|---|---|
| 焦点切换 | `Tab` / `Shift + Tab` | 在可交互元素间正向/反向切换焦点 |
| 确认操作 | `Enter` | 激活当前焦点元素（按钮、链接、菜单项） |
| 取消操作 | `Esc` | 关闭Modal、Drawer、Popover、下拉菜单 |
| 表单提交 | `Enter`（在输入框内） | 提交当前表单（单输入框场景） |

- **焦点顺序**：DOM结构需保证Tab焦点顺序与视觉阅读顺序一致（从左到右、从上到下）。
- **可聚焦元素**：所有可交互元素（按钮、链接、输入框、选择器）必须可通过键盘聚焦，禁止使用`tabindex="-1"`移除可聚焦性（除非有明确替代方案）。

#### 8.4.2 色彩对比度

| 元素类型 | 对比度要求 | 验证依据 |
|---|---|---|
| 正文文字与背景 | ≥ 4.5:1 | WCAG 2.1 AA级标准 |
| 大字号文字（≥ 24px或≥ 18.66px加粗）与背景 | ≥ 3:1 | WCAG 2.1 AA级标准 |
| 图形元素与背景 | ≥ 3:1 | 图标、图表、状态标识 |
| 焦点指示器与背景 | ≥ 3:1 | 焦点边框、焦点阴影 |

- **主文本`#1d1d1f`与白色背景`#ffffff`**：对比度约15.9:1，满足要求。
- **次文本`#6e6e73`与白色背景`#ffffff`**：对比度约4.8:1，满足正文要求。
- **主色`#0071e3`与白色背景`#ffffff`**：对比度约4.5:1，满足正文要求。

#### 8.4.3 ARIA标签

| ARIA属性 | 使用场景 | 示例 |
|---|---|---|
| `aria-label` | 仅含图标的按钮、无文字链接 | `<Button icon={<BellOutlined />} aria-label="通知" />` |
| `aria-describedby` | 表单字段关联帮助文案 | `<Input aria-describedby="phone-help" />` + `<span id="phone-help">请输入11位手机号</span>` |
| `aria-required` | 必填表单字段 | `<Input aria-required="true" />` |
| `aria-invalid` | 校验失败的字段 | `<Input aria-invalid="true" />` |
| `role` | 自定义组件语义化 | `<div role="navigation">`、`<div role="dialog">` |
| `aria-expanded` | 可折叠菜单/面板 | 侧边栏子菜单展开状态 |
| `aria-live` | 动态更新的内容区域 | `aria-live="polite"`用于Toast、消息提示 |

#### 8.4.4 焦点可见性

- **焦点样式**：移除默认`outline: none`后，通过`box-shadow`提供焦点指示器，使用主色`#0071e3`的3px半透明环：
  ```css
  :focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.3);
  }
  ```
- **焦点指示器对比度**：焦点环颜色与背景对比度≥3:1，确保在任意背景下可见。
- **禁止全局移除焦点**：禁止使用`* { outline: none; }`全局移除焦点样式，仅在`:focus-visible`状态下替换为更美观的`box-shadow`。

#### 8.4.5 图片无障碍

- **装饰性图片**：`alt=""`空属性，避免屏幕阅读器朗读冗余信息。
- **信息性图片**：`alt`属性描述图片内容，如`<img src={logo} alt="法智汇Logo" />`。
- **图标按钮**：使用`aria-label`描述按钮功能，图标本身设置`aria-hidden="true"`避免重复朗读。

---

## 第9章 集成与部署规范

### 9.1 第三方平台对接规范

本产品需对接5大广告/社交平台、2大协同办公平台、2大腾讯云基础能力，共9类第三方接口。所有第三方对接遵循"密钥集中配置、回调统一处理、失败可降级、调用全留痕"原则。

#### 9.1.1 第三方平台对接清单

| 平台名称 | 对接能力 | 授权方式 | 核心接口 | 回调处理 |
|---|---|---|---|---|
| 抖音（巨量引擎） | 广告账户管理、投放计划管控、转化数据回传、素材管理 | OAuth 2.0授权码模式，获取access_token与refresh_token，token有效期10小时，refresh_token有效期30天 | 账户查询`/v3.0/advertiser/list/`、计划CRUD`/v3.0/ad/get/`、计划启停`/v3.0/ad/update/status/`、转化数据`/v3.0/convert/data/`、回传转化`/v3.0/convert/upload/` | 回调URL配置于抖音开放平台，接收转化回传确认、计划状态变更通知，验签后写入`AdPlanLog`，失败重试3次 |
| 百度营销 | 广告账户绑定、投放计划查询、转化数据同步 | OAuth 2.0授权码模式，token有效期7天，支持刷新 | 账户信息`/json/sms/service/AccountInfo/getAccountInfo`、计划查询`/json/sms/service/Campaign/getCampaign`、转化回传`/json/sms/service/ConvertData/uploadConvertData` | 回调接收百度营销转化回包，校验click_id后写入`ConversionEvent`，幂等去重 |
| 快手广告 | 广告账户绑定、投放计划管控、转化数据回传 | OAuth 2.0授权码模式，token有效期30天，支持刷新 | 账户列表`/openapi/v2/advertiser/list`、计划CRUD`/openapi/v2/campaign/create`、转化回传`/openapi/v2/convert/upload` | 回调URL配置于快手磁力引擎，接收转化回传确认，写入`ConversionEvent`并触发分润前置校验 |
| 腾讯广告 | 广告账户绑定、投放计划查询、转化数据同步 | OAuth 2.0授权码模式，token有效期12小时，refresh_token有效期30天 | 账户信息`/v3.0/wechat_advertiser/get`、计划查询`/v3.0/adgroup/get`、转化回传`/v3.0/user_actions/add` | 回调接收腾讯广告转化回包，校验user_action_set_id后写入`ConversionEvent` |
| 企业微信 | 客户管理、侧边栏、聊天存档、客户标签、私域触达 | 企业自建应用，获取corpid+corpsecret，调用`/cgi-bin/gettoken`获取access_token，有效期7200秒，需定时刷新 | 客户列表`/cgi-bin/externalcontact/list`、客户详情`/cgi-bin/externalcontact/get`、侧边栏配置`/cgi-bin/agent/get_sidebars`、聊天存档`/cgi-bin/msgaudit/check_single_agree`、群发触达`/cgi-bin/externalcontact/add_msg_template` | 接收企微事件回调（客户添加、客户删除、聊天存档授权变更），验签后更新`ScrmClient`与`ChatArchive`，回调超时5秒响应success |
| 飞书 | 审批流程、消息推送、日历同步 | 企业自建应用，获取app_id+app_secret，调用`/open-apis/auth/v3/tenant_access_token/internal`获取tenant_access_token，有效期2小时 | 审批创建`/open-apis/approval/v4/instances/create`、审批查询`/open-apis/approval/v4/instances/get`、消息发送`/open-apis/im/v1/messages`、日历事件`/open-apis/calendar/v4/calendars` | 接收飞书审批状态变更回调（审批通过/拒绝/撤销），更新本地`Approval`记录，回调超时3秒响应200 |
| 腾讯云短信 | 验证码发送、通知短信 | 腾讯云SecretId+SecretKey签名认证，调用SMS服务API | 发送验证码`SmsService.SendSms`，模板ID预配置于腾讯云控制台，签名内容为"法智汇" | 无回调（同步返回发送结果），发送状态通过`SmsService.PullSmsSendStatus`异步拉取，失败重试3次 |
| 腾讯云COS | 文件上传、文件下载、文件预览 | 腾讯云SecretId+SecretKey签名认证，使用COS Node.js SDK | 对象上传`cos.putObject`、分片上传`cos.sliceUploadFile`、对象下载`cos.getObject`、临时URL`cos.getObjectUrl` | 无回调，上传成功后返回文件URL与ETag，写入`File`表，失败自动重试3次 |
| 腾讯云IM（可选） | C端消息推送、AI咨询消息通道 | 腾讯云SecretId+SecretKey签名认证，创建IM应用获取SDKAppID | 创建用户`/v4/im_open_login_svc/account_import`、发送消息`/v4/group_open_http_svc/send_group_msg`、消息历史`/v4/group_open_http_svc/get_group_msg` | 接收IM事件回调（消息已读、消息撤回），更新`CasePushNotification`阅读状态 |

#### 9.1.2 对接通用规范

- **密钥管理**：所有第三方密钥（access_token、refresh_token、SecretId、SecretKey）统一存储于环境变量与数据库加密字段，禁止硬编码于代码中。access_token通过定时任务在过期前5分钟自动刷新。
- **调用留痕**：所有第三方接口调用记录写入`ApiCallLog`表，包含平台、接口、请求参数、响应结果、耗时、调用时间，便于追溯与排障。
- **失败降级**：第三方接口调用失败时，不影响核心业务流程，降级策略包括：①重试3次（指数退避1s/2s/4s）；②降级为本地手动操作；③通过message提示用户"第三方服务暂不可用，请稍后重试"。
- **限流保护**：调用第三方接口遵循对方限流策略，本产品侧通过队列控制调用频率（如抖音API每秒≤10次），超限请求进入排队。
- **回调验签**：所有回调接口必须验签，抖音使用`signature`字段SHA1验签，企微使用`EncodingAESKey`解密，飞书使用`encrypt`字段解密，验签失败返回403。

### 9.2 部署架构

#### 9.2.1 整体架构

本产品采用腾讯云CVM + Docker容器化 + Nginx反向代理的部署架构，前后端分离部署，单机SQLite存储（可平滑升级至PostgreSQL），适用于10-500人规模律所的中小规模部署场景。

**架构组成（文字描述）**：

```
                    ┌─────────────────────────────────┐
                    │        用户终端（浏览器）         │
                    │  PC端管理后台 / C端H5客户端口    │
                    └───────────────┬─────────────────┘
                                    │ HTTPS
                                    ▼
                    ┌─────────────────────────────────┐
                    │     腾讯云CVM（2核4G起步）       │
                    │  ┌───────────────────────────┐  │
                    │  │      Nginx反向代理        │  │
                    │  │  /api/* → 后端3000端口    │  │
                    │  │  /* → 前端静态资源        │  │
                    │  │  SSL终结 + gzip压缩       │  │
                    │  └──────┬────────────┬───────┘  │
                    │         │            │          │
                    │         ▼            ▼          │
                    │  ┌──────────┐  ┌──────────┐    │
                    │  │ 前端容器 │  │ 后端容器 │    │
                    │  │  Nginx   │  │ NestJS   │    │
                    │  │ 静态资源 │  │ Node 20  │    │
                    │  │  dist/   │  │ 端口3000 │    │
                    │  └──────────┘  └────┬─────┘    │
                    │                     │          │
                    │         ┌───────────┼────────┐ │
                    │         ▼           ▼        ▼ │
                    │  ┌──────────┐ ┌─────────┐ ┌─────────┐
                    │  │ SQLite   │ │ 文件存储│ │ 日志存储│
                    │  │ /data/db/│ │/data/   │ │/data/   │
                    │  │fazhihui. │ │uploads/ │ │logs/    │
                    │  │   db     │ │         │ │         │
                    │  └──────────┘ └─────────┘ └─────────┘
                    └─────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │       腾讯云对象存储COS          │
                    │  大文件/证据/合同/素材存储        │
                    └─────────────────────────────────┘
```

#### 9.2.2 部署组件说明

| 组件 | 镜像/版本 | 资源配额 | 数据卷挂载 | 说明 |
|---|---|---|---|---|
| Nginx反向代理 | `nginx:1.25-alpine` | 128MB内存 | `/etc/nginx/conf.d`配置文件 | 监听80/443端口，SSL终结，`/api/*`转发至后端，`/*`返回前端静态资源 |
| 前端容器 | 自构镜像（基于`nginx:1.25-alpine`） | 64MB内存 | `/usr/share/nginx/html`静态资源 | 构建产物`dist/`目录，由Vite构建产出 |
| 后端容器 | 自构镜像（基于`node:20.17-alpine`） | 1GB内存起步 | `/data`数据目录 | NestJS应用，监听3000端口，连接SQLite |
| SQLite数据库 | 文件型数据库，无独立容器 | - | `/data/db/fazhihui.db` | 单机文件存储， WAL模式开启，可平滑迁移至PostgreSQL |
| 文件存储 | 宿主机目录 | 按需扩容 | `/data/uploads/` | 用户上传的小文件本地存储，大文件转存腾讯云COS |
| 日志存储 | 宿主机目录 | 10GB滚动 | `/data/logs/` | Winston日志按天切割，保留30天 |

#### 9.2.3 Nginx反向代理配置

```nginx
server {
    listen 80;
    server_name fazhihui.example.com;
    # HTTP强制跳转HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name fazhihui.example.com;

    ssl_certificate     /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # 前端静态资源
    location / {
        root   /usr/share/nginx/html;
        index  index.html;
        try_files $uri $uri/ /index.html;  # SPA路由回退
        gzip on;
        gzip_types text/css application/javascript application/json;
    }

    # 后端API代理
    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # 文件上传大小限制
        client_max_body_size 10M;
        # 超时设置
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://backend:3000/health;
        access_log off;
    }
}
```

#### 9.2.4 数据存储方案

| 存储类型 | 存储路径 | 备份策略 | 扩展方案 |
|---|---|---|---|
| SQLite数据库 | `/data/db/fazhihui.db` | 每日凌晨2点全量备份至`/data/backup/db/`，保留7天；同步上传至腾讯云COS异地备份 | 数据量超过10GB或并发超过500时，迁移至PostgreSQL，仅需修改`TypeOrmModule`配置 |
| 上传文件 | `/data/uploads/` | 每周全量备份至COS | 大文件（>10MB）直接上传至腾讯云COS，本地仅存元数据 |
| 日志文件 | `/data/logs/` | 按天切割，保留30天 | 超过30天自动清理，可选接入ELK集中化日志 |
| 备份文件 | `/data/backup/` | 本地保留7天 + COS异地备份 | 定期校验备份完整性 |

### 9.3 环境配置

#### 9.3.1 环境变量清单

| 变量名 | 说明 | 示例值 | 必填 |
|---|---|---|---|
| `JWT_SECRET` | JWT签名密钥，用于生成与验证Token | `fazhihui-jwt-secret-2026-xxx` | 是 |
| `JWT_EXPIRES_IN` | JWT Token有效期 | `24h`（24小时） | 是 |
| `JWT_REFRESH_EXPIRES_IN` | JWT刷新Token有效期 | `7d`（7天） | 是 |
| `DB_PATH` | SQLite数据库文件路径 | `/data/db/fazhihui.db` | 是 |
| `DB_LOGGING` | 数据库SQL日志开关 | `false`（生产环境）/`true`（开发环境） | 否 |
| `UPLOAD_DIR` | 文件上传目录 | `/data/uploads` | 是 |
| `PORT` | 后端服务监听端口 | `3000` | 是 |
| `VITE_API_BASE_URL` | 前端API基础地址 | `/api`（同域）或`https://api.fazhihui.com`（跨域） | 是 |
| `NODE_ENV` | Node.js运行环境 | `development` / `production` | 是 |
| `LOG_LEVEL` | 日志级别 | `error` / `warn` / `info` / `debug` | 是 |
| `DOUYIN_APP_ID` | 抖音开放平台应用ID | `tt-xxxxxxxx` | 否（启用抖音对接时必填） |
| `DOUYIN_APP_SECRET` | 抖音开放平台应用密钥 | `xxxxxxxxxxxxxxxx` | 否（启用抖音对接时必填） |
| `DOUYIN_CALLBACK_URL` | 抖音OAuth回调地址 | `https://fazhihui.com/api/oauth/douyin/callback` | 否 |
| `BAIDU_API_KEY` | 百度营销API Key | `xxxxxxxx` | 否（启用百度对接时必填） |
| `BAIDU_API_SECRET` | 百度营销API Secret | `xxxxxxxxxxxxxxxx` | 否（启用百度对接时必填） |
| `BAIDU_CALLBACK_URL` | 百度OAuth回调地址 | `https://fazhihui.com/api/oauth/baidu/callback` | 否 |
| `KUAISHOU_APP_ID` | 快手磁力引擎应用ID | `xxxxxxxx` | 否（启用快手对接时必填） |
| `KUAISHOU_APP_SECRET` | 快手磁力引擎应用密钥 | `xxxxxxxxxxxxxxxx` | 否（启用快手对接时必填） |
| `TENCENT_AD_APP_ID` | 腾讯广告应用ID | `xxxxxxxx` | 否（启用腾讯广告对接时必填） |
| `TENCENT_AD_APP_SECRET` | 腾讯广告应用密钥 | `xxxxxxxxxxxxxxxx` | 否（启用腾讯广告对接时必填） |
| `WECOM_CORP_ID` | 企业微信企业ID | `xxxxxxxxxxxxxxxx` | 否（启用企微对接时必填） |
| `WECOM_CORP_SECRET` | 企业微信应用Secret | `xxxxxxxxxxxxxxxx` | 否（启用企微对接时必填） |
| `WECOM_AGENT_ID` | 企业微信应用AgentId | `1000002` | 否（启用企微对接时必填） |
| `WECOM_CALLBACK_TOKEN` | 企业微信回调Token | `xxxxxxxx` | 否 |
| `WECOM_ENCODING_AES_KEY` | 企业微信回调加密密钥 | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | 否 |
| `FEISHU_APP_ID` | 飞书应用App ID | `cli_xxxxxxxx` | 否（启用飞书对接时必填） |
| `FEISHU_APP_SECRET` | 飞书应用App Secret | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | 否（启用飞书对接时必填） |
| `FEISHU_VERIFICATION_TOKEN` | 飞书事件订阅验证Token | `xxxxxxxxxxxxxxxx` | 否 |
| `TENCENT_CLOUD_SECRET_ID` | 腾讯云SecretId | `AKIDxxxxxxxxxxxxxxxx` | 是（短信、COS、IM均依赖） |
| `TENCENT_CLOUD_SECRET_KEY` | 腾讯云SecretKey | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | 是（短信、COS、IM均依赖） |
| `TENCENT_SMS_APP_ID` | 腾讯云短信应用SDKAppID | `1400000000` | 否（启用短信时必填） |
| `TENCENT_SMS_SIGN_NAME` | 短信签名内容 | `法智汇` | 否（启用短信时必填） |
| `TENCENT_SMS_TEMPLATE_ID` | 验证码短信模板ID | `1000000` | 否（启用短信时必填） |
| `TENCENT_COS_BUCKET` | 腾讯云COS存储桶名称 | `fazhihui-1250000000` | 否（启用COS时必填） |
| `TENCENT_COS_REGION` | 腾讯云COS地域 | `ap-guangzhou` | 否（启用COS时必填） |
| `CORS_ORIGINS` | 跨域允许的源 | `https://fazhihui.com,https://www.fazhihui.com` | 是 |
| `RATE_LIMIT_MAX` | API限流每分钟最大请求数 | `600` | 否（默认600） |
| `FILE_UPLOAD_MAX_SIZE` | 文件上传最大大小（字节） | `10485760`（10MB） | 否（默认10MB） |

#### 9.3.2 运行环境要求

| 环境项 | 版本要求 | 说明 |
|---|---|---|
| Node.js | ≥ 20.17.0 | 后端运行时，需支持ES2022与原生fetch |
| npm/pnpm | npm ≥ 10 或 pnpm ≥ 8 | 包管理工具 |
| Docker | ≥ 24.0 | 容器化运行环境 |
| Docker Compose | ≥ 2.20 | 多容器编排 |
| Nginx | ≥ 1.25 | 反向代理与静态资源服务 |
| SQLite | ≥ 3.40 | 嵌入式数据库（随Node.js better-sqlite3驱动） |

#### 9.3.3 环境分层

| 环境 | 用途 | 数据库 | 第三方对接 | 说明 |
|---|---|---|---|---|
| 开发环境（development） | 本地开发调试 | 本地SQLite文件 | Mock模式，不调用真实第三方接口 | `NODE_ENV=development`，开启SQL日志与debug日志 |
| 测试环境（staging） | 集成测试、验收测试 | 独立SQLite文件 | 调用第三方测试环境沙箱接口 | `NODE_ENV=staging`，使用测试沙箱密钥 |
| 生产环境（production） | 线上正式运行 | 生产SQLite文件（定期备份） | 调用第三方正式环境接口 | `NODE_ENV=production`，关闭SQL日志，日志级别warn |

### 9.4 监控告警

#### 9.4.1 应用日志

- **日志框架**：后端采用Winston日志库，按级别输出至文件与控制台。
- **日志级别**：

| 级别 | 使用场景 | 是否生产环境输出 |
|---|---|---|
| `error` | 系统错误、接口异常、未捕获异常 | 是（实时告警） |
| `warn` | 业务警告、第三方接口降级、资源接近阈值 | 是 |
| `info` | 关键业务操作、用户登录、数据流转 | 是 |
| `debug` | 调试信息、SQL语句、详细请求参数 | 否（仅开发环境） |

- **日志格式**：JSON结构化日志，包含`timestamp`、`level`、`message`、`module`、`userId`、`requestId`、`stack`（错误堆栈）。
- **日志切割**：按天切割，单文件最大100MB，保留30天，超期自动清理。
- **日志路径**：`/data/logs/app-YYYY-MM-DD.log`（按天）、`/data/logs/error-YYYY-MM-DD.log`（仅error级别）。

#### 9.4.2 性能监控

| 监控指标 | 采集方式 | 阈值 | 告警动作 |
|---|---|---|---|
| API响应时间 | NestJS拦截器记录每个请求耗时 | P99 ≤ 500ms | 超阈值记录warn日志，连续10分钟超阈值告警 |
| 内存占用 | `process.memoryUsage()`定时采集 | ≤ 1GB（容器限制） | 超阈值80%告警，超95%自动重启容器 |
| CPU占用 | `os.loadavg()`定时采集 | ≤ 80% | 超阈值80%告警 |
| 数据库查询耗时 | TypeORM日志中间件 | ≤ 200ms | 超阈值记录慢查询日志，包含SQL与参数 |
| 文件描述符 | `process.resourceUsage()` | ≤ 80% | 超阈值告警，排查文件句柄泄漏 |

#### 9.4.3 异常告警

| 告警类型 | 触发条件 | 通知方式 | 通知对象 |
|---|---|---|---|
| 接口异常 | 5xx错误率 ≥ 1%（1分钟内） | 邮件 + 短信 | 系统管理员、开发负责人 |
| 服务不可用 | 健康检查连续3次失败（每次间隔10秒） | 邮件 + 短信 + 电话 | 系统管理员、运维负责人 |
| 数据库异常 | SQLite连接失败或写入失败 | 邮件 + 短信 | 系统管理员、DBA |
| 第三方接口故障 | 第三方接口连续5次调用失败 | 邮件 | 系统管理员、对应模块负责人 |
| 磁盘空间不足 | 磁盘使用率 ≥ 80% | 邮件 + 短信 | 系统管理员 |
| 备份失败 | 每日备份任务失败 | 邮件 | 系统管理员 |

#### 9.4.4 数据备份监控

- **备份策略**：每日凌晨2点全量备份SQLite数据库文件至`/data/backup/db/fazhihui-YYYYMMDD.db`，同时上传至腾讯云COS异地存储。
- **备份校验**：备份完成后自动校验文件完整性（SHA256校验和），校验失败立即告警。
- **备份保留**：本地保留7天，COS异地保留30天，超期自动清理。
- **备份恢复演练**：每月执行一次备份恢复演练，验证备份可用性，记录演练结果。

#### 9.4.5 磁盘空间监控

- **监控频率**：每5分钟采集一次磁盘使用率。
- **告警阈值**：
  - 80%：邮件告警，提示清理日志与临时文件。
  - 90%：邮件 + 短信告警，自动清理30天前的日志文件。
  - 95%：邮件 + 短信 + 电话告警，自动清理7天前的备份文件，暂停非关键任务。

#### 9.4.6 健康检查接口

- **接口路径**：`GET /api/health`
- **响应格式**：
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "status": "healthy",
      "timestamp": "2026-07-25T10:00:00.000Z",
      "uptime": 86400,
      "database": "connected",
      "disk": { "total": 53687091200, "free": 32212254720, "usage": 0.4 },
      "memory": { "rss": 268435456, "heapUsed": 134217728, "heapTotal": 268435456 }
    }
  }
  ```
- **检查项**：数据库连接状态、磁盘空间、内存占用、服务运行时长。任何一项异常返回`status: "unhealthy"`与HTTP 503状态码。

---

## 第10章 测试规范

### 10.1 测试策略

本产品采用测试金字塔模型，从底层单元测试到顶层验收测试分层覆盖，确保代码质量、业务正确性、性能达标。测试环境与生产环境严格隔离，测试数据通过`seeds.module.ts`统一播种，保证测试可重复执行。

#### 10.1.1 测试金字塔

```
                    ┌───────────┐
                    │  验收测试  │  用户故事验证（UAT）
                    └─────┬─────┘
                    ┌─────┴─────┐
                    │ E2E测试   │  核心业务流程端到端
                    └─────┬─────┘
                    ┌─────┴─────┐
                    │ 集成测试   │  模块间数据流转
                    └─────┬─────┘
                    ┌─────┴─────┐
                    │ 单元测试   │  覆盖率≥70%（Jest）
                    └───────────┘
```

#### 10.1.2 测试层级说明

| 测试层级 | 工具/框架 | 覆盖目标 | 覆盖率要求 | 执行频率 |
|---|---|---|---|---|
| 单元测试 | Jest | Service/Controller/Util纯函数逻辑 | 行覆盖率 ≥ 70%，分支覆盖率 ≥ 60% | 每次提交（CI） |
| 集成测试 | Jest + Supertest | 模块间数据流转、数据库读写、API联调 | 核心模块100%覆盖 | 每日构建（CI） |
| 端到端测试 | Playwright | 核心业务流程（登录→线索→立案→结案全链路） | 8大模块主流程覆盖 | 每日构建（CI） |
| 验收测试 | 人工 + 自动化脚本 | 用户故事验证、UI交互验收 | V2.0验收用例100%覆盖 | 每个迭代版本发布前 |
| 性能测试 | JMeter | 并发性能、响应时间、吞吐量、稳定性 | 满足第5章非功能性需求 | 每月执行 + 版本发布前 |

#### 10.1.3 测试环境隔离

- **测试数据库**：测试环境使用独立的SQLite文件`/data/db/fazhihui-test.db`，每个测试套件执行前清空重建，避免数据污染。
- **测试数据播种**：通过`seeds.module.ts`统一管理测试种子数据，包含预置用户（7大角色各1个）、预置线索、预置案件、预置合规规则等，所有测试用例基于种子数据编写。
- **第三方Mock**：测试环境不调用真实第三方接口，通过Mock模块拦截HTTP请求，返回预设响应。抖音/百度/快手/企微/飞书/腾讯云SDK均有对应Mock实现。
- **环境变量隔离**：测试环境使用`.env.test`配置文件，与生产环境`.env`严格分离，禁止测试环境读取生产密钥。

#### 10.1.4 测试数据管理

- **种子数据模块**：`seeds.module.ts`预置以下基础数据：
  - 7大角色用户各1个（super_admin/org_admin/marketing/sales/lawyer/assistant/finance）+ 1个client用户
  - 3个广告账户（抖音/百度/快手各1个）
  - 10条线索（覆盖不同来源、不同状态）
  - 5条案件（覆盖不同案由、不同阶段）
  - 5条合规规则（覆盖营销/谈案/签约/办案/财务5环节）
  - 3条分润规则
  - 2条SOP模板（婚姻/劳动仲裁）
- **数据清理**：每个测试用例执行后通过`afterEach`钩子清理本用例产生的数据，保证测试用例间相互独立。
- **数据工厂**：使用工厂函数生成测试数据（如`createLead(overrides)`、`createCase(overrides)`），支持自定义字段覆盖，避免重复硬编码。

### 10.2 核心验收用例

以下验收用例按8大模块组织，每个用例包含用例ID、所属模块、前置条件、操作步骤、预期结果。所有用例为V2.0版本必须通过的核心验收项。

#### 10.2.1 模块1 全域投放与获客营销系统

| 用例ID | 模块 | 前置条件 | 步骤 | 预期结果 |
|---|---|---|---|---|
| TC-1.1 | 投放账户绑定 | 已登录为marketing角色；已获取抖音OAuth授权码 | 1. 进入"投放营销-广告账户"页面<br>2. 点击"绑定账户"按钮<br>3. 选择"抖音"平台<br>4. 跳转抖音授权页，确认授权<br>5. 回调跳转回系统 | 账户列表新增一条抖音账户记录，状态为"已绑定"，账户余额同步显示，绑定日志写入`AdAccountLog` |
| TC-1.2 | 投放计划批量启停 | 已绑定至少1个广告账户；该账户下有≥3个投放计划 | 1. 进入"投放计划"页面<br>2. 勾选3个计划<br>3. 点击"批量暂停"按钮<br>4. Modal.confirm确认<br>5. 等待3秒 | 3个计划状态变更为"已暂停"，操作日志写入`AdPlanLog`，message.success提示"已批量暂停3个计划" |
| TC-1.3 | 转化归因回传 | 已有线索产生且关联click_id；线索已签约立案 | 1. 系统自动检测到线索签约事件<br>2. 触发转化回传任务<br>3. 调用抖音转化回传API<br>4. 接收回传确认 | `ConversionEvent`表新增回传记录，回传状态为"成功"，回传时间为签约后5分钟内；抖音后台可见转化数据 |
| TC-1.4 | 素材效能排行 | 已有≥10个素材且关联投放数据≥7天 | 1. 进入"素材管理"页面<br>2. 切换Tab至"效能排行"<br>3. 选择时间范围"近7天"<br>4. 按转化成本升序排序 | 素材列表按转化成本升序展示，展示字段含展示量/点击量/转化量/转化成本/ROI，仅加载当前Tab数据 |
| TC-1.5 | AI内容生成 | 已配置AI工具；已选择案件类型"婚姻纠纷" | 1. 进入"AI内容生成"页面<br>2. 选择内容类型"短视频脚本"<br>3. 选择案件类型"婚姻纠纷"<br>4. 输入关键词"离婚财产分割"<br>5. 点击"生成" | 30秒内生成1份短视频脚本，内容包含开场钩子、法律要点、CTA引导；可一键入库素材库 |

#### 10.2.2 模块2 公私域连接器与SCRM私域运营系统

| 用例ID | 模块 | 前置条件 | 步骤 | 预期结果 |
|---|---|---|---|---|
| TC-2.1 | 活码创建与分流 | 已登录为marketing角色；已绑定企微员工账号≥3个 | 1. 进入"活码管理"页面<br>2. 点击"新建活码"<br>3. 配置名称"抖音-婚姻咨询"<br>4. 选择分流策略"轮询"<br>5. 勾选3个企微员工<br>6. 保存 | 生成唯一活码二维码与渠道标识，客户扫码后按轮询规则分配至3个员工之一，扫码记录写入`LiveCodeScanLog` |
| TC-2.2 | 渠道转化追踪 | 已创建≥2个活码且各有≥5条扫码线索 | 1. 进入"渠道追踪"页面<br>2. 选择时间范围"近30天"<br>3. 查看渠道对比 | 展示各渠道的扫码量/线索量/到所量/签约量/转化成本对比，支持按转化率排序，高转化渠道自动标记 |
| TC-2.3 | 聊天存档同步质检 | 已配置企微聊天存档；员工与客户有≥10条聊天记录 | 1. 进入"聊天存档"页面<br>2. 选择某员工-客户会话<br>3. 查看聊天详情<br>4. 触发AI质检 | 聊天记录完整展示（含文本/图片/语音转文字），AI质检结果展示违规点标注，违规会话生成质检预警 |
| TC-2.4 | 私域触达群发 | 已有≥20个私域客户标签为"待激活" | 1. 进入"私域触达"页面<br>2. 选择"1V1群发"<br>3. 选择客户标签"待激活"<br>4. 编辑触达文案<br>5. 预览并提交 | 触达任务创建成功，按企微限流规则批量发送，发送进度实时展示，发送结果（成功/失败）写入`ReachTaskLog` |

#### 10.2.3 模块3 线索中台与谈案转化CRM

| 用例ID | 模块 | 前置条件 | 步骤 | 预期结果 |
|---|---|---|---|---|
| TC-3.1 | 线索自动分配 | 已配置分配规则（按案由轮询）；sales角色≥2个在线 | 1. 抖音渠道产生1条新线索（婚姻纠纷）<br>2. 系统自动接收线索<br>3. 触发分配规则<br>4. 检查分配结果 | 线索按轮询规则分配至下一位sales，分配日志写入`LeadAssignmentLog`，sales收到企微通知，线索状态为"已分配" |
| TC-3.2 | 邀约到所登记 | 线索已分配至邀约岗；邀约岗已联系客户 | 1. 邀约岗登录"邀约工作台"<br>2. 选择某条线索<br>3. 点击"登记到所"<br>4. 填写到所时间、接待谈案岗<br>5. 提交 | 线索状态变更为"已到所"，自动创建`Opportunity`商机记录并分配至指定谈案岗，邀约岗绩效+1 |
| TC-3.3 | 谈案签约转化 | 商机已分配至谈案岗；客户已到所沟通 | 1. 谈案岗登录"谈案工作台"<br>2. 选择商机<br>3. 更新商机阶段为"签约"<br>4. 填写签约金额、案由<br>5. 提交立案申请 | 商机状态变更为"已签约"，触发立案流程，生成`Case`案件记录（状态为"待立案"），谈案岗绩效更新 |
| TC-3.4 | 公海池回收 | 线索已分配但sales超过48小时未跟进 | 1. 系统定时任务扫描超时线索<br>2. 自动回收至公海池<br>3. sales查看公海池 | 线索从sales名下移除，进入公海池可被其他sales领取，回收日志记录，原sales收到提醒通知 |
| TC-3.5 | 谈案SOP节点校验 | 商机已创建；谈案SOP配置"需求确认"为强制节点 | 1. 谈案岗尝试更新商机阶段为"方案提交"<br>2. 系统校验前置节点<br>3. "需求确认"未完成 | 阻止阶段推进，提示"请先完成'需求确认'节点"，商机阶段保持不变 |

#### 10.2.4 模块4 标准化案件办案管理系统

| 用例ID | 模块 | 前置条件 | 步骤 | 预期结果 |
|---|---|---|---|---|
| TC-4.1 | 案件立案 | 商机已签约；律师已通过利冲检索 | 1. 谈案岗提交立案申请<br>2. 律所管理者审批通过<br>3. 系统生成案件编号<br>4. 指派办案律师<br>5. 通知各方 | 生成`Case`记录，案件编号格式`FH-YYYYMM-XXXX`，案件状态"办案中"，自动生成应收台账，律师收到企微通知 |
| TC-4.2 | 办案SOP任务生成 | 案件已立案；案件案由匹配到SOP模板"婚姻纠纷" | 1. 立案时系统自动匹配SOP模板<br>2. 生成办案任务清单<br>3. 律师查看任务列表 | 按SOP模板生成N个`CaseTask`任务，含预估完成时间、负责人、强制节点标记，任务状态为"待开始" |
| TC-4.3 | 证据上传 | 案件已立案；律师已登录 | 1. 进入案件详情-证据卷宗<br>2. 选择"上传证据"<br>3. 拖拽3个文件（PDF/JPG）<br>4. 选择证据类型"财产凭证"<br>5. 提交 | 3个文件上传至腾讯云COS，`Evidence`表新增3条记录，文件预览可用，证据列表按类型分组展示 |
| TC-4.4 | 案件超期预警 | 案件某SOP节点预估完成时间已过且未完成 | 1. 系统定时任务扫描超期任务<br>2. 生成预警记录<br>3. 通知律师与管理者 | `CaseWarning`表新增预警记录，预警级别"超期"，律师与管理者收到企微/短信通知，预警看板更新 |
| TC-4.5 | 电子卷宗导出 | 案件已结案；卷宗含≥5个证据/文书 | 1. 进入案件详情-卷宗管理<br>2. 点击"导出卷宗"<br>3. 选择导出范围"全部"<br>4. 确认 | 系统打包生成ZIP文件（含目录索引PDF + 全部文件），导出任务异步执行，完成后通知律师下载 |

#### 10.2.5 模块5 全节点AI合规风控体系

| 用例ID | 模块 | 前置条件 | 步骤 | 预期结果 |
|---|---|---|---|---|
| TC-5.1 | 营销内容合规预审 | 已配置营销合规规则；待发布广告素材含"包胜诉"文案 | 1. 投放专员提交素材至合规预审<br>2. AI扫描文案内容<br>3. 匹配违规规则<br>4. 生成预审结果 | 预审结果为"不通过"，标注违规点"包胜诉承诺"（违反《律师执业管理办法》），素材无法发布，违规记录写入`ComplianceCheckResult` |
| TC-5.2 | 谈案AI质检 | 谈案岗与客户通话已完成；通话录音已上传 | 1. 系统自动ASR转文字<br>2. AI质检引擎分析内容<br>3. 识别违规表述<br>4. 生成质检报告 | 质检报告展示违规点（如"风险代理收费"）、违规时段、合规建议，质检结果为"不通过"时触发预警通知管理者 |
| TC-5.3 | 客诉工单处理 | 客户通过C端提交投诉；已配置客诉处理流程 | 1. 客户C端提交投诉工单<br>2. 系统自动分配至律所管理者<br>3. 管理者调查处理<br>4. 录入处理结果<br>5. 客户确认 | `ComplaintTicket`工单状态流转"待处理→处理中→已处理→已确认"，处理全程留痕，超时未处理自动升级 |
| TC-5.4 | 签约合规校验 | 谈案岗提交签约；合同模板未更新至最新版本 | 1. 系统校验合同模板版本<br>2. 比对最新模板库<br>3. 识别版本不一致<br>4. 阻止签约 | 签约被阻止，提示"合同模板非最新版本，请使用V2.1模板"，校验失败记录写入`SigningCompliance` |

#### 10.2.6 模块6 财务分润与收支管理系统

| 用例ID | 模块 | 前置条件 | 步骤 | 预期结果 |
|---|---|---|---|---|
| TC-6.1 | 收款登记 | 案件已立案；应收台账已生成；客户支付首付款 | 1. 财务进入"财务管理-收款登记"<br>2. 选择案件<br>3. 填写收款金额、支付方式、到账时间<br>4. 上传到账凭证<br>5. 提交 | `PaymentRecord`新增记录，应收台账已收金额更新，案件收款状态变更为"部分收款"，客户收到C端收款通知 |
| TC-6.2 | 分润计算 | 案件已结案；全款已到账；分润规则已配置 | 1. 系统检测到结案+全款到账<br>2. 触发分润计算任务<br>3. 按规则计算各角色提成<br>4. 生成分润明细 | `CommissionRecord`生成N条分润记录（投放/邀约/谈案/律师/助理各1条），分润总额=签约金额×分润比例，财务可导出分润明细表 |
| TC-6.3 | 退费流程 | 案件已签约；客户申请退费；退费金额≤已收金额 | 1. 财务发起退费申请<br>2. 填写退费金额、原因<br>3. 律所管理者审批<br>4. 财务执行退费<br>5. 同步台账与合规 | `Refund`记录创建，审批通过后执行退费，应收台账更新，退费记录同步至合规模块进行合规校验 |
| TC-6.4 | 逾期应收预警 | 案件应收台账有未收款且超过约定付款日期 | 1. 系统定时任务扫描逾期应收<br>2. 生成预警记录<br>3. 通知财务与律师 | `OverdueWarning`新增预警记录，预警级别按逾期天数分级（7天/30天/60天），财务收到邮件+企微通知 |

#### 10.2.7 模块7 C端客户服务与口碑运营体系

| 用例ID | 模块 | 前置条件 | 步骤 | 预期结果 |
|---|---|---|---|---|
| TC-7.1 | C端案件查看 | 客户已绑定案件；案件有≥1次进度更新 | 1. 客户登录C端<br>2. 进入"案件"页面<br>3. 查看案件列表<br>4. 点击案件详情 | 展示客户名下所有案件（脱敏处理），案件详情含当前阶段、已完成节点、下一步动作、律师信息，进度更新主动推送 |
| TC-7.2 | AI智能答疑 | 客户已登录C端 | 1. 客户进入"咨询"页面<br>2. 输入问题"离婚财产如何分割"<br>3. AI生成回答<br>4. 客户查看回答 | AI基于法律知识库生成专业回答（≤5秒），回答末尾提示"建议咨询律师"，可一键转人工工单 |
| TC-7.3 | 服务评价提交 | 案件已结案；客户未评价 | 1. 客户收到评价邀请通知<br>2. 进入"评价"页面<br>3. 选择星级（1-5星）<br>4. 填写文字评价<br>5. 提交 | `ServiceRating`新增评价记录，评价分数≤3星触发低分预警通知管理者，评价数据沉淀至口碑库 |
| TC-7.4 | 在线支付签约 | 客户已与谈案岗沟通确认签约 | 1. 客户进入"签约"页面<br>2. 查看电子合同<br>3. 确认合同条款<br>4. 在线支付签约费<br>5. 电子签约 | 合同在线预览，支付通过腾讯云支付完成，电子签章生成，签约成功后案件进入立案流程，全程留痕 |
| TC-7.5 | 投诉提交 | 客户已登录C端 | 1. 客户进入"投诉"页面<br>2. 选择投诉类型<br>3. 填写投诉内容<br>4. 上传证据附件<br>5. 提交 | `ComplaintTicket`工单创建，自动分配至律所管理者，客户可查看处理进度，48小时内响应 |

#### 10.2.8 模块8 全链路经营数据决策中台

| 用例ID | 模块 | 前置条件 | 步骤 | 预期结果 |
|---|---|---|---|---|
| TC-8.1 | 转化漏斗看板 | 已有≥30天投放数据与线索数据 | 1. 进入"投放转化漏斗"看板<br>2. 选择时间范围"近30天"<br>3. 选择渠道"全部"<br>4. 查看漏斗图 | 漏斗图展示5级转化（展示→点击→线索→到所→签约），各层级数量与转化率展示，支持点击下钻查看明细 |
| TC-8.2 | 销售绩效排行 | 已有≥10名sales且各有≥5条线索 | 1. 进入"销售团队绩效"看板<br>2. 选择角色"邀约岗"<br>3. 选择时间"本周"<br>4. 查看排行榜 | 邀约岗按到所数降序排行，展示指标含线索数/到所数/到所率/绩效得分，前三名高亮显示 |
| TC-8.3 | 自定义报表导出 | 已有≥1个报表模板配置 | 1. 进入"自定义报表"页面<br>2. 选择报表模板"月度经营报表"<br>3. 选择时间范围"2026年7月"<br>4. 点击"生成报表"<br>5. 下载 | 报表异步生成，完成后提供Excel/PDF下载链接，报表含营收/线索/案件/分润多维数据，生成日志写入`ReportExportLog` |
| TC-8.4 | 合规风险监控 | 已有≥3条合规预警记录 | 1. 进入"合规风险监控"看板<br>2. 查看预警分布<br>3. 点击某条预警查看详情 | 看板展示违规预警总数、整改率、环节分布图，预警列表可筛选，点击预警跳转至合规中心处理 |

### 10.3 性能测试要求

#### 10.3.1 JMeter测试场景

| 场景编号 | 测试场景 | 接口路径 | 并发用户数 | 持续时间 | 思考时间 | 通过标准 |
|---|---|---|---|---|---|---|
| PERF-1 | 用户登录 | `POST /api/auth/login` | 100 | 5分钟 | 1秒 | 响应时间P99 ≤ 500ms，错误率 = 0% |
| PERF-2 | 线索列表查询 | `GET /api/leads?page=1&size=20` | 200 | 5分钟 | 2秒 | 响应时间P99 ≤ 500ms，错误率 = 0% |
| PERF-3 | 案件创建 | `POST /api/cases` | 50 | 5分钟 | 3秒 | 响应时间P99 ≤ 500ms，错误率 = 0% |
| PERF-4 | 报表生成 | `POST /api/reports/generate` | 20 | 5分钟 | 5秒 | 响应时间P99 ≤ 500ms（异步任务立即返回），错误率 = 0% |
| PERF-5 | 数据看板加载 | `GET /api/dashboard/overview` | 150 | 5分钟 | 2秒 | 响应时间P99 ≤ 500ms，错误率 = 0% |
| PERF-6 | 文件上传 | `POST /api/files/upload`（10MB文件） | 30 | 5分钟 | 5秒 | 响应时间P99 ≤ 3秒，错误率 ≤ 1% |

#### 10.3.2 并发用户梯度测试

| 梯度编号 | 并发用户数 | 加压策略 | 测试场景 | 通过标准 |
|---|---|---|---|---|
| GRAD-1 | 50 | 10秒内线性加压至50 | 全场景混合（登录+查询+创建） | P99 ≤ 500ms，CPU ≤ 60%，内存 ≤ 60% |
| GRAD-2 | 100 | 20秒内线性加压至100 | 全场景混合 | P99 ≤ 500ms，CPU ≤ 70%，内存 ≤ 70% |
| GRAD-3 | 200 | 30秒内线性加压至200 | 全场景混合 | P99 ≤ 500ms，CPU ≤ 80%，内存 ≤ 80% |
| GRAD-4 | 500 | 60秒内线性加压至500 | 全场景混合 | P99 ≤ 800ms，CPU ≤ 90%，内存 ≤ 90%，错误率 ≤ 1% |

#### 10.3.3 性能指标阈值

| 指标类别 | 指标名称 | 阈值要求 | 说明 |
|---|---|---|---|
| 响应时间 | API响应时间P95 | ≤ 300ms | 95%的请求在300ms内响应 |
| 响应时间 | API响应时间P99 | ≤ 500ms | 99%的请求在500ms内响应 |
| 响应时间 | 首屏加载时间 | ≤ 2秒 | 前端首屏可见时间（不含图片懒加载） |
| 响应时间 | 数据库慢查询 | ≤ 200ms | 单条SQL执行时间阈值，超阈值记录慢查询日志 |
| 吞吐量 | 系统吞吐量 | ≥ 100 req/s | 每秒处理请求数 |
| 吞吐量 | 数据库QPS | ≥ 200 | 每秒数据库查询数 |
| 资源占用 | CPU使用率 | ≤ 80%（常态） | 持续5分钟超过80%触发告警 |
| 资源占用 | 内存使用率 | ≤ 80%（常态） | 持续5分钟超过80%触发告警 |
| 稳定性 | 持续运行 | 30分钟无内存泄漏 | 压测30分钟后内存增长 ≤ 5% |
| 稳定性 | 错误率 | ≤ 0.1% | 压测期间HTTP 5xx错误率 |

#### 10.3.4 稳定性测试要求

- **持续运行测试**：以200并发用户持续运行30分钟，监测以下指标：
  - 内存占用趋势：每5分钟采样一次，30分钟内内存增长 ≤ 5%（无明显泄漏）。
  - 响应时间趋势：P99响应时间无持续上升趋势。
  - 错误率：30分钟内HTTP 5xx错误率 ≤ 0.1%。
  - 数据库连接：连接池无泄漏，活动连接数稳定。
- **内存泄漏判定**：压测结束后强制GC，内存占用回落至压测前水平 ±5%以内，判定无内存泄漏。

#### 10.3.5 数据库性能监控

| 监控项 | 阈值 | 监控方式 | 处理动作 |
|---|---|---|---|
| 慢查询 | ≤ 200ms | TypeORM日志中间件记录所有SQL耗时 | 超阈值记录慢查询日志（含SQL、参数、耗时、调用栈），每日汇总分析 |
| 查询QPS | ≥ 200 | 应用层统计 | 低于阈值时排查连接池配置 |
| 索引命中率 | ≥ 95% | SQLite `EXPLAIN QUERY PLAN`分析 | 低于95%时识别缺失索引并补建 |
| 数据库文件大小 | ≤ 10GB | 定时采集 | 超过10GB时启动PostgreSQL迁移评估 |
| 写入锁等待 | ≤ 50ms | SQLite WAL模式监控 | 超阈值时排查长事务，考虑读写分离 |

#### 10.3.6 性能测试执行计划

| 阶段 | 执行时机 | 测试范围 | 参与角色 |
|---|---|---|---|
| 开发阶段 | 每个迭代结束 | 核心接口基准测试 | 开发负责人 |
| 集成测试阶段 | 版本集成完成 | 全场景JMeter测试 | 测试工程师 |
| 验收测试阶段 | 版本发布前 | 并发梯度 + 稳定性测试 | 测试工程师 + 运维 |
| 生产环境 | 上线后每月 | 生产环境压测（低峰期） | 运维工程师 |

---

## 第11章 全链路衔接性详细校验

本章在 V1.0 第4章衔接性整体校验的基础上，对8大模块之间的衔接点进行字段级细化。每个衔接点均包含四要素：**字段映射表**（源实体.字段 → 目标实体.字段，含转换规则）、**触发条件**（业务事件）、**同步方式**（技术实现）、**异常处理**（容错策略）。所有字段名均以后端 NestJS 实体实际定义为准，全局 API 前缀 `/api`，JWT 鉴权，SQLite 持久化。

---

### 11.1 前端获客-销转链路字段映射

#### 11.1.1 投放→线索

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| ConversionEvent.lead_id | Lead.id | 线索创建后回填至转化事件 | Lead 先创建生成 id，再 UPDATE ConversionEvent.lead_id |
| ConversionEvent.channel | Lead.source_channel | 广告渠道映射为线索来源 | 枚举值直传：douyin/baidu/kuaishou/wechat/other |
| ConversionEvent.keyword | Lead.source_keyword | 触发关键词透传 | 原样写入，NULL 容忍 |
| 表单提交 payload.phone | Lead.phone | 广告表单电话写入线索 | 手机号正则校验 `^1[3-9]\d{9}$`，不符合则入无效线索池 |
| 表单提交 payload.contact_name | Lead.contact_name | 客户姓名透传 | 去首尾空格，最长 50 字符 |
| 表单提交 payload.case_description | Lead.case_description | 需求描述透传 | 原样写入，超长截断至 2000 字符 |
| ConversionEvent.plan_id | Lead.landing_page（间接） | 计划归因 | plan_id 落库于 ConversionEvent，Lead 侧记录 landing_page |
| ConversionEvent.case_type | Lead.case_type | 案由透传 | 枚举值：marriage/traffic/labor/debt/other |
| ConversionEvent.organization_id | Lead.organization_id | 组织隔离 | 必须与当前 JWT 所属组织一致 |

> 实现说明：`ConversionEvent` 实体本身不存储 `phone` 字段，电话号码由广告平台表单提交 payload 直接写入 `Lead.phone`；`ConversionEvent.lead_id` 为线索创建后异步回填字段（nullable）。

**触发条件**：广告平台（抖音/百度/快手）表单提交回传事件，ConversionEvent.event_type = `lead`。

**同步方式**：异步消息队列。广告平台 Webhook 命中 `/api/marketing/conversion-events` 后，先入 `conversion_events` 表，再投递至 BullMQ 队列 `lead-import-queue`，由消费者完成 Lead 创建与 lead_id 回填，保证高并发下平台回传不阻塞。

**异常处理**：
1. 手机号格式校验失败 → 写入 `lead_pool` 无效线索池，标记 `status=invalid`，不进入分配流程；
2. Lead 创建失败 → 队列自动重试 3 次（指数退避 1s/4s/16s），仍失败则进入死信队列 `lead-import-dlq`；
3. 死信队列消息触发管理员告警（站内信 + 飞书 Webhook），人工在 `/api/lead/import` 补录；
4. 重复手机号（同 organization_id 内 24 小时去重）→ 不创建新 Lead，仅追加 ConversionEvent 关联至已有 lead_id，避免重复线索。

---

#### 11.1.2 线索→私域加微关联

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| Lead.id | ChatArchive.client_id | 线索ID映射为聊天归档客户ID | 字符串直传，作为聊天归档的客户维度主键 |
| User.id | ChatArchive.employee_id | 接待员工ID映射为归档员工ID | 取自 LiveCode.bound_users 分流结果 |
| LiveCode.id | Lead（间接关联） | 活码归因 | LiveCode 通过 channel_id + bound_users 与线索渠道绑定；Lead 实体无 live_code_id 字段，归因关系由 LiveCode.channel_id ↔ Lead.source_channel 间接建立 |
| 企微回调 external_userid | ChatArchive.client_id | 外部联系人映射 | 通过 phone 反查 Lead.id 后写入 client_id |
| ChatArchive.sent_at | — | 消息发送时间 | ISO8601 写入 |

> 实现说明：`Lead` 实体不含 `live_code_id` 字段，活码与线索的关联为松耦合（通过渠道维度归因）；`ChatArchive` 使用 `client_id`/`employee_id`（非 lead_id/staff_id），加微时通过手机号反查 Lead.id 填充 client_id。

**触发条件**：客户扫码添加企微好友事件（企微回调 `change_external_contact`，change_type = `add_external_contact`）。

**同步方式**：Webhook 回调。企微回调命中 `/api/scrm/chat-archive/webhook`，同步校验签名后，异步落库 ChatArchive 并触发 client_id 反查。

**异常处理**：
1. 手机号在 Lead 表无匹配 → ChatArchive.client_id 置空，标记 `pending_match=true`，进入"待匹配私域消息"列表，由销售手动补录关联；
2. 企微回调签名校验失败 → 返回 401 并记录安全日志，不落库；
3. 回调超时/丢失 → 企微会重试 5 次，仍失败则依赖企微聊天存档 API 次日 T+1 全量补拉；
4. 一个 Lead 被多名员工接待 → 以 LiveCode.dispatch_rule（poll/load/region/case_type）分流结果为准，多员工会话各自独立归档。

---

#### 11.1.3 线索→邀约→谈案

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| Lead.id | InviteTask.lead_id | 线索关联邀约任务 | 一对多（一个线索可多次邀约） |
| Lead.assign_sales_id | InviteTask.inviter_id | 销售自动指派为邀约人 | 取自 Lead.assign_sales_id |
| InviteTask.id | Opportunity.invite_task_id | 邀约成功关联商机 | 邀约 result=arrived 时创建 Opportunity 并回填 invite_task_id（Opportunity 实体含 invite_task_id 关联） |
| Lead.id | Opportunity.lead_id | 商机关联线索 | 直传，必填 |
| Lead.case_type | Opportunity（业务透传） | 案由带入商机 | 通过 Lead.case_type 一致性校验 |
| InviteTask.result | Opportunity.stage 初始值 | 邀约结果驱动商机阶段 | result=arrived → stage=FIRST_CONTACT |

> 实现说明：`Opportunity` 实体含 `lead_id` 与 `invite_task_id` 双关联；邀约到所（InviteTask.result = `arrived`）触发商机自动创建，避免销售重复录入。

**触发条件**：邀约任务标记为"到所"（InviteTask.result = `arrived`，status = `completed`）。

**同步方式**：同步调用。`InviteTaskService.update()` 在数据库事务内同步创建 Opportunity、写 OpportunityStageLog（from_stage=null → to_stage=FIRST_CONTACT），保证邀约与商机的原子性。

**异常处理**：
1. 同一 Lead 已存在 ACTIVE 状态 Opportunity → 拒绝重复创建，返回 409，提示"该线索已有进行中商机"；
2. 谈案岗（negotiator_id）未指派 → 商机创建后状态置为 `pending_assign`，进入谈案待分配池，由主管手动改派；
3. 事务回滚 → InviteTask 状态不变更，邀约记录保留，销售可重新标记到所；
4. 利冲检索命中（同 client_phone 存在已有案件）→ 阻断 Opportunity 创建，弹窗提示利冲风险，需合规管理员审批后放行。

---

#### 11.1.4 聊天录音归档

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| Lead.id | ChatArchive.client_id | 线索关联聊天归档 | 通过 phone 反查 |
| User.id | ChatArchive.employee_id | 接待员工归档 | 企微会话取 employee_id |
| ChatArchive.message_type | — | 消息类型 | 枚举：text/image/voice/video/file |
| ChatArchive.content | — | 文本内容 | text 类型写入，其他类型留空 |
| ChatArchive.file_path | — | 文件路径 | OSS/本地路径，voice 类型存录音文件 |
| ChatArchive.compliance_synced | TalkQualityCheck（触发） | 同步合规质检 | 归档后异步投递质检队列 |
| ChatArchive.compliance_result | TalkQualityCheck.check_result | 质检结果回填 | pass/warning/violation 三态 |

**触发条件**：实时聊天消息事件（企微会话存档 SDK 推送 / 个微聊天消息）。

**同步方式**：实时同步。企微会话存档通过长连接 SDK 实时拉取消息，逐条写入 ChatArchive；消息量高峰期采用批量插入（每 50 条或每 2 秒一批）降低 SQLite 写压力。

**异常处理**：
1. 企微 SDK 断连 → 本地 SQLite 缓存队列 `chat_archive_buffer` 暂存，连接恢复后按 sent_at 顺序补传；
2. 文件下载失败（file_path 无法访问）→ ChatArchive 仍落库 content 元数据，file_path 标记 `pending_download`，由定时任务每 10 分钟重试 3 次；
3. 合规质检队列堆积 → 质检可降级为离线批处理（每日 02:00 全量补检），实时仅做关键词命中拦截；
4. ChatArchive 写入超时 → 离线缓存重传，保证聊天记录不丢失（合规要求全量留痕）。

---

### 11.2 销转-办案交付链路字段映射

#### 11.2.1 谈案→立案

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| Opportunity.lead_id | Case.lead_id | 通过线索关联（Case 无 opportunity_id 字段） | Opportunity 与 Case 共享 lead_id 作为关联纽带 |
| Opportunity.id | Case（业务层关联） | 商机与案件关联 | 通过 lead_id 间接关联；案件创建时记录来源商机至 CaseEvent 日志 |
| Opportunity.actual_amount | Case.amount | 签约金额映射为案件金额 | 直传，精度 decimal(12,2) |
| Lead.case_type | Case.case_type | 案由透传 | 枚举一致性校验，不一致则告警 |
| Lead.phone | Case.client_phone | 客户电话透传 | 直传 |
| Lead.contact_name | Case.client_name | 客户姓名透传 | 直传 |
| Lead.id | Case.client_id | 线索ID映射为客户ID | Lead.id 即为 client_id（C端客户以 lead_id 为唯一标识） |
| Opportunity.requirement_note | Case.description | 需求描述带入案件 | 截断至 2000 字符 |

> 实现说明：`Case` 实体不含 `opportunity_id` 字段，谈案→立案的实际关联纽带为 `lead_id`（Opportunity.lead_id = Case.lead_id = Lead.id）。签约金额取 `Opportunity.actual_amount`（非 quote_amount 报价金额）。

**触发条件**：谈案签约，Opportunity.status 置为 `WON`，发起立案申请。

**同步方式**：同步调用。`OpportunityService.signContract()` 在事务内创建 Case、写入 ConversionEvent（event_type=`sign`，回填 case_id）、更新 Opportunity.status，三者原子提交。

**异常处理**：
1. 立案审批驳回 → Case 创建为草稿态（status=PENDING_ASSIGN 但 filing_date 留空），驳回原因记录至审批日志，销售可修改后重新提交；
2. 利冲检索未通过 → 阻断立案，需合规管理员审批；
3. actual_amount 为 NULL 或 ≤ 0 → 校验失败，返回 422，提示"签约金额不能为空"；
4. lead_id 在 Lead 表不存在 → 事务回滚，记录数据完整性异常告警。

---

#### 11.2.2 立案→办案SOP

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| Case.case_type | CaseSOPTemplate.case_type | 按案由匹配SOP模板 | 精确匹配 + is_default=true 优先 |
| Case.id | CaseTask.case_id | 案件ID写入任务实例 | 一对多（一个案件生成N个任务） |
| CaseSOPTemplate.id | CaseTask.sop_template_id | 模板来源记录 | 用于模板版本追溯 |
| CaseSOPTemplate.stages[].stage_id | CaseTask.stage_id | 阶段ID透传 | 直传 |
| CaseSOPTemplate.stages[].tasks[].task_id | CaseTask.task_id | 任务ID透传 | 直传 |
| CaseSOPTemplate.stages[].tasks[].responsible_role | CaseTask.responsible_role | 责任人角色 | 用于指派 assignee_id |
| Case.filing_date + task.deadline_days | CaseTask.deadline | 截止时间计算 | filing_date + deadline_days 天 |
| Case.case_type | CaseSOP.case_type | SOP步骤记录案由 | 同步生成 CaseSOP（compliance 模块） |

> 实现说明：实际任务实例化基于 `CaseSOPTemplate`（模板）生成 `CaseTask`（任务实例），关联字段为 `CaseTask.sop_template_id`；同时 `compliance` 模块的 `CaseSOP` 表记录标准化步骤节点（用于合规校验）。

**触发条件**：立案审批通过（Case.status 由 PENDING_ASSIGN → IN_PROGRESS，filing_date 写入）。

**同步方式**：自动生成任务。立案审批通过的领域事件 `case.filing_approved` 触发 `CaseTaskService.generateFromTemplate(caseId)`，按 CaseSOPTemplate.stages 展开生成全部 CaseTask 实例。

**异常处理**：
1. 无匹配 SOP 模板（CaseSOPTemplate.case_type 无对应记录）→ 告警通知管理员，案件进入"无 SOP 待配置"状态，办案律师可手动创建任务；
2. 模板存在但 enabled=false → 同上告警；
3. 任务生成部分失败 → 事务回滚全部任务，保证不出现残缺任务清单，重试 3 次仍失败则告警；
4. responsible_role 对应角色无在岗用户 → assignee_id 置空，进入待指派列表，由律所主任手动分配。

---

#### 11.2.3 办案→客户服务

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| Case.id | CasePushNotification.case_id | 案件关联推送通知 | 一对多 |
| Case.client_id | CasePushNotification.client_id | 客户ID透传 | 直传 |
| CaseTask.status | CasePushNotification.node_type | 任务状态映射推送节点 | in_progress→filing、completed(court)→court、completed(judgment)→judgment、Case.status=closed→closed |
| CaseTask.stage_name | CasePushNotification.push_content | 推送内容生成 | 标准化模板渲染，屏蔽敏感信息（金额/对方当事人） |
| — | CasePushNotification.push_channel | 推送渠道 | 默认 in_app，客户绑定微信后增加 wechat |

**触发条件**：案件节点变更（CaseTask.status 由 pending → in_progress / completed，或 Case.status 变更）。

**同步方式**：事件驱动。CaseTask 状态变更发出领域事件 `casetask.status_changed`，`CasePushNotificationService` 监听后生成推送记录并异步发送。

**异常处理**：
1. 推送失败（微信/短信网关异常）→ CasePushNotification.status 置 `failed`，定时任务重试 3 次（间隔 5min/30min/2h）；
2. 3 次重试仍失败 → status 置 `failed` 终态，通知办案律师手动跟进；
3. 客户未绑定任何渠道（无微信、无手机）→ 仅生成站内信，等待客户登录 C 端查看；
4. 推送内容含敏感词 → 模板渲染层过滤，违规内容替换为"案件有新进展，请登录查看"。

---

#### 11.2.4 办案→结案

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| Case.id | CaseArchive.case_id | 案件关联归档记录 | 一对一 |
| Case.status | CaseArchive.archive_status | 案件状态映射归档状态 | Case.status=closed → CaseArchive.archive_status=PENDING |
| CaseTask（全量） | CaseArchive.node_completion_check | 节点闭环检查 | 序列化 NodeCompletionCheckItem[] 为 JSON |
| Document + Evidence | CaseArchive.material_checklist | 材料清单检查 | 序列化 MaterialChecklistItem[] 为 JSON |
| CaseTask 完成率 | 结案校验门槛 | 必做节点完成率 | is_required=true 的 CaseTask 必须 100% completed |

**触发条件**：律师提交结案申请（Case.status 由 IN_PROGRESS → 待结案审批）。

**同步方式**：同步校验。`CaseArchiveService.submitArchive(caseId)` 同步执行节点闭环校验与材料清单校验，校验通过后创建 CaseArchive 记录（archive_status=PENDING）进入归档审批流。

**异常处理**：
1. 必做节点未完成（is_required=true 的 CaseTask 存在非 completed 状态）→ 阻断结案，返回 422 并列出未完成节点清单；
2. 必需材料未上传（material_checklist 中 required=true 且 uploaded=false）→ 阻断结案，提示补传材料；
3. 校验通过但审批驳回 → CaseArchive.archive_status=REJECTED，reject_reason 记录驳回原因，Case 恢复 IN_PROGRESS；
4. 归档中（ARCHIVING）异常中断 → 定时任务检测超时 30 分钟未变 ARCHIVED，自动回滚至 PENDING 并告警。

---

### 11.3 业务-财务链路字段映射

#### 11.3.1 立案→财务应收台账

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| Case.id | Receivable.case_id | 案件关联应收记录 | 一对一 |
| Case.amount | Receivable.contract_amount | 案件金额映射合同金额 | 直传，精度 decimal(12,2) |
| Receivable.contract_amount | Receivable.pending_amount | 待收金额初始化 | pending_amount = contract_amount - 0 |
| — | Receivable.received_amount | 已收金额初始化 | 默认 0 |
| — | Receivable.status | 应收状态初始化 | 默认 PENDING |
| Case.organization_id | Receivable.organization_id | 组织隔离 | 直传 |

> 实现说明：`Case` 实体无 `contract_amount` 字段，签约金额存储于 `Case.amount`；`Receivable` 使用 `contract_amount`（非 amount）作为合同金额字段。

**触发条件**：立案审批通过（与 11.2.2 同一领域事件 `case.filing_approved`）。

**同步方式**：自动生成应收。`case.filing_approved` 事件触发 `ReceivableService.create()`，与 SOP 任务生成并行执行（非事务耦合，失败不影响立案）。

**异常处理**：
1. 金额异常告警（Case.amount ≤ 0 或 > 1000万）→ 仍创建应收但标记 `remarks='金额异常待核实'`，通知财务管理员；
2. 同一 case_id 已存在 Receivable → 拒绝重复创建，返回 409；
3. 应收创建失败 → 立案流程不回滚（财务与办案解耦），失败记录入补偿队列，定时任务每 5 分钟重试；
4. 分期案件 → installment_plan 字段写入分期计划 JSON，pending_amount 按首期金额初始化。

---

#### 11.3.2 收款→案件状态

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| PaymentRecord.case_id | Receivable.case_id | 收款关联应收 | 通过 case_id 关联 |
| PaymentRecord.amount | Receivable.received_amount | 累加已收金额 | received_amount += amount |
| PaymentRecord.amount | Receivable.pending_amount | 扣减待收金额 | pending_amount -= amount |
| PaymentRecord.status=PAID | Receivable.status | 应收状态更新 | received≥contract → COMPLETED；部分 → PARTIAL；逾期 → OVERDUE |
| PaymentRecord.case_id | Case（业务状态联动） | 案件缴费状态 | Case 实体无 payment_status 字段，缴费状态由 Receivable.status 间接表达，办案侧通过关联查询获取 |

> 实现说明：`Case` 实体不含 `payment_status` 字段，案件缴费状态通过 `Receivable.status` 间接表达；前端办案页通过 `case_id` 关联查询 Receivable 渲染缴费状态。

**触发条件**：财务登记收款（PaymentRecord.status 由 PENDING → PAID）。

**同步方式**：同步更新。`PaymentService.confirm()` 在事务内更新 PaymentRecord.status、累加 Receivable.received_amount、重算 Receivable.status，三者原子提交。

**异常处理**：
1. 金额超额校验（received_amount + 本次 amount > contract_amount）→ 拦截并提示"收款金额超过合同金额"，需财务主管审批后放行（多收转预收/退费）；
2. PaymentRecord.case_id 在 Receivable 表无记录 → 告警，标记为"孤儿收款"，需人工核查（可能立案应收未生成）；
3. 事务回滚 → 收款登记失败，PaymentRecord 保留 PENDING 状态，可重新确认；
4. 部分收款 → Receivable.status 自动转 PARTIAL，不阻断办案流程。

---

#### 11.3.3 结案→分润

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| Case.id | CommissionRecord.case_id | 案件关联分润记录 | 一对多（多岗位分润） |
| CommissionRule.id | CommissionRecord.rule_id | 适用规则记录 | 按 role_type 匹配生效规则 |
| CommissionRoleType | CommissionRecord.role_type | 岗位角色 | 枚举：negotiator/lawyer/assistant 等 |
| Case.amount | CommissionRecord.base_amount | 分润基数 | 取 Case.amount（或扣除成本后净值，按规则配置） |
| base_amount × rule.rate | CommissionRecord.commission_amount | 提成金额计算 | commission_amount = base_amount × rate |
| User.id | CommissionRecord.user_id | 分润对象 | 按 role_type + Case 关联人员确定 |
| — | CommissionRecord.status | 分润状态 | 默认 PENDING，发放后置 PAID |

**触发条件**：案件结案（CaseArchive.archive_status=ARCHIVED）且全款到账（Receivable.status=COMPLETED）。

**同步方式**：自动计算。结案归档完成事件 + 应收完成事件共同触发 `CommissionService.calculate(caseId)`，按 CommissionRule 表匹配各 role_type 规则，批量生成 CommissionRecord。

**异常处理**：
1. 规则缺失告警（某 role_type 在 CommissionRule 表无生效记录）→ 跳过该岗位分润，记录告警，通知管理员配置规则；
2. base_amount 为 0 或负数 → 阻断分润，告警核查；
3. 全款未到账（Receivable.status ≠ COMPLETED）→ 不触发分润，案件进入"待收款结案"列表，全款到账次日补算；
4. 分润总额 > 案件金额 → 拦截并告警（规则配置错误），全部 CommissionRecord 不落库，等待管理员修正规则。

---

#### 11.3.4 退费→全链路

**字段映射表**

| 源实体.字段 | 目标实体.字段 | 映射说明 | 转换规则 |
|------------|--------------|---------|---------|
| Refund.case_id | Case.id | 退费关联案件 | 直传 |
| Refund.fee_id | Fee.id | 退费关联费用明细 | 直传 |
| Refund.amount | Receivable.received_amount | 冲减已收金额 | received_amount -= refund.amount |
| Refund.amount | Receivable.pending_amount | 恢复待收金额 | pending_amount += refund.amount（视业务策略） |
| Refund.case_id | CommissionRecord.case_id | 冲销已发分润 | 关联案件的全部分润 status 由 PAID → 回滚或扣减 |
| Refund.status=PAID | PaymentRecord.status | 标记原收款已退 | 关联 PaymentRecord.status=REFUNDED |

**触发条件**：退费审批通过（Refund.status 由 APPROVED → PAID）。

**同步方式**：事务同步。`RefundService.execute()` 在单一数据库事务内同步更新 Refund、Receivable、PaymentRecord、CommissionRecord 四张表，任一失败全部回滚。

**异常处理**：
1. 退费金额 > 已收金额 → 拦截，返回 422"退费金额超过已收金额"；
2. 已发分润冲销（CommissionRecord.status=PAID）→ 标记 `remarks='退费冲销'`，生成负数冲销记录，通知财务从后续工资抵扣；
3. 事务回滚机制 → 任一关联表更新失败，整个事务回滚，Refund 保留 APPROVED 状态，进入重试队列（最多 3 次），仍失败则人工介入；
4. 退费同步至合规模块 → 生成 FinanceComplianceCheck（check_type=commission）记录，标记退费案件为合规关注案件。

---

### 11.4 全链路合规覆盖校验

#### 11.4.1 获客环节合规点

**覆盖对象与实体**

| 合规点 | 对应实体 | 关键字段 | 预警规则 |
|--------|---------|---------|---------|
| 营销内容合规预审 | MarketingContent | status、compliance_issues、compliance_suggestions | status 非 approved 禁止发布；命中 reject 规则直接置 rejected |
| 公域内容巡检 | SocialPost | status、fail_reason、likes/comments/shares | 已发布内容每日 02:00 巡检，违规自动生成 ComplianceCheckResult（is_inspection=true）|
| 合规校验结果 | ComplianceCheckResult | target_type=marketing_content、check_result、handle_status | check_result=reject 禁止发布；review 需人工二审 |
| 获客素材留痕 | MarketingContent + SocialPost | 永久留存禁止物理删除 | 仅支持状态置 rejected，支持按 organization_id + 时间范围一键导出 |

**预警规则**：违规内容禁止发布；24 小时内提交审核超 5 次触发频率限制；巡检发现违规自动下架并通知 reviewer_id。

---

#### 11.4.2 销转环节合规点

**覆盖对象与实体**

| 合规点 | 对应实体 | 关键字段 | 预警规则 |
|--------|---------|---------|---------|
| 通话质检 | TalkQualityCheck | check_type=call、violation_type、check_result | 命中 false_promise/exaggerate/illegal_fee 自动标记 violation |
| 聊天质检 | TalkQualityCheck | check_type=chat、violation_keyword | 实时关键词命中 → warning；违规表述自动标记 |
| 销售合规 | SalesCompliance（compliance 模块） | 关联 Opportunity/InviteTask | 签约前合规校验，未通过阻断签约 |
| 风险披露 | RiskDisclosure | opportunity_id | 商机阶段强制风险披露，未签署阻断立案 |
| 谈案SOP | TalkSOP | opportunity_id、node_id | 谈案节点未完成阻断商机阶段推进 |

**预警规则**：违规表述（虚假承诺/夸大效果/违规收费）自动标记 violation，通知 handler_id；notified=true 后 24 小时未处理升级至合规主管。

---

#### 11.4.3 办案环节合规点

**覆盖对象与实体**

| 合规点 | 对应实体 | 关键字段 | 预警规则 |
|--------|---------|---------|---------|
| SOP节点校验 | CaseComplianceCheck | check_type=sop_node、check_result | 必做节点未完成 → violation，阻断结案 |
| 超期预警 | CaseWarning + CaseComplianceCheck | warning_type、warning_level、target_date | 超期升级通知：PENDING 超 3 天 → handler；超 7 天 → 管理员；超 15 天 → 律所主任 |
| 文书巡检 | CaseComplianceCheck | check_type=document_inspection | 文书缺失/不规范 → warning |
| 证据巡检 | CaseComplianceCheck | check_type=evidence_inspection | 证据未验证（evidence_verified=false）→ warning |
| 人员变更 | CaseComplianceCheck + CasePersonnelChange | check_type=personnel_change | 办案律师变更需合规审批 |

**预警规则**：超期升级通知管理员；SOP 强制节点未完成阻断结案；高风险（risk_level=high）案件自动纳入合规重点监控清单。

---

#### 11.4.4 财务环节合规点

**覆盖对象与实体**

| 合规点 | 对应实体 | 关键字段 | 预警规则 |
|--------|---------|---------|---------|
| 收费校验 | FinanceComplianceCheck | check_type=receivable、target_type=receivable | 应收金额异常/未收款即办案 → warning |
| 发票对应校验 | FinanceComplianceCheck + Invoice | check_type=invoice、target_type=invoice | 收款无发票/发票无收款 → warning；金额不一致 → violation |
| 分润校验 | FinanceComplianceCheck | check_type=commission、target_type=commission | 分润总额 > 案件金额 → violation 拦截；规则缺失 → warning |
| 退费合规 | FinanceComplianceCheck | 关联 Refund.case_id | 退费案件自动标记合规关注 |

**预警规则**：异常分润（分润总额超案件金额）直接拦截 CommissionRecord 落库；发票金额与收款金额不一致触发 violation，通知财务管理员。

---

### 11.5 数据中台数据源校验

#### 11.5.1 投放数据源

| 维度 | 说明 |
|------|------|
| 数据实体 | ConversionEvent + AdAccount + AdPlan |
| 消耗口径 | 来自广告平台 API（AdAccount.balance 反推 / 平台报表接口） |
| 转化口径 | 来自 CRM（ConversionEvent 表，按 event_type 统计 lead/wechat/invite/sign 四级转化） |
| 关联键 | ConversionEvent.account_id ↔ AdAccount.account_id（松耦合字符串关联）；ConversionEvent.plan_id ↔ AdPlan.platform_plan_id |
| 更新频率 | T+1（每日 02:00 拉取平台消耗报表，转化数据实时写入） |
| 数据时区 | Asia/Shanghai |

#### 11.5.2 销售数据源

| 维度 | 说明 |
|------|------|
| 数据实体 | Lead + InviteTask + Opportunity |
| 线索量口径 | 来自 Lead 表（按 source_channel 维度统计） |
| 邀约量口径 | 来自 InviteTask 表（按 result=arrived 统计到所量） |
| 商机量口径 | 来自 Opportunity 表（按 stage/status 统计） |
| 关联键 | InviteTask.lead_id ↔ Lead.id；Opportunity.lead_id ↔ Lead.id |
| 更新频率 | 实时 |
| 数据时区 | Asia/Shanghai |

#### 11.5.3 办案数据源

| 维度 | 说明 |
|------|------|
| 数据实体 | Case + CaseTask + CaseWarning |
| 案件量口径 | 来自 Case 表（按 case_type/status 统计） |
| 超期率口径 | 来自 CaseWarning 表（warning_status=PENDING 占比） |
| 节点完成率口径 | 来自 CaseTask 表（completed/total 比例） |
| 关联键 | CaseTask.case_id ↔ Case.id；CaseWarning.case_id ↔ Case.id |
| 更新频率 | 实时 |
| 数据时区 | Asia/Shanghai |

#### 11.5.4 财务数据源

| 维度 | 说明 |
|------|------|
| 数据实体 | Receivable + PaymentRecord + CommissionRecord |
| 营收口径 | 来自 PaymentRecord 表（status=PAID 的 amount 汇总） |
| 应收口径 | 来自 Receivable 表（contract_amount / pending_amount） |
| 分润口径 | 来自 CommissionRecord 表（commission_amount 汇总，按 status 区分已发/待发） |
| 关联键 | PaymentRecord.case_id / Receivable.case_id / CommissionRecord.case_id ↔ Case.id |
| 更新频率 | 实时 |
| 数据时区 | Asia/Shanghai |

#### 11.5.5 合规数据源

| 维度 | 说明 |
|------|------|
| 数据实体 | ComplianceCheckResult + ComplaintTicket |
| 违规数口径 | 来自 ComplianceCheckResult 表（check_result=reject/violation 计数，按 target_type 分组） |
| 客诉率口径 | 来自 ComplaintTicket 表（complaint 数 / 案件数） |
| 处理及时率口径 | ComplaintTicket.resolved_at - created_at 与 SLA 阈值对比 |
| 关联键 | ComplaintTicket.case_id ↔ Case.id；ComplianceCheckResult.target_id ↔ 各业务实体 |
| 更新频率 | 实时 |
| 数据时区 | Asia/Shanghai |

#### 11.5.6 口径统一规则

| 统一项 | 规则 |
|--------|------|
| 主键关联 | 所有看板基于唯一 client_id（=Lead.id）和 case_id（=Case.id）关联，禁止跨主键拼接 |
| 时区 | 全系统统一 Asia/Shanghai，数据库存储 UTC，查询时转换 |
| 金额单位 | 统一"元"（decimal precision=12, scale=2），禁止"万元/分"混用 |
| 时间格式 | 统一 ISO8601（YYYY-MM-DDTHH:mm:ss.sssZ），前端展示按本地时区格式化 |
| 组织隔离 | 所有查询强制带 organization_id，禁止跨组织聚合 |
| 数据刷新 | 实时数据延迟 ≤ 5 秒；T+1 数据每日 02:00 全量刷新；报表缓存 1 小时 |

---

### 11.6 整体衔接性最终结论

**衔接性汇总表**

| 链路名称 | 衔接点数 | 字段映射完整度 | 异常处理覆盖 | 结论 |
|---------|---------|---------------|-------------|------|
| 投放→线索→私域→销转 | 4 | 100%（核心字段全映射，含回填与反查） | 100%（重试/告警/人工补录/去重） | 无断点 |
| 销转→立案→办案→结案 | 4 | 100%（通过 lead_id 纽带贯通） | 100%（审批驳回/阻断/告警/回滚） | 无断点 |
| 立案→应收→收款→分润→退费 | 4 | 100%（事务同步保证账实一致） | 100%（金额校验/规则缺失/回滚机制） | 无断点 |
| 全链路合规覆盖 | 4 环节 | 100%（每环节有对应合规实体） | 100%（拦截/告警/升级通知） | 无盲区 |
| 数据中台数据源 | 6 数据源 | 100%（口径统一、主键关联） | 100%（缓存/重试/SLA） | 无孤岛 |

**最终结论**：8大模块围绕"获客—销转—办案—合规—财务—服务"核心链路实现全流程字段级打通，每个衔接点均有明确的字段映射表、触发条件、同步方式与异常处理策略。**8大链路无断点、数据无孤岛、合规无盲区**，完整支撑网推律所全链路数字化运营需求。

---

## 第12章 附录

### 附录A 典型业务场景剧本

#### A.1 婚姻案件全流程

| 步骤 | 角色 | 操作 | 系统响应 | 产出数据 |
|------|------|------|---------|---------|
| 1 | 抖音用户 | 在抖音看到离婚咨询广告，填写表单（姓名/电话/简述需求）提交 | ConversionEvent 创建（channel=douyin，event_type=lead），异步入队 | ConversionEvent 记录 |
| 2 | 系统 | BullMQ 消费 lead-import-queue | 校验手机号 → 创建 Lead（case_type=marriage）→ 回填 ConversionEvent.lead_id | Lead 记录 |
| 3 | 系统 | 线索自动分配（按 case_type 路由） | Lead.assign_sales_id 写入，状态 NEW→ASSIGNED，触发企微通知 | LeadAssignmentLog |
| 4 | 销售 | 查看线索，引导客户扫描 LiveCode 加企微 | 客户加微回调，反查 Lead.id 写入 ChatArchive.client_id | ChatArchive 记录 |
| 5 | 销售 | 创建 InviteTask，电话邀约到所 | InviteTask 创建；通话结束录音上传 recording_url | InviteTask 记录 |
| 6 | 销售 | 客户到所，标记 InviteTask.result=arrived | 同步创建 Opportunity（stage=FIRST_CONTACT），分配谈案岗 negotiator_id | Opportunity + StageLog |
| 7 | 谈案律师 | 谈案、报价、签约，Opportunity.actual_amount 填写，status=WON | 同步创建 Case（case_type=marriage，amount=签约金额），ConversionEvent(event_type=sign，case_id 回填) | Case + ConversionEvent |
| 8 | 律所主任 | 立案审批通过 | Case.filing_date 写入，status=IN_PROGRESS；触发 SOP 生成 + 应收生成 | CaseTask × N + Receivable |
| 9 | 办案律师 | 按 CaseSOP 执行：立案→调解前取证→证据收集（Evidence 上传） | CaseTask 逐条 completed；案件节点变更触发 CasePushNotification 推送客户 | CaseTask 进度 + Evidence |
| 10 | 办案律师 | 开庭节点完成，上传判决书 Document | CaseTask（court/judgment）completed；CaseWarning 自动检测上诉期 | Document + CaseWarning |
| 11 | 办案律师 | 提交结案申请 | CaseArchive 校验节点闭环 + 材料清单通过 → archive_status=ARCHIVED；Case.status=closed | CaseArchive |
| 12 | 系统/财务 | 结案 + 全款到账触发分润 | CommissionService 按 CommissionRule 计算 lawyer/negotiator/assistant 提成，生成 CommissionRecord | CommissionRecord × N |
| 13 | 客户 | C 端收到结案推送，提交 ServiceRating 评价 | ServiceRating 创建，satisfaction_score 写入；同步至数据中台 | ServiceRating |

---

#### A.2 劳动仲裁全流程

| 步骤 | 角色 | 操作 | 系统响应 | 产出数据 |
|------|------|------|---------|---------|
| 1 | 百度用户 | 在百度搜索"劳动仲裁律师"，点击广告填写表单提交 | ConversionEvent 创建（channel=baidu，event_type=lead） | ConversionEvent |
| 2 | 系统 | 异步创建 Lead（case_type=labor） | Lead 创建 + lead_id 回填 | Lead |
| 3 | 销售 | 加微沟通，InviteTask 创建并邀约到所 | InviteTask.result=arrived → Opportunity 创建 | InviteTask + Opportunity |
| 4 | 谈案律师 | 谈案签约，Opportunity.status=WON | Case 创建（case_type=labor），ConversionEvent(event_type=sign) | Case |
| 5 | 律所主任 | 立案审批通过 | CaseTask 按"劳动仲裁标准流程"SOP 模板生成（立案→举证→开庭→裁决）；Receivable 生成 | CaseTask + Receivable |
| 6 | 办案律师 | 执行举证阶段：收集劳动合同/工资流水/考勤记录（Evidence 上传） | CaseTask（举证）completed；证据 evidence_verified=true | Evidence |
| 7 | 办案律师 | 仲裁庭审节点，上传仲裁裁决书 | CaseTask（court）completed；Document 落库 | Document |
| 8 | 办案律师 | 提交结案申请 | CaseArchive 校验通过 → ARCHIVED；Case.status=closed | CaseArchive |
| 9 | 财务 | 确认全款到账 PaymentRecord.status=PAID | Receivable.status=COMPLETED；触发分润计算 | PaymentRecord + CommissionRecord |
| 10 | 系统 | 案件归档，数据中台更新案件量/营收/分润看板 | Dashboard 报表刷新 | 报表数据 |

---

#### A.3 交通事故全流程

| 步骤 | 角色 | 操作 | 系统响应 | 产出数据 |
|------|------|------|---------|---------|
| 1 | 快手用户 | 在快手看到交通事故咨询广告，填写表单 | ConversionEvent 创建（channel=kuaishou，event_type=lead） | ConversionEvent |
| 2 | 系统 | 异步创建 Lead（case_type=traffic） | Lead 创建 + lead_id 回填 | Lead |
| 3 | 销售 | 邀约到所，InviteTask.result=arrived | Opportunity 创建，分配谈案律师 | InviteTask + Opportunity |
| 4 | 谈案律师 | 谈案签约，Opportunity.status=WON，actual_amount 填写 | Case 创建（case_type=traffic），ConversionEvent(event_type=sign) | Case |
| 5 | 律所主任 | 立案审批通过 | CaseTask 按"交通事故标准流程"SOP 生成；Receivable 生成 | CaseTask + Receivable |
| 6 | 办案律师 | 伤残鉴定阶段：上传鉴定报告 Evidence | CaseTask（伤残鉴定）completed；证据归档 | Evidence |
| 7 | 办案律师 | 谈判阶段：与保险公司/对方谈判，记录谈判结果 | CaseTask（谈判）completed；CaseTask.result 写入 | CaseTask |
| 8 | 办案律师 | 调解成功 → 调解结案；调解失败 → 诉讼节点 | 调解：Case.status 直接进入结案；诉讼：开庭节点 CaseTask 生成 | CaseTask |
| 9 | 办案律师 | 提交结案申请 | CaseArchive 校验通过 → ARCHIVED | CaseArchive |
| 10 | 财务 | 全款到账，触发分润 | CommissionRecord 生成（律师/谈案/助理） | CommissionRecord |
| 11 | 系统 | 数据中台更新交通事故案件量/平均处理周期/营收看板 | Dashboard 报表刷新 | 报表数据 |

---

### 附录B 常见问题FAQ

#### B.1 技术选型类

**Q1：为什么选 NestJS 而非 Express？**
NestJS 提供开箱即用的模块化架构、依赖注入、TypeScript 强类型支持，内置守卫（Guard）、拦截器（Interceptor）、管道（Pipe）天然适配 JWT 鉴权、字段校验、统一响应等企业级需求；Express 需自行拼装中间件，大型项目维护成本高。NestJS 的全局前缀 `api` 配合 `@nestjs/swagger` 可自动生成 OpenAPI 文档，降低前后端协作成本。

**Q2：为什么用 SQLite 而非 PostgreSQL？**
网推律所单组织数据量通常在百万级记录以内，SQLite 单文件部署免数据库运维，降低中小律所部署门槛；TypeORM 抽象层保证未来可平滑切换至 PostgreSQL（仅需改 datasource 配置）。对于高并发写入场景（如聊天归档），通过 WAL 模式 + 批量插入优化即可满足。

**Q3：为什么用 AntD6 而非 AntD5？**
AntD6 提供更完善的 Design Token 与 CSS-in-JS 主题定制能力，性能更优（组件按需加载），且修复了 AntD5 的多处 Table 虚拟滚动缺陷，更适合律所后台密集表格场景。

**Q4：为什么用 JWT 而非 Session？**
SaaS 平台需支持多端（管理后台 + C 端 H5 + 企微内嵌），JWT 无状态特性天然适配分布式与跨域；配合 Refresh Token 机制兼顾安全与体验。Session 在多实例部署下需引入 Redis 共享，增加运维复杂度。

#### B.2 部署类

**Q5：腾讯云 CVM 如何选型？**
推荐 4 核 8G（中小律所，<50 并发）或 8 核 16G（大型律所，>100 并发）；磁盘 SSD 100G 起（SQLite 文件 + 上传文件存储）；带宽 5Mbps 起，峰值可按量付费。地域选择距客户最近的华东/华北节点。

**Q6：Docker 部署步骤？**
1. 编写 Dockerfile（node:20-alpine 基础镜像，多阶段构建，dist 产物 + production 依赖）；
2. docker-compose.yml 编排 backend + nginx + 静态前端；
3. SQLite 数据卷挂载至 `/data/db`，上传文件挂载至 `/data/uploads`；
4. `docker compose up -d` 启动，`docker compose logs -f` 查看日志。

**Q7：Nginx 如何配置？**
配置反向代理 `/api/* → backend:3000`，前端静态资源 `/* → /usr/share/nginx/html`；开启 gzip 压缩、client_max_body_size 50M（文件上传）、HTTPS（Let's Encrypt 免费证书）；WebSocket（企微回调）配置 `proxy_set_header Upgrade $http_upgrade`。

**Q8：SQLite 如何备份？**
1. 在线备份：`sqlite3 db.sqlite ".backup '/data/backup/db-$(date +%Y%m%d).sqlite'"`；
2. 定时任务：crontab 每日 03:00 执行备份脚本，保留近 30 天；
3. 异地容灾：备份文件 rsync 至对象存储（COS）；
4. WAL 模式下备份不影响在线读写。

#### B.3 集成类

**Q9：如何对接抖音广告 API？**
1. 在抖音开放平台创建应用，获取 app_id/app_secret；
2. AdAccount.auth_token 存储 OAuth access_token + refresh_token（JSON）；
3. 配置转化回传 Webhook：抖音线索表单提交 → POST `/api/marketing/conversion-events`；
4. 消耗数据通过 Ocean Engine API 每日拉取（T+1）；
5. token 过期前 7 天自动刷新。

**Q10：企微聊天存档如何接入？**
1. 企微管理后台开通会话存档功能，获取 secret；
2. 部署会话存档 SDK（C++ 原生库 + Node 原生扩展）；
3. 长连接拉取消息，解密后写入 ChatArchive；
4. 通过 ChatArchive.client_id（phone 反查 Lead.id）关联线索；
5. 文件媒体单独下载存储至 OSS/本地。

**Q11：飞书审批如何配置？**
1. 飞书开放平台创建自建应用，配置审批事件订阅；
2. 在飞书审批后台创建审批流模板（立案审批/退费审批/结案审批）；
3. 系统通过飞书 OpenAPI 发起审批实例，回调 Webhook 接收审批结果；
4. 审批通过/驳回同步更新业务实体状态（Case.status / Refund.status / CaseArchive.archive_status）。

#### B.4 数据迁移类

**Q12：从其他 CRM 迁移数据如何操作？**
1. 导出原系统数据为 CSV/Excel；
2. 按 Lead/Opportunity/Case 实体字段映射整理模板；
3. 通过 `/api/lead/import`、`/api/case/import` 批量导入接口上传；
4. 系统自动校验手机号去重、组织隔离、字段格式；
5. 导入日志记录失败行，支持修正后重导。

**Q13：SQLite 升级 PostgreSQL 如何做？**
1. 部署 PostgreSQL 实例；
2. 使用 `pgloader` 工具迁移 SQLite → PostgreSQL（自动处理类型映射）；
3. 修改后端 datasource 配置（type: postgres + 连接串）；
4. TypeORM 自动适配，无需改业务代码；
5. 灰度切换：先双写读 SQLite，验证一致后切读 PostgreSQL。

#### B.5 权限类

**Q14：如何配置角色权限？**
基于 RBAC 模型：1. 在 User 实体配置 role 字段（admin/director/lawyer/sales/finance/compliance）；2. 每个角色对应权限点矩阵（模块 + 操作）；3. NestJS Guard `@Roles('admin','director')` 装饰器校验；4. 超管可在 `/api/user/roles` 自定义角色与权限点。

**Q15：数据隔离如何实现？**
所有业务实体含 organization_id 字段，查询强制带 `WHERE organization_id = currentUser.orgId`；通过 TypeORM 全局订阅器自动注入 organization_id；跨组织查询需超管权限。C 端客户通过 client_id 隔离，仅能查看本人案件。

**Q16：C 端客户如何认证？**
C 端客户使用手机号 + 验证码登录（无密码），JWT 与管理后台独立签发（payload 含 client_id 而非 user_id），有效期 7 天；通过 `/api/client/auth/login` 颁发，访问 C 端接口走 ClientGuard 而非 JwtAuthGuard。

#### B.6 性能类

**Q17：线索量大时如何优化？**
1. SQLite 开启 WAL 模式，提升并发读；
2. Lead 表索引：organization_id + source_channel + created_at 复合索引；
3. 线索导入走 BullMQ 异步队列，削峰填谷；
4. 线索列表分页查询（cursor 分页优于 offset）；
5. 单组织线索量超 500 万时，建议升级 PostgreSQL + 读写分离。

**Q18：报表生成慢如何处理？**
1. 报表数据缓存 1 小时（Redis 或内存缓存）；
2. 复杂聚合预计算至物化视图/汇总表（dashboard_report 每日全量刷新）；
3. 大表查询走只读副本；
4. 报表导出异步生成（ReportExportLog 记录），完成通知下载。

#### B.7 安全类

**Q19：JWT 密钥如何管理？**
1. 密钥通过环境变量 `JWT_SECRET` 注入，禁止硬编码；
2. 生产环境密钥长度 ≥ 32 字符，定期轮换（季度）；
3. 密钥存储于密钥管理服务（如腾讯云 KMS）或 Vault；
4. Refresh Token 单独密钥，与 Access Token 隔离。

**Q20：敏感数据如何脱敏？**
1. 手机号展示脱敏（138****5678）；
2. 身份证号存储加密（AES-256），展示脱敏；
3. ChatArchive 推送客户前过滤敏感信息（金额/对方当事人）；
4. 数据库备份文件加密存储；
5. 日志输出禁止打印手机号/身份证号，自动脱敏中间件处理。

**Q21：文件上传如何校验？**
1. 文件类型白名单（jpg/png/pdf/docx/mp3/mp4）；
2. 文件大小限制（图片 10M、文档 50M、音视频 200M）；
3. MIME 类型 + 文件头双重校验，防止伪造扩展名；
4. 文件名重命名（UUID + 原扩展名），防止路径遍历攻击；
5. 上传至独立目录，Nginx 禁止该目录执行权限。

