import axios from './axios'

// ==================== 类型定义 ====================

// 对账规则匹配模式
export enum RuleMatchMode {
  EXACT = 'exact',
  FUZZY = 'fuzzy',
  REGEX = 'regex',
}

// 对账规则
export interface ReconciliationRule {
  id: string
  name: string
  description?: string
  match_mode: RuleMatchMode
  source_field: string
  target_field: string
  tolerance_amount?: number
  enabled: boolean
  organization_id?: string
  created_at: string
  updated_at: string
}

// ==================== 对账规则管理 ====================

/** 获取对账规则列表 */
export const getRules = (params?: { org_id?: string; enabled?: string }) => {
  return axios.get<ReconciliationRule[]>('/reconciliation-rules', { params })
}

/** 创建对账规则 */
export const createRule = (data: {
  name: string
  description?: string
  match_mode: RuleMatchMode
  source_field: string
  target_field: string
  tolerance_amount?: number
  enabled?: boolean
  organization_id?: string
}) => {
  return axios.post<ReconciliationRule>('/reconciliation-rules', data)
}

/** 更新对账规则 */
export const updateRule = (id: string, data: Partial<{
  name: string
  description: string
  match_mode: RuleMatchMode
  source_field: string
  target_field: string
  tolerance_amount: number
  enabled: boolean
}>) => {
  return axios.put<ReconciliationRule>(`/reconciliation-rules/${id}`, data)
}

/** 启停对账规则 */
export const toggleRule = (id: string, enabled: boolean) => {
  return axios.put<ReconciliationRule>(`/reconciliation-rules/${id}/toggle`, { enabled })
}

/** 删除对账规则 */
export const deleteRule = (id: string) => {
  return axios.delete(`/reconciliation-rules/${id}`)
}
