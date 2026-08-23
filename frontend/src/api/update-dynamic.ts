import axios from './axios'

// 获取业务动态时间线
export const getUpdateDynamic = (params?: { limit?: number; type?: string }) => {
  return axios.get('/update-dynamic/feed', { params })
}
