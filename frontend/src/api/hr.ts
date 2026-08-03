import axios from './axios'

// ==================== 请假管理 ====================

// 查询请假列表（支持 user_id/status/start_date/end_date 筛选）
export const getLeaves = (params?: any) => axios.get('/hr/leaves', { params })

// 查询单条请假
export const getLeave = (id: string) => axios.get(`/hr/leaves/${id}`)

// 创建请假申请
export const createLeave = (data: any) => axios.post('/hr/leaves', data)

// 更新请假（仅待审批状态可编辑）
export const updateLeave = (id: string, data: any) => axios.put(`/hr/leaves/${id}`, data)

// 删除请假
export const deleteLeave = (id: string) => axios.delete(`/hr/leaves/${id}`)

// 审批通过
export const approveLeave = (id: string, comment?: string) => axios.put(`/hr/leaves/${id}/approve`, { comment })

// 驳回
export const rejectLeave = (id: string, comment?: string) => axios.put(`/hr/leaves/${id}/reject`, { comment })

// 撤销请假
export const cancelLeave = (id: string) => axios.put(`/hr/leaves/${id}/cancel`)

// ==================== 考勤管理 ====================

// 查询考勤列表（支持 user_id/status/start_date/end_date 筛选）
export const getAttendances = (params?: any) => axios.get('/hr/attendances', { params })

// 创建考勤记录
export const createAttendance = (data: any) => axios.post('/hr/attendances', data)

// 上班打卡
export const clockIn = () => axios.post('/hr/attendances/clock-in')

// 下班打卡
export const clockOut = () => axios.post('/hr/attendances/clock-out')

// 删除考勤记录
export const deleteAttendance = (id: string) => axios.delete(`/hr/attendances/${id}`)

// ==================== 物品申购/领用 ====================

// 查询物品申购列表（支持 user_id/status/type/keyword 筛选）
export const getMaterials = (params?: any) => axios.get('/hr/materials', { params })

// 查询单条物品申购
export const getMaterial = (id: string) => axios.get(`/hr/materials/${id}`)

// 创建物品申购/领用申请
export const createMaterial = (data: any) => axios.post('/hr/materials', data)

// 更新物品申购（仅待审批状态可编辑）
export const updateMaterial = (id: string, data: any) => axios.put(`/hr/materials/${id}`, data)

// 删除物品申购
export const deleteMaterial = (id: string) => axios.delete(`/hr/materials/${id}`)

// 审批通过
export const approveMaterial = (id: string, comment?: string) => axios.put(`/hr/materials/${id}/approve`, { comment })

// 驳回
export const rejectMaterial = (id: string, comment?: string) => axios.put(`/hr/materials/${id}/reject`, { comment })

// 发放物品
export const fulfillMaterial = (id: string) => axios.put(`/hr/materials/${id}/fulfill`)

// ==================== 活动管理 ====================

// 查询活动列表（支持 status/activity_type/keyword 筛选）
export const getActivities = (params?: any) => axios.get('/hr/activities', { params })

// 查询单条活动
export const getActivity = (id: string) => axios.get(`/hr/activities/${id}`)

// 创建活动
export const createActivity = (data: any) => axios.post('/hr/activities', data)

// 更新活动
export const updateActivity = (id: string, data: any) => axios.put(`/hr/activities/${id}`, data)

// 删除活动
export const deleteActivity = (id: string) => axios.delete(`/hr/activities/${id}`)

// 活动报名
export const registerActivity = (id: string) => axios.post(`/hr/activities/${id}/register`)

// 取消报名
export const unregisterActivity = (id: string) => axios.delete(`/hr/activities/${id}/register`)

// 查询用户已报名的活动ID列表
export const getMyRegistrations = () => axios.get('/hr/my-registrations')

// 查询活动的报名人员列表
export const getActivityRegistrations = (id: string) => axios.get(`/hr/activities/${id}/registrations`)
