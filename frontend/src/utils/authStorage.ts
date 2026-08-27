// B端 / C端 登录态隔离工具
// 原先两端共用 localStorage 的 token/user 两个 key，导致 C 端登录/退出会覆盖或清掉 B 端登录态。
// 现按当前路由端使用独立 key：
//   - B 端（非 /client 路径）：token / user
//   - C 端（/client 路径）：client_token / client_user
// 两端读写、清理互不影响。

// 当前是否为 C 端（/client 开头的路径）
export function isClientPath(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/client')
}

// 当前端对应的 token 存储 key
export function tokenKey(): string {
  return isClientPath() ? 'client_token' : 'token'
}

// 当前端对应的 user 存储 key
export function userKey(): string {
  return isClientPath() ? 'client_user' : 'user'
}

// 读取当前端的 token
export function getToken(): string | null {
  return localStorage.getItem(tokenKey())
}

// 读取当前端的用户信息
export function getAuthUser<T = unknown>(): T | null {
  const s = localStorage.getItem(userKey())
  if (!s) return null
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

// 写入当前端登录态（登录成功后调用，登录页位于对应端路径下）
export function setAuth(data: { access_token: string; user: unknown }): void {
  localStorage.setItem(tokenKey(), data.access_token)
  localStorage.setItem(userKey(), JSON.stringify(data.user))
}

// 清除当前端登录态（登出时调用）
export function clearAuth(): void {
  localStorage.removeItem(tokenKey())
  localStorage.removeItem(userKey())
}