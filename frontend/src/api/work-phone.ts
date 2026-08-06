import axios from './axios'

// ==================== 类型定义 ====================

// 通话类型
export enum CallType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

// 通话记录
export interface CallRecord {
  id: string
  phone_number: string
  call_type: CallType
  caller_name?: string
  callee_name?: string
  duration: number
  recording_url?: string
  status: string
  organization_id?: string
  operator_id?: string
  remark?: string
  created_at: string
}

// ==================== 通话记录管理 ====================

/** 获取通话记录列表 */
export const getCallRecords = (params?: {
  org_id?: string
  phone_number?: string
  call_type?: CallType
  start_date?: string
  end_date?: string
}) => {
  return axios.get<CallRecord[]>('/call-records', { params })
}

/** 创建通话记录（外呼入口） */
export const createCallRecord = (data: {
  phone_number: string
  call_type: CallType
  caller_name?: string
  callee_name?: string
  duration?: number
  recording_url?: string
  remark?: string
  organization_id?: string
  operator_id?: string
}) => {
  return axios.post<CallRecord>('/call-records', data)
}

/** 删除通话记录 */
export const deleteCallRecord = (id: string) => {
  return axios.delete(`/call-records/${id}`)
}
