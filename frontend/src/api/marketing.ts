import axios from './axios'

// ============ 类型定义 ============

export type AdChannel = 'douyin' | 'baidu' | 'kuaishou' | 'wechat' | 'other'
export type ConversionEventType = 'lead' | 'wechat_add' | 'invite' | 'sign'
export type AdMaterialType = 'image' | 'video' | 'article' | 'script'
export type AdMaterialStatus = 'draft' | 'active' | 'paused' | 'archived'
export type RoiDimension = 'channel' | 'account' | 'plan' | 'material' | 'keyword'
export type MaterialRankMetric = 'impressions' | 'clicks' | 'conversions' | 'roi'

// Task 1.5 / 1.6：AI 内容生成 + 合规预审相关类型
export type MaterialComplianceStatus = 'pending' | 'passed' | 'need_modification' | 'forbidden'
export type ContentCaseType = 'marriage' | 'traffic' | 'labor' | 'debt' | 'other'
export type ContentTypeEnum = 'video_script' | 'copywriting' | 'live_script' | 'article'

export interface ContentTemplate {
  id: string
  case_type: string
  content_type: string
  title: string
  content: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GenerateContentDto {
  case_type: string
  content_type: string
  selling_points: string
  template_id?: string
}

export interface GeneratedContentResult {
  title: string
  content: string
  case_type: string
  content_type: string
  template_id?: string
  tags: string[]
}

export interface SaveGeneratedContentDto {
  title: string
  content: string
  case_type: string
  content_type: string
  tags?: string[]
  organization_id: string
  uploaded_by_id: string
  channel?: string
}

export interface ViolationItem {
  keyword: string
  type: string
  label: string
  suggestion: string
  severity: 'minor' | 'serious'
  positions: number[]
}

export interface ComplianceHighlight {
  keyword: string
  start: number
  end: number
  severity: 'minor' | 'serious'
}

export interface CompliancePrecheckResult {
  status: MaterialComplianceStatus
  violations: ViolationItem[]
  summary: string
  suggestions: string[]
  highlights: ComplianceHighlight[]
}

export interface MaterialComplianceResult {
  material_id: string
  status: MaterialComplianceStatus
  detail: CompliancePrecheckResult | null
  checked_at: string | null
}

export interface MaterialBindCheckResult {
  allowed: boolean
  reason: string
  material?: AdMaterial
}

export interface ConversionEvent {
  id: string
  channel: AdChannel
  account_id?: string
  plan_id?: string
  material_id?: string
  event_type: ConversionEventType
  amount: number
  keyword?: string
  client_id?: string
  lead_id?: string
  case_id?: string
  organization_id: string
  created_at: string
}

export interface CreateConversionEventDto {
  channel: AdChannel
  account_id?: string
  plan_id?: string
  material_id?: string
  event_type?: ConversionEventType
  amount?: number
  keyword?: string
  client_id?: string
  lead_id?: string
  case_id?: string
  phone?: string
  organization_id: string
}

export interface FunnelStats {
  lead: number
  wechat_add: number
  invite: number
  sign: number
}

export interface RoiStatsRow {
  dimension_key: string
  channel?: string
  account_id?: string
  plan_id?: string
  material_id?: string
  keyword?: string
  cost: number
  lead_count: number
  wechat_add_count: number
  invite_count: number
  sign_count: number
  revenue: number
  lead_cost: number
  wechat_add_rate: number
  sign_rate: number
  roi: number
}

export interface AdMaterial {
  id: string
  name: string
  type: AdMaterialType
  tags: string[]
  file_path?: string
  account_id?: string
  plan_id?: string
  channel?: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
  roi: number
  status: AdMaterialStatus
  organization_id: string
  uploaded_by_id: string
  // Task 1.5.3 / 1.6：AI 内容入库 + 合规预审相关字段
  compliance_status?: MaterialComplianceStatus
  compliance_detail?: string
  compliance_checked_at?: string
  content_text?: string
  case_type?: string
  created_at: string
  updated_at: string
}

export interface AdMaterialWithPerformance extends AdMaterial {
  performance: 'high' | 'low' | 'normal'
}

export interface CreateAdMaterialDto {
  name: string
  type: AdMaterialType
  tags?: string[]
  file_path?: string
  account_id?: string
  plan_id?: string
  channel?: string
  impressions?: number
  clicks?: number
  conversions?: number
  cost?: number
  status?: AdMaterialStatus
  organization_id: string
  uploaded_by_id: string
}

export interface UpdateEffectDto {
  impressions?: number
  clicks?: number
  conversions?: number
  cost?: number
}

// ============ 转化事件接口 ============

export const reportLead = (data: CreateConversionEventDto) => {
  return axios.post('/conversions/lead', data)
}

export const reportWechatAdd = (data: CreateConversionEventDto) => {
  return axios.post('/conversions/wechat-add', data)
}

export const reportInvite = (data: CreateConversionEventDto) => {
  return axios.post('/conversions/invite', data)
}

export const reportSign = (data: CreateConversionEventDto) => {
  return axios.post('/conversions/sign', data)
}

export const createConversionEvent = (data: CreateConversionEventDto) => {
  return axios.post('/conversions/events', data)
}

export const getConversionEvents = (params: {
  org_id: string
  channel?: AdChannel
  account_id?: string
  plan_id?: string
  material_id?: string
  event_type?: ConversionEventType
  start_date?: string
  end_date?: string
}) => {
  return axios.get<ConversionEvent[]>('/conversions/events', { params })
}

export const getFunnelStats = (params: {
  org_id: string
  channel?: AdChannel
  account_id?: string
  plan_id?: string
  material_id?: string
  start_date?: string
  end_date?: string
}) => {
  return axios.get<FunnelStats>('/conversions/funnel', { params })
}

export const getRoiStats = (params: {
  org_id: string
  dimension: RoiDimension
  channel?: AdChannel
  account_id?: string
  plan_id?: string
  material_id?: string
  start_date?: string
  end_date?: string
}) => {
  return axios.get<RoiStatsRow[]>('/conversions/roi-stats', { params })
}

export const refreshMaterialRoi = () => {
  return axios.post('/conversions/refresh-material-roi')
}

// ============ 素材管理接口 ============

export const createAdMaterial = (data: CreateAdMaterialDto) => {
  return axios.post<AdMaterial>('/ad-materials', data)
}

export const getAdMaterials = (params: {
  org_id: string
  type?: AdMaterialType
  tag?: string
  status?: AdMaterialStatus
  channel?: string
  account_id?: string
  plan_id?: string
}) => {
  return axios.get<AdMaterial[]>('/ad-materials', { params })
}

export const getAdMaterialById = (id: string) => {
  return axios.get<AdMaterial>(`/ad-materials/${id}`)
}

export const updateAdMaterial = (id: string, data: Partial<AdMaterial>) => {
  return axios.put<AdMaterial>(`/ad-materials/${id}`, data)
}

export const deleteAdMaterial = (id: string) => {
  return axios.delete(`/ad-materials/${id}`)
}

export const updateAdMaterialEffect = (id: string, data: UpdateEffectDto) => {
  return axios.put<AdMaterial>(`/ad-materials/${id}/effect`, data)
}

export const addAdMaterialTag = (id: string, tag: string) => {
  return axios.post<AdMaterial>(`/ad-materials/${id}/tags`, { tag })
}

export const removeAdMaterialTag = (id: string, tag: string) => {
  return axios.delete<AdMaterial>(`/ad-materials/${id}/tags/${encodeURIComponent(tag)}`)
}

export const getAllTags = (orgId: string) => {
  return axios.get<string[]>('/ad-materials/tags', { params: { org_id: orgId } })
}

export const getMaterialRanking = (params: {
  org_id: string
  metric?: MaterialRankMetric
  limit?: number
  high_threshold?: number
  low_threshold?: number
  type?: AdMaterialType
  tag?: string
  status?: AdMaterialStatus
  channel?: string
  account_id?: string
  plan_id?: string
}) => {
  return axios.get<AdMaterialWithPerformance[]>('/ad-materials/ranking', { params })
}

// ============ 标签与渠道展示 ============

export const channelLabels: Record<AdChannel, string> = {
  douyin: '抖音',
  baidu: '百度',
  kuaishou: '快手',
  wechat: '微信',
  other: '其他',
}

export const channelOptions = [
  { value: 'douyin', label: '抖音' },
  { value: 'baidu', label: '百度' },
  { value: 'kuaishou', label: '快手' },
  { value: 'wechat', label: '微信' },
  { value: 'other', label: '其他' },
]

export const eventTypeLabels: Record<ConversionEventType, string> = {
  lead: '线索',
  wechat_add: '加微',
  invite: '邀约到所',
  sign: '签约回款',
}

export const eventTypeOptions = [
  { value: 'lead', label: '线索' },
  { value: 'wechat_add', label: '加微' },
  { value: 'invite', label: '邀约到所' },
  { value: 'sign', label: '签约回款' },
]

export const materialTypeLabels: Record<AdMaterialType, string> = {
  image: '图片',
  video: '视频',
  article: '文章',
  script: '脚本',
}

export const materialTypeOptions = [
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'article', label: '文章' },
  { value: 'script', label: '脚本' },
]

export const materialStatusLabels: Record<AdMaterialStatus, string> = {
  draft: '草稿',
  active: '投放中',
  paused: '暂停',
  archived: '归档',
}

export const materialStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '投放中' },
  { value: 'paused', label: '暂停' },
  { value: 'archived', label: '归档' },
]

export const dimensionOptions = [
  { value: 'channel', label: '按渠道' },
  { value: 'account', label: '按账户' },
  { value: 'plan', label: '按计划' },
  { value: 'material', label: '按素材' },
  { value: 'keyword', label: '按关键词' },
]

export const rankMetricOptions = [
  { value: 'roi', label: '按 ROI' },
  { value: 'impressions', label: '按曝光' },
  { value: 'clicks', label: '按点击' },
  { value: 'conversions', label: '按转化' },
]

// ============ Task 1.5 / 1.6：AI 内容生成 + 合规预审接口 ============

// 案由类型选项
export const caseTypeOptions = [
  { value: 'marriage', label: '婚姻家事' },
  { value: 'traffic', label: '交通事故' },
  { value: 'labor', label: '劳动争议' },
  { value: 'debt', label: '债务纠纷' },
  { value: 'other', label: '综合法律' },
]

export const caseTypeLabels: Record<string, string> = {
  marriage: '婚姻家事',
  traffic: '交通事故',
  labor: '劳动争议',
  debt: '债务纠纷',
  other: '综合法律',
}

// 内容类型选项
export const contentTypeOptions = [
  { value: 'video_script', label: '短视频脚本' },
  { value: 'copywriting', label: '朋友圈文案' },
  { value: 'live_script', label: '直播话术' },
  { value: 'article', label: '科普图文' },
]

export const contentTypeLabels: Record<string, string> = {
  video_script: '短视频脚本',
  copywriting: '朋友圈文案',
  live_script: '直播话术',
  article: '科普图文',
}

// 合规预审状态选项与标签
export const complianceStatusLabels: Record<MaterialComplianceStatus, string> = {
  pending: '未预审',
  passed: '已通过',
  need_modification: '需修改',
  forbidden: '禁止发布',
}

export const complianceStatusOptions = [
  { value: 'pending', label: '未预审' },
  { value: 'passed', label: '已通过' },
  { value: 'need_modification', label: '需修改' },
  { value: 'forbidden', label: '禁止发布' },
]

// 合规预审状态对应的展示颜色
export const complianceStatusColors: Record<MaterialComplianceStatus, string> = {
  pending: '#86868b',
  passed: '#34c759',
  need_modification: '#ff9500',
  forbidden: '#ff3b30',
}

// 查询内容模板列表
export const getContentTemplates = (params?: {
  case_type?: string
  content_type?: string
  is_active?: boolean
}) => {
  return axios.get<ContentTemplate[]>('/marketing-content/templates', { params })
}

// 查询模板详情
export const getContentTemplateById = (id: string) => {
  return axios.get<ContentTemplate>(`/marketing-content/templates/${id}`)
}

// AI 内容生成
export const generateContent = (data: GenerateContentDto) => {
  return axios.post<GeneratedContentResult>('/marketing-content/generate', data)
}

// 生成内容一键入库素材库
export const saveGeneratedContent = (data: SaveGeneratedContentDto) => {
  return axios.post<AdMaterial>('/marketing-content/save-to-material', data)
}

// 合规预审
export const precheckCompliance = (data: { content: string; material_id?: string }) => {
  return axios.post<CompliancePrecheckResult>('/marketing-content/compliance-precheck', data)
}

// 查询素材合规预审结果
export const getMaterialCompliance = (materialId: string) => {
  return axios.get<MaterialComplianceResult>(`/marketing-content/compliance/${materialId}`)
}

// 素材绑定投放计划前置校验
export const validateMaterialForBinding = (materialId: string) => {
  return axios.get<MaterialBindCheckResult>(`/marketing-content/bind-check/${materialId}`)
}

// 素材绑定投放计划（带合规校验）
export const bindMaterialToPlan = (materialId: string, planId: string) => {
  return axios.put<AdMaterial>(`/ad-materials/${materialId}/bind-plan`, { plan_id: planId })
}
