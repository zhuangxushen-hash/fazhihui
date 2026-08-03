import axios from './axios'

// ============ 律所知识文章 ============

// 获取文章列表
export const getArticles = (params: any) => axios.get('/knowledge/articles', { params })

// 创建文章
export const createArticle = (data: any) => axios.post('/knowledge/articles', data)

// 更新文章
export const updateArticle = (id: string, data: any) => axios.put(`/knowledge/articles/${id}`, data)

// 删除文章
export const deleteArticle = (id: string) => axios.delete(`/knowledge/articles/${id}`)

// 浏览文章（浏览量+1）
export const viewArticle = (id: string) => axios.get(`/knowledge/articles/${id}/view`)

// ============ 法律法规 ============

// 获取法规列表
export const getLawRegulations = (params: any) => axios.get('/knowledge/law-regulations', { params })

// 创建法规
export const createLawRegulation = (data: any) => axios.post('/knowledge/law-regulations', data)

// 更新法规
export const updateLawRegulation = (id: string, data: any) => axios.put(`/knowledge/law-regulations/${id}`, data)

// 删除法规
export const deleteLawRegulation = (id: string) => axios.delete(`/knowledge/law-regulations/${id}`)

// ============ 裁判文书 ============

// 获取判例列表
export const getCasePrecedents = (params: any) => axios.get('/knowledge/case-precedents', { params })

// 创建判例
export const createCasePrecedent = (data: any) => axios.post('/knowledge/case-precedents', data)

// 更新判例
export const updateCasePrecedent = (id: string, data: any) => axios.put(`/knowledge/case-precedents/${id}`, data)

// 删除判例
export const deleteCasePrecedent = (id: string) => axios.delete(`/knowledge/case-precedents/${id}`)
