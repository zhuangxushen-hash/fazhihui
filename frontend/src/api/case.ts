import axios from './axios'

export interface Case {
  id: string
  case_type: string
  status: string
  client_id: string
  assignee_lawyer_id?: string
  fee_amount?: number
  description?: string
  deadline?: string
  created_at: string
  organization_id: string
}

export const createCase = (data: Partial<Case>) => {
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
