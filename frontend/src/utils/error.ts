import { message } from 'antd'

/**
 * 统一错误处理工具
 * 从 axios 错误中提取用户友好的报错信息，并自动展示提示
 */

// HTTP 状态码到友好提示的映射
const STATUS_MESSAGE_MAP: Record<number, string> = {
  400: '请求参数有误，请检查后重试',
  401: '登录已过期，请重新登录',
  403: '您没有权限执行此操作',
  404: '请求的资源不存在',
  408: '请求超时，请稍后重试',
  409: '数据冲突，请刷新后重试',
  413: '上传文件过大，请压缩后重试',
  429: '操作过于频繁，请稍后再试',
  500: '服务器异常，请稍后重试',
  502: '网关异常，请稍后重试',
  503: '服务暂不可用，请稍后重试',
  504: '网关超时，请稍后重试',
}

/**
 * 从 axios 错误对象中提取用户友好的错误信息
 * 优先级：后端业务 message > HTTP 状态码映射 > 网络异常提示 > 兜底文案
 */
export function getErrorMessage(error: any, fallback = '操作失败，请稍后重试'): string {
  // 非 axios 错误（如原生 JS 错误）
  if (!error) return fallback

  // 网络中断 / 请求未发出
  if (error.code === 'ERR_NETWORK') {
    return '网络连接异常，请检查网络后重试'
  }

  // 请求超时
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return '请求超时，请检查网络后重试'
  }

  const response = error.response
  if (!response) {
    // 无响应但非超时/网络错误
    return error.message || '网络异常，请稍后重试'
  }

  const status = response.status
  const data = response.data

  // 优先使用后端返回的具体业务错误信息
  if (data) {
    // NestJS 标准 HTTP 异常格式：{ message: string | string[], error: string, statusCode: number }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim()
    }
    // 验证管道返回的数组格式：{ message: string[] }
    if (Array.isArray(data.message) && data.message.length > 0) {
      return data.message.join('；')
    }
    // 其他格式的 message
    if (typeof data.message === 'object' && data.message !== null) {
      const vals = Object.values(data.message as Record<string, string>)
      if (vals.length > 0) return vals.join('；')
    }
    // 某些接口返回 { error: string } 或 { msg: string }
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim()
    }
    if (typeof data.msg === 'string' && data.msg.trim()) {
      return data.msg.trim()
    }
  }

  // 按 HTTP 状态码映射
  if (STATUS_MESSAGE_MAP[status]) {
    return STATUS_MESSAGE_MAP[status]
  }

  return fallback
}

/**
 * 判断是否为 401 未授权错误
 */
export function isUnauthorized(error: any): boolean {
  return error?.response?.status === 401
}

/**
 * 判断是否为 403 无权限错误
 */
export function isForbidden(error: any): boolean {
  return error?.response?.status === 403
}

/**
 * 展示用户友好的错误提示（通过 antd message）
 * 如果错误已被拦截器标记为已处理，则不再重复展示
 */
export function showError(error: any, fallback = '操作失败，请稍后重试'): void {
  // 拦截器已处理过的错误不再重复提示
  if (error?._handled) return
  const msg = getErrorMessage(error, fallback)
  message.error(msg)
}

/**
 * 标记错误为已处理（供拦截器调用，避免页面层重复提示）
 */
export function markHandled(error: any): any {
  if (error && typeof error === 'object') {
    error._handled = true
  }
  return error
}
