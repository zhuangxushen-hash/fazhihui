// 小程序 web-view 壳登录态引导
// ------------------------------------------------------------------
// 小程序壳通过 wx-phone-login 拿到 { access_token, user } 后，以 URL 参数
// ?token=xxx&user=yyy 打开 H5。此模块在应用渲染前消费这些参数并建立
// C 端登录态（client_token / client_user），再把参数从地址栏剥掉，
// 避免凭证残留在分享卡片 / 浏览历史中。
//
// 为什么不走 /auth/verify 换用户信息：
// verifyToken 按 JWT sub 查 users 表，而 client_profiles 档案账号的
// sub 是档案 id，verify 会失败；故由小程序直接携带 user JSON。
// ------------------------------------------------------------------

export function bootstrapUrlToken(): void {
  if (typeof window === 'undefined') return

  const search = new URLSearchParams(window.location.search)
  const token = search.get('token')
  const userRaw = search.get('user')

  // 无 token 则不做任何事（正常浏览器访问不受影响）
  if (!token) {
    // 仅清理小程序壳可能残留的 wx.login code 参数
    if (search.get('code')) {
      search.delete('code')
      const qs = search.toString()
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (qs ? '?' + qs : '') + window.location.hash
      )
    }
    return
  }

  // URL 参数登录态仅用于 C 端（小程序壳只进 /client 路径）
  if (!/^\/client(\/|$)/.test(window.location.pathname)) return

  // 以 URL 传入的 token 为准（小程序每次进入都带最新登录态）
  localStorage.setItem('client_token', token)
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw)
      localStorage.setItem('client_user', JSON.stringify(user))
    } catch {
      // user 参数损坏时仅存 token，路由守卫会因缺 user 放行至登录页
    }
  }

  // 剥掉 token / user / code 参数，保留其余查询参数
  search.delete('token')
  search.delete('user')
  search.delete('code')
  const qs = search.toString()
  window.history.replaceState(
    {},
    '',
    window.location.pathname + (qs ? '?' + qs : '') + window.location.hash
  )
}
