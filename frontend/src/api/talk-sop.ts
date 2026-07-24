import api from './axios'
import { TalkSOP, TalkSOPNodeType, OpportunitySOPProgress } from '../types'

// ==================== SOP模板管理接口 ====================

// 创建SOP模板
export const createSOP = (data: {
  name: string
  case_type?: string
  nodes?: Array<{
    node_id?: string
    node_name: string
    node_type?: TalkSOPNodeType
    is_required?: boolean
    order?: number
    description?: string
  }>
  is_default?: boolean
}): Promise<TalkSOP> => {
  return api.post('/talk-sop', data)
}

// 编辑SOP模板
export const updateSOP = (
  sopId: string,
  data: {
    name?: string
    case_type?: string
    nodes?: Array<{
      node_id?: string
      node_name: string
      node_type?: TalkSOPNodeType
      is_required?: boolean
      order?: number
      description?: string
    }>
    is_default?: boolean
  }
): Promise<TalkSOP> => {
  return api.put(`/talk-sop/${sopId}`, data)
}

// 删除SOP模板
export const deleteSOP = (sopId: string): Promise<{ message: string }> => {
  return api.delete(`/talk-sop/${sopId}`)
}

// 查询SOP模板列表
export const getSOPList = (caseType?: string, enabled?: boolean): Promise<TalkSOP[]> => {
  const params: any = {}
  if (caseType) params.case_type = caseType
  if (enabled !== undefined) params.enabled = enabled
  return api.get('/talk-sop', { params })
}

// 获取SOP详情
export const getSOPDetail = (sopId: string): Promise<TalkSOP> => {
  return api.get(`/talk-sop/${sopId}`)
}

// 设置默认SOP
export const setDefaultSOP = (sopId: string): Promise<TalkSOP> => {
  return api.post(`/talk-sop/${sopId}/set-default`)
}

// 启用/禁用SOP
export const toggleSOPEnabled = (sopId: string, enabled: boolean): Promise<TalkSOP> => {
  return api.post(`/talk-sop/${sopId}/toggle-enabled`, { enabled })
}

// ==================== SOP节点完成状态追踪接口 ====================

// 获取商机的SOP进度
export const getOpportunitySOPProgress = (opportunityId: string): Promise<OpportunitySOPProgress> => {
  return api.get(`/talk-sop/opportunity/${opportunityId}/progress`)
}

// 完成单个节点
export const completeNode = (opportunityId: string, nodeId: string): Promise<OpportunitySOPProgress> => {
  return api.post(`/talk-sop/opportunity/${opportunityId}/node/${nodeId}/complete`)
}

// 取消完成节点
export const uncompleteNode = (opportunityId: string, nodeId: string): Promise<OpportunitySOPProgress> => {
  return api.post(`/talk-sop/opportunity/${opportunityId}/node/${nodeId}/uncomplete`)
}

// 获取SOP完成百分比
export const getSOPCompletionPercentage = (
  opportunityId: string
): Promise<{
  completion_percentage: number
  has_incomplete_required_nodes: boolean
}> => {
  return api.get(`/talk-sop/opportunity/${opportunityId}/completion`)
}