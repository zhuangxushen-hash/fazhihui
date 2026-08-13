import axios from './axios'

// ========== 个人中心（在线模板/最近关注/VIP记录） ==========

// 在线模板
export interface OnlineTemplateItem {
  id: string
  name: string
  template_type: string
  category?: string
  content?: string
  usage_count: number
  is_hot: boolean
  organization_id: string
  created_at: string
}

// 最近关注
export interface RecentConcernItem {
  id: string
  user_id: string
  target_id: string
  target_type: string
  target_name?: string
  organization_id: string
  created_at: string
}

// VIP订阅记录
export interface VipRecordItem {
  id: string
  user_id: string
  order_id?: string
  plan_type: string
  months: number
  amount: number
  start_date: string
  end_date: string
  status: string
  created_at: string
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[]
  total: number
}

// ========== 在线模板 ==========

export const getProfileTemplates = (params: {
  template_type?: string
  category?: string
  keyword?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<PaginatedResult<OnlineTemplateItem>>('/profile/templates', { params })
}

export const getProfileTemplateById = (id: string) => {
  return axios.get<OnlineTemplateItem>(`/profile/templates/${id}`)
}

export const createProfileTemplate = (data: {
  name: string
  template_type?: string
  category?: string
  content?: string
}) => {
  return axios.post<OnlineTemplateItem>('/profile/templates', data)
}

export const updateProfileTemplate = (
  id: string,
  data: { name?: string; template_type?: string; category?: string; content?: string; is_hot?: boolean },
) => {
  return axios.put<OnlineTemplateItem>(`/profile/templates/${id}`, data)
}

export const deleteProfileTemplate = (id: string) => {
  return axios.delete(`/profile/templates/${id}`)
}

export const useProfileTemplate = (id: string) => {
  return axios.post<OnlineTemplateItem>(`/profile/templates/${id}/use`)
}

// ========== 最近关注 ==========

export const addConcern = (data: { target_id: string; target_type: string; target_name?: string }) => {
  return axios.post<RecentConcernItem>('/profile/concerns', data)
}

export const getMyConcerns = (params: { target_type?: string; page?: number; page_size?: number }) => {
  return axios.get<PaginatedResult<RecentConcernItem>>('/profile/concerns', { params })
}

export const removeConcern = (id: string) => {
  return axios.delete(`/profile/concerns/${id}`)
}

// ========== VIP 记录 ==========

export const getMyVipRecords = () => {
  return axios.get<VipRecordItem[]>('/profile/vip-records')
}

export const getMyVipStatus = () => {
  return axios.get<{ is_vip: boolean; current: VipRecordItem | null; records: VipRecordItem[] }>('/profile/vip-status')
}
