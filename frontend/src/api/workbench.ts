import axios from './axios'

// 获取个人工作台聚合概览
export const getWorkbenchSummary = () => axios.get('/workbench/summary')
