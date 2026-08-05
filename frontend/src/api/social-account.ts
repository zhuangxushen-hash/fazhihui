import axios from './axios'

// 公域账号平台
export type SocialPlatform = 'douyin' | 'kuaishou' | 'wechat_video' | 'wechat_official'

// 公域账号授权状态
export type SocialAuthStatus = 'authorized' | 'unauthorized' | 'expired'

// 公域内容发布状态
export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'failed'

// 公域账号
export interface SocialAccount {
  id: string
  platform: SocialPlatform
  account_name: string
  account_id: string
  group_name?: string
  followers: number
  likes: number
  consultations: number
  auth_status: SocialAuthStatus
  authorized_at?: string
  auth_token?: string
  avatar_url?: string
  bio?: string
  organization_id: string
  creator_id?: string
  created_at: string
  updated_at: string
}

// 公域内容发布
export interface SocialPost {
  id: string
  account_id: string
  account?: SocialAccount
  title?: string
  content: string
  media_files?: string
  hashtags?: string
  scheduled_time?: string
  published_at?: string
  status: SocialPostStatus
  fail_reason?: string
  likes: number
  comments: number
  shares: number
  sync_batch_id?: string
  organization_id: string
  creator_id?: string
  created_at: string
  updated_at: string
}

// 查询账号列表参数
export interface FetchSocialAccountsParams {
  org_id: string
  platform?: SocialPlatform
  group_name?: string
  auth_status?: SocialAuthStatus
  keyword?: string
}

// 创建/更新账号 payload
export interface SocialAccountPayload {
  platform: SocialPlatform
  account_name: string
  account_id: string
  group_name?: string
  followers?: number
  likes?: number
  consultations?: number
  auth_token?: string
  avatar_url?: string
  bio?: string
}

// 查询内容排期参数
export interface FetchSocialPostsParams {
  org_id: string
  account_id?: string
  status?: SocialPostStatus
  start_date?: string
  end_date?: string
}

// 创建内容 payload
export interface SocialPostPayload {
  account_id: string
  title?: string
  content: string
  media_files?: string[]
  hashtags?: string
  scheduled_time?: string
}

// 多账号同步发布 payload
export interface SocialMultiPostPayload {
  account_ids: string[]
  title?: string
  content: string
  media_files?: string[]
  hashtags?: string
  scheduled_time?: string
}

// ========== 账号 CRUD ==========

export const getSocialAccounts = (params: FetchSocialAccountsParams) => {
  return axios.get<SocialAccount[]>('/social-accounts', { params })
}

export const getSocialAccountById = (id: string) => {
  return axios.get<SocialAccount>(`/social-accounts/${id}`)
}

export const createSocialAccount = (data: SocialAccountPayload) => {
  return axios.post<SocialAccount>('/social-accounts', data)
}

export const updateSocialAccount = (id: string, data: Partial<SocialAccountPayload>) => {
  return axios.put<SocialAccount>(`/social-accounts/${id}`, data)
}

export const deleteSocialAccount = (id: string) => {
  return axios.delete<{ success: boolean }>(`/social-accounts/${id}`)
}

export const updateSocialAccountStats = (
  id: string,
  data: { followers?: number; likes?: number; consultations?: number },
) => {
  return axios.put<SocialAccount>(`/social-accounts/${id}/stats`, data)
}

// ========== 分组管理 ==========

export const getSocialAccountGroups = (orgId: string) => {
  return axios.get<string[]>('/social-accounts/groups', { params: { org_id: orgId } })
}

export const createSocialAccountGroup = (data: {
  group_name: string
  account_ids: string[]
  org_id: string
}) => {
  return axios.post<{ success: boolean }>('/social-accounts/groups', data)
}

export const changeSocialAccountGroup = (data: {
  account_ids: string[]
  group_name: string
}) => {
  return axios.put<{ success: boolean }>('/social-accounts/groups/change', data)
}

// ========== 授权状态管理 ==========

export const updateSocialAuthStatus = (id: string, auth_status: SocialAuthStatus) => {
  return axios.put<SocialAccount>(`/social-accounts/${id}/auth-status`, { auth_status })
}

export const authorizeSocialAccount = (id: string, auth_token: string) => {
  return axios.put<SocialAccount>(`/social-accounts/${id}/authorize`, { auth_token })
}

export const revokeSocialAccount = (id: string) => {
  return axios.put<SocialAccount>(`/social-accounts/${id}/revoke`)
}

// ========== 账号统计 ==========

export const getSocialOverview = (orgId: string) => {
  return axios.get<any>('/social-accounts/stats/overview', { params: { org_id: orgId } })
}

export const getSocialStatsByPlatform = (orgId: string) => {
  return axios.get<any[]>('/social-accounts/stats/by-platform', {
    params: { org_id: orgId },
  })
}

export const getSocialStatsByGroup = (orgId: string) => {
  return axios.get<any[]>('/social-accounts/stats/by-group', {
    params: { org_id: orgId },
  })
}

// ========== 内容排期 ==========

export const getSocialPosts = (params: FetchSocialPostsParams) => {
  return axios.get<SocialPost[]>('/social-posts', { params })
}

export const getSocialPostById = (id: string) => {
  return axios.get<SocialPost>(`/social-posts/${id}`)
}

export const createSocialPost = (data: SocialPostPayload) => {
  return axios.post<SocialPost>('/social-posts', data)
}

export const createSocialMultiPost = (data: SocialMultiPostPayload) => {
  return axios.post<SocialPost[]>('/social-posts/multi-account', data)
}

export const updateSocialPost = (id: string, data: Partial<SocialPostPayload>) => {
  return axios.put<SocialPost>(`/social-posts/${id}`, data)
}

export const deleteSocialPost = (id: string) => {
  return axios.delete<{ success: boolean }>(`/social-posts/${id}`)
}

export const publishSocialPost = (id: string) => {
  return axios.put<SocialPost>(`/social-posts/${id}/publish`)
}

export const cancelSocialPostSchedule = (id: string) => {
  return axios.put<SocialPost>(`/social-posts/${id}/cancel-schedule`)
}

export const updateSocialPostInteractions = (
  id: string,
  data: { likes?: number; comments?: number; shares?: number },
) => {
  return axios.put<SocialPost>(`/social-posts/${id}/interactions`, data)
}

// ========== 内容统计 ==========

export const getSocialPostStatsByStatus = (orgId: string) => {
  return axios.get<any[]>('/social-posts/stats/by-status', { params: { org_id: orgId } })
}

export const getSocialPostStatsByPlatform = (orgId: string) => {
  return axios.get<any[]>('/social-posts/stats/by-platform', {
    params: { org_id: orgId },
  })
}

export const getSocialPostDailyTrend = (orgId: string, startDate: string, endDate: string) => {
  return axios.get<any[]>('/social-posts/stats/daily-trend', {
    params: { org_id: orgId, start_date: startDate, end_date: endDate },
  })
}
