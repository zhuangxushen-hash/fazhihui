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
