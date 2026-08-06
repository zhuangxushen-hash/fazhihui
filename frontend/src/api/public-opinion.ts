import axios from './axios'

// ==================== 类型定义 ====================

// 舆情来源平台
export enum OpinionPlatform {
  DOUYIN = 'douyin',
  WEIBO = 'weibo',
  XIAOHONGSHU = 'xiaohongshu',
  WECHAT = 'wechat',
  BAIDU = 'baidu',
  OTHER = 'other',
}

// 舆情情感倾向
export enum OpinionSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

// 舆情处理状态
export enum OpinionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  IGNORED = 'ignored',
}

// 舆情记录
export interface PublicOpinion {
  id: string
  title: string
  content: string
  platform: OpinionPlatform
  sentiment: OpinionSentiment
  status: OpinionStatus
  source_url?: string
  author?: string
  organization_id?: string
  handler_id?: string
  handle_note?: string
  created_at: string
  handled_at?: string
}

// 舆情关键词配置
export interface OpinionKeyword {
  id: string
  keyword: string
  organization_id?: string
  enabled: boolean
  created_at: string
}

// ==================== 舆情记录管理 ====================

/** 获取舆情列表 */
export const getOpinions = (params?: {
  org_id?: string
  platform?: OpinionPlatform
  sentiment?: OpinionSentiment
  status?: OpinionStatus
  keyword?: string
}) => {
  return axios.get<PublicOpinion[]>('/public-opinions', { params })
}

/** 更新舆情状态（处理/忽略） */
export const updateOpinionStatus = (id: string, data: {
  status: OpinionStatus
  handler_id?: string
  handle_note?: string
}) => {
  return axios.put<PublicOpinion>(`/public-opinions/${id}/status`, data)
}

// ==================== 舆情关键词配置 ====================

/** 获取关键词列表 */
export const getKeywords = (params?: { org_id?: string }) => {
  return axios.get<OpinionKeyword[]>('/public-opinions/keywords', { params })
}

/** 创建关键词 */
export const createKeyword = (data: { keyword: string; organization_id?: string }) => {
  return axios.post<OpinionKeyword>('/public-opinions/keywords', data)
}

/** 删除关键词 */
export const deleteKeyword = (id: string) => {
  return axios.delete(`/public-opinions/keywords/${id}`)
}
