import axios from './axios'

// 管理端查询所有通知
export const getNotifications = (params?: { type?: string; level?: string; isRead?: boolean; keyword?: string; admin?: boolean }) => {
  const query: any = { admin: true }
  if (params) {
    if (params.type) query.type = params.type
    if (params.level) query.level = params.level
    if (params.isRead !== undefined) query.is_read = params.isRead
    if (params.keyword) query.keyword = params.keyword
  }
  return axios.get('/notifications', { params: query })
}

// 获取当前用户通知
export const getMyNotifications = (isRead?: boolean) => {
  const params: any = {}
  if (isRead !== undefined) params.is_read = isRead
  return axios.get('/notifications', { params })
}

// 查询通知详情
export const getNotificationById = (id: string) =>
  axios.get(`/notifications/${id}`)

// 发布通知（超管/律所管理员）
export const createNotification = (data: {
  title: string
  content?: string
  type?: string
  level?: string
  receiver_id?: string
  sender_id?: string
  related_type?: string
  related_id?: string
}) =>
  axios.post('/notifications', data)

export const getUnreadCount = () =>
  axios.get('/notifications/unread-count')

export const markNotificationAsRead = (id: string) =>
  axios.put(`/notifications/${id}/read`)

export const markAllNotificationsAsRead = () =>
  axios.put('/notifications/mark-all-read')

export const deleteNotification = (id: string) =>
  axios.delete(`/notifications/${id}`)

export const clearAllNotifications = () =>
  axios.delete('/notifications/clear-all')
