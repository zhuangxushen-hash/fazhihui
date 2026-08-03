import axios from './axios'

// 印章管理
export const getSeals = (params?: any) => axios.get('/seals', { params })
export const createSeal = (data: any) => axios.post('/seals', data)
export const updateSeal = (id: string, data: any) => axios.put(`/seals/${id}`, data)
export const toggleSealStatus = (id: string) => axios.put(`/seals/${id}/toggle-status`)
export const deleteSeal = (id: string) => axios.delete(`/seals/${id}`)

// 用印申请
export const getSealApplications = (params?: any) =>
  axios.get('/seal-applications', { params })
export const createSealApplication = (data: any) => axios.post('/seal-applications', data)
export const updateSealApplication = (id: string, data: any) => axios.put(`/seal-applications/${id}`, data)
export const approveSealApplication = (id: string, data: any) => axios.put(`/seal-applications/${id}/approve`, data)
export const rejectSealApplication = (id: string, data: any) => axios.put(`/seal-applications/${id}/reject`, data)
export const useSealApplication = (id: string) => axios.put(`/seal-applications/${id}/use`)
export const batchUseSealApplications = (ids: string[]) => axios.put('/seal-applications/batch-use', { ids })
// 批量作废用印申请
export const batchVoidSealApplications = (ids: string[], reason?: string) =>
  axios.post('/seal-applications/batch-void', { ids, reason })
// 单个作废用印申请
export const voidSealApplication = (id: string, reason?: string) =>
  axios.put(`/seal-applications/${id}/void`, { reason })
// 收回已作废的用印申请
export const recoverSealApplication = (id: string) =>
  axios.put(`/seal-applications/${id}/recover`)

// 盖章记录
export const getSealRecords = (params?: any) => axios.get('/seal-records', { params })
