import axios from './axios'

// ========== 订单系统（订单/VIP订阅/支付） ==========

// 订单
export interface OrderItem {
  id: string
  order_no: string
  user_id: string
  order_type: string
  title: string
  total_amount: number
  status: string
  pay_method?: string
  pay_time?: string
  remark?: string
  organization_id: string
  created_at: string
}

// 订单明细
export interface OrderDetailItem {
  id: string
  order_id: string
  item_name: string
  item_type?: string
  unit_price: number
  quantity: number
  amount: number
}

// 支付记录
export interface PaymentItem {
  id: string
  order_id: string
  payment_no: string
  amount: number
  method: string
  status: string
  transaction_id?: string
  paid_at?: string
  payer_id?: string
  organization_id: string
  created_at: string
}

// VIP 套餐
export interface VipPlan {
  plan_type: string
  label: string
  price: number
  months: number
}

// VIP 订阅
export interface VipSubscriptionItem {
  id: string
  user_id: string
  order_id?: string
  plan_type: string
  months: number
  amount: number
  start_date: string
  end_date: string
  status: string
  organization_id: string
  created_at: string
}

// 订单统计
export interface OrderStats {
  total_count: number
  paid_count: number
  pending_count: number
  total_amount: number
  paid_amount: number
  vip_count: number
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[]
  total: number
}

// 创建订单
export const createOrder = (data: {
  user_id: string
  title: string
  order_type?: string
  items: Array<{ item_name: string; item_type?: string; unit_price: number; quantity?: number }>
  remark?: string
}) => {
  return axios.post<{ order: OrderItem; items: OrderDetailItem[] }>('/order/create', data)
}

// 订单列表
export const getOrders = (params: {
  status?: string
  order_type?: string
  user_id?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<PaginatedResult<OrderItem>>('/order/list', { params })
}

// 订单详情
export const getOrderDetail = (id: string) => {
  return axios.get<{ order: OrderItem; items: OrderDetailItem[]; payments: PaymentItem[] }>(`/order/detail/${id}`)
}

// 支付订单
export const payOrder = (data: { id: string; method: string; transaction_id?: string }) => {
  return axios.post<{ order: OrderItem; payment: PaymentItem }>('/order/pay', data)
}

// 取消订单
export const cancelOrder = (id: string) => {
  return axios.post<OrderItem>('/order/cancel', { id })
}

// VIP 套餐价格表
export const getVipPlans = () => {
  return axios.get<{ plans: VipPlan[] }>('/order/vip/plans')
}

// VIP 订阅
export const subscribeVip = (data: { user_id: string; plan_type: string; pay_method: string }) => {
  return axios.post<{ order: OrderItem; subscription: VipSubscriptionItem; payment: PaymentItem }>(
    '/order/vip/subscribe',
    data,
  )
}

// VIP 订阅列表
export const getVipSubscriptions = (params: {
  status?: string
  user_id?: string
  page?: number
  page_size?: number
}) => {
  return axios.get<PaginatedResult<VipSubscriptionItem>>('/order/vip/list', { params })
}

// 订单统计
export const getOrderStats = () => {
  return axios.get<OrderStats>('/order/stats')
}
