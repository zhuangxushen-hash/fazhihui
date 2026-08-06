import axios from './axios'

// ==================== 类型定义 ====================

// 推送渠道枚举
export type PushChannel = 'sms' | 'wechat' | 'app'

// 推送节点类型枚举（案件立案/开庭/结案/证据提交/文书生成等节点）
export type PushNodeType =
  | 'filing'        // 案件立案
  | 'court'         // 案件开庭
  | 'closed'        // 案件结案
  | 'evidence'      // 证据提交
  | 'document'      // 文书生成
  | 'judgment'      // 案件判决

// 推送规则配置（每个节点一条配置）
export interface PushRule {
  id: string
  // 节点类型
  node_type: PushNodeType
  // 节点中文名称
  node_label: string
  // 是否启用推送
  enabled: boolean
  // 推送内容模板（多行文本，支持变量占位符）
  content_template: string
  // 推送渠道列表（可多选：sms短信/wechat微信/app站内信）
  channels: PushChannel[]
  organization_id?: string
  created_at?: string
  updated_at?: string
}

// 更新推送规则请求参数
export interface UpdatePushRuleDto {
  enabled?: boolean
  content_template?: string
  channels?: PushChannel[]
}

// ==================== 推送规则管理接口 ====================

/**
 * 获取推送规则列表（复用 case-push-notifications 路由前缀）
 * 返回各节点的推送配置，未配置的节点返回默认配置
 */
export const getPushRules = (params?: { org_id?: string }) => {
  return axios.get<PushRule[]>('/case-push-notifications/rules', { params })
}

/** 获取单个推送节点配置详情 */
export const getPushRule = (nodeType: PushNodeType) => {
  return axios.get<PushRule>(`/case-push-notifications/rules/${nodeType}`)
}

/** 更新推送节点配置 */
export const updatePushRule = (nodeType: PushNodeType, data: UpdatePushRuleDto) => {
  return axios.put<PushRule>(`/case-push-notifications/rules/${nodeType}`, data)
}

/** 批量更新推送规则 */
export const batchUpdatePushRules = (data: UpdatePushRuleDto[]) => {
  return axios.put<PushRule[]>('/case-push-notifications/rules/batch', { rules: data })
}

// ==================== 节点与渠道展示映射 ====================

// 推送节点中文标签映射
export const pushNodeLabels: Record<PushNodeType, string> = {
  filing: '案件立案',
  court: '案件开庭',
  closed: '案件结案',
  evidence: '证据提交',
  document: '文书生成',
  judgment: '案件判决',
}

// 推送节点选项列表
export const pushNodeOptions: { value: PushNodeType; label: string }[] = [
  { value: 'filing', label: '案件立案' },
  { value: 'court', label: '案件开庭' },
  { value: 'closed', label: '案件结案' },
  { value: 'evidence', label: '证据提交' },
  { value: 'document', label: '文书生成' },
  { value: 'judgment', label: '案件判决' },
]

// 推送渠道中文标签映射
export const channelLabels: Record<PushChannel, string> = {
  sms: '短信',
  wechat: '微信',
  app: 'APP',
}

// 推送渠道选项列表
export const channelOptions: { value: PushChannel; label: string }[] = [
  { value: 'sms', label: '短信' },
  { value: 'wechat', label: '微信' },
  { value: 'app', label: 'APP' },
]
