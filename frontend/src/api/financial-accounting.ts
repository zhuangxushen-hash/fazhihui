import axios from './axios'

// ========== 财务核算（固定费用/工资/个税代扣） ==========

// 代扣记录
export interface WithholdingRecordItem {
  id: string
  withholding_no: string
  batch_id?: string
  case_id?: string
  user_id?: string
  withholding_type: string
  amount: number
  status: string
  executed_at?: string
  fail_reason?: string
  cancel_reason?: string
  remark?: string
  organization_id: string
  created_at: string
}

// 代扣批次
export interface WithholdingBatchItem {
  id: string
  batch_no: string
  withholding_type: string
  total_count: number
  success_count: number
  fail_count: number
  total_amount: number
  status: string
  operator_id?: string
  organization_id: string
  created_at: string
}

// 个税计算明细
export interface TaxCalculationItem {
  id: string
  withholding_id?: string
  user_id?: string
  case_id?: string
  income_amount: number
  exemption_amount: number
  taxable_income: number
  tax_rate: number
  quick_deduction: number
  tax_amount: number
  tax_month?: string
  status: string
  organization_id: string
  created_at: string
}

// 代扣统计
export interface WithholdingStats {
  pending_count: number
  completed_count: number
  pending_amount: number
  completed_amount: number
  failed_count: number
  batch_count: number
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[]
  total: number
}

// 创建单条代扣记录
export const createWithholding = (data: {
  case_id?: string
  user_id?: string
  withholding_type: string
  amount: number
  remark?: string
}) => {
  return axios.post<WithholdingRecordItem>('/finance/accounting/withholding', data)
}

// 批量创建代扣记录并生成批次
export const createWithholdingBatch = (data: {
  withholding_type: string
  records: Array<{ case_id?: string; user_id?: string; amount: number; remark?: string }>
  remark?: string
}) => {
  return axios.post<{ batch: WithholdingBatchItem; records: WithholdingRecordItem[] }>(
    '/finance/accounting/withholding/batch',
    data,
  )
}

// 查询代扣记录
export const getWithholdingRecords = (params: {
  batch_id?: string
  withholding_type?: string
  status?: string
  case_id?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<PaginatedResult<WithholdingRecordItem>>('/finance/accounting/withholding', { params })
}

// 查询代扣批次列表
export const getWithholdingBatches = (params: {
  withholding_type?: string
  status?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<PaginatedResult<WithholdingBatchItem>>('/finance/accounting/withholding/batches', { params })
}

// 执行单条代扣
export const executeWithholding = (id: string) => {
  return axios.post<WithholdingRecordItem>(`/finance/accounting/withholding/${id}/execute`)
}

// 批量执行代扣批次
export const executeWithholdingBatch = (id: string) => {
  return axios.post<{ batch: WithholdingBatchItem; success: number; failed: number; fail_records: WithholdingRecordItem[] }>(
    `/finance/accounting/withholding/batch/${id}/execute`,
  )
}

// 撤销代扣
export const cancelWithholding = (id: string, reason?: string) => {
  return axios.post<WithholdingRecordItem>(`/finance/accounting/withholding/${id}/cancel`, { reason })
}

// 冲抵代扣
export const offsetWithholding = (id: string, reason?: string) => {
  return axios.post<WithholdingRecordItem>(`/finance/accounting/withholding/${id}/offset`, { reason })
}

// 计算个税（纯计算）
export const calculateTax = (data: { income_amount: number; exemption_amount?: number }) => {
  return axios.post<{
    taxable_income: number
    tax_rate: number
    quick_deduction: number
    tax_amount: number
  }>('/finance/accounting/tax/calculate', data)
}

// 个税批量结算入账
export const createIncomeTaxWithholding = (data: {
  records: Array<{
    user_id?: string
    case_id?: string
    income_amount: number
    tax_month: string
    remark?: string
  }>
}) => {
  return axios.post<{ calculations: TaxCalculationItem[]; withholding: WithholdingRecordItem | null }>(
    '/finance/accounting/tax/withholding',
    data,
  )
}

// 查询个税计算明细
export const getTaxCalculations = (params: {
  tax_month?: string
  status?: string
  user_id?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<PaginatedResult<TaxCalculationItem>>('/finance/accounting/tax', { params })
}

// 代扣统计
export const getWithholdingStats = () => {
  return axios.get<WithholdingStats>('/finance/accounting/stats')
}
