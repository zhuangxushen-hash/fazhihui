import axios from './axios'

// 获取工作日志列表
export const getWorklogs = (params: any) => axios.get('/worklogs', { params })

// 创建工作日志
export const createWorklog = (data: any) => axios.post('/worklogs', data)

// 更新工作日志（仅草稿可编辑）
export const updateWorklog = (id: string, data: any) => axios.put(`/worklogs/${id}`, data)

// 删除工作日志
export const deleteWorklog = (id: string) => axios.delete(`/worklogs/${id}`)

// 提交工作日志（草稿 -> 已提交）
export const submitWorklog = (id: string) => axios.put(`/worklogs/${id}/submit`)

// 审批通过（已提交 -> 已通过）
export const approveWorklog = (id: string, data: any) => axios.put(`/worklogs/${id}/approve`, data)

// 驳回（已提交 -> 已驳回）
export const rejectWorklog = (id: string, data: any) => axios.put(`/worklogs/${id}/reject`, data)

// 工时统计
export const getWorklogStats = (params: any) => axios.get('/worklogs/stats', { params })

// 日程转工作日志：根据日程ID生成一条工作日志
export const convertFromSchedule = (scheduleId: string) =>
  axios.post(`/worklogs/convert-schedule/${scheduleId}`)
