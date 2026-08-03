import axios from './axios'

// 日程相关
export const getSchedules = (params?: any) =>
  axios.get('/schedules', { params })

export const getMySchedules = (params?: any) =>
  axios.get('/schedules/my', { params })

export const createSchedule = (data: any) => axios.post('/schedules', data)

export const updateSchedule = (id: string, data: any) =>
  axios.put(`/schedules/${id}`, data)

export const deleteSchedule = (id: string) => axios.delete(`/schedules/${id}`)

// 日程转工作日志
export const convertToLog = (id: string) =>
  axios.post(`/schedules/${id}/convert-to-log`)

// 参与人相关
export const addParticipant = (scheduleId: string, userId: string) =>
  axios.post(`/schedules/${scheduleId}/participants`, { user_id: userId })

export const respondParticipant = (
  scheduleId: string,
  userId: string,
  status: string,
) =>
  axios.put(`/schedules/${scheduleId}/participants/${userId}`, { status })

export const removeParticipant = (scheduleId: string, userId: string) =>
  axios.delete(`/schedules/${scheduleId}/participants/${userId}`)

export const listParticipants = (scheduleId: string) =>
  axios.get(`/schedules/${scheduleId}/participants`)

// 会议室相关
export const getMeetingRooms = (params?: any) =>
  axios.get('/meeting-rooms', { params })

export const createMeetingRoom = (data: any) =>
  axios.post('/meeting-rooms', data)

export const updateMeetingRoom = (id: string, data: any) =>
  axios.put(`/meeting-rooms/${id}`, data)

export const deleteMeetingRoom = (id: string) =>
  axios.delete(`/meeting-rooms/${id}`)

// 会议室预约相关
export const getMeetingRoomBookings = (params?: any) =>
  axios.get('/meeting-room-bookings', { params })

export const createBooking = (data: any) =>
  axios.post('/meeting-room-bookings', data)

export const approveBooking = (id: string) =>
  axios.put(`/meeting-room-bookings/${id}/approve`)

export const rejectBooking = (id: string) =>
  axios.put(`/meeting-room-bookings/${id}/reject`)
