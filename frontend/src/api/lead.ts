import axios from './axios'

export interface Lead {
  id: string
  source_channel: string
  source_keyword?: string
  case_type?: string
  status: string
  assign_sales_id?: string
  phone: string
  contact_name?: string
  case_description?: string
  created_at: string
  organization_id: string
}

export interface User {
  id: string
  real_name: string
  phone: string
  email?: string
  role: string
  credentials_no?: string
  avatar?: string
  status: boolean
  organization_id?: string
  created_at: string
  updated_at: string
}

export interface LeadAssignment {
  id: string
  rule_name: string
  rule_type: string
  conditions: string
  target_user_id?: string
  target_user?: User
  priority: number
  enabled: boolean
  organization_id: string
  created_at: string
  updated_at: string
}

export interface LeadPool {
  id: string
  lead_id: string
  lead?: Lead
  original_owner_id: string
  original_owner?: User
  original_owner_name?: string
  recycle_reason: string
  recycle_note?: string
  recycle_time: string
  status: string
  taken_by_id?: string
  taken_by?: User
  taken_by_name?: string
  taken_at?: string
  take_count: number
}

export const createLead = (data: Partial<Lead>) => {
  return axios.post('/leads', data)
}

export const getLeads = (params: {
  org_id: string
  status?: string
  case_type?: string
  source_channel?: string
  page?: number
  limit?: number
}) => {
  return axios.get('/leads', { params })
}

export const getLeadById = (id: string) => {
  return axios.get(`/leads/${id}`)
}

export const updateLeadStatus = (id: string, status: string) => {
  return axios.put(`/leads/${id}/status`, { status })
}

export const assignLead = (id: string, salesId: string) => {
  return axios.put(`/leads/${id}/assign`, { sales_id: salesId })
}

// ==================== 分配规则 ====================
export const createAssignmentRule = (data: Partial<LeadAssignment>) => {
  return axios.post('/lead-assignments', data)
}

export const updateAssignmentRule = (id: string, data: Partial<LeadAssignment>) => {
  return axios.put(`/lead-assignments/${id}`, data)
}

export const getAssignmentRules = () => {
  return axios.get('/lead-assignments')
}

export const deleteAssignmentRule = (id: string) => {
  return axios.delete(`/lead-assignments/${id}`)
}

export const toggleAssignmentRule = (id: string, enabled: boolean) => {
  return axios.put(`/lead-assignments/${id}/toggle`, null, { params: { enabled } })
}

export const getAvailableUsers = () => {
  return axios.get('/lead-assignments/users/available')
}

// ==================== 公海池 ====================
export const getLeadPoolList = (params?: {
  status?: string
  case_type?: string
  recycle_reason?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}) => {
  return axios.get('/lead-pool', { params })
}

export const getLeadPoolStatistics = () => {
  return axios.get('/lead-pool/statistics')
}

export const recycleLeadToPool = (leadId: string, note?: string) => {
  return axios.post(`/lead-pool/recycle/${leadId}`, { note })
}

export const takeLeadFromPool = (id: string) => {
  return axios.post(`/lead-pool/take/${id}`)
}

export const assignLeadFromPool = (id: string, userId: string) => {
  return axios.post(`/lead-pool/assign/${id}`, { userId })
}

export const batchTakeLeadsFromPool = (ids: string[]) => {
  return axios.post('/lead-pool/batch-take', { ids })
}

export const batchAssignLeadsFromPool = (ids: string[], userId: string) => {
  return axios.post('/lead-pool/batch-assign', { ids, userId })
}
