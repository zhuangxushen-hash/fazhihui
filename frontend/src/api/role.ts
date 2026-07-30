import axios from './axios'

export const getRoles = () => axios.get('/roles').then(res => res.data || [])
export const createRole = (data: any) => axios.post('/roles', data)
export const updateRole = (id: string, data: any) => axios.put(`/roles/${id}`, data)
export const deleteRole = (id: string) => axios.delete(`/roles/${id}`)
export const toggleRoleStatus = (id: string) => axios.put(`/roles/${id}/toggle-status`)
