import axios from './axios'

export const getNotifications = (isRead?: boolean) => {
  const params: any = {}
  if (isRead !== undefined) params.is_read = isRead
  return axios.get('/notifications', { params }).then(res => res.data || [])
}

export const getUnreadCount = () =>
  axios.get('/notifications/unread-count').then(res => res.data || 0)

export const markNotificationAsRead = (id: string) =>
  axios.put(`/notifications/${id}/read`)

export const markAllNotificationsAsRead = () =>
  axios.put('/notifications/mark-all-read')

export const deleteNotification = (id: string) =>
  axios.delete(`/notifications/${id}`)

export const clearAllNotifications = () =>
  axios.delete('/notifications/clear-all')
