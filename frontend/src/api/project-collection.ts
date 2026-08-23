import axios from './axios'

// 获取项目收款台账聚合列表
export const getProjectCollection = (params?: {
  keyword?: string
  status?: string
  startDate?: string
  endDate?: string
}) => {
  return axios.get('/finance/project-collection', { params })
}

// 登记收款
export const recordProjectPayment = (data: {
  case_id: string
  amount: number
  method?: string
  transaction_id?: string
  remarks?: string
  client_id?: string
}) => {
  return axios.post('/finance/project-collection/payment', data)
}
