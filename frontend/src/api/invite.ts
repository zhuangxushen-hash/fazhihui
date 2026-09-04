import api from './axios'
import { InviteTask, Lead, InviteMethod, InviteTaskStatus, InviteResult } from '../types'

// 获取待跟进线索
export const getPendingLeads = (): Promise<Lead[]> => {
  return api.get('/invite-tasks/pending-leads')
}

// 获取今日任务
export const getTodayTasks = (): Promise<InviteTask[]> => {
  return api.get('/invite-tasks/today-tasks')
}

// 获取已邀约列表
export const getInvitedTasks = (): Promise<InviteTask[]> => {
  return api.get('/invite-tasks/invited-tasks')
}

// 获取历史记录
export const getHistoryTasks = (): Promise<InviteTask[]> => {
  return api.get('/invite-tasks/history-tasks')
}

// 获取我的任务列表
export const getMyTasks = (status?: InviteTaskStatus): Promise<InviteTask[]> => {
  return api.get('/invite-tasks/my-tasks', { params: { status } })
}

// 获取邀约任务列表（支持按线索过滤，用于线索管理页邀约状态列与详情弹窗邀约记录）
export const getInviteTasks = (params: {
  org_id?: string
  lead_id?: string
  status?: InviteTaskStatus
  inviter_id?: string
  page?: number
  limit?: number
}): Promise<{ data: InviteTask[]; total: number }> => {
  return api.get('/invite-tasks', { params })
}

// 创建邀约记录
export const createInviteTask = (data: {
  leadId: string
  inviteMethod: InviteMethod
  scheduledTime?: Date
  result?: InviteResult
  resultNote?: string
  recordingUrl?: string
  callDuration?: number
}): Promise<InviteTask> => {
  return api.post('/invite-tasks/create', data)
}

// 更新邀约任务状态
export const updateTaskStatus = (taskId: string, data: {
  status: InviteTaskStatus
  resultNote?: string
}): Promise<InviteTask> => {
  return api.put(`/invite-tasks/${taskId}/status`, data)
}

// 上传录音文件
export const uploadRecording = (file: File): Promise<{ url: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/invite-tasks/upload-recording', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}