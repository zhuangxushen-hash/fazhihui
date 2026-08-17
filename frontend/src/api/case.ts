import axios from './axios'

export interface Case {
  id: string
  case_no: string
  case_name?: string
  client_name: string
  client_phone?: string
  client_id?: string
  client_type?: string
  case_type: string
  case_category?: string
  court?: string
  opposing_party?: string
  opposing_agent?: string
  court_room?: string
  case_source?: string
  amount?: number
  quality_deposit?: number
  filing_date?: string
  expected_close_date?: string
  is_confidential?: boolean
  stage?: string
  description?: string
  organization_id: string
  status: string
  approval_status?: string
  created_at: string
  updated_at?: string
  assignee_lawyer_id?: string
  fee_amount?: number
  deadline?: string
  lawyer_name?: string
  risk_level?: string
  is_overdue?: boolean
  change_status?: string
}

export type CreateCasePayload = {
  case_no: string
  case_name?: string
  client_name: string
  client_phone?: string
  client_id?: string
  client_type?: string
  case_type: string
  case_category?: string
  court?: string
  opposing_party?: string
  opposing_agent?: string
  court_room?: string
  case_source?: string
  amount?: number
  quality_deposit?: number
  filing_date?: string
  expected_close_date?: string
  is_confidential?: boolean
  stage?: string
  description?: string
  organization_id: string
}

export const createCase = (data: CreateCasePayload) => {
  return axios.post('/cases', data)
}

export const getCases = (params: {
  org_id: string
  status?: string
  case_type?: string
  assignee_lawyer_id?: string
  page?: number
  limit?: number
}) => {
  return axios.get('/cases', { params })
}

export const getCaseById = (id: string) => {
  return axios.get(`/cases/${id}`)
}

export const updateCaseStatus = (id: string, status: string) => {
  return axios.put(`/cases/${id}/status`, { status })
}

export const assignLawyer = (id: string, lawyerId: string) => {
  return axios.put(`/cases/${id}/assign`, { lawyer_id: lawyerId })
}

// 出函：type 为 court_letter 出庭函 / firm_letter 所函
export const generateLetter = (id: string, type: string) => {
  return axios.post(`/cases/${id}/generate-letter`, { type })
}

// 生成结案报告
export const closeCaseReport = (id: string) => {
  return axios.post(`/cases/${id}/close-report`)
}

// 结案归档
export const archiveCase = (id: string) => {
  return axios.post(`/cases/${id}/archive`)
}

// 自动生成委托合同
export const generateContract = (data: { case_id: string; template_id: string }) => {
  return axios.post('/cases/documents/generate-contract', data)
}

// 批量生成文书
export const batchGenerateDocuments = (data: { case_ids: string[]; template_id: string }) => {
  return axios.post('/cases/documents/batch-generate', data)
}

// 获取逾期案件列表
export const getOverdueCases = () => {
  return axios.get('/cases/overdue')
}

// 获取高风险案件列表
export const getHighRiskCases = () => {
  return axios.get('/cases/high-risk')
}

// 检查逾期案件
export const checkOverdueCases = () => {
  return axios.post('/cases/check-overdue')
}

// 批量分配案件
export const batchAssignCases = (data: { case_ids: string[]; lawyer_id: string }) => {
  return axios.post('/cases/batch-assign', data)
}

// 13.8 缺口6: 批量结案
export const batchCloseCases = (caseIds: string[]) => {
  return axios.post('/cases/batch-close', { case_ids: caseIds })
}

// 13.8 缺口6: 批量归档
export const batchArchiveCases = (caseIds: string[]) => {
  return axios.post('/cases/batch-archive', { case_ids: caseIds })
}
