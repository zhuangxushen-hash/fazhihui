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
