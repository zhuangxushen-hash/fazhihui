import axios from './axios'

export const getMenus = () => axios.get('/menus')
export const getMenuTree = () => axios.get('/menus/tree')
export const createMenu = (data: any) => axios.post('/menus', data)
export const updateMenu = (id: string, data: any) => axios.put(`/menus/${id}`, data)
export const deleteMenu = (id: string) => axios.delete(`/menus/${id}`)
export const toggleMenuVisibility = (id: string) => axios.put(`/menus/${id}/toggle-visibility`)
