import axios from './axios'

// 获取任务列表
export const getTasks = (params: any) => axios.get('/tasks', { params })

// 创建任务
export const createTask = (data: any) => axios.post('/tasks', data)

// 更新任务
export const updateTask = (id: string, data: any) => axios.put(`/tasks/${id}`, data)

// 删除任务
export const deleteTask = (id: string) => axios.delete(`/tasks/${id}`)

// 开始任务（待办 -> 进行中）
export const startTask = (id: string) => axios.put(`/tasks/${id}/start`)

// 完成任务（进行中 -> 已完成）
export const completeTask = (id: string) => axios.put(`/tasks/${id}/complete`)

// 更新任务进度（progress >= 100 时自动标记为已完成）
export const updateProgress = (id: string, progress: number) =>
  axios.put(`/tasks/${id}/progress`, { progress })

// 取消任务（任意状态 -> 已取消）
export const cancelTask = (id: string) => axios.put(`/tasks/${id}/cancel`)

// 任务统计（各状态任务数）
export const getTaskStats = () => axios.get('/tasks/stats')
