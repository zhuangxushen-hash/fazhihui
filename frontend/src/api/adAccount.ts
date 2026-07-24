import axios from './axios'

// 广告账户投放平台
export type AdPlatform = 'douyin' | 'baidu' | 'tencent' | 'kuaishou'

// 广告账户状态
export type AdAccountStatus = 'active' | 'disabled' | 'unauthorized'

// 余额预警状态
export type AdAccountWarningStatus = 'pending' | 'notified' | 'resolved'

// 广告账户
export interface AdAccount {
  id: string
  platform: AdPlatform
  account_name: string
  account_id: string
  group_name?: string
  balance: number | string
  threshold: number | string
  status: AdAccountStatus
  auth_token?: string
  authorized_at?: string
  organization_id: string
  creator_id?: string
  created_at: string
  updated_at: string
}

// 余额预警记录
export interface AdAccountWarning {
  id: string
  account_id: string
  platform: string
  account_name: string
  balance: number | string
  threshold: number | string
  status: AdAccountWarningStatus
  remarks?: string
  organization_id: string
  created_at: string
  updated_at: string
}

// 查询账户列表参数
export interface FetchAdAccountsParams {
  org_id: string
  platform?: AdPlatform
  group_name?: string
  status?: AdAccountStatus
  keyword?: string
}

// 创建/更新账户 payload
export interface AdAccountPayload {
  platform: AdPlatform
  account_name: string
  account_id: string
  group_name?: string
  balance?: number
  threshold?: number
  status?: AdAccountStatus
  auth_token?: string
}

export const getAdAccounts = (params: FetchAdAccountsParams) => {
  return axios.get<AdAccount[]>('/ad-accounts', { params })
}

export const getAdAccountById = (id: string) => {
  return axios.get<AdAccount>(`/ad-accounts/${id}`)
}

export const createAdAccount = (data: AdAccountPayload) => {
  return axios.post<AdAccount>('/ad-accounts', data)
}

export const updateAdAccount = (id: string, data: Partial<AdAccountPayload>) => {
  return axios.put<AdAccount>(`/ad-accounts/${id}`, data)
}

export const deleteAdAccount = (id: string) => {
  return axios.delete<{ success: boolean }>(`/ad-accounts/${id}`)
}

export const updateAdAccountBalance = (id: string, balance: number) => {
  return axios.put<AdAccount>(`/ad-accounts/${id}/balance`, { balance })
}

export const updateAdAccountThreshold = (id: string, threshold: number) => {
  return axios.put<AdAccount>(`/ad-accounts/${id}/threshold`, { threshold })
}

export const updateAdAccountStatus = (id: string, status: AdAccountStatus) => {
  return axios.put<AdAccount>(`/ad-accounts/${id}/status`, { status })
}

// 分组管理
export const getAdAccountGroups = (orgId: string) => {
  return axios.get<string[]>('/ad-accounts/groups', { params: { org_id: orgId } })
}

export const createAdAccountGroup = (data: {
  group_name: string
  account_ids: string[]
  org_id: string
}) => {
  return axios.post<{ success: boolean }>('/ad-accounts/groups', data)
}

export const changeAdAccountGroup = (data: { account_ids: string[]; group_name: string }) => {
  return axios.put<{ success: boolean }>('/ad-accounts/groups/change', data)
}

// 余额预警
export const getAdAccountWarnings = (params: {
  org_id: string
  status?: AdAccountWarningStatus
}) => {
  return axios.get<AdAccountWarning[]>('/ad-accounts/warnings', { params })
}

export const manualCheckAdAccountWarnings = () => {
  return axios.post<string>('/ad-accounts/warnings/manual-check')
}

export const markAdAccountWarningNotified = (id: string) => {
  return axios.put<AdAccountWarning>(`/ad-accounts/warnings/${id}/notified`)
}

export const markAdAccountWarningResolved = (id: string, remarks?: string) => {
  return axios.put<AdAccountWarning>(`/ad-accounts/warnings/${id}/resolved`, { remarks })
}
