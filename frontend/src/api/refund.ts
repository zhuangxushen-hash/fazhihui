import axios from './axios'

// ==================== 类型定义 ====================

// 退费审批状态
export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

// 退费记录
export interface Refund {
  id: string
  refund_no: string
  case_id?: string
  case_title?: string
  client_name: string
  client_phone?: string
  refund_amount: number
  reason: string
  status: RefundStatus
  applicant_id?: string
  applicant_name?: string
  approver_id?: string
  approver_name?: string
  approval_note?: string
  organization_id?: string
  approved_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

// ==================== 退费管理 ====================

/** 获取退费申请列表 */
export const getRefunds = (params?: {
  org_id?: string
  status?: RefundStatus
  keyword?: string
  start_date?: string
  end_date?: string
}) => {
  return axios.get<Refund[]>('/finance/refunds', { params })
}

/** 发起退费申请 */
export const createRefund = (data: {
  case_id?: string
  client_name: string
  client_phone?: string
  refund_amount: number
  reason: string
  organization_id?: string
  applicant_id?: string
}) => {
  return axios.post<Refund>('/finance/refund', data)
}

/** 审批通过退费 */
export const approveRefund = (id: string, data: {
  approver_id?: string
  approval_note?: string
}) => {
  return axios.put<Refund>(`/finance/refund/${id}/approve`, data)
}

/** 驳回退费 */
export const rejectRefund = (id: string, data: {
  approver_id?: string
  approval_note?: string
}) => {
  return axios.put<Refund>(`/finance/refund/${id}/reject`, data)
}
