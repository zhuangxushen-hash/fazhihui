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

// ==================== 数据转换 ====================

// 后端返回的营销内容原始字段（MarketingContent 实体）
interface RawMarketingContent {
  id: string
  title: string
  content: string
  content_type: ContentType
  platform?: string
  status?: string
  compliance_issues?: string | null
  compliance_suggestions?: string | null
  review_time?: string | null
  reviewer_id?: string | null
  organization_id?: string
  operator_id?: string
  operator_name?: string | null
  created_at?: string
  updated_at?: string
}

// 后端状态值 → 前端审核状态映射（draft 归入待审核展示）
const reviewStatusMap: Record<string, ReviewStatus> = {
  pending_review: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  draft: 'pending',
}

// 后端 MarketingContent → 前端 ContentPreviewItem 转换（容忍空值）
const toContentPreviewItem = (raw: RawMarketingContent | null | undefined): ContentPreviewItem => {
  if (!raw) {
    return {
      id: '',
      title: '',
      content_type: 'article',
      submitted_by_id: '',
      submitted_at: '',
      review_status: 'pending',
    }
  }
  return {
    id: raw.id,
    title: raw.title,
    content_type: raw.content_type,
    content_text: raw.content,
    submitted_by_id: raw.operator_id || '',
    submitted_by_name: raw.operator_name || undefined,
    submitted_at: raw.created_at || '',
    review_status: reviewStatusMap[raw.status || ''] || 'pending',
    reject_reason: raw.compliance_issues || undefined,
    reviewer_id: raw.reviewer_id || undefined,
    reviewed_at: raw.review_time || undefined,
    compliance_status: raw.status,
    compliance_detail: raw.compliance_suggestions || undefined,
    organization_id: raw.organization_id,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

// ==================== 内容预审管理接口 ====================

/**
 * 获取营销内容列表（按审核状态筛选）
 * 对接 GET /compliance/marketing-content，status 值映射：pending→pending_review 等
 */
export const getContentList = async (params: ContentListParams) => {
  const queryParams: Record<string, unknown> = { ...params }
  if (params.status) {
    // 前端状态值 → 后端状态值（approved/rejected 透传）
    const statusMap: Record<ReviewStatus, string> = {
      pending: 'pending_review',
      approved: 'approved',
      rejected: 'rejected',
    }
    queryParams.status = statusMap[params.status]
  }
  const res = await axios.get<RawMarketingContent[]>('/compliance/marketing-content', { params: queryParams })
  return Array.isArray(res) ? res.map(toContentPreviewItem) : []
}

/** 获取内容详情（含合规预审结果），对接 GET /compliance/marketing-content/:id */
export const getContentDetail = async (id: string) => {
  const res = await axios.get<RawMarketingContent>(`/compliance/marketing-content/${id}`)
  return toContentPreviewItem(res)
}

/** 提交内容进入审核流程，对接 POST /compliance/marketing-content/:id/submit */
export const submitForReview = (data: SubmitForReviewDto) => {
  return axios.post<ContentPreviewItem>(`/compliance/marketing-content/${data.material_id}/submit`)
}

/** 审核通过，对接 PUT /compliance/marketing-content/:id/review（status=approved） */
export const approveContent = (id: string) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return axios.put<ContentPreviewItem>(`/compliance/marketing-content/${id}/review`, {
    reviewer_id: user.id,
    status: 'approved',
  })
}

/** 审核驳回（需填写驳回原因），对接 PUT /compliance/marketing-content/:id/review（status=rejected） */
export const rejectContent = (id: string, data: RejectContentDto) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return axios.put<ContentPreviewItem>(`/compliance/marketing-content/${id}/review`, {
    reviewer_id: user.id,
    status: 'rejected',
    issues: data.reject_reason,
  })
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
