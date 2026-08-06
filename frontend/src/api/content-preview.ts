import axios from './axios'

// ==================== 类型定义 ====================

// 营销内容类型
export type ContentType = 'article' | 'video' | 'copywriting'

// 审核状态：pending待审核 / approved已通过 / rejected已驳回
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

// 营销内容记录
export interface ContentPreviewItem {
  id: string
  // 内容标题
  title: string
  // 内容类型：article图文 / video视频 / copywriting文案
  content_type: ContentType
  // 内容文本
  content_text?: string
  // 提交人ID
  submitted_by_id: string
  // 提交人姓名
  submitted_by_name?: string
  // 提交时间
  submitted_at: string
  // 审核状态
  review_status: ReviewStatus
  // 驳回原因
  reject_reason?: string
  // 审核人ID
  reviewer_id?: string
  // 审核时间
  reviewed_at?: string
  // 合规预审状态
  compliance_status?: string
  // 合规预审详情
  compliance_detail?: string
  organization_id?: string
  created_at?: string
  updated_at?: string
}

// 查询内容列表参数
export interface ContentListParams {
  status?: ReviewStatus
  content_type?: ContentType
  keyword?: string
  org_id?: string
}

// 提交审核参数
export interface SubmitForReviewDto {
  material_id: string
  title?: string
  content_text?: string
}

// 驳回请求参数
export interface RejectContentDto {
  reject_reason: string
}

// ==================== 内容预审管理接口 ====================

/**
 * 获取营销内容列表（按审核状态筛选）
 * 复用 marketing-content 路由前缀，对接后端素材列表 + 合规预审接口
 */
export const getContentList = (params: ContentListParams) => {
  return axios.get<ContentPreviewItem[]>('/marketing-content/list', { params })
}

/** 获取内容详情（含合规预审结果） */
export const getContentDetail = (id: string) => {
  return axios.get<ContentPreviewItem>(`/marketing-content/${id}`)
}

/** 提交内容进入审核流程 */
export const submitForReview = (data: SubmitForReviewDto) => {
  return axios.post<ContentPreviewItem>('/marketing-content/submit-review', data)
}

/** 审核通过 */
export const approveContent = (id: string) => {
  return axios.post<ContentPreviewItem>(`/marketing-content/${id}/approve`)
}

/** 审核驳回（需填写驳回原因） */
export const rejectContent = (id: string, data: RejectContentDto) => {
  return axios.post<ContentPreviewItem>(`/marketing-content/${id}/reject`, data)
}

// ==================== 展示映射 ====================

// 内容类型中文标签映射
export const contentTypeLabels: Record<ContentType, string> = {
  article: '图文',
  video: '视频',
  copywriting: '文案',
}

// 内容类型选项
export const contentTypeOptions: { value: ContentType; label: string }[] = [
  { value: 'article', label: '图文' },
  { value: 'video', label: '视频' },
  { value: 'copywriting', label: '文案' },
]

// 审核状态中文标签映射
export const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}

// 审核状态对应的 stitch-tag 变体类名
export const reviewStatusTagClass: Record<ReviewStatus, string> = {
  pending: 'stitch-tag stitch-tag-warning',
  approved: 'stitch-tag stitch-tag-success',
  rejected: 'stitch-tag stitch-tag-error',
}
