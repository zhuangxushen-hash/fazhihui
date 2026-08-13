import axios from './axios'

// ========== AI 合同审查与法律研究（持久化） ==========

// 合同审查记录
export interface ContractReviewItem {
  id: string
  title?: string
  contract_type?: string
  contract_text?: string
  risk_level: string
  risk_items: string
  summary?: string
  status: string
  reviewer_id?: string
  organization_id: string
  created_at: string
}

// 法律研究任务
export interface ResearchTaskItem {
  id: string
  topic: string
  keywords: string
  summary?: string
  key_points: string
  references: string
  status: string
  creator_id?: string
  organization_id: string
  created_at: string
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[]
  total: number
}

// 发起合同审查并保存记录
export const createContractReview = (data: {
  title?: string
  contract_type?: string
  contract_text: string
}) => {
  return axios.post<ContractReviewItem>('/ai/review/contract', data)
}

// 查询合同审查记录列表
export const getContractReviews = (params: {
  risk_level?: string
  contract_type?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<PaginatedResult<ContractReviewItem>>('/ai/review/contract', { params })
}

// 查询合同审查详情
export const getContractReviewById = (id: string) => {
  return axios.get<ContractReviewItem>(`/ai/review/contract/${id}`)
}

// 删除合同审查记录
export const deleteContractReview = (id: string) => {
  return axios.delete(`/ai/review/contract/${id}`)
}

// 创建法律研究任务
export const createResearchTask = (data: { topic: string; keywords?: string[] }) => {
  return axios.post<ResearchTaskItem>('/ai/review/research', data)
}

// 查询法律研究任务列表
export const getResearchTasks = (params: { status?: string; page?: number; page_size?: number }) => {
  return axios.get<PaginatedResult<ResearchTaskItem>>('/ai/review/research', { params })
}

// 查询法律研究任务详情
export const getResearchTaskById = (id: string) => {
  return axios.get<ResearchTaskItem>(`/ai/review/research/${id}`)
}

// 删除法律研究任务
export const deleteResearchTask = (id: string) => {
  return axios.delete(`/ai/review/research/${id}`)
}
