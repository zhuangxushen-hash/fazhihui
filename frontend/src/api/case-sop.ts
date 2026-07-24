import axios from './axios'
import { CaseSOPTemplate, CaseType } from '../types'

export const getCaseSOPList = async (orgId?: string, caseType?: CaseType): Promise<CaseSOPTemplate[]> => {
  const params: any = {}
  if (orgId) params.org_id = orgId
  if (caseType) params.case_type = caseType
  return axios.get('/case-sop-templates', { params })
}

export const getCaseSOPById = async (id: string): Promise<CaseSOPTemplate> => {
  return axios.get(`/case-sop-templates/${id}`)
}

export const createCaseSOP = async (data: Partial<CaseSOPTemplate>): Promise<CaseSOPTemplate> => {
  return axios.post('/case-sop-templates', data)
}

export const updateCaseSOP = async (id: string, data: Partial<CaseSOPTemplate>): Promise<CaseSOPTemplate> => {
  return axios.put(`/case-sop-templates/${id}`, data)
}

export const deleteCaseSOP = async (id: string): Promise<void> => {
  await axios.delete(`/case-sop-templates/${id}`)
}

export const setDefaultCaseSOP = async (id: string): Promise<CaseSOPTemplate> => {
  return axios.put(`/case-sop-templates/${id}/set-default`)
}

export const toggleCaseSOPEnabled = async (id: string): Promise<CaseSOPTemplate> => {
  return axios.put(`/case-sop-templates/${id}/toggle-enabled`)
}

export const initializeSystemTemplates = async (): Promise<void> => {
  await axios.post('/case-sop-templates/initialize-system-templates')
}
