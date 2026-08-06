import axios from './axios'

// ==================== 类型定义 ====================

// 组织信息
export interface Organization {
  id: string
  name: string
  short_name?: string
  contact_name?: string
  contact_phone?: string
  address?: string
  description?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// ==================== 组织管理 ====================

/** 获取组织列表（复用 user 模块路由） */
export const getOrganizations = (params?: { keyword?: string; status?: string }) => {
  return axios.get<Organization[]>('/users/organizations', { params })
}

/** 创建组织 */
export const createOrganization = (data: {
  name: string
  short_name?: string
  contact_name?: string
  contact_phone?: string
  address?: string
  description?: string
}) => {
  return axios.post<Organization>('/users/organizations', data)
}

/** 更新组织 */
export const updateOrganization = (id: string, data: Partial<{
  name: string
  short_name: string
  contact_name: string
  contact_phone: string
  address: string
  description: string
  status: 'active' | 'inactive'
}>) => {
  return axios.put<Organization>(`/users/organizations/${id}`, data)
}
