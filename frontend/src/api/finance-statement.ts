import axios from './axios'

// ========== 财务报表与打印 ==========

// 账户台账结算明细
export interface AccountStatementItem {
  id: string
  case_id?: string
  type: string
  category: string
  amount: number
  payer: string
  payee: string
  payment_date: string
  payment_method?: string
  remarks?: string
  direction_label: string
  created_at: string
}

export interface AccountStatementResult {
  data: AccountStatementItem[]
  total: number
  summary: { total_income: number; total_expense: number; net_amount: number }
}

// 项目收入一览
export interface ProjectRevenueItem {
  case_id: string
  case_no: string
  case_name: string
  contract_amount: number
  received_amount: number
  total_income: number
  total_expense: number
  net_profit: number
}

// 收支详情
export interface IncomeExpenditureItem {
  id: string
  case_id?: string
  type: string
  category: string
  amount: number
  payer: string
  payee: string
  payment_date: string
  payment_method?: string
  remarks?: string
  created_at: string
}

// 发票打印数据
export interface InvoicePrintItem {
  id: string
  case_id: string
  invoice_no: string
  amount: number
  tax_amount: number
  total_amount: number
  status: string
  organization_id: string
  created_at: string
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[]
  total: number
}

// 账户台账结算明细表
export const getAccountStatement = (params: {
  start_date?: string
  end_date?: string
  type?: string
  category?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<AccountStatementResult>('/finance/statements/account-statement', { params })
}

// 项目收入一览表
export const getProjectRevenueOverview = (params: { keyword?: string; page?: number; page_size?: number }) => {
  return axios.get<PaginatedResult<ProjectRevenueItem>>('/finance/statements/project-revenue', { params })
}

// 收支综合详情
export const getIncomeExpenditureDetail = (
  type: string,
  params: { start_date?: string; end_date?: string; page?: number; page_size?: number },
) => {
  return axios.get<{ data: IncomeExpenditureItem[]; total: number; total_amount: number }>(
    `/finance/statements/income-expenditure/${type}`,
    { params },
  )
}

// 发票打印数据
export const getInvoicePrintData = (params: {
  status?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<PaginatedResult<InvoicePrintItem>>('/finance/statements/invoice-print', { params })
}
