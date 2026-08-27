import axios from './axios'

// ==================== 类型定义 ====================

// 团队信息（组织 → 团队，每个组织下可维护多个团队）
export interface Team {
  id: string
  organization_id?: string
  name: string
  leader_id?: string
  description?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// 新增/更新团队参数
export interface SaveTeamParams {
  name: string
  organization_id?: string
  leader_id?: string
  description?: string
  status?: 'active' | 'inactive'
}

// ==================== 团队管理 ====================

/** 获取团队列表（可按组织过滤，超管可按 organization_id 过滤；普通管理员后端强制为本组织） */
export const getTeamList = (params?: { organization_id?: string; keyword?: string; status?: string }) => {
  return axios.get<Team[]>('/teams', { params })
}

/** 创建团队 */
export const createTeam = (data: SaveTeamParams) => {
  return axios.post<Team>('/teams', data)
}

/** 更新团队 */
export const updateTeam = (id: string, data: Partial<SaveTeamParams>) => {
  return axios.patch<Team>(`/teams/${encodeURIComponent(id)}`, data)
}

/** 删除团队 */
export const deleteTeam = (id: string) => {
  return axios.delete<{ success: boolean }>(`/teams/${encodeURIComponent(id)}`)
}