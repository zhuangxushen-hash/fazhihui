import axios from './axios'

// 投放计划状态
export type AdPlanStatus = 'running' | 'paused' | 'ended'

// 操作类型
export type AdPlanOperationType =
  | 'create'
  | 'update'
  | 'start'
  | 'pause'
  | 'end'
  | 'budget_adjust'
  | 'bid_adjust'
  | 'copy'
  | 'migrate'
  | 'delete'

// 投放计划
export interface AdPlan {
  id: string
  account_id: string
  plan_name: string
  case_type: string
  budget: number | string
  bid: number | string
  status: AdPlanStatus
  platform_plan_id?: string
  start_date?: string
  end_date?: string
  organization_id: string
  creator_id?: string
  created_at: string
  updated_at: string
}

// 操作日志
export interface AdPlanLog {
  id: string
  plan_id: string
  operator_id: string
  operation_type: AdPlanOperationType
  operation_detail?: string
  created_at: string
}

export interface FetchAdPlansParams {
  org_id: string
  account_id?: string
  case_type?: string
  status?: AdPlanStatus
  keyword?: string
  platform?: string
}

export interface AdPlanPayload {
  account_id: string
  plan_name: string
  case_type: string
  budget?: number
  bid?: number
  status?: AdPlanStatus
  platform_plan_id?: string
  start_date?: string
  end_date?: string
}

export const getAdPlans = (params: FetchAdPlansParams) => {
  return axios.get<AdPlan[]>('/ad-plans', { params })
}

export const getAdPlanById = (id: string) => {
  return axios.get<AdPlan>(`/ad-plans/${id}`)
}

export const createAdPlan = (data: AdPlanPayload) => {
  return axios.post<AdPlan>('/ad-plans', data)
}

export const updateAdPlan = (id: string, data: Partial<AdPlanPayload>) => {
  return axios.put<AdPlan>(`/ad-plans/${id}`, data)
}

export const deleteAdPlan = (id: string) => {
  return axios.delete<{ success: boolean }>(`/ad-plans/${id}`)
}

// 单项操作
export const adjustAdPlanBudget = (id: string, budget: number) => {
  return axios.put<AdPlan>(`/ad-plans/${id}/budget`, { budget })
}

export const adjustAdPlanBid = (id: string, bid: number) => {
  return axios.put<AdPlan>(`/ad-plans/${id}/bid`, { bid })
}

export const updateAdPlanStatus = (id: string, status: AdPlanStatus) => {
  return axios.put<AdPlan>(`/ad-plans/${id}/status`, { status })
}

// 批量操作
export const batchUpdateAdPlanStatus = (planIds: string[], status: AdPlanStatus) => {
  return axios.post<AdPlan[]>('/ad-plans/batch/status', { plan_ids: planIds, status })
}

export const batchAdjustAdPlanBudget = (planIds: string[], budget: number) => {
  return axios.post<AdPlan[]>('/ad-plans/batch/budget', { plan_ids: planIds, budget })
}

// 复制 / 迁移
export const copyAdPlan = (id: string, newPlanName?: string) => {
  return axios.post<AdPlan>(`/ad-plans/${id}/copy`, { new_plan_name: newPlanName })
}

export const migrateAdPlan = (id: string, targetAccountId: string) => {
  return axios.put<AdPlan>(`/ad-plans/${id}/migrate`, { target_account_id: targetAccountId })
}

// 操作日志
export const getAdPlanLogs = (id: string) => {
  return axios.get<AdPlanLog[]>(`/ad-plans/${id}/logs`)
}
