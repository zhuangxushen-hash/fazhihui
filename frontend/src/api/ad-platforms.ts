import axios from './axios'

/**
 * 广告平台对接 API
 * 对接巨量引擎/百度营销/腾讯广告/磁力引擎/抖音运营五大平台
 */

// 平台标识
export type PlatformCode = 'ocean_engine' | 'baidu_marketing' | 'tencent_ads' | 'kuaishou_ads' | 'douyin_open'

// 平台授权 Token 状态
export interface PlatformToken {
  id: string
  platform: string
  account_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  refresh_expires_at: string
  scope: string
  token_status: string
  organization_id: string
  created_at: string
  updated_at: string
}

// 数据同步日志
export interface SyncLog {
  id: string
  platform: string
  sync_type: string
  status: string
  record_count: number
  error_message: string
  data_summary: string
  organization_id: string
  created_at: string
}

// 平台名称映射
export const PLATFORM_NAMES: Record<PlatformCode, string> = {
  ocean_engine: '巨量引擎',
  baidu_marketing: '百度营销',
  tencent_ads: '腾讯广告',
  kuaishou_ads: '磁力引擎',
  douyin_open: '抖音运营',
}

/**
 * 发起平台 OAuth 授权（返回授权链接，前端跳转）
 */
export function authorizePlatform(platform: PlatformCode) {
  return axios.get(`/ad-platforms/auth/${platform}`)
}

/**
 * 查询当前组织所有平台的授权状态
 */
export function getPlatformTokens() {
  return axios.get<PlatformToken[]>('/ad-platforms/tokens')
}

/**
 * 取消平台授权（删除 Token）
 */
export function revokePlatformToken(tokenId: string) {
  return axios.delete(`/ad-platforms/tokens/${tokenId}`)
}

/**
 * 手动刷新平台 Token
 */
export function refreshPlatformToken(platform: PlatformCode) {
  return axios.post(`/ad-platforms/refresh/${platform}`)
}

/**
 * 手动触发账户余额同步
 */
export function syncAccountBalance(platform: PlatformCode) {
  return axios.post(`/ad-platforms/sync/balance/${platform}`)
}

/**
 * 手动触发投放计划同步
 */
export function syncCampaignList(platform: PlatformCode) {
  return axios.post(`/ad-platforms/sync/campaigns/${platform}`)
}

/**
 * 手动触发报表数据同步
 */
export function syncReportData(platform: PlatformCode, startDate: string, endDate: string) {
  return axios.post(`/ad-platforms/sync/report/${platform}`, { startDate, endDate })
}

/**
 * 查询同步日志
 */
export function getSyncLogs(platform?: string, limit = 20) {
  const params = new URLSearchParams()
  if (platform) params.append('platform', platform)
  params.append('limit', String(limit))
  return axios.get<SyncLog[]>(`/ad-platforms/sync-logs?${params.toString()}`)
}

/**
 * 获取 Webhook 回调地址（用于在平台开放平台配置）
 */
export function getWebhookUrl(platform: PlatformCode, type: 'lead' | 'conversion') {
  return `/ad-platforms/webhook/${platform}/${type}`
}
