import axios from './axios'

// 数据大屏聚合数据
export const getScreenData = (params?: any) => axios.get('/dashboard/screen-data', { params })
