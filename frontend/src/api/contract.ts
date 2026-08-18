import axios from './axios'

// 合同接口定义
export interface Contract {
  id: string
  contract_no: string
  contract_name?: string
  case_id?: string
  case_name?: string
  client_name: string
  client_id?: string
  contract_type?: string
  contract_amount?: number
  fee_amount?: number
  paid_amount?: number
  unpaid_amount?: number
  payment_status?: string
  refund_status?: string
  co_handler?: string
  handler?: string
  sign_date?: string
  start_date?: string
  end_date?: string
  receive_date?: string
  original_received?: boolean
  status?: string
  review_status?: string
  organization_id: string
  created_at: string
  updated_at?: string
  remarks?: string
  // 补充字段 - 参考项目合同管理
  contract_category?: string
  contract_source?: string
  template_id?: string
  success_fee_ratio?: number
  fee_type?: 'fixed' | 'risk' | 'hybrid'
  billing_cycle?: 'hourly' | 'monthly' | 'case_based'
  payment_method?: 'one_time' | 'installment' | 'milestone'
  installment_count?: number
  installment_amount?: number
  refund_amount?: number
  refund_reason?: string
  refund_date?: string
  termination_date?: string
  termination_reason?: string
  void_reason?: string
  void_date?: string
  correction_count?: number
  last_correction_date?: string
  related_lead_id?: string
  invoice_status?: string
  invoice_amount?: number
  tax_amount?: number
  net_amount?: number
}

export type CreateContractPayload = {
  contract_no: string
  contract_name?: string
  case_id?: string
  client_name: string
  client_id?: string
  contract_type?: string
  contract_amount?: number
  fee_amount?: number
  payment_status?: string
  co_handler?: string
  handler?: string
  sign_date?: string
  start_date?: string
  end_date?: string
  organization_id: string
  // 补充字段
  contract_category?: string
  contract_source?: string
  template_id?: string
  success_fee_ratio?: number
  fee_type?: 'fixed' | 'risk' | 'hybrid'
  billing_cycle?: 'hourly' | 'monthly' | 'case_based'
  payment_method?: 'one_time' | 'installment' | 'milestone'
  installment_count?: number
  installment_amount?: number
  related_lead_id?: string
  remarks?: string
}

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
