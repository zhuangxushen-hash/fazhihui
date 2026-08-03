import axios from './axios'

// 查询审批列表：mode(pending/processed/mine)、type、status 筛选
export const getApprovals = (params: { mode: string; type?: string; status?: string }) =>
  axios.get('/approvals', { params })

// 发起审批
export const createApproval = (data: any) => axios.post('/approvals', data)

// 审批通过
export const approveApproval = (id: string, data: { comment?: string }) =>
  axios.put(`/approvals/${id}/approve`, data)

// 驳回
export const rejectApproval = (id: string, data: { comment?: string }) =>
  axios.put(`/approvals/${id}/reject`, data)

// 撤销
export const cancelApproval = (id: string) => axios.put(`/approvals/${id}/cancel`)

// 退回上一步
export const returnApproval = (id: string, data: { comment?: string }) =>
  axios.put(`/approvals/${id}/return`, data)

// 批量撤销
export const batchCancelApprovals = (ids: string[]) =>
  axios.post('/approvals/batch-cancel', { ids })

// 批量审批通过
export const batchApproveApprovals = (data: { ids: string[]; comment?: string }) =>
  axios.post('/approvals/batch-approve', data)
