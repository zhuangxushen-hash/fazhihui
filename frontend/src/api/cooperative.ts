import axios from './axios'

// ========== 协作律所管理 ==========

// 协作律所接口字段定义
export interface CooperativeFirmItem {
  id: string
  firm_no: string
  firm_name: string
  firm_type: string
  cooperation_scope?: string
  contact_person?: string
  contact_phone?: string
  region?: string
  firm_size?: string
  rating: string
  status: string
  description?: string
  organization_id: string
  created_at: string
  updated_at: string
}

// 查询协作律所列表（keyword/firm_type/status 筛选，分页）
export const getCooperativeFirms = (params: {
  keyword?: string
  firm_type?: string
  status?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<{ data: CooperativeFirmItem[]; total: number; page: number; page_size: number }>('/cooperative-firms', { params })
}

// 获取协作律所统计
export const getCooperativeFirmStats = () => {
  return axios.get<{ total: number; active: number; paused: number }>('/cooperative-firms/stats')
}

// 创建协作律所
export const createCooperativeFirm = (data: Partial<CooperativeFirmItem>) => {
  return axios.post<CooperativeFirmItem>('/cooperative-firms', data)
}

// 更新协作律所
export const updateCooperativeFirm = (id: string, data: Partial<CooperativeFirmItem>) => {
  return axios.put<CooperativeFirmItem>(`/cooperative-firms/${id}`, data)
}

// 删除协作律所
export const deleteCooperativeFirm = (id: string) => {
  return axios.delete(`/cooperative-firms/${id}`)
}
