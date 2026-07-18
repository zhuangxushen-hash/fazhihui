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

export const verifyToken = (token: string) => {
  return axios.post('/auth/verify', { token })
}
