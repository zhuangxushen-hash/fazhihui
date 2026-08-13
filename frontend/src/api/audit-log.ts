import axios from './axios'

// ==================== 类型定义 ====================

// 审计日志
export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  operation_type: string
  module: string
  method: string
  request_url: string
  request_params?: string
  response_status: number
  ip_address?: string
  user_agent?: string
  duration: number
  error_message?: string
  organization_id?: string
  created_at: string
}

// ==================== 审计日志查询 ====================

/** 获取审计日志列表 */
export const getAuditLogs = (params?: {
  org_id?: string
  user_id?: string
  user_name?: string
  operation_type?: string
  module?: string
  start_date?: string
  end_date?: string
}) => {
  return axios.get<AuditLog[]>('/audit-logs', { params })
}
