import axios from './axios'
import { HandoverType } from '../types'

// 发起交接
export const initiateHandover = (data: {
  from_user_id: string
  to_user_id: string
  handover_type: HandoverType
  lead_ids?: string[]
  opportunity_ids?: string[]
  case_ids?: string[]
  handover_note?: string
}) => axios.post('/handover/initiate', data)

// 确认交接
export const confirmHandover = (id: string) => axios.put(`/handover/${id}/confirm`)

// 拒绝交接
export const rejectHandover = (id: string, reason?: string) => axios.put(`/handover/${id}/reject`, { reason })

// 查询交接记录列表
export const getHandoverList = () => axios.get('/handover')

// 查询单个交接记录
export const getHandoverDetail = (id: string) => axios.get(`/handover/${id}`)

// 获取用户资产
export const getUserAssets = (userId: string) => axios.get(`/handover/user-assets/${userId}`)

// 批量移交
export const batchTransfer = (data: {
  from_user_id: string
  to_user_id: string
  handover_type: HandoverType
  lead_ids?: string[]
  opportunity_ids?: string[]
  case_ids?: string[]
  handover_note?: string
}) => axios.post('/handover/batch-transfer', data)