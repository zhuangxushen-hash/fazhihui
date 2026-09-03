/**
 * 打开法大大页面（个人实名刷脸 / 互动视频签）的统一入口。
 *
 * 背景：微信小程序内 H5 被 <web-view> 承载，法大大页面走到「人脸识别 / 互动视频签」
 * 环节时需要跳转到法大大的人脸 / 音视频小程序。但 web-view 无法直接唤起小程序，
 * 必须借助法大大官方「刷脸 + 互动视频签小程序跳转中间页 DEMO」包（pagesFace）做桥接：
 * 由 pagesFace 的 webview 页加载法大大链接，内部负责「跳刷脸 / 互动视频签小程序
 * → 返回 → 二次重定向拿结果」。
 *
 * 参考文档：
 * - 微信小程序集成法大大页面开发流程（刷脸）：https://dev.fadada.com/api-help/EJ7BTI5DGW/EUOXLYDFCTHRD3ZA
 * - 微信小程序集成法大大页面开发流程（刷脸 + 互动视频签）：https://dev.fadada.com/api-help/6YHMCFJJC4/FIJYQHAS802K7UD9
 */

/** 是否处于微信小程序 web-view 环境（判定逻辑与 ClientLogin.tsx 保持一致） */
export function isInWeChatMiniProgram(): boolean {
  if (typeof navigator === 'undefined') return false
  // 微信 web-view 的 UA 含 miniProgram
  if (/miniProgram/i.test(navigator.userAgent)) return true
  // 小程序 webview.js 会向 H5 透传 mp_env=weapp，作为双重保险
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mp_env') === 'weapp') return true
  } catch {
    /* ignore */
  }
  return false
}

/**
 * 打开法大大页面链接。
 * - 微信小程序内：跳转到法大大 pagesFace 中间页（/pagesFace/pages/webview/webview?url=），
 *   由它内部完成「跳刷脸 / 互动视频签小程序 → 返回 → 二次重定向拿结果」的桥接。
 * - App 内嵌 web-view（UA 含 app_embed）：直接在当前页跳转。
 * - 浏览器 / 其他：新窗口打开（保持原行为）。
 */
export function openFadadaUrl(url: string): void {
  if (!url) return

  if (isInWeChatMiniProgram()) {
    const wx = (window as any).wx
    if (wx && wx.miniProgram && wx.miniProgram.navigateTo) {
      wx.miniProgram.navigateTo({
        url: '/pagesFace/pages/webview/webview?url=' + encodeURIComponent(url),
      })
      return
    }
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
  if (ua.includes('app_embed')) {
    window.location.href = url
    return
  }

  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) window.location.href = url
}
