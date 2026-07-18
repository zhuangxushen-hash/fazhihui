import axios, { AxiosInstance } from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

type ApiClient = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete'> & {
  get: <T = any>(url: string, config?: any) => Promise<T>
  post: <T = any>(url: string, data?: any, config?: any) => Promise<T>
  put: <T = any>(url: string, data?: any, config?: any) => Promise<T>
  delete: <T = any>(url: string, config?: any) => Promise<T>
}

export default instance as ApiClient
