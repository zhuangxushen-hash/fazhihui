# 法智汇 - 外部系统对接功能清单

## 文档说明
- **生成时间**: 2026-08-07
- **目的**: 梳理项目中所有需要对接外部系统/API/服务的功能模块
- **版本**: v1.0

---

## 一、广告投放平台对接（5 个平台）

### 1.1 巨量引擎（抖音广告）
- **对接平台**: 巨量引擎开放平台
- **官方文档**: https://open.oceanengine.com/
- **后端实现**: `backend/src/ad-platforms/platforms/ocean-engine.service.ts`
- **对接状态**: 已完成基础框架
- **配置要求**: 
  - `OCEAN_ENGINE_APP_ID`
  - `OCEAN_ENGINE_APP_SECRET
- **功能清单**:

| 功能 | 接口路径 | 状态 | 说明 |
|------|----------|------|------|
| OAuth 授权 | `/oauth/callback/ocean_engine` | 已实现 | 授权码模式获取 access_token |
| 账户余额同步 | `POST /ad-platforms/sync/balance/:platform` | 已实现 | 巨量引擎账户余额拉取 |
| 投放计划同步 | `POST /ad-platforms/sync/campaigns/:platform` | 已实现 | 广告计划列表同步 |
| 报表数据同步 | `POST /ad-platforms/sync/report/:platform` | 已实现 | 消耗/展示/点击/转化数据 |
| 线索回调 | `POST /ad-platforms/webhook/:platform/lead` | 已实现 | 留资数据接收 |
| 转化回调 | `POST /ad-platforms/webhook/:platform/conversion` | 已实现 | 转化事件回传 |
| 创建投放计划 | 内部调用 | 已实现 | 通过 API 创建 campaign |
| 更新计划状态 | 内部调用 | 已实现 | 启用/暂停操作 |
| 回传转化数据 | 内部调用 | 已实现 | convert_data 接口 |

### 1.2 腾讯广告（广点通）
- **对接平台**: 腾讯广告开放平台
- **官方文档**: https://developers.e.qq.com/
- **后端实现**: `backend/src/ad-platforms/platforms/tencent-ads.service.ts`
- **对接状态**: 已完成基础框架
- **配置要求**:
  - `TENCENT_ADS_APP_ID`
  - `TENCENT_ADS_APP_SECRET`
- **功能清单**:

| 功能 | 接口路径 | 状态 | 说明 |
|------|----------|------|------|
| OAuth 授权 | `/oauth/callback/tencent_ads` | 已实现 | 授权码模式 |
| 账户余额同步 | 同上 | 已实现 | 单位转换：分→元 |
| 投放计划同步 | 同上 | 已实现 | campaigns/get 接口 |
| 报表数据同步 | 同上 | 已实现 | real_time_cost/get 实时统计 |
| 线索回调 | 同上 | 已实现 | Webhook 接收 |
| 转化回调 | 同上 | 已实现 | user_actions/add 回传 |
| 创建投放计划 | 内部调用 | 已实现 | campaigns/add 接口 |

### 1.3 百度营销
- **对接平台**: 百度营销开放平台
- **官方文档**: https://dev2.baidu.com/
- **后端实现**: `backend/src/ad-platforms/platforms/baidu-marketing.service.ts`
- **对接状态**: 已完成基础框架
- **配置要求**:
  - `BAIDU_MARKETING_APP_ID`
  - `BAIDU_MARKETING_APP_SECRET`
- **功能清单**: 与巨量引擎类似（OAuth、账户、计划、报表、Webhook）

### 1.4 快手广告（磁力引擎）
- **对接平台**: 磁力引擎开放平台
- **官方文档**: https://www.kuaishou.com/
- **后端实现**: `backend/src/ad-platforms/platforms/kuaishou-ads.service.ts`
- **对接状态**: 已完成基础框架
- **配置要求**:
  - `KUAISHOU_ADS_APP_ID`
  - `KUAISHOU_ADS_APP_SECRET`
- **功能清单**: 与巨量引擎类似（OAuth、账户、计划、报表、Webhook）

### 1.5 抖音开放平台
- **对接平台**: 抖音开放平台
- **官方文档**: https://open.douyin.com/
- **后端实现**: `backend/src/ad-platforms/platforms/douyin-open.service.ts`
- **对接状态**: 已完成基础框架
- **配置要求**:
  - `DOUYIN_OPEN_APP_ID`
  - `DOUYIN_OPEN_APP_SECRET`
- **功能清单**: 
  - 抖音运营账号授权
  - 内容发布（短视频、直播）
  - 用户互动数据同步

---

## 二、AI 服务对接

### 2.1 AI 智能助手
- **对接平台**: 外部大模型 API（待定）
- **后端实现**: `backend/src/ai/ai.controller.ts`, `backend/src/ai/ai.service.ts`
- **对接状态**: 框架已完成，AI 功能为预设响应
- **待对接**: 
  - 接入真实 LLM（如千问、GPT、文心一言等）
  - RAG 知识库检索
- **功能清单**:

| 功能 | 接口路径 | 当前状态 | 待对接内容 |
|------|----------|----------|------------|
| AI 营销文案生成 | `POST /ai/marketing/copy` | 预设响应 | 接入大模型生成 |
| AI 营销话术生成 | `POST /ai/marketing/script` | 预设响应 | 接入大模型生成 |
| AI 法律文书生成 | `POST /ai/legal/document` | 预设响应 | 接入大模型生成 |
| AI 风险分析 | `POST /ai/legal/risk-analysis` | 预设响应 | 接入大模型分析 |
| AI 智能对话 | `POST /ai/chat` | 预设响应（关键词匹配） | 接入大模型对话 |
| AI 合同审查 | `POST /ai/contract-review` | 预设响应（规则匹配） | 接入大模型审查 |
| AI 法律研究 | `POST /ai/legal-research` | 预设响应 | 接入 RAG 检索 |
| AI 类案检索 | `GET /ai/similar-cases` | 空数据占位 | 接入 SimilarCaseService |
| AI 法条查询 | `GET /ai/laws` | 空数据占位 | 接入 KnowledgeService |

---

## 三、社交媒体/公域平台对接

### 3.1 公域账号管理
- **对接平台**: 微信、抖音、小红书、视频号等
- **后端实现**: `backend/src/marketing/social-account.controller.ts`
- **对接状态**: 数据模型已完成，实际 OAuth 对接待实现
- **支持平台枚举**: `SocialPlatform` 类型
- **功能清单**:

| 功能 | 接口路径 | 状态 | 待对接内容 |
|------|----------|------|------------|
| 账号授权 | `PUT /social-accounts/:id/authorize` | 框架就绪 | 各平台 OAuth 流程 |
| 账号数据同步 | `GET /social-accounts` | 框架就绪 | 粉丝数、互动数拉取 |
| 内容发布 | 待实现 | 未实现 | 对接各平台发布 API |
| 消息/评论同步 | 待实现 | 未实现 | 对接各平台消息 API |

### 3.2 社交内容发布
- **后端实现**: `backend/src/marketing/social-post.controller.ts`
- **对接状态**: 数据模型已完成
- **待对接**:
  - 微信公众号/视频号发布 API
  - 抖音开放平台发布 API
  - 小红书发布 API
  - 微博发布 API

---

## 四、即时通讯/办公协作对接

### 4.1 企业微信
- **对接平台**: 企业微信开放平台
- **官方文档**: https://developer.work.weixin.qq.com/
- **对接状态**: 未开始
- **待实现功能**:
  - 组织架构同步
  - 员工身份认证（扫码登录）
  - 消息通知推送
  - 客户联系（外部联系人管理）
  - 日程/会议集成
  - 文档/审批集成

### 4.2 飞书
- **对接平台**: 飞书开放平台
- **官方文档**: https://open.feishu.cn/
- **对接状态**: 未开始
- **待实现功能**:
  - 组织架构同步
  - 员工身份认证
  - 消息通知推送
  - 日历/会议集成
  - 多维表格数据同步
  - 审批流程集成

### 4.3 钉钉
- **对接平台**: 钉钉开放平台
- **官方文档**: https://open.dingtalk.com/
- **对接状态**: 未开始
- **待实现功能**:
  - 组织架构同步
  - 员工身份认证
  - 消息通知推送
  - 考勤数据同步
  - 审批流程集成

---

## 五、支付对接

### 5.1 支付平台
- **对接平台**: 支付宝、微信支付
- **后端实现**: `backend/src/finance/` 模块
- **对接状态**: 数据模型已完成，支付接口未实现
- **待实现功能**:
  - 在线支付（支付宝/微信 H5、JSAPI）
  - 支付回调通知
  - 退款处理
  - 对账单下载
  - 分账/结算

---

## 六、短信/邮件服务对接

### 6.1 邮件服务
- **后端实现**: `backend/src/mail/mail.controller.ts`, `backend/src/mail/mail.service.ts`
- **对接状态**: 基础 CRUD 完成，实际邮件发送待对接
- **待对接**:
  - SMTP 邮件发送服务（如阿里云邮推、SendCloud、Amazon SES）
  - 邮件模板管理
  - 邮件发送记录跟踪

### 6.2 短信服务
- **对接平台**: 阿里云短信、腾讯云短信、华为云短信
- **对接状态**: 未开始
- **待实现功能**:
  - 验证码发送
  - 营销短信推送
  - 短信签名/模板管理

---

## 七、电子签章对接

### 7.1 电子签章服务
- **后端实现**: `backend/src/seal/seal.controller.ts`
- **对接状态**: 内部用印流程已完成，第三方签章对接未实现
- **待对接**:
  - 法大大/e 签宝/上上签 API
  - 电子印章生成
  - 合同在线签署
  - 签章记录查询
  - 批量签章

---

## 八、AI 数字人直播
- **后端实现**: `backend/src/marketing/digital-human-live.controller.ts`
- **对接状态**: 数据模型和 CRUD 完成，数字人服务对接未实现
- **待对接**:
  - 火山引擎数字人
  - 百度智能云数字人
  - 腾讯云数字人
  - 直播推流/拉流

---

## 九、实名认证/身份核验

### 9.1 律师执业证核验
- **对接平台**: 司法部/全国律师执业诚信信息公示平台
- **对接状态**: 未开始
- **待实现功能**:
  - 执业证 OCR 识别
  - 执业信息核验
  - 律所信息核验

### 9.2 客户实名认证
- **对接平台**: 公安部身份核验、第三方实名服务
- **对接状态**: 未开始
- **待实现功能**:
  - 身份证 OCR
  - 人脸比对
  - 实名核验

---

## 十、舆情监控对接

- **后端实现**: `backend/src/public-opinion/public-opinion.controller.ts`
- **对接状态**: 内部 CRUD 完成，舆情数据采集待对接
- **待对接**:
  - 百度指数/舆情 API
  - 微博舆情 API
  - 微信舆情监控
  - 第三方舆情服务商（如新榜、清博）

---

## 十一、其他外部对接

### 11.1 电子合同存储
- **对接平台**: 阿里云 OSS / 腾讯云 COS / 七牛云
- **对接状态**: 未开始
- **待实现**: 合同文件上传、下载、CDN 分发

### 11.2 日历/日程集成
- **对接平台**: 企业微信日历、飞书日历、Google Calendar
- **后端实现**: `backend/src/schedule/` 模块
- **对接状态**: 内部日程管理完成，外部同步未实现
- **待实现**: 日程双向同步、会议室预定集成

### 11.3 法律数据库
- **对接平台**: 国家法律法规数据库、北大法宝、威科先行
- **后端实现**: `backend/src/knowledge/` 模块
- **对接状态**: 数据模型完成，外部 API 未对接
- **待实现**: 法规检索、案例检索、司法解释查询

### 11.4 法院/仲裁机构
- **对接状态**: 未开始
- **待实现**:
  - 立案数据对接
  - 裁判文书查询
  - 执行信息查询

---

## 十二、对接优先级建议

### P0 - 核心业务阻塞

| 优先级 | 对接项 | 影响范围 | 预估工作量 |
|--------|--------|----------|------------|
| P0 | 支付对接（支付宝/微信） | 客户付款、退费全流程 | 中 |
| P0 | 电子签章对接 | 合同签署、用印流程 | 中 |
| P0 | AI 大模型接入 | AI 助手核心功能 | 中 |
| P1 | 短信服务对接 | 验证码、通知推送 | 小 |
| P1 | 邮件服务对接 | 邮件通知、营销邮件 | 小 |

### P1 - 重要功能补充

| 优先级 | 对接项 | 影响范围 | 预估工作量 |
|--------|--------|----------|------------|
| P1 | 企业微信/飞书对接 | 组织架构、消息通知 | 大 |
| P1 | 社交媒体发布 API | 内容营销自动化 | 大 |
| P1 | 实名认证对接 | 客户实名认证 | 中 |

### P2 - 增值功能

| 优先级 | 对接项 | 影响范围 | 预估工作量 |
|--------|--------|----------|------------|
| P2 | AI 数字人直播 | 营销直播功能 | 大 |
| P2 | 舆情监控对接 | 品牌舆情管理 | 中 |
| P2 | 法律数据库对接 | 法规/案例检索 | 中 |
| P2 | 日历/日程集成 | 办公协同 | 中 |
| P2 | 法院/仲裁机构对接 | 司法数据查询 | 大 |

---

## 附录：对接配置环境变量

```bash
# === 广告平台 ===
# 巨量引擎（抖音广告）
OCEAN_ENGINE_APP_ID=
OCEAN_ENGINE_APP_SECRET=

# 腾讯广告
TENCENT_ADS_APP_ID=
TENCENT_ADS_APP_SECRET=

# 百度营销
BAIDU_MARKETING_APP_ID=
BAIDU_MARKETING_APP_SECRET=

# 快手广告（磁力引擎）
KUAISHOU_ADS_APP_ID=
KUAISHOU_ADS_APP_SECRET=

# 抖音开放平台
DOUYIN_OPEN_APP_ID=
DOUYIN_OPEN_APP_SECRET=

# === AI 服务 ===
# 大模型 API
LLM_API_KEY=
LLM_API_ENDPOINT=

# === 社交媒体 ===
WECHAT_MP_APP_ID=
WECHAT_MP_APP_SECRET=
WECHAT_WORK_CORP_ID=
WECHAT_WORK_CORP_SECRET=
DOUYIN_APP_ID=
DOUYIN_APP_SECRET=
XIAOHONGSHU_APP_ID=
XIAOHONGSHU_APP_SECRET=

# === 即时通讯 ===
FEISHU_APP_ID=
FEISHU_APP_SECRET=
DINGTALK_APP_ID=
DINGTALK_APP_SECRET=

# === 支付 ===
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
WECHAT_PAY_APP_ID=
WECHAT_PAY_MCH_ID=
WECHAT_PAY_API_KEY=

# === 短信 ===
ALIYUN_SMS_ACCESS_KEY_ID=
ALIYUN_SMS_ACCESS_KEY_SECRET=
ALIYUN_SMS_SIGN_NAME=

# === 邮件 ===
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

# === 电子签章 ===
FAAPI_APP_ID=
FAAPI_APP_SECRET=

# === 存储 ===
ALIYUN_OSS_ACCESS_KEY_ID=
ALIYUN_OSS_ACCESS_KEY_SECRET=
ALIYUN_OSS_BUCKET=
ALIYUN_OSS_ENDPOINT=
```

---

*文档生成时间：2026-08-07*
*下次更新建议：完成某个对接项后及时更新本文档状态*
