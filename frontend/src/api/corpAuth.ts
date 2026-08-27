import axios from './axios'

// ==================== 类型定义 ====================

// 法大大企业授权记录（corp_auths 表）
export interface CorpAuth {
  id: string
  organization_id?: string
  client_corp_id: string
  corp_name: string
  corp_ident_no?: string
  legal_rep_name?: string
  agent_name?: string
  agent_id_card_no?: string
  agent_mobile?: string
  auth_scopes?: string
  open_corp_id?: string
  auth_status: string
  binding_status?: string
  ident_status?: string
  auth_url?: string
  url_expire_at?: string
  auth_result?: string
  created_at: string
  updated_at: string
}

// 发起企业授权参数
export interface CreateCorpAuthParams {
  organization_id?: string
  client_corp_id: string
  corp_name: string
  corp_ident_no?: string
  legal_rep_name?: string
  agent_name?: string
  agent_id_card_no?: string
  agent_mobile?: string
  auth_scopes?: string[]
  redirect_url?: string
}

// ==================== 接口封装 ====================

/** 企业授权记录列表 */
export const getCorpAuthList = () => {
  return axios.get<CorpAuth[]>('/corp-auth')
}

/** 发起企业授权（生成授权链接）；已授权企业重复调用即为补充授权范围 */
export const createCorpAuth = (data: CreateCorpAuthParams) => {
  return axios.post<CorpAuth>('/corp-auth', data)
}

/** 企业授权记录详情 */
export const getCorpAuth = (clientCorpId: string) => {
  return axios.get<CorpAuth>(`/corp-auth/${encodeURIComponent(clientCorpId)}`)
}

/** 查询企业授权状态（从法大大拉取后回填本地） */
export const queryCorpAuthStatus = (clientCorpId: string) => {
  return axios.get<CorpAuth>(`/corp-auth/${encodeURIComponent(clientCorpId)}/status`)
}