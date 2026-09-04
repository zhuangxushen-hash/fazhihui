import axios from './axios'

// ==================== 类型定义 ====================

export interface Complaint {
  id: string
  type: string
  content: string
  client_id: string
  client_name: string
  client_phone: string
  organization_id: string
  case_id?: string
  evidence_files?: string
  status?: string
  created_at?: string
}

export interface ServiceRating {
  id: string
  case_id: string
  client_id: string
  rating: number
  content?: string
  organization_id?: string
  status?: string
  created_at?: string
}

export interface Archive {
  id: string
  client_id: string
  case_id?: string
  file_name: string
  file_type: string
  file_size?: number
  file_url?: string
  description?: string
  organization_id?: string
  created_at?: string
}

export interface Consultation {
  id: string
  client_id: string
  question: string
  answer?: string
  case_id?: string
  organization_id?: string
  created_at?: string
}

export interface Payment {
  id: string
  client_id: string
  amount: number
  status: string
  method?: string
  case_id?: string
  created_at?: string
}

export interface PushNotification {
  id: string
  client_id: string
  case_id?: string
  title: string
  content: string
  is_read?: boolean
  created_at?: string
}

// ==================== API 函数 ====================

/**
 * 获取客户的案件列表
 * POST /client/cases
 * @param data 包含 client_id 的对象
 */
export const getClientCases = (data: { client_id: string }) => {
  return axios.post('/client/cases', data)
}

/**
 * AI 客户咨询（基础版）
 * POST /client/ai/consult
 * @param data 包含 question 的对象
 */
export const aiClientConsult = (data: { question: string }) => {
  return axios.post('/client/ai/consult', data)
}

/**
 * 创建投诉/反馈
 * POST /client/complaint
 * @param data 投诉信息
 */
export const createComplaint = (data: {
  type: string
  content: string
  client_id: string
  client_name: string
  client_phone: string
  organization_id: string
  case_id?: string
  evidence_files?: string
}) => {
  return axios.post('/client/complaint', data)
}

/**
 * 获取客户的投诉列表
 * POST /client/complaints
 * @param data 包含 client_id 的对象
 */
export const getClientComplaints = (data: { client_id: string }) => {
  return axios.post('/client/complaints', data)
}

/**
 * 获取客户的支付记录
 * POST /client/payments
 * @param data 包含 client_id 的对象
 */
export const getClientPayments = (data: { client_id: string }) => {
  return axios.post('/client/payments', data)
}

/**
 * 获取客户的服务费信息
 * POST /client/service-fee
 * @param data 包含 client_id 的对象
 */
export const getClientServiceFee = (data: { client_id: string }) => {
  return axios.post('/client/service-fee', data)
}

/**
 * 获取客户的推送通知列表
 * POST /client/push-notifications
 * @param data 包含 client_id 的对象
 */
export const getPushNotificationsByClient = (data: { client_id: string }) => {
  return axios.post('/client/push-notifications', data)
}

/**
 * AI 客户增强咨询（带上下文）
 * POST /client/ai/consult-enhanced
 * @param data 咨询信息，包含客户ID、问题及可选的案件/组织ID
 */
export const aiConsultEnhanced = (data: {
  client_id: string
  question: string
  case_id?: string
  organization_id?: string
}) => {
  return axios.post('/client/ai/consult-enhanced', data)
}

/**
 * 获取客户的咨询记录
 * POST /client/consultations
 * @param data 包含 client_id 的对象
 */
export const getConsultations = (data: { client_id: string }) => {
  return axios.post('/client/consultations', data)
}

/**
 * 线上签约
 * POST /client/online-sign
 * @param data 签约信息
 */
export const onlineSign = (data: {
  case_id: string
  client_id: string
  lawyer_id: string
  contract_template_id: string
  organization_id: string
}) => {
  return axios.post('/client/online-sign', data)
}

/**
 * 法大大电子签配置（不含密钥）
 * POST /client/sign/config
 */
export const getSignConfig = () => {
  return axios.post('/client/sign/config')
}

/**
 * 获取法大大实名认证链接（身份鉴别）
 * POST /client/sign/verify-url
 * @deprecated 旧「先刷脸实名、后签署」流程。现行流程为互动视频签即实名：客户打开签署链接后
 * 由法大大互动视频签（audio_video，含人脸核身）一并完成实名与意愿确认，无需单独获取实名链接。
 */
export const getSignVerifyUrl = (data: {
  signing_id: string
  client_id: string
  user_name?: string
  id_card_no?: string
  mobile?: string
}) => {
  return axios.post('/client/sign/verify-url', data)
}

/**
 * 模拟模式：本地完成实名认证
 * POST /client/sign/mock-verify
 * @deprecated 配套旧两步流程的 mock 演示。现行流程（互动视频签即实名）下生产模式无单独实名步骤。
 */
export const mockVerifySigning = (data: { signing_id: string; client_id: string }) => {
  return axios.post('/client/sign/mock-verify', data)
}

/**
 * 创建法大大签署任务并返回签署链接
 * POST /client/sign/flow
 * @deprecated 旧「先实名后签署」链路专用（后端强制 verify_status=verified，与现行整合模式矛盾）。
 * 现行流程：发起签约即创建签署任务，前端无需调用。
 */
export const createSignFlow = (data: { signing_id: string; client_id: string }) => {
  return axios.post('/client/sign/flow', data)
}

/**
 * 模拟模式：本地完成签署
 * POST /client/sign/mock-finish
 */
export const mockFinishSigning = (data: { signing_id: string; client_id: string }) => {
  return axios.post('/client/sign/mock-finish', data)
}

/**
 * 查询签约状态（轮询用）
 * POST /client/sign/status
 */
export const getSignStatus = (data: { signing_id: string; client_id: string }) => {
  return axios.post('/client/sign/status', data)
}

/**
 * 创建服务评价
 * POST /client/service-ratings
 * @param data 评价信息
 */
export const createServiceRating = (data: {
  case_id: string
  client_id: string
  rating: number
  content?: string
  organization_id?: string
}) => {
  return axios.post('/client/service-ratings', data)
}

/**
 * 获取客户的服务评价列表
 * POST /client/service-ratings/list
 * @param data 包含 client_id 的对象
 */
export const getServiceRatingsByClient = (data: { client_id: string }) => {
  return axios.post('/client/service-ratings/list', data)
}

/**
 * 上传归档文件
 * POST /client/archives
 * @param data 归档文件信息
 */
export const uploadArchive = (data: {
  client_id: string
  case_id?: string
  file_name: string
  file_type: string
  file_size?: number
  file_url?: string
  description?: string
  organization_id?: string
}) => {
  return axios.post('/client/archives', data)
}

/**
 * 获取客户的归档文件列表
 * POST /client/archives/list
 * @param data 查询参数
 */
export const getClientArchives = (data: {
  client_id: string
  case_id?: string
  file_type?: string
}) => {
  return axios.post('/client/archives/list', data)
}