import axios from './axios'

// ========== 用户管理 ==========

// 用户信息
export interface UserItem {
  id: string
  real_name: string
  phone?: string
  email?: string
  role?: string
  avatar?: string
  position?: string
  organization_id?: string
  created_at?: string
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[]
  total: number
}

// 查询用户列表（默认当前组织，支持姓名/手机号/角色筛选）
export const getUsers = (params: { name?: string; phone?: string; role?: string; org_id?: string }) => {
  return axios.get<PaginatedResult<UserItem>>('/users', { params })
}
