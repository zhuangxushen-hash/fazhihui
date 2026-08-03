import axios from './axios'

// 查询图表列表
export const getDiagrams = (params?: any) => axios.get('/diagrams', { params })

// 查询图表详情
export const getDiagramById = (id: string) => axios.get(`/diagrams/${id}`)

// 按创建人查询图表
export const getDiagramsByCreator = (creatorId: string) => axios.get(`/diagrams/creator/${creatorId}`)

// 创建图表
export const createDiagram = (data: any) => axios.post('/diagrams', data)

// 更新图表
export const updateDiagram = (id: string, data: any) => axios.put(`/diagrams/${id}`, data)

// 删除图表
export const deleteDiagram = (id: string) => axios.delete(`/diagrams/${id}`)
