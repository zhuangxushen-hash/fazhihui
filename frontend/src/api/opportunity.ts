import api from './axios'
import { Opportunity, OpportunityStage, InviteTask } from '../types'

// 获取今日到所列表
export const getTodayArrivals = (): Promise<InviteTask[]> => {
  return api.get('/opportunities/today-arrivals')
}

// 获取待跟进商机列表
export const getPendingOpportunities = (): Promise<Opportunity[]> => {
  return api.get('/opportunities/pending')
}

// 获取已签约列表
export const getSignedOpportunities = (): Promise<Opportunity[]> => {
  return api.get('/opportunities/signed')
}

// 获取已流失列表
export const getLostOpportunities = (): Promise<Opportunity[]> => {
  return api.get('/opportunities/lost')
}

// 获取商机详情
export const getOpportunityDetail = (id: string): Promise<Opportunity> => {
  return api.get(`/opportunities/${id}`)
}

// 创建商机
export const createOpportunity = (data: {
  lead_id: string
  requirement_note?: string
  plan_note?: string
}): Promise<Opportunity> => {
  return api.post('/opportunities', data)
}

// 更新商机阶段
export const updateOpportunityStage = (id: string, data: {
  stage: OpportunityStage
  remark?: string
}): Promise<Opportunity> => {
  return api.put(`/opportunities/${id}/stage`, data)
}

// 更新商机信息
export const updateOpportunityInfo = (id: string, data: {
  requirement_note?: string
  plan_note?: string
}): Promise<Opportunity> => {
  return api.put(`/opportunities/${id}/info`, data)
}

// 添加报价项
export const addQuoteItem = (opportunityId: string, data: {
  item_name: string
  amount: number
  item_description?: string
  quantity?: number
  remark?: string
}): Promise<Opportunity> => {
  return api.post(`/opportunities/${opportunityId}/quote-items`, data)
}

// 更新报价项
export const updateQuoteItem = (opportunityId: string, itemId: string, data: {
  item_name?: string
  amount?: number
  item_description?: string
  quantity?: number
  remark?: string
}): Promise<Opportunity> => {
  return api.put(`/opportunities/${opportunityId}/quote-items/${itemId}`, data)
}

// 删除报价项
export const deleteQuoteItem = (opportunityId: string, itemId: string): Promise<Opportunity> => {
  return api.delete(`/opportunities/${opportunityId}/quote-items/${itemId}`)
}

// 签约转化（一键立案）
export const convertToCase = (opportunityId: string, data?: {
  case_type?: string
  case_description?: string
  service_fee?: number
}): Promise<{ opportunity: Opportunity; case: any }> => {
  return api.post(`/opportunities/${opportunityId}/convert-to-case`, data || {})
}

// 标记为流失
export const markAsLost = (opportunityId: string, data?: {
  remark?: string
}): Promise<Opportunity> => {
  return api.post(`/opportunities/${opportunityId}/mark-lost`, data || {})
}