import axios from './axios'

export interface AINavCategory {
  key: string
  name: string
  description: string
  icon: string
  path: string
}

export interface AINavResponse {
  categories: AINavCategory[]
}

export interface SimilarCaseItem {
  id: string
  case_no?: string
  case_name?: string
  case_type?: string
  court?: string
  amount?: number
  judgment_date?: string
  similarity?: number
  [key: string]: unknown
}

export interface SimilarCaseResult {
  data: SimilarCaseItem[]
  total: number
  message?: string
  query?: { case_type?: string; keyword?: string; year?: string }
}

export interface LawItem {
  id: string
  title: string
  content?: string
  category?: string
  effective_date?: string
  source?: string
  [key: string]: unknown
}

export interface LawsResult {
  data: LawItem[]
  total: number
  message?: string
  query?: { keyword?: string; category?: string }
}

// 生成营销文案
export const generateMarketingCopy = (data: { prompt: string; case_type?: string; platform?: string }) => {
  return axios.post('/ai/marketing/copy', data)
}

// 生成营销视频脚本
export const generateMarketingScript = (data: { prompt: string; case_type?: string }) => {
  return axios.post('/ai/marketing/script', data)
}

export interface LegalDocumentData {
  [key: string]: unknown
}

// 生成法律文书
export const generateLegalDocument = (data: { type: string; data: LegalDocumentData }) => {
  return axios.post('/ai/legal/document', data)
}

// 分析法律风险
export const analyzeLegalRisk = (data: { case_type?: string; description?: string; case_data?: LegalDocumentData }) => {
  return axios.post('/ai/legal/risk-analysis', data)
}

// 获取 AI 工具导航
export const getAINavigation = () => {
  return axios.get<AINavResponse>('/ai/nav')
}

// AI 智能问答
export const aiChat = (data: { question: string; case_type?: string }) => {
  return axios.post('/ai/chat', data)
}

// 合同审查
export const contractReview = (data: { contract_text: string; contract_type?: string }) => {
  return axios.post('/ai/contract-review', data)
}

// 法律研究
export const legalResearch = (data: { topic: string; keywords?: string[] }) => {
  return axios.post('/ai/legal-research', data)
}

// 类案检索
export const getSimilarCases = (params: { case_type?: string; keyword?: string; year?: string }) => {
  return axios.get<SimilarCaseResult>('/ai/similar-cases', { params })
}

// 法律法规查询
export const getLaws = (params: { keyword?: string; category?: string }) => {
  return axios.get<LawsResult>('/ai/laws', { params })
}