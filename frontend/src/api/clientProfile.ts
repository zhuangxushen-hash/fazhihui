import axios from './axios'

// 获取客户档案列表（支持 keyword 按名称/电话搜索）
export const getClientProfiles = (params?: any) => axios.get('/client-profiles', { params })

// 获取单个客户档案
export const getClientProfile = (id: string) => axios.get(`/client-profiles/${id}`)

// 创建客户档案
export const createClientProfile = (data: any) => axios.post('/client-profiles', data)

// 更新客户档案
export const updateClientProfile = (id: string, data: any) => axios.put(`/client-profiles/${id}`, data)

// 删除客户档案
export const deleteClientProfile = (id: string) => axios.delete(`/client-profiles/${id}`)

// 查询客户关联案件（通过 client_name 软关联）
export const getRelatedCases = (id: string) => axios.get(`/client-profiles/${id}/related-cases`)

// 查询客户关联线索（通过 phone 软关联）
export const getRelatedLeads = (id: string) => axios.get(`/client-profiles/${id}/related-leads`)
