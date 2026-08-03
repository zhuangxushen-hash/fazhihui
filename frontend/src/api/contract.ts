import axios from './axios'

// 查询合同列表
export const getContracts = (params?: any) => axios.get('/contracts', { params })

// 查询合同详情
export const getContractById = (id: string) => axios.get(`/contracts/${id}`)

// 创建合同
export const createContract = (data: any) => axios.post('/contracts', data)

// 更新合同
export const updateContract = (id: string, data: any) => axios.put(`/contracts/${id}`, data)

// 删除合同
export const deleteContract = (id: string) => axios.delete(`/contracts/${id}`)

// 审查合同
export const reviewContract = (id: string, data?: { remarks?: string }) =>
  axios.put(`/contracts/${id}/review`, data || {})

// 签订合同
export const signContract = (id: string, data?: { sign_date?: string; start_date?: string; end_date?: string; remarks?: string }) =>
  axios.put(`/contracts/${id}/sign`, data || {})

// 变更合同
export const changeContract = (id: string, data?: { data?: any; remarks?: string }) =>
  axios.put(`/contracts/${id}/change`, data || {})

// 解约
export const terminateContract = (id: string, data?: { remarks?: string }) =>
  axios.put(`/contracts/${id}/terminate`, data || {})

// 作废
export const voidContract = (id: string, data?: { remarks?: string }) =>
  axios.put(`/contracts/${id}/void`, data || {})

// 合同更正
export const correctContract = (id: string, data: { reason: string; content: string; operator_id: string }) =>
  axios.put(`/contracts/${id}/correct`, data)

// 原件回收登记
export const receiveOriginal = (id: string) =>
  axios.put(`/contracts/${id}/receive-original`, {})

// 分配比例确认
export const confirmAllocation = (id: string, ratio: Array<{ role: string; ratio: number }>) =>
  axios.put(`/contracts/${id}/confirm-allocation`, { ratio })
