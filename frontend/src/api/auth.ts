import axios from './axios'

export interface LoginResponse {
  access_token: string
  user: {
    id: string
    real_name: string
    phone: string
    role: string
    organization_id: string
  }
}

export const login = (phone: string, password: string) => {
  return axios.post<LoginResponse>('/auth/login', { phone, password })
}

// C 端客户登录：以客户档案为准（手机号 + 身份证号后8位默认密码），与管理端账号切分
export const clientLogin = (phone: string, password: string) => {
  return axios.post<LoginResponse>('/auth/client-login', { phone, password })
}

export const verifyToken = (token: string) => {
  return axios.post('/auth/verify', { token })
}
