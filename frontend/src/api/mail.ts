import axios from './axios'

// 发送邮件
export const sendMail = (data: {
  recipient_ids: string[]
  cc_ids?: string[]
  subject: string
  content: string
  attachments?: any[]
}) => axios.post('/mail/send', data)

// 保存草稿
export const saveDraft = (data: any) => axios.post('/mail/draft', data)

// 收件箱（支持 keyword/is_read/is_starred 筛选）
export const getInbox = (params?: { keyword?: string; is_read?: boolean; is_starred?: boolean }) =>
  axios.get('/mail/inbox', { params })

// 已发送
export const getSent = () => axios.get('/mail/sent')

// 草稿箱
export const getDrafts = () => axios.get('/mail/drafts')

// 已删除
export const getTrash = () => axios.get('/mail/trash')

// 标记已读
export const markAsRead = (id: string) => axios.put(`/mail/${id}/read`)

// 星标切换
export const toggleStar = (id: string) => axios.put(`/mail/${id}/star`)

// 移到已删除
export const moveToTrash = (id: string) => axios.put(`/mail/${id}/trash`)

// 彻底删除
export const removeMail = (id: string) => axios.delete(`/mail/${id}`)
