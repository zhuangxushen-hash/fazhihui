import axios from './axios'

// 案件状态字典（组织级自定义）
export interface CaseStatusItem {
  id: string
  organization_id: string
  name: string
  code: string
  kind: string
  sort_order: number
  enabled: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

/** 查询组织案件状态列表（首次访问自动按系统默认播种） */
export const getCaseStatuses = (organization_id?: string) => {
  return axios.get<CaseStatusItem[]>('/case-statuses', { params: organization_id ? { organization_id } : undefined })
}

/** 新增自定义状态 */
export const createCaseStatus = (data: { name: string; kind?: string; sort_order?: number; is_default?: boolean }) => {
  return axios.post<CaseStatusItem>('/case-statuses', data)
}

/** 更新状态（名称/配色/排序/启停/默认） */
export const updateCaseStatus = (id: string, data: { name?: string; kind?: string; sort_order?: number; enabled?: boolean; is_default?: boolean }) => {
  return axios.put<CaseStatusItem>(`/case-statuses/${encodeURIComponent(id)}`, data)
}

/** 删除状态 */
export const deleteCaseStatus = (id: string) => {
  return axios.delete<{ success: boolean }>(`/case-statuses/${encodeURIComponent(id)}`)
}

/** 前端回退默认状态（接口失败时使用，与后端播种一致） */
export const FALLBACK_CASE_STATUSES: Array<{ code: string; name: string; kind: string }> = [
  { code: 'pending_assign', name: '待分配', kind: 'neutral' },
  { code: 'processing', name: '处理中', kind: 'blue' },
  { code: 'filing', name: '立案中', kind: 'blue' },
  { code: 'evidence', name: '取证中', kind: 'cyan' },
  { code: 'hearing', name: '庭审中', kind: 'orange' },
  { code: 'appeal', name: '上诉中', kind: 'geekblue' },
  { code: 'pending_close', name: '待结案', kind: 'orange' },
  { code: 'closed', name: '已结案', kind: 'green' },
  { code: 'terminated', name: '已解约', kind: 'orange' },
  { code: 'voided', name: '已作废', kind: 'red' },
]
