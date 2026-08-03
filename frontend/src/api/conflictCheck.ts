import axios from './axios'

// 利冲检索请求参数
export interface ConflictCheckParams {
  party_name: string
  opposing_party: string
  party_phone?: string
  case_id?: string
}

// 利冲检索记录
export interface ConflictCheckRecord {
  id: string
  case_id?: string
  party_name: string
  opposing_party: string
  party_phone?: string
  check_result: string
  conflict_detail?: string
  checker_id?: string
  organization_id: string
  // 本案角色：client委托人/opposing对方
  party_role?: string
  // 冲突项目/案源名称
  conflict_case_name?: string
  // 审批状态：pending待审批/approved已通过/rejected已驳回
  approval_status?: string
  // 业务主管ID
  supervisor_id?: string
  // 所属团队
  team_id?: string
  created_at: string
}

// 执行利冲检索
export const checkConflict = (data: ConflictCheckParams) => {
  return axios.post('/conflict-checks', data)
}

// 查询检索记录
export const getConflictChecks = (params: {
  org_id?: string
  keyword?: string
}) => {
  return axios.get('/conflict-checks', { params })
}

// 深度利冲检索请求参数
export interface DeepCheckParams {
  party_name: string
  opposing_party: string
  party_role: string
}

// 审批请求参数
export interface ApprovalParams {
  supervisor_id: string
  comment: string
}

// 执行深度利冲检索
export const deepCheckConflict = (data: DeepCheckParams) => {
  return axios.post('/conflict-checks/deep', data)
}

// 利冲审批通过
export const approveConflict = (id: string, data: ApprovalParams) => {
  return axios.put(`/conflict-checks/${id}/approve`, data)
}

// 利冲审批驳回
export const rejectConflict = (id: string, data: ApprovalParams) => {
  return axios.put(`/conflict-checks/${id}/reject`, data)
}
