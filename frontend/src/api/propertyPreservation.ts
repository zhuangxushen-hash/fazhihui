import axios from './axios'

// 财产保全管理API
export const getPropertyPreservations = (params?: any) =>
  axios.get('/property-preservation', { params })
export const getPropertyPreservationById = (id: string) =>
  axios.get(`/property-preservation/${id}`)
export const createPropertyPreservation = (data: any) =>
  axios.post('/property-preservation', data)
export const updatePropertyPreservation = (id: string, data: any) =>
  axios.put(`/property-preservation/${id}`, data)
export const deletePropertyPreservation = (id: string) =>
  axios.delete(`/property-preservation/${id}`)
// 提交审批
export const submitPropertyPreservation = (id: string) =>
  axios.put(`/property-preservation/${id}/submit`)
// 审批通过
export const approvePropertyPreservation = (id: string, comment?: string) =>
  axios.put(`/property-preservation/${id}/approve`, { comment })
// 审批驳回
export const rejectPropertyPreservation = (id: string, comment?: string) =>
  axios.put(`/property-preservation/${id}/reject`, { comment })
// 标记已实施
export const implementPropertyPreservation = (id: string, params?: any) =>
  axios.put(`/property-preservation/${id}/implement`, params)
// 解除保全
export const releasePropertyPreservation = (id: string, release_date?: Date) =>
  axios.put(`/property-preservation/${id}/release`, { release_date })
