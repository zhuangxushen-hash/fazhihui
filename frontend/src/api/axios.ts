import axios, { AxiosInstance } from 'axios'
import { message } from 'antd'
import { getErrorMessage, markHandled } from '../utils/error'

const instance = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      if (!config.headers) {
        config.headers = {} as any
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 401 未授权：清除登录态并跳转登录页
    if (error?.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes('/login')
      if (isLoginPage) {
        // 登录页的 401 是账号密码错误，展示后端返回的具体错误信息
        const loginMsg = getErrorMessage(error, '账号或密码错误')
        message.error(loginMsg)
        return Promise.reject(markHandled(error))
      }
      // 非登录页的 401：清除登录态并跳转
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      message.warning('登录已过期，请重新登录')
      setTimeout(() => {
        const isClient = window.location.pathname.startsWith('/client')
        window.location.href = isClient ? '/client/login' : '/login'
      }, 800)
      return Promise.reject(markHandled(error))
    }

    // 提取用户友好的错误信息并自动展示
    // 拦截器统一处理后标记 _handled，页面层调用 showError 时会跳过
    const friendlyMsg = getErrorMessage(error)
    const isFileUpload = error?.config?.url?.includes('/upload') || error?.config?.url?.includes('/files')
    // 文件上传错误由页面自行处理（可能需要展示文件名等上下文）
    if (!isFileUpload) {
      message.error(friendlyMsg)
    }
    return Promise.reject(markHandled(error))
  }
)

type ApiClient = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete'> & {
  get: <T = any>(url: string, config?: any) => Promise<T>
  post: <T = any>(url: string, data?: any, config?: any) => Promise<T>
  put: <T = any>(url: string, data?: any, config?: any) => Promise<T>
  delete: <T = any>(url: string, config?: any) => Promise<T>
}

export default instance as ApiClient
