import axios from './axios'

// ========== 律师中心 ==========

// 律师列表项
export interface LawyerItem {
  id: string
  name: string
  avatar: string
  field: string
  rating: number
  rating_count: number
  level: string
  years: number
  position: string
  phone: string
}

// 律师主页聚合信息
export interface LawyerHomeInfo {
  id: string
  name: string
  avatar: string
  phone: string
  email: string
  position: string
  department: string
  level: number
  experience: number
  hire_date: string
  rating_avg: number
  ratings: LawyerRatingRecord[]
}

// 评级记录
export interface LawyerRatingRecord {
  id: string
  lawyer_id: string
  lawyer_name?: string
  rating_level: string
  score: number
  dimensions: unknown
  comment: string
  period: string
  rated_by: string
  created_at: string
  updated_at: string
}

// 查询组织内律师列表（name/level 筛选，分页）
export const getLawyers = (params: {
  name?: string
  level?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<{ data: LawyerItem[]; total: number }>('/lawyers', { params })
}

// 查询律师主页聚合信息
export const getLawyerHome = (id: string) => {
  return axios.get<LawyerHomeInfo>(`/lawyers/${id}`)
}

// 查询评级记录列表（level/keyword 筛选，分页）
export const getLawyerRatings = (params: {
  level?: string
  keyword?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<{ data: LawyerRatingRecord[]; total: number }>('/lawyer-ratings', { params })
}

// 提交评级
export const createLawyerRating = (data: Partial<LawyerRatingRecord>) => {
  return axios.post<LawyerRatingRecord>('/lawyer-ratings', data)
}

// 更新评级
export const updateLawyerRating = (id: string, data: Partial<LawyerRatingRecord>) => {
  return axios.put<LawyerRatingRecord>(`/lawyer-ratings/${id}`, data)
}

// 删除评级
export const deleteLawyerRating = (id: string) => {
  return axios.delete(`/lawyer-ratings/${id}`)
}
