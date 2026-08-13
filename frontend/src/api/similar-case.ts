import axios from './axios'

export interface SimilarCaseSearchParams {
  case_type?: string
  amount?: number
  court?: string
  year?: number
}

export interface SimilarCaseStats {
  total_cases: number
  case_type_distribution: Array<{ case_type: string; count: number }>
  court_distribution: Array<{ court: string; count: number }>
  average_amount: number
  recent_cases_count: number
}

export interface SimilarCaseItem {
  id: string
  case_no: string
  case_name?: string
  client_name: string
  case_type: string
  court?: string
  amount?: number
  status?: string
  organization_id?: string
  created_at?: string
  updated_at?: string
  similarity: number
}

export interface SimilarCaseSearchResult {
  data: SimilarCaseItem[]
  total: number
}

// 搜索类案：根据案由、金额、法院、年份等条件查找相似案例
export const searchSimilarCases = (data: SimilarCaseSearchParams) => {
  return axios.post('/similar-cases/search', data)
}

// 获取类案统计：获取案件匹配统计数据，包括案由分布、法院分布、平均金额等
export const getSimilarCaseStats = (params?: { org_id?: string }) => {
  return axios.get('/similar-cases/stats', { params })
}