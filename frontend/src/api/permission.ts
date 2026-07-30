import axios from './axios'

export const getPermissions = (module?: string) => {
  const params: any = {}
  if (module) params.module = module
  return axios.get('/permissions', { params })
}

export const getPermissionModules = () =>
  axios.get('/permissions/modules')

export const createPermission = (data: any) => axios.post('/permissions', data)
export const updatePermission = (id: string, data: any) => axios.put(`/permissions/${id}`, data)
export const deletePermission = (id: string) => axios.delete(`/permissions/${id}`)
export const togglePermissionStatus = (id: string) => axios.put(`/permissions/${id}/toggle-status`)